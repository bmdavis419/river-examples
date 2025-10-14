import { RIVER_STREAMS } from '@davis7dotsh/river-alpha';
import { addTasksAgent } from './streams';

export const myRiverRouter = RIVER_STREAMS.createRiverRouter({
	addTasks: addTasksAgent
});

export type MyRiverRouter = typeof myRiverRouter;
