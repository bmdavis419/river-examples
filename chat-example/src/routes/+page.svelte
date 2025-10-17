<script lang="ts">
	import { ChatStore } from './ChatStore.svelte';

	const chatStore = new ChatStore();
</script>

<div class="flex flex-col justify-start gap-4 p-8">
	<button onclick={() => chatStore.handleSendMessage()}>START THE TEST</button>
	<button onclick={() => chatStore.handleResetChat()}>RESET CHAT</button>
</div>
