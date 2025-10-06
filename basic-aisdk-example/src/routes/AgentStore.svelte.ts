import { myRiverClient } from '$lib/river/client';
import type {
	RiverClientCallerAiSdkToolSetType,
	RiverClientCallerToolCallInputType,
	RiverClientCallerToolCallOutputType
} from '@davis7dotsh/river-alpha';
import { marked } from 'marked';

type AgentToolSet = RiverClientCallerAiSdkToolSetType<typeof myRiverClient.addTasks>;

type AgentTaskToolCallInput = RiverClientCallerToolCallInputType<AgentToolSet, 'add_task'>;
type AgentTaskToolCallOutput = RiverClientCallerToolCallOutputType<AgentToolSet, 'add_task'>;
type AgentDateToolCallInput = RiverClientCallerToolCallInputType<AgentToolSet, 'get_todays_date'>;
type AgentDateToolCallOutput = RiverClientCallerToolCallOutputType<AgentToolSet, 'get_todays_date'>;

type DisplayToolCall = {
	type: 'tool_call';
	id: string;
	toolCall:
		| {
				name: 'add_task';
				input: AgentTaskToolCallInput;
				output: AgentTaskToolCallOutput;
		  }
		| {
				name: 'get_todays_date';
				input: AgentDateToolCallInput;
				output: AgentDateToolCallOutput;
		  };
};

type DisplayText = {
	type: 'text';
	id: string;
	rawContent: string;
	parsedContent: string;
};

type DisplayBreak = {
	type: 'break';
};

type DisplayAgentOutput = DisplayToolCall | DisplayText | DisplayBreak;

// if ur not familiar with svelte, this is one of my favorite patterns
// classes are pretty shit for a lot of things, but when you're doing state-based client-side logic, they're awesome
export class AgentStore {
	private userId = 'not_real'; // placeholder for the sake of the example
	userMessageInput = $state(
		'I need to go to the gym later tonight, then tmrw I have a flight to catch, and I need to finish packing for it'
	);
	agentStatus = $state<'idle' | 'running' | 'success' | 'error' | 'cancelled'>('idle');
	agentOutput = $state<DisplayAgentOutput[]>([]);

	finalTextOutput = $derived.by(() => {
		if (this.agentStatus === 'success') {
			const textEntries = this.agentOutput.filter((entry) => entry.type === 'text');
			if (textEntries.length > 0) {
				return textEntries[textEntries.length - 1].parsedContent;
			}
		}
		return null;
	});

	reset() {
		this.agentOutput = [];
		this.agentStatus = 'idle';
	}

	private taskAgentCaller = myRiverClient.addTasks({
		onStart: () => {
			this.reset();
			this.agentStatus = 'running';
		},
		onChunk: (streamChunk) => {
			switch (streamChunk.type) {
				case 'tool-result':
					if (streamChunk.dynamic) break;
					if (streamChunk.toolName === 'add_task') {
						this.agentOutput.push({
							type: 'tool_call',
							id: streamChunk.toolCallId,
							toolCall: {
								name: 'add_task',
								input: streamChunk.input,
								output: streamChunk.output
							}
						});
					}
					if (streamChunk.toolName === 'get_todays_date') {
						this.agentOutput.push({
							type: 'tool_call',
							id: streamChunk.toolCallId,
							toolCall: {
								name: 'get_todays_date',
								input: streamChunk.input,
								output: streamChunk.output
							}
						});
					}
					break;
				case 'text-start': {
					this.agentOutput.push({
						type: 'text',
						id: streamChunk.id,
						rawContent: '',
						parsedContent: ''
					});
					break;
				}
				case 'text-delta': {
					const currentTextEntry = this.agentOutput.find(
						(entry) => entry.type === 'text' && entry.id === streamChunk.id
					);
					if (!currentTextEntry || currentTextEntry.type !== 'text') break;
					const updatedContent = currentTextEntry.rawContent + streamChunk.text;
					const markedResult = marked(updatedContent, {
						async: false
					});
					currentTextEntry.rawContent = updatedContent;
					currentTextEntry.parsedContent = markedResult;
					break;
				}
				case 'finish-step': {
					this.agentOutput.push({
						type: 'break'
					});
				}
				default:
					break;
			}
		},
		onError: (error) => {
			this.agentStatus = 'error';
			console.error(error);
		},
		onComplete: (output) => {
			console.log(
				'agent finished,',
				output.totalChunks,
				`chunks in ${(output.duration / 1000).toFixed(2)} seconds`
			);
			if (this.agentStatus === 'running') {
				this.agentStatus = 'success';
				// remove the last break
				this.agentOutput.pop();
			}
			this.userMessageInput = '';
		},
		onCancel: () => {
			console.warn('agent cancelled');
			this.agentStatus = 'cancelled';
		}
	});

	async handleCallAgent() {
		await this.taskAgentCaller.start({
			userId: this.userId,
			userMessage: this.userMessageInput
		});
	}

	handleStopAgent() {
		this.taskAgentCaller.stop();
	}
}
