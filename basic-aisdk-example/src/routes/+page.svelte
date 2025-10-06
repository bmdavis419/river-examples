<script lang="ts">
	import { AgentStore } from './AgentStore.svelte';
	import { Play, Square, RotateCcw } from '@lucide/svelte';

	const agentStore = new AgentStore();
</script>

<div class="min-h-screen bg-neutral-50 p-6">
	<div class="mx-auto max-w-4xl space-y-6">
		<!-- Input Section -->
		<div class="rounded-lg bg-white p-6 shadow-sm">
			<h1 class="mb-4 text-2xl font-semibold text-neutral-900">AI Agent</h1>

			<form
				class="space-y-4"
				onsubmit={async (e) => {
					e.preventDefault();
					await agentStore.handleCallAgent();
				}}
			>
				<textarea
					bind:value={agentStore.userMessageInput}
					placeholder="Enter your message for the AI agent..."
					class="h-32 w-full resize-none rounded-lg border border-neutral-300 p-4 focus:border-transparent focus:ring-2 focus:ring-blue-800"
					disabled={agentStore.agentStatus === 'running'}
					onkeydown={async (e) => {
						if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
							e.preventDefault();
							await agentStore.handleCallAgent();
						}
					}}
				></textarea>

				<div class="flex gap-3">
					<button
						type="submit"
						disabled={!agentStore.userMessageInput.trim() || agentStore.agentStatus === 'running'}
						class="flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2 text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Play class="h-4 w-4" />
						Start
					</button>

					<button
						type="button"
						onclick={() => agentStore.handleStopAgent()}
						disabled={agentStore.agentStatus !== 'running'}
						class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Square class="h-4 w-4" />
						Stop
					</button>

					<button
						type="button"
						onclick={() => agentStore.reset()}
						class="flex items-center gap-2 rounded-lg bg-neutral-600 px-4 py-2 text-white transition-colors hover:bg-neutral-700"
					>
						<RotateCcw class="h-4 w-4" />
						Reset
					</button>
				</div>
			</form>
		</div>

		<!-- Final Output Section -->
		{#if agentStore.finalTextOutput}
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<h2 class="mb-3 text-lg font-semibold text-neutral-900">Final Response</h2>
				<div class="prose max-w-none leading-relaxed whitespace-pre-wrap">
					{@html agentStore.finalTextOutput}
				</div>
			</div>
		{/if}

		<!-- Agent Stream Display -->
		{#if agentStore.agentOutput.length > 0}
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-semibold text-neutral-900">Agent Activity</h2>
				<div class="space-y-4">
					{#each agentStore.agentOutput as output}
						{#if output.type === 'text'}
							<div class="prose rounded-lg bg-neutral-50 p-4 whitespace-pre-wrap">
								{@html output.parsedContent}
							</div>
						{:else if output.type === 'tool_call'}
							<div class="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
								<div class="mb-2 flex items-center gap-2">
									<span class="text-sm font-medium text-blue-900">Tool Call:</span>
									<span class="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800"
										>{output.toolCall.name}</span
									>
								</div>
								{#if output.toolCall.name === 'add_task'}
									<div class="space-y-2 text-sm">
										<div>
											<strong>Input:</strong>
											{JSON.stringify(output.toolCall.input, null, 2)}
										</div>
										<div>
											<strong>Output:</strong>
											{JSON.stringify(output.toolCall.output, null, 2)}
										</div>
									</div>
								{:else if output.toolCall.name === 'get_todays_date'}
									<div class="space-y-2 text-sm">
										<div>
											<strong>Input:</strong>
											{JSON.stringify(output.toolCall.input, null, 2)}
										</div>
										<div>
											<strong>Output:</strong>
											{JSON.stringify(output.toolCall.output, null, 2)}
										</div>
									</div>
								{/if}
							</div>
						{:else if output.type === 'break'}
							<hr class="border-gray-200" />
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Status Indicator -->
		{#if agentStore.agentStatus !== 'idle'}
			<div class="fixed right-6 bottom-6">
				<div class="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-lg">
					<div
						class="h-2 w-2 rounded-full {agentStore.agentStatus === 'running'
							? 'animate-pulse bg-blue-500'
							: agentStore.agentStatus === 'success'
								? 'bg-green-500'
								: agentStore.agentStatus === 'error'
									? 'bg-red-500'
									: 'bg-yellow-500'}"
					></div>
					<span class="text-sm font-medium capitalize">{agentStore.agentStatus}</span>
				</div>
			</div>
		{/if}
	</div>
</div>
