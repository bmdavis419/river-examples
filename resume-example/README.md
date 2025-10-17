# basic example: stream resuming

a really simple project showing off how you can make durable streams with [river](https://github.com/bmdavis419/river) (TRPC for agent streams)

we're using s2 for the stream resume logic, so you will need a free account to use it.

```ts
export const myHealthAgent = RIVER_STREAMS.createRiverStream()
	.input(
		z.object({
			user_id: z.string()
		})
	)
	.runner(async (stuff) => {
		const { input, initStream } = stuff;

		const { fullStream } = streamText({
			model: openrouter('anthropic/claude-haiku-4.5'),
			system: SYSTEM_PROMPT,
			tools: {
				getUserWeightTool,
				getUserHeightTool,
				getUserBodyFatPercentageTool,
				getUserAgeTool,
				getUserProfileTool,
				getTodayDateTool
			},
			onError: (error) => {
				console.error('Error generating text', { error });
				throw new RiverError('Error generating text', error, 'custom');
			},
			onFinish: (completion) => {
				const totalTokens = completion.usage.totalTokens;
				console.info('Text generation finished, total tokens: ' + totalTokens);
			},
			stopWhen: stepCountIs(10),
			providerOptions: {
				openai: {
					parallelToolCalls: true,
					reasoningEffort: 'low',
					reasoningSummary: 'auto'
				}
			},
			toolChoice: 'auto',
			prompt: `User's ID: ${input.user_id}`
		});

		// this is how we get type safety on the chunks on the client
		type ChunkType = InferAiSdkChunkType<typeof fullStream>;

		const activeStream = await initStream(
			// this is how we setup s2 so that it will persist the stream data
			RIVER_PROVIDERS.s2RiverStorageProvider<ChunkType>(S2_TOKEN, 'river-testing', waitUntil)
		);

		activeStream.sendData(async ({ appendChunk, close }) => {
			for await (const chunk of fullStream) {
				appendChunk(chunk);
			}
			await close();
		});

		return activeStream;
	});
```

## getting started

1. clone the repo
2. install dependencies `bun i`
3. grab an openrouter api key and an s2 token then add them to the `.env` file (see `.env.example`)
4. run the project `bun dev`

## stuff to go look at:

- `src/lib/river/streams.ts` - the agent code
- `src/lib/river/router.ts` - the router code
- `src/lib/river/client.ts` - the river client definition code
- `src/routes/+page.svelte` - the page code
- `src/routes/api/river/+server.ts` - the river server endpoint code
