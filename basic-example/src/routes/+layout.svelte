<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>basic river ex: custom stream</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="font-geist">
	{@render children?.()}
</div>
