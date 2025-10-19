<script lang="ts">
	import { myRiverClient } from '$lib/river/client';
	import { getCustomChatStore } from '$lib/stores/CustomChatStore.svelte';
	import { onMount } from 'svelte';
	import { MessageSquare } from '@lucide/svelte';

	const { threadId, firstMessage } = $props<{
		threadId: string;
		firstMessage: string;
	}>();

	const customChatStore = getCustomChatStore();

	let title = $state('');

	const threadTitleRunner = myRiverClient.threadTitle({
		onStart: () => {
			title = '';
		},
		onChunk: (chunk) => {
			if (chunk.type === 'text-delta') {
				title += chunk.text;
			}
		},
		onSuccess: () => {
			console.log('thread title generated', title);
		}
	});

	onMount(() => {
		threadTitleRunner.start({
			firstMessage
		});
	});
</script>

<button
	onclick={() => customChatStore.openThread(threadId)}
	class="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50 focus:ring-2 focus:ring-purple-400/40 focus:outline-none"
	><MessageSquare size={16} class="opacity-90" />
	{#if title}{title}{:else}{'new thread'}{/if}</button
>
