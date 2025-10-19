import type {
	RiverAiSdkToolInputType,
	RiverAiSdkToolOutputType,
	RiverAiSdkToolSet,
	RiverStreamInputType
} from '@davis7dotsh/river-alpha';
import { myRiverClient } from '$lib/river/client';
import { z } from 'zod';

export const chatPageParamsSchema = z.object({
	threadId: z.string().default(''),
	curResumeKey: z.string().default('')
});

export type ChatInput = RiverStreamInputType<ReturnType<typeof myRiverClient.chat>>;

export type ChatToolSet = RiverAiSdkToolSet<ReturnType<typeof myRiverClient.chat>>;

export type SaveTaskToolInput = RiverAiSdkToolInputType<ChatToolSet, 'save_task'>;
export type SaveNoteToolInput = RiverAiSdkToolInputType<ChatToolSet, 'save_note'>;
export type SaveTaskToolOutput = RiverAiSdkToolOutputType<ChatToolSet, 'save_task'>;
export type SaveNoteToolOutput = RiverAiSdkToolOutputType<ChatToolSet, 'save_note'>;

export type ChatDisplayEntry =
	| {
			type: 'text';
			data:
				| {
						role: 'user';
						text: string;
				  }
				| {
						role: 'assistant';
						status: 'running' | 'completed' | 'error';
						id: string;
						rawText: string;
						markdownText: string;
				  };
	  }
	| {
			type: 'dynamic-tool-call';
			toolName: string;
			id: string;
			toolInput: string;
			toolOutput: string;
	  }
	| {
			type: 'adding-task-tool';
			id: string;
			input: SaveTaskToolInput;
			output: SaveTaskToolOutput;
	  }
	| {
			type: 'adding-note-tool';
			id: string;
			input: SaveNoteToolInput;
			output: SaveNoteToolOutput;
	  };
