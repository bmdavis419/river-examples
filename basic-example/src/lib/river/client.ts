import { RIVER_CLIENT } from '@davis7dotsh/river-alpha';
import { type MyRiverRouter } from './router';

// similar to a trpc client, this is how we call the agents from the client
export const myRiverClient = RIVER_CLIENT.createClientCaller<MyRiverRouter>('/api/river');
