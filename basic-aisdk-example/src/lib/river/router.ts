import { RIVER_SERVER } from '@davis7dotsh/river-alpha';
import { addTasksAgent } from './agents';

export const myRiverRouter = RIVER_SERVER.createAgentRouter({
	addTasks: addTasksAgent
});

export type MyRiverRouter = typeof myRiverRouter;
