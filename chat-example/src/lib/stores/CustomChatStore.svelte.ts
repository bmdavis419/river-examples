import { myRiverClient } from '$lib/river/client';
import { marked } from 'marked';
import { useSearchParams } from 'runed/kit';
import { createContext, onMount } from 'svelte';
import { getThreadsStore } from '$lib/stores/ThreadsStore.svelte';
import type { ChatDisplayEntry, ChatInput } from '$lib/types';
import { chatPageParamsSchema } from '$lib/types';

class CustomChatStore {
	currentUserMessage = $state('');
	chatDisplay = $state<ChatDisplayEntry[]>([]);
	private params = useSearchParams(chatPageParamsSchema);
	private threadId = $derived(this.params.threadId);
	private curResumeKey = $derived(this.params.curResumeKey);
	private threadsStore = getThreadsStore();

	private chatCaller = myRiverClient.chat({
		onChunk: (chunk) => {
			switch (chunk.type) {
				case 'tool-result':
					if (chunk.dynamic) {
						this.chatDisplay.push({
							type: 'dynamic-tool-call',
							toolName: chunk.toolName,
							id: chunk.toolCallId,
							toolInput: JSON.stringify(chunk.input),
							toolOutput: JSON.stringify(chunk.output)
						});
					} else {
						if (chunk.toolName === 'save_note') {
							this.chatDisplay.push({
								type: 'adding-note-tool',
								id: chunk.toolCallId,
								input: chunk.input,
								output: chunk.output
							});
						} else if (chunk.toolName === 'save_task') {
							this.chatDisplay.push({
								type: 'adding-task-tool',
								id: chunk.toolCallId,
								input: chunk.input,
								output: chunk.output
							});
						}
					}
					break;
				case 'text-start':
					const existingMessage = this.chatDisplay.find(
						(entry) =>
							entry.type === 'text' && entry.data.role === 'assistant' && entry.data.id === chunk.id
					);
					if (!existingMessage) {
						this.chatDisplay.push({
							type: 'text',
							data: {
								role: 'assistant',
								id: chunk.id,
								rawText: '',
								markdownText: '',
								status: 'running'
							}
						});
					}
					break;
				case 'text-delta':
					const curDisplayEntry = this.chatDisplay.find(
						(entry) =>
							entry.type === 'text' && entry.data.role === 'assistant' && entry.data.id === chunk.id
					);
					if (
						!curDisplayEntry ||
						curDisplayEntry.type !== 'text' ||
						curDisplayEntry.data.role !== 'assistant'
					)
						break;

					curDisplayEntry.data.rawText += chunk.text;
					curDisplayEntry.data.markdownText = marked.parse(curDisplayEntry.data.rawText, {
						async: false
					});
					break;
				default:
					break;
			}
		},
		onStart: () => {
			console.log('chat started');
			const lastAssistantMessage = [...this.chatDisplay]
				.reverse()
				.find((entry) => entry.type === 'text' && entry.data.role === 'assistant');
			if (
				lastAssistantMessage &&
				lastAssistantMessage.type === 'text' &&
				lastAssistantMessage.data.role === 'assistant'
			) {
				lastAssistantMessage.data.status = 'running';
			}
		},
		onCancel: () => {
			console.log('chat stream cancelled');
		},
		onError: (error) => {
			console.error('chat error', error);
			const lastAssistantMessage = [...this.chatDisplay]
				.reverse()
				.find((entry) => entry.type === 'text' && entry.data.role === 'assistant');
			if (
				lastAssistantMessage &&
				lastAssistantMessage.type === 'text' &&
				lastAssistantMessage.data.role === 'assistant'
			) {
				lastAssistantMessage.data.status = 'error';
			}
			this.params.curResumeKey = '';
			this.threadsStore.saveThread(this.threadId, this.chatDisplay);
		},
		onSuccess: () => {
			console.log('chat completed');
			const lastAssistantMessage = [...this.chatDisplay]
				.reverse()
				.find((entry) => entry.type === 'text' && entry.data.role === 'assistant');
			if (
				lastAssistantMessage &&
				lastAssistantMessage.type === 'text' &&
				lastAssistantMessage.data.role === 'assistant'
			) {
				lastAssistantMessage.data.status = 'completed';
			}
			this.params.curResumeKey = '';
			this.threadsStore.saveThread(this.threadId, this.chatDisplay);
		},
		onStreamInfo: (info) => {
			this.params.curResumeKey = info.resumeKey;
		}
	});

	chatRunStatus = $derived(this.chatCaller.status);

	private generateThreadId = (): string => {
		return crypto.randomUUID();
	};

	handleSendMessage = () => {
		if (!this.threadId) {
			const newThreadId = this.generateThreadId();
			this.params.threadId = newThreadId;
		}

		const properHistory = this.chatDisplay.reduce<ChatInput['messages']>((acc, entry) => {
			if (entry.type === 'text') {
				if (entry.data.role === 'user') {
					acc.push({ role: entry.data.role, content: entry.data.text });
				} else {
					acc.push({ role: entry.data.role, content: entry.data.rawText });
				}
			}
			if (
				entry.type === 'dynamic-tool-call' ||
				entry.type === 'adding-task-tool' ||
				entry.type === 'adding-note-tool'
			) {
				let toolName: string;
				let toolInput: unknown;
				let toolOutput: unknown;

				if (entry.type === 'dynamic-tool-call') {
					toolName = entry.toolName;
					toolInput = JSON.parse(entry.toolInput);
					toolOutput = JSON.parse(entry.toolOutput);
				} else if (entry.type === 'adding-task-tool') {
					toolName = 'save_task';
					toolInput = entry.input;
					toolOutput = entry.output;
				} else {
					toolName = 'save_note';
					toolInput = entry.input;
					toolOutput = entry.output;
				}

				acc.push({
					role: 'assistant',
					content: [
						{
							type: 'tool-call' as const,
							toolCallId: entry.id,
							toolName,
							input: toolInput
						}
					]
				});

				acc.push({
					role: 'tool',
					content: [
						{
							type: 'tool-result' as const,
							toolCallId: entry.id,
							toolName,
							output: {
								type: 'json' as const,
								value: toolOutput
							}
						}
					]
				});
			}
			return acc;
		}, []);
		this.chatDisplay.push({
			type: 'text',
			data: {
				role: 'user',
				text: this.currentUserMessage
			}
		});
		this.chatCaller.start({
			today: new Date().toLocaleDateString(),
			messages: [...properHistory, { role: 'user', content: this.currentUserMessage }]
		});
	};

	handleStopStream = () => {
		this.chatCaller.stop();
	};

	handleResetChat = () => {
		this.params.reset();
		this.chatDisplay = [];
		this.chatCaller.reset();
	};

	openThread = (threadId: string) => {
		this.handleResetChat();
		this.params.threadId = threadId;
		this.handleLoadThread();
	};

	handleLoadThread = () => {
		if (this.threadId) {
			const threadData = this.threadsStore.getThread(this.threadId);
			if (threadData) {
				this.chatDisplay = threadData;
			}
		}
		if (this.curResumeKey) {
			const lastAssistantMessage = [...this.chatDisplay]
				.reverse()
				.find((entry) => entry.type === 'text' && entry.data.role === 'assistant');
			if (
				lastAssistantMessage &&
				lastAssistantMessage.type === 'text' &&
				lastAssistantMessage.data.role === 'assistant'
			) {
				lastAssistantMessage.data.rawText = '';
				lastAssistantMessage.data.markdownText = '';
			}
			this.chatCaller.resume(this.curResumeKey);
		}
	};

	constructor() {
		onMount(() => {
			this.handleLoadThread();
		});
	}
}

const [getCustomChatStore, internalSetCustomChatStore] = createContext<CustomChatStore>();

const setCustomChatStore = () => internalSetCustomChatStore(new CustomChatStore());

export { getCustomChatStore, setCustomChatStore };
