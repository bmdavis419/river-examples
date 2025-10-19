<script lang="ts">
	import { myRiverClient } from '$lib/river/client';
	import { getCustomChatStore } from '$lib/stores/CustomChatStore.svelte';
	import { onMount } from 'svelte';

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
	class=" text-sm text-neutral-400 hover:text-neutral-200"
	>{#if title}{title}{:else}{'new thread'}{/if}</button
>
