import { RIVER_STREAMS } from '@davis7dotsh/river-alpha';
import { myHealthAgent } from './streams';

export const myRiverRouter = RIVER_STREAMS.createRiverRouter({
	healthSummary: myHealthAgent
});

export type MyRiverRouter = typeof myRiverRouter;
