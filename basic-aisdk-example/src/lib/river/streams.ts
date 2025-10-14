import { OPENROUTER_API_KEY } from '$env/static/private';
import { RIVER_PROVIDERS, RIVER_STREAMS, type InferAiSdkChunkType } from '@davis7dotsh/river-alpha';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { stepCountIs, streamText, tool } from 'ai';
import z from 'zod';

// a little agent that will add tasks to a user's todo list

const openrouter = createOpenRouter({
	apiKey: OPENROUTER_API_KEY
});

const addTaskTool = tool({
	name: 'add_task',
	description: "Add a task to a user's todo list",
	inputSchema: z.object({
		userId: z.string(),
		taskContent: z.string(),
		dueDate: z.string().describe('The date the task is due, should be in YYYY-MM-DD format')
	}),
	execute: ({ userId, taskContent, dueDate }) => {
		console.log('agent added task', { userId, taskContent, dueDate });
		return `Task added: ${taskContent} due on ${dueDate}`;
	}
});

const getTodaysDateTool = tool({
	name: 'get_todays_date',
	description: 'Get the current date',
	inputSchema: z.object({}),
	execute: () => {
		const today = new Date().toISOString().split('T')[0];
		console.log('agent got todays date', today);
		return today;
	}
});

export const addTasksAgent = RIVER_STREAMS.createRiverStream()
	.input(
		z.object({
			userId: z.string(),
			userMessage: z.string()
		})
	)
	.runner(async (stuff) => {
		const { input, abortSignal, initStream } = stuff;

		const SYSTEM_PROMPT = `You are an internal system designed to parse through messages from users and determine if there are any tasks in them that need to be added to a user's todo list. If there are, you should add them to the todo list using the add_task tool. If there are no tasks, you should respond with "No tasks found." Make sure the due date you assign is correct, you can use the get_todays_date tool to get the current date. Make sure all of the text you send is in markdown format.`;

		const PROMPT = `User ID: ${input.userId}\n\nUser Message: ${input.userMessage}`;

		const { fullStream } = streamText({
			abortSignal,
			tools: {
				add_task: addTaskTool,
				get_todays_date: getTodaysDateTool
			},
			system: SYSTEM_PROMPT,
			prompt: PROMPT,
			model: openrouter('x-ai/grok-4-fast'),
			stopWhen: stepCountIs(10),
			onStepFinish: (stepData) => {
				console.log('finished step', stepData.toolCalls.length, 'tool calls made');
			}
		});

		type ChunkType = InferAiSdkChunkType<typeof fullStream>;

		const stream = await initStream(RIVER_PROVIDERS.defaultRiverStorageProvider<ChunkType>());

		stream.sendData(async ({ appendChunk, close }) => {
			for await (const chunk of fullStream) {
				appendChunk(chunk);
			}
			close();
		});

		return stream;
	});
