import { myRiverClient } from '$lib/river/client';
import type { RiverStreamInputType } from '@davis7dotsh/river-alpha';
import { marked } from 'marked';
import { useSearchParams } from 'runed/kit';
import { onMount } from 'svelte';
import z from 'zod';

// TODO:
// chat page UI
// tools
// store the chat history in local storage along side the resume key(s)
// error handling

const chatPageParamsSchema = z.object({
	chatResumeKey: z.string().default('')
});

type ChatDisplayEntry =
	| {
			type: 'text';
			role: 'user' | 'assistant';
			id: string;
			rawText: string;
			markdownText: string;
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
	currentUserMessage = $state('How does state work in vue?');
	chatDisplay = $state<ChatDisplayEntry[]>([]);
	private params = useSearchParams(chatPageParamsSchema);
	private chatResumeKey = $derived(this.params.chatResumeKey);

	private chatCaller = myRiverClient.chat({
		onChunk: (chunk) => {
			switch (chunk.type) {
				case 'text-start':
					this.chatDisplay.push({
						type: 'text',
						role: 'assistant',
						id: chunk.id,
						rawText: '',
						markdownText: ''
					});
					break;
				case 'text-delta':
					const curDisplayEntry = this.chatDisplay.find((entry) => entry.id === chunk.id);
					if (!curDisplayEntry || curDisplayEntry.type !== 'text') break;

					curDisplayEntry.rawText += chunk.text;
					curDisplayEntry.markdownText = marked.parse(curDisplayEntry.rawText, {
						async: false
					});
					break;
				default:
					break;
			}
		},
		onStart: () => {
			console.log('chat started');
		},
		onCancel: () => {
			console.log('chat stream cancelled');
		},
		onError: (error) => {
			console.error('chat error', error);
		},
		onSuccess: () => {
			console.log('chat completed');
		},
		onStreamInfo: (info) => {
			this.params.chatResumeKey = info.resumeKey;
		}
	});

	handleSendMessage = () => {
		const properHistory = this.chatDisplay.reduce<ChatInput>((acc, entry) => {
			if (entry.type === 'text') {
				acc.push({ role: entry.role, content: entry.rawText });
			}
			return acc;
		}, []);
		this.chatDisplay.push({
			type: 'text',
			role: 'user',
			id: '',
			rawText: this.currentUserMessage,
			markdownText: marked.parse(this.currentUserMessage, {
				async: false
			})
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
		$inspect(this.chatDisplay);
		onMount(() => {
			if (this.chatResumeKey) {
				this.chatCaller.resume(this.chatResumeKey);
			}
		});
	}
}
