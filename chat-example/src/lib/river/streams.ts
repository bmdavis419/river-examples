import { OPENROUTER_API_KEY, S2_TOKEN } from '$env/static/private';
import { RIVER_PROVIDERS, RIVER_STREAMS, type InferAiSdkChunkType } from '@davis7dotsh/river-alpha';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { waitUntil } from '@vercel/functions';
import { stepCountIs, streamText, tool, type ModelMessage } from 'ai';
import z from 'zod';

const openrouter = createOpenRouter({
	apiKey: OPENROUTER_API_KEY
});

const saveTaskTool = tool({
	name: 'save_task',
	description: "save a task to the user's todo list",
	inputSchema: z.object({
		content: z
			.string()
			.describe("the content of the task that will show up in the user's todo list"),
		dueDate: z.string().describe('the due date of the task in the format YYYY-MM-DD')
	}),
	execute: async ({ content, dueDate }) => {
		console.log('saving task', content, dueDate);
		return {
			success: true,
			message: 'Task saved successfully'
		};
	}
});

const saveNoteTool = tool({
	name: 'save_note',
	description: "save a note for the user, it will appear in the user's notes.",
	inputSchema: z.object({
		content: z
			.string()
			.describe(
				"the content of the note that will show up in the user's notes. USE MARKDOWN FORMATTING FOR THE NOTE."
			)
	}),
	execute: async ({ content }) => {
		console.log('saving note', content);
		return {
			success: true,
			message: 'Note saved successfully'
		};
	}
});

const GET_SYSTEM_PROMPT = (today: string) => `
You are a user's personal assistant. Your job is the following:

- Answer the user's questions and help them with whatever they need
- Save tasks to the user's todo list by using the \`save_task\` tool. Save tasks when they ask you to, or if you think you noticed a task that should be saved, ask before saving it.
- Save notes to the user's notes by using the \`save_note\` tool. Save notes only when they ask you to

Be clear and concise in your response, and ALWAYS use markdown formatting. NEVER respond with emojis, the earth will explode if you do.

USEFUL INFO FOR YOU:

- Today's date is ${today}
`;

const inputSchema = z.object({
	today: z.string(),
	messages: z.array(
		z.discriminatedUnion('role', [
			z.object({
				role: z.literal('user'),
				content: z.string()
			}),
			z.object({
				role: z.literal('assistant'),
				content: z.string()
			}),
			z.object({
				role: z.literal('tool'),
				content: z.array(
					z.object({
						type: z.literal('tool-result'),
						toolCallId: z.string(),
						toolName: z.string(),
						output: z.object({
							type: z.literal('text'),
							value: z.string()
						})
					})
				)
			})
		])
	)
});

export const chatStream = RIVER_STREAMS.createRiverStream()
	.input(inputSchema)
	.runner(async (stuff) => {
		const { input, initStream } = stuff;

		const { today, messages } = input;

		const systemPrompt = GET_SYSTEM_PROMPT(today);

		console.log('system prompt', systemPrompt);

		const { fullStream } = streamText({
			model: openrouter('anthropic/claude-haiku-4.5'),
			tools: {
				save_task: saveTaskTool,
				save_note: saveNoteTool
			},
			toolChoice: 'auto',
			stopWhen: stepCountIs(10),
			system: systemPrompt,
			messages
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
