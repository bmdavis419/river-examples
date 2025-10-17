import {
	RIVER_PROVIDERS,
	RIVER_STREAMS,
	RiverError,
	type InferAiSdkChunkType
} from '@davis7dotsh/river-alpha';
import { stepCountIs, streamText, tool } from 'ai';
import z from 'zod';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { OPENROUTER_API_KEY, S2_TOKEN } from '$env/static/private';
import { waitUntil } from '@vercel/functions';

const openrouter = createOpenRouter({
	apiKey: OPENROUTER_API_KEY
});

const SYSTEM_PROMPT = `
You are an agent who's job is do produce a summary of a given user's health.

You will have access to a variety of tools to get information about the user.

Use the tools to get the information you need to produce a summary of the user's health.

The only thing you should respond with is the summary of the user's health.

It should be in markdown, following this format:

## {user name} Health Summary
{today's date}

- weight: {weight}
- height: {height}
- bmi: {bmi}
- body fat percentage: {body fat percentage}
- age: {age}
- gender: {gender}

### summary

{short summary of the user's health}

### key areas of concern

{list of key areas of concern}

### key recommendations

{list of key recommendations}
`;

const getTodayDateTool = tool({
	name: 'get_today_date',
	description: "Get the today's date",
	inputSchema: z.object({}),
	execute: async () => {
		return `Today's date is ${new Date().toISOString().split('T')[0]}`;
	}
});

const getUserProfileTool = tool({
	name: 'get_user_profile',
	description:
		"Get a user's profile out of the database (contains name, gender, and other app specific data)",
	inputSchema: z.object({
		user_id: z.string()
	}),
	execute: async ({ user_id }) => {
		return {
			user_id,
			name: 'Fake User',
			gender: 'male',
			created_at: '2025-01-01',
			updated_at: '2025-01-01'
		};
	}
});

const getUserHeightTool = tool({
	name: 'get_user_height',
	description: "Get a user's height out of the database",
	inputSchema: z.object({
		user_id: z.string()
	}),
	execute: async ({ user_id }) => {
		return {
			user_id,
			height: 70,
			unit: 'in'
		};
	}
});

const getUserBodyFatPercentageTool = tool({
	name: 'get_user_body_fat_percentage',
	description: "Get a user's body fat percentage out of the database",
	inputSchema: z.object({
		user_id: z.string()
	}),
	execute: async ({ user_id }) => {
		return {
			user_id,
			body_fat_percentage: 20
		};
	}
});

const getUserAgeTool = tool({
	name: 'get_user_age',
	description: "Get a user's age out of the database",
	inputSchema: z.object({
		user_id: z.string()
	}),
	execute: async ({ user_id }) => {
		return {
			user_id,
			age: 23
		};
	}
});

const getUserWeightTool = tool({
	name: 'get_user_weight',
	description: "Get a user's weight out of the database",
	inputSchema: z.object({
		user_id: z.string()
	}),
	execute: async ({ user_id }) => {
		return {
			user_id,
			weight: 193,
			unit: 'lb'
		};
	}
});

// THIS IS THE IMPORTANT PART
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
