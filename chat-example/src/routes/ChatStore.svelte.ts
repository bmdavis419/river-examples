import { myRiverClient } from '$lib/river/client';
import type { RiverStreamInputType } from '@davis7dotsh/river-alpha';
import { marked } from 'marked';
import { useSearchParams } from 'runed/kit';
import { onMount } from 'svelte';
import z from 'zod';

// TODO:
// chat page UI
// tools
// error handling

const chatPageParamsSchema = z.object({
	threadId: z.string().default(''),
	curResumeKey: z.string().default('')
});

type ChatDisplayEntry =
	| {
			type: 'text';
			data:
				| {
						role: 'user';
						text: string;
				  }
				| {
						role: 'assistant';
						status: 'running' | 'completed' | 'error';
						id: string;
						rawText: string;
						markdownText: string;
				  };
	  }
	| {
			type: 'tool-call';
			toolName: string;
			id: string;
			toolInput: string;
			toolOutput: string;
	  };

type ChatInput = RiverStreamInputType<ReturnType<typeof myRiverClient.chat>>;

export class ChatStore {
	currentUserMessage = $state('');
	chatDisplay = $state<ChatDisplayEntry[]>([]);
	private params = useSearchParams(chatPageParamsSchema);
	private threadId = $derived(this.params.threadId);
	private curResumeKey = $derived(this.params.curResumeKey);

	private readonly LOCAL_STORAGE_KEY = 'river-chat-threads';

	private chatCaller = myRiverClient.chat({
		onChunk: (chunk) => {
			switch (chunk.type) {
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
			this.saveThreadToStorage();
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
			this.saveThreadToStorage();
		},
		onStreamInfo: (info) => {
			this.params.curResumeKey = info.resumeKey;
		}
	});

	chatRunStatus = $derived(this.chatCaller.status);

	private generateThreadId = (): string => {
		return crypto.randomUUID();
	};

	private getThreadsFromStorage = (): Record<string, ChatDisplayEntry[]> => {
		if (typeof window === 'undefined') return {};
		const stored = window.localStorage.getItem(this.LOCAL_STORAGE_KEY);
		return stored ? JSON.parse(stored) : {};
	};

	private saveThreadToStorage = () => {
		if (typeof window === 'undefined') return;
		const threads = this.getThreadsFromStorage();
		threads[this.threadId] = this.chatDisplay;
		window.localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(threads));
	};

	handleSendMessage = () => {
		if (!this.threadId) {
			const newThreadId = this.generateThreadId();
			this.params.threadId = newThreadId;
		}

		const properHistory = this.chatDisplay.reduce<ChatInput>((acc, entry) => {
			if (entry.type === 'text') {
				if (entry.data.role === 'user') {
					acc.push({ role: entry.data.role, content: entry.data.text });
				} else {
					acc.push({ role: entry.data.role, content: entry.data.rawText });
				}
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
		this.chatCaller.start([...properHistory, { role: 'user', content: this.currentUserMessage }]);
	};

	handleStopStream = () => {
		this.chatCaller.stop();
	};

	handleResetChat = () => {
		this.params.reset();
		this.chatDisplay = [];
		this.chatCaller.reset();
	};

	constructor() {
		onMount(() => {
			if (this.threadId) {
				const threads = this.getThreadsFromStorage();
				if (threads[this.threadId]) {
					this.chatDisplay = threads[this.threadId];
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
		});
	}
}
