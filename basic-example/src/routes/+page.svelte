<script lang="ts">
	import { myRiverClient } from '$lib/river/client';
	import type { RiverStreamChunkType } from '@davis7dotsh/river-alpha';
	import { Play, Square, RotateCcw } from '@lucide/svelte';

	let agentResults = $state<RiverStreamChunkType<typeof basicExample>[]>([]);
	let agentResultsTotalVowels = $state(0);
	let agentResultsTotalConsonants = $state(0);
	let message = $state('');

	const reset = () => {
		agentResults = [];
		agentResultsTotalVowels = 0;
		agentResultsTotalConsonants = 0;
	};

	// this works just like mutations in trpc, it will not actually run until you call start
	// the callbacks are optional, and will fire when they are defined and the agent starts
	const basicExample = myRiverClient.basicExample({
		onStart: () => {
			// fires when the agent starts
			reset();
		},
		onChunk: ({ letter, isVowel }) => {
			// fires when a chunk is received
			// will always just have one chunk and is fully type safe
			agentResults.push({ letter, isVowel });
			if (isVowel) {
				agentResultsTotalVowels++;
			} else {
				agentResultsTotalConsonants++;
			}
		},
		onError: (error) => {
			// fires when the agent errors
			console.error(error);
		},
		onSuccess: () => {
			console.log('Basic example completed');
		}
	});

	$inspect(basicExample.status);

	const handleStart = async (event: SubmitEvent) => {
		event.preventDefault();
		// actually starts the agent
		basicExample.start({
			message
		});
	};

	const handleCancel = () => {
		// stops the agent (uses an abort controller under the hood)
		basicExample.stop();
	};

	const handleClear = () => {
		// reset state
		message = '';
		basicExample.reset();
		reset();
	};
</script>

<div class="mx-auto max-w-2xl space-y-6 p-6">
	<div class="space-y-4">
		<h1 class="text-2xl font-bold">Agent Runner</h1>

		<form class="flex gap-3" onsubmit={handleStart}>
			<input
				bind:value={message}
				placeholder="Enter your message..."
				class="flex-1 rounded-lg border border-neutral-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-900 focus:outline-none"
				disabled={basicExample.status === 'running'}
			/>

			<button
				type="submit"
				disabled={basicExample.status === 'running' || message.trim() === ''}
				class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900 text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-neutral-400"
			>
				<Play class="h-4 w-4" />
			</button>

			<button
				type="button"
				onclick={handleCancel}
				disabled={basicExample.status !== 'running'}
				class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
			>
				<Square class="h-4 w-4" />
			</button>

			<button
				type="button"
				onclick={handleClear}
				disabled={basicExample.status === 'running'}
				class="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-600 text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
			>
				<RotateCcw class="h-4 w-4" />
			</button>
		</form>

		{#if basicExample.status !== 'idle'}
			<div class="flex flex-row items-center gap-3">
				<div class="text-sm text-neutral-600">
					Status: <span class="font-medium capitalize">{basicExample.status}</span>
				</div>
				<div class="text-sm text-neutral-600">
					Total Vowels: <span class="font-medium">{agentResultsTotalVowels}</span>
				</div>
				<div class="text-sm text-neutral-600">
					Total Consonants: <span class="font-medium">{agentResultsTotalConsonants}</span>
				</div>
			</div>
		{/if}
	</div>

	{#if agentResults.length > 0}
		<div class="space-y-2">
			<h2 class="text-lg font-semibold">Results</h2>
			<div class="space-y-2">
				{#each agentResults as result, index}
					<div class="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
						<span class="font-mono text-lg font-bold">{result.letter}</span>
						<span class="text-sm text-neutral-600">
							{result.isVowel ? 'Vowel' : 'Consonant'}
						</span>
						<span class="ml-auto text-xs text-neutral-400">#{index + 1}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
