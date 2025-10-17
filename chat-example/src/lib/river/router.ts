import { RIVER_STREAMS } from '@davis7dotsh/river-alpha';
import { chatStream } from './streams';

export const myRiverRouter = RIVER_STREAMS.createRiverRouter({
	chat: chatStream
});

export type MyRiverRouter = typeof myRiverRouter;
