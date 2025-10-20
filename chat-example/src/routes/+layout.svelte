<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setThreadsStore } from '$lib/stores/ThreadsStore.svelte';
	import ThreadSidebarLink from '$lib/components/ThreadSidebarLink.svelte';
	import { setCustomChatStore } from '$lib/stores/CustomChatStore.svelte';
	import { Plus } from '@lucide/svelte';

	let { children } = $props();

	const threadsStore = setThreadsStore();

	const customChatStore = setCustomChatStore();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>River Durable Chat</title>
</svelte:head>

<div class="flex h-screen flex-row">
	<nav
		class="flex w-64 flex-col items-stretch gap-2 border-r border-neutral-800 bg-neutral-950 p-4"
	>
		<button
			onclick={() => customChatStore.handleResetChat()}
			class="inline-flex w-full items-center justify-center gap-2 rounded-md border border-orange-400/30 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:border-orange-400/50 hover:bg-neutral-900/60 focus:ring-2 focus:ring-orange-400/40 focus:outline-none"
			><Plus size={16} class="opacity-90" /> New Thread</button
		>
		{#each threadsStore.threadsList as thread}
			{#if thread}
				<ThreadSidebarLink threadId={thread.threadId} firstMessage={thread.firstMessage} />
			{/if}
		{/each}
	</nav>

	<div class="flex h-screen w-full flex-col bg-neutral-950 text-neutral-50">
		{@render children?.()}
	</div>
</div>
