<script lang="ts">
	import { myRiverClient } from '$lib/river/client';
	import z from 'zod';
	import { useSearchParams } from 'runed/kit';
	import { onMount } from 'svelte';
	import { Play, Square, Settings, User, Activity, Trash, FileText } from '@lucide/svelte';
	import { marked } from 'marked';

	const urlParamsSchema = z.object({
		resumeKey: z.string().default('')
	});

	const params = useSearchParams(urlParamsSchema);

	const resumeKey = $derived(params.resumeKey);

	let userWeight = $state<number | null>(null);
	let userHeight = $state<number | null>(null);
	const displayHeight = $derived.by(() => {
		if (userHeight === null) return null;
		const feet = Math.floor(userHeight / 12);
		const inches = userHeight % 12;
		return `${feet}'${inches}''`;
	});
	let userBodyFatPercentage = $state<number | null>(null);
	let userAge = $state<number | null>(null);
	let userGender = $state<string | null>(null);
	let userName = $state<string | null>(null);

	type DisplayRun =
		| {
				type: 'text';
				id: string;
				rawText: string;
				markdownText: string;
		  }
		| {
				type: 'toolCall';
				id: string;
				toolName: string;
		  };

	let runDisplay = $state<DisplayRun[]>([]);

	const healthSummaryRunner = myRiverClient.healthSummary({
		onStart: () => {
			runDisplay = [];
		},
		onChunk: (chunk) => {
			switch (chunk.type) {
				case 'text-start':
					runDisplay.push({
						type: 'text',
						id: chunk.id,
						rawText: '',
						markdownText: ''
					});
					break;
				case 'text-delta':
					const currentTextEntry = runDisplay.find((r) => r.id === chunk.id);
					if (!currentTextEntry || currentTextEntry.type !== 'text') break;
					currentTextEntry.rawText += chunk.text;
					currentTextEntry.markdownText = marked.parse(currentTextEntry.rawText, {
						async: false
					});
					break;
				case 'tool-result':
					if (chunk.dynamic) break;
					runDisplay.push({
						type: 'toolCall',
						id: chunk.toolCallId,
						toolName: chunk.toolName
					});
					switch (chunk.toolName) {
						case 'getUserAgeTool':
							userAge = chunk.output.age;
							break;
						case 'getUserBodyFatPercentageTool':
							userBodyFatPercentage = chunk.output.body_fat_percentage;
							break;
						case 'getUserHeightTool':
							userHeight = chunk.output.height;
							break;
						case 'getUserWeightTool':
							userWeight = chunk.output.weight;
							break;
						case 'getUserProfileTool':
							userName = chunk.output.name;
							userGender = chunk.output.gender;
							break;
					}
					break;
				default:
					break;
			}
		},
		onSuccess: () => {
			console.log('Health summary finished');
		},
		onError: (error) => {
			console.error('Error generating health summary', { error });
		},
		onStreamInfo: (streamInfo) => {
			params.resumeKey = streamInfo.resumeKey;
		}
	});

	const runnerState = $derived(healthSummaryRunner.status);
	const isLoading = $derived(runnerState === 'running');

	const finalMarkdownOutput = $derived.by(() => {
		if (runnerState !== 'success' || runDisplay.length === 0) return null;
		const lastTextEntry = runDisplay[runDisplay.length - 1];
		if (lastTextEntry.type !== 'text') return null;
		return lastTextEntry.markdownText;
	});

	const handleStart = () => {
		handleClear();
		healthSummaryRunner.start({ user_id: '123' });
	};

	const handleStop = () => {
		healthSummaryRunner.stop();
	};

	const handleClear = () => {
		runDisplay = [];
		healthSummaryRunner.reset();
		userWeight = null;
		userHeight = null;
		userBodyFatPercentage = null;
		userAge = null;
		userGender = null;
		userName = null;
		params.resumeKey = '';
	};

	onMount(() => {
		if (resumeKey) {
			healthSummaryRunner.resume(resumeKey);
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-8">
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-12">
			<h1 class="text-4xl font-bold text-neutral-900">Health Summary</h1>
			<p class="mt-2 text-neutral-600">Generate a personalized health analysis using AI</p>
		</div>

		<div class="flex h-[calc(100vh-12rem)] flex-col gap-8">
			<!-- Top Row: Controls, Stats, and Final Output -->
			<div class="grid h-[60%] gap-8 lg:grid-cols-3">
				<!-- Control Panel -->
				<div
					class="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
				>
					<div class="flex items-center gap-2 p-6 pb-4">
						<Activity size={20} class="text-yellow-600" />
						<h2 class="text-lg font-semibold text-neutral-900">Control</h2>
					</div>

					<div class="flex flex-col gap-4 overflow-y-auto px-6 pb-6">
						<div class="space-y-3">
							<button
								onclick={handleStart}
								disabled={isLoading}
								class="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-yellow-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
							>
								<Play size={18} />
								<span>Start Analysis</span>
							</button>

							<button
								onclick={handleStop}
								disabled={!isLoading}
								class="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
							>
								<Square size={18} />
								<span>Stop Stream</span>
							</button>

							<button
								onclick={handleClear}
								disabled={!isLoading && runnerState === 'idle'}
								class="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-3 font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<Trash size={18} />
								<span>Reset</span>
							</button>
						</div>

						<!-- Status Badge -->
						<div class="rounded-lg bg-neutral-100 p-4">
							<p class="text-sm font-medium text-neutral-600">Status</p>
							<div class="mt-2 flex items-center gap-2">
								<div
									class="h-3 w-3 rounded-full transition-colors duration-300"
									class:bg-yellow-500={isLoading}
									class:bg-green-500={runnerState === 'success'}
									class:bg-red-500={runnerState === 'error'}
									class:bg-neutral-400={runnerState === 'idle'}
								></div>
								<span class="font-semibold text-neutral-900 capitalize">
									{#if isLoading}
										Analyzing...
									{:else if runnerState === 'success'}
										Complete
									{:else if runnerState === 'error'}
										Error
									{:else}
										Idle
									{/if}
								</span>
							</div>
						</div>
					</div>
				</div>

				<!-- User Stats -->
				{#if userName || userAge || userWeight || displayHeight || userGender || userBodyFatPercentage}
					<div
						class="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
					>
						<div class="flex items-center gap-2 p-6 pb-4">
							<User size={20} class="text-yellow-600" />
							<h2 class="text-lg font-semibold text-neutral-900">Stats</h2>
						</div>

						<div class="flex-1 overflow-y-auto px-6 pb-6">
							<div class="space-y-4">
								{#if userName}
									<div class="border-b border-neutral-100 pb-3 last:border-0">
										<p class="text-xs font-medium text-neutral-500 uppercase">Name</p>
										<p class="mt-1 text-lg font-semibold text-neutral-900">{userName}</p>
									</div>
								{/if}

								{#if userAge !== null}
									<div class="border-b border-neutral-100 pb-3 last:border-0">
										<p class="text-xs font-medium text-neutral-500 uppercase">Age</p>
										<p class="mt-1 text-lg font-semibold text-neutral-900">{userAge} years</p>
									</div>
								{/if}

								{#if userGender}
									<div class="border-b border-neutral-100 pb-3 last:border-0">
										<p class="text-xs font-medium text-neutral-500 uppercase">Gender</p>
										<p class="mt-1 text-lg font-semibold text-neutral-900 capitalize">
											{userGender}
										</p>
									</div>
								{/if}

								{#if userWeight !== null}
									<div class="border-b border-neutral-100 pb-3 last:border-0">
										<p class="text-xs font-medium text-neutral-500 uppercase">Weight</p>
										<p class="mt-1 text-lg font-semibold text-neutral-900">{userWeight} lb</p>
									</div>
								{/if}

								{#if displayHeight}
									<div class="border-b border-neutral-100 pb-3 last:border-0">
										<p class="text-xs font-medium text-neutral-500 uppercase">Height</p>
										<p class="mt-1 text-lg font-semibold text-neutral-900">{displayHeight}</p>
									</div>
								{/if}

								{#if userBodyFatPercentage !== null}
									<div class="border-b border-neutral-100 pb-3 last:border-0">
										<p class="text-xs font-medium text-neutral-500 uppercase">Body Fat</p>
										<p class="mt-1 text-lg font-semibold text-neutral-900">
											{userBodyFatPercentage}%
										</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else}
					<!-- Empty stats placeholder -->
					<div
						class="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 shadow-sm"
					>
						<div class="flex items-center gap-2 p-6 pb-4">
							<User size={20} class="text-neutral-400" />
							<h2 class="text-lg font-semibold text-neutral-600">Stats</h2>
						</div>
						<div class="flex-1 overflow-y-auto px-6 pb-6">
							<p class="text-sm text-neutral-500">
								No stats available yet. Start an analysis to see user data.
							</p>
						</div>
					</div>
				{/if}

				<!-- Final Output -->
				{#if finalMarkdownOutput}
					<div
						class="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
					>
						<div class="flex items-center gap-2 p-6 pb-4">
							<FileText size={20} class="text-yellow-600" />
							<h2 class="text-lg font-semibold text-neutral-900">Final Summary</h2>
						</div>
						<div class="flex-1 overflow-y-auto px-6 pb-6">
							<div class="prose prose-sm max-w-none prose-neutral">
								{@html finalMarkdownOutput}
							</div>
						</div>
					</div>
				{:else}
					<!-- Empty final output placeholder -->
					<div
						class="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 shadow-sm"
					>
						<div class="flex items-center gap-2 p-6 pb-4">
							<FileText size={20} class="text-neutral-400" />
							<h2 class="text-lg font-semibold text-neutral-600">Final Summary</h2>
						</div>
						<div class="flex-1 overflow-y-auto px-6 pb-6">
							<p class="text-sm text-neutral-500">
								Complete an analysis to see the final health summary.
							</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Bottom Row: Analysis Output full width -->
			<div
				class="flex h-[40%] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
			>
				<div class="flex items-center gap-2 p-6 pb-4">
					<Settings size={20} class="text-yellow-600" />
					<h2 class="text-lg font-semibold text-neutral-900">Analysis Output</h2>
				</div>

				<div class="flex-1 overflow-y-auto px-6 pb-6">
					<div class="space-y-4 rounded-lg bg-neutral-50 p-4">
						{#if runDisplay.length === 0}
							<p class="text-center text-neutral-500">
								{#if isLoading}
									Generating analysis...
								{:else}
									Click "Start Analysis" to begin
								{/if}
							</p>
						{:else}
							{#each runDisplay as item (item.id)}
								{#if item.type === 'text'}
									<div
										class="prose prose-sm rounded-lg bg-white p-4 text-neutral-900 prose-neutral"
									>
										{@html item.markdownText}
									</div>
								{:else if item.type === 'toolCall'}
									<div
										class="flex items-center gap-3 rounded-lg border-l-4 border-yellow-600 bg-yellow-50 p-4"
									>
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600"
										>
											<Settings size={16} class="text-white" />
										</div>
										<div>
											<p class="text-sm font-semibold text-neutral-900">{item.toolName}</p>
											<p class="text-xs text-neutral-600">Tool execution</p>
										</div>
									</div>
								{/if}
							{/each}

							{#if isLoading}
								<div class="flex items-center gap-2 text-sm text-neutral-600">
									<div class="h-2 w-2 animate-pulse rounded-full bg-yellow-600"></div>
									<span>Analyzing...</span>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
