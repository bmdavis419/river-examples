import { OPENROUTER_API_KEY, S2_TOKEN } from '$env/static/private';
import { RIVER_PROVIDERS, RIVER_STREAMS, type InferAiSdkChunkType } from '@davis7dotsh/river-alpha';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { waitUntil } from '@vercel/functions';
import { streamText } from 'ai';
import z from 'zod';

const openrouter = createOpenRouter({
	apiKey: OPENROUTER_API_KEY
});

const SYSTEM_PROMPT = `You are the river chat example assistant. Your job is to answer the user's questions. Be clear and concise in your response, and ALWAYS use markdown formatting. NEVER respond with emojis, the earth will explode if you do.`;

export const chatStream = RIVER_STREAMS.createRiverStream()
	.input(
		z.array(
			z.object({
				role: z.enum(['user', 'assistant']),
				content: z.string()
			})
		)
	)
	.runner(async (stuff) => {
		const { input, initStream } = stuff;

		const { fullStream } = streamText({
			model: openrouter('anthropic/claude-haiku-4.5'),
			// TODO: add in some tools, ideas:
			// add to todo list, save note, schedule reminder
			tools: {},
			system: SYSTEM_PROMPT,
			messages: input
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
