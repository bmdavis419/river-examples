<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>River Durable Chat</title>
</svelte:head>

<div class=" flex h-screen w-full flex-col bg-neutral-950 text-neutral-50">
	{@render children?.()}
</div>
