<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setThreadsStore } from '$lib/stores/ThreadsStore.svelte';
	import ThreadSidebarLink from '$lib/components/ThreadSidebarLink.svelte';
	import { setCustomChatStore } from '$lib/stores/CustomChatStore.svelte';

	let { children } = $props();

	const threadsStore = setThreadsStore();

	const customChatStore = setCustomChatStore();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>River Durable Chat</title>
</svelte:head>

<div class="flex h-screen flex-row">
	<nav class="flex w-64 flex-col items-start gap-2 p-4">
		<button onclick={() => customChatStore.handleResetChat()}>New Thread</button>
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
