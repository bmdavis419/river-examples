import { RIVER_STREAMS } from '@davis7dotsh/river-alpha';
import { chatStream, threadTitleStream } from './streams';

export const myRiverRouter = RIVER_STREAMS.createRiverRouter({
	chat: chatStream,
	threadTitle: threadTitleStream
});

export type MyRiverRouter = typeof myRiverRouter;
