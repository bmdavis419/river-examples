<script lang="ts">
	import { getCustomChatStore } from '$lib/stores/CustomChatStore.svelte';
	import { Send, RotateCcw } from '@lucide/svelte';

	const chatStore = getCustomChatStore();

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

<div class="relative flex flex-1 flex-col justify-between overflow-hidden">
	<header
		class="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/50 px-6 py-3"
	>
		<h2 class="text-xl font-semibold text-neutral-200">River Durable Chat</h2>
		<div>
			<p class="text-sm text-neutral-400">Status: {chatStore.chatRunStatus}</p>
		</div>
	</header>
	<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-neutral-900 px-12 py-6 pb-64">
		{#each chatStore.chatDisplay as entry}
			{#if entry.type === 'text'}
				{#if entry.data.role === 'user'}
					<div class="flex justify-end">
						<div class="max-w-xs rounded-lg bg-purple-500 px-4 py-2 text-white">
							{entry.data.text}
						</div>
					</div>
				{:else}
					<div class="prose-sm prose-neutral prose-invert prose-a:text-purple-400">
						{@html entry.data.markdownText}
					</div>
				{/if}
			{:else if entry.type === 'dynamic-tool-call'}
				<div class="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2">
					<div
						class="h-2 w-2 rounded-full {entry.toolOutput.includes('error') ||
						entry.toolOutput.includes('Error')
							? 'bg-red-500'
							: 'bg-green-500'}"
					></div>
					<span class="text-sm font-medium text-neutral-300"
						>{entry.toolName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}: {JSON.parse(
							entry.toolInput
						).command || entry.toolInput}</span
					>
				</div>
			{:else if entry.type === 'adding-task-tool'}
				<div class="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2">
					<div
						class="h-2 w-2 rounded-full {entry.output.message.includes('error') ||
						entry.output.message.includes('Error')
							? 'bg-red-500'
							: 'bg-green-500'}"
					></div>
					<span class="text-sm font-medium text-neutral-300"
						>Add Task: "{entry.input.content}" (Due: {entry.input.dueDate})</span
					>
				</div>
			{:else if entry.type === 'adding-note-tool'}
				<div class="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2">
					<div
						class="h-2 w-2 rounded-full {entry.output.message.includes('error') ||
						entry.output.message.includes('Error')
							? 'bg-red-500'
							: 'bg-green-500'}"
					></div>
					<span class="text-sm font-medium text-neutral-300">Add Note: "{entry.input.content}"</span
					>
				</div>
			{/if}
		{/each}
	</div>
	<form
		onsubmit={handleSubmit}
		class="absolute inset-x-0 bottom-0 z-10 mx-12 flex flex-col gap-0 rounded-t-lg bg-neutral-950 px-3 pt-2"
	>
		<textarea
			placeholder="Type your message here..."
			bind:value={chatStore.currentUserMessage}
			id="user-message-input"
			disabled={chatStore.chatRunStatus === 'running'}
			class=" w-full resize-none rounded-t-lg bg-neutral-900 px-4 py-3 text-neutral-100 placeholder-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			rows="2"
			style="max-height: 140px; overflow-y: auto;"
			onkeydown={handleKeydown}
		></textarea>
		<div class="flex items-center justify-between bg-neutral-900 p-4">
			<span class="text-sm text-neutral-400">Claude 4.5 Haiku</span>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => chatStore.handleResetChat()}
					disabled={chatStore.chatRunStatus === 'running'}
					class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500 focus:ring-2 focus:ring-red-500/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					<RotateCcw size={16} class="opacity-90" /> Reset
				</button>
				<button
					type="submit"
					disabled={chatStore.chatRunStatus === 'running'}
					class="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 font-medium text-white hover:bg-purple-400 focus:ring-2 focus:ring-purple-400/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Send size={16} class="opacity-90" />
					{chatStore.chatRunStatus === 'running' ? 'Sending...' : 'Send'}
				</button>
			</div>
		</div>
	</form>
</div>
