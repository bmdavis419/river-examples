import { createContext, onMount } from 'svelte';
import type { ChatDisplayEntry } from '$lib/types';
import { SvelteMap } from 'svelte/reactivity';

class ThreadsStore {
	private readonly LOCAL_STORAGE_KEY = 'river-chat-threads';

	threads = new SvelteMap<string, ChatDisplayEntry[]>();

	private hasLoadedThreads = false;

	threadsList = $derived.by(() => {
		const list = Array.from(this.threads.entries()).map(([threadId, chatDisplay]) => {
			if (chatDisplay.length === 0) return null;
			const firstMessage = chatDisplay[0];
			if (firstMessage.type !== 'text') return null;
			if (firstMessage.data.role !== 'user') return null;
			return {
				threadId,
				firstMessage: firstMessage.data.text
			};
		});
		return list;
	});

	private loadThreadsFromStorage = () => {
		const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
		const allThreads = stored ? JSON.parse(stored) : {};

		for (const [threadId, chatDisplay] of Object.entries(allThreads)) {
			this.threads.set(threadId, chatDisplay as ChatDisplayEntry[]);
		}
		this.hasLoadedThreads = true;
	};

	private persistThreadsToStorage = () => {
		const threads = Object.fromEntries(this.threads.entries());
		localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(threads));
	};

	deleteThread = (threadId: string) => {
		this.threads.delete(threadId);
		this.persistThreadsToStorage();
	};

	saveThread = (threadId: string, chatDisplay: ChatDisplayEntry[]) => {
		this.threads.set(threadId, chatDisplay);
		this.persistThreadsToStorage();
	};

	getThread = (threadId: string): ChatDisplayEntry[] | null => {
		if (!this.hasLoadedThreads) {
			this.loadThreadsFromStorage();
		}
		return this.threads.get(threadId) || null;
	};

	constructor() {
		onMount(() => {
			if (!this.hasLoadedThreads) {
				this.loadThreadsFromStorage();
			}
		});
	}
}

const [getThreadsStore, internalSetThreadsStore] = createContext<ThreadsStore>();

const setThreadsStore = () => internalSetThreadsStore(new ThreadsStore());

export { getThreadsStore, setThreadsStore };
