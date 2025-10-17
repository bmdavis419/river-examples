<script lang="ts">
	import { ChatStore } from './ChatStore.svelte';

	const chatStore = new ChatStore();

	const handleSubmit = (e: SubmitEvent) => {
		e.preventDefault();
		chatStore.handleSendMessage();
		chatStore.currentUserMessage = '';
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			if (e.metaKey) {
				e.preventDefault();
				const textarea = e.target as HTMLTextAreaElement;
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				chatStore.currentUserMessage =
					chatStore.currentUserMessage.slice(0, start) +
					'\n' +
					chatStore.currentUserMessage.slice(end);
				setTimeout(() => {
					textarea.selectionStart = textarea.selectionEnd = start + 1;
				}, 0);
			} else {
				e.preventDefault();
				const form = (e.target as HTMLTextAreaElement).closest('form');
				form?.requestSubmit();
			}
		}
	};
</script>

<div class="flex flex-1 flex-col justify-between overflow-hidden">
	<header class="flex items-center justify-between p-4">
		<h2 class="text-2xl font-bold">River Durable Chat</h2>
		<div>
			<p class="text-sm text-neutral-400">Status: {chatStore.chatRunStatus}</p>
		</div>
	</header>
	<div class="min-h-0 flex-1 overflow-y-auto bg-neutral-900 p-4">
		{#each chatStore.chatDisplay as entry}
			{#if entry.type === 'text'}
				{#if entry.data.role === 'user'}
					<div class="mb-4 flex justify-end">
						<div class="max-w-xs rounded-lg bg-blue-500 px-4 py-2 text-white">
							{entry.data.text}
						</div>
					</div>
				{:else}
					<div class="prose-sm mb-4 prose-neutral prose-invert">
						{@html entry.data.markdownText}
					</div>
				{/if}
			{/if}
		{/each}
	</div>
	<form onsubmit={handleSubmit} class="px-12 py-6">
		<textarea
			placeholder="Type your message here..."
			bind:value={chatStore.currentUserMessage}
			disabled={chatStore.chatRunStatus === 'running'}
			class="mb-4 w-full resize-none rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-neutral-50 placeholder-neutral-500 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			rows="2"
			style="max-height: 140px; overflow-y: auto;"
			onkeydown={handleKeydown}
		></textarea>
		<div class="flex items-center justify-between">
			<span class="text-sm text-neutral-400">Claude 4.5 Haiku</span>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => chatStore.handleResetChat()}
					disabled={chatStore.chatRunStatus === 'running'}
					class="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-600/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					Reset
				</button>
				<button
					type="submit"
					disabled={chatStore.chatRunStatus === 'running'}
					class="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-600/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{chatStore.chatRunStatus === 'running' ? 'Sending...' : 'Send'}
				</button>
			</div>
		</div>
	</form>
</div>
