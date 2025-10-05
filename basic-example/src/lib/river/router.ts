import { RIVER_SERVER } from '@davis7dotsh/river-alpha';
import { basicExampleAgent } from './agents';

export const myRiverRouter = RIVER_SERVER.createAgentRouter({
	// I recommend having the key not be the name of the agent, this will make the go to definition experience much better
	basicExample: basicExampleAgent
});

// this is to get type inference on the client
export type MyRiverRouter = typeof myRiverRouter;
