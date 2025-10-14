import { RIVER_CLIENT_SVELTEKIT } from '@davis7dotsh/river-alpha';
import type { MyRiverRouter } from './router';

// similar to a trpc client, this is how we call the agents from the client
export const myRiverClient =
	RIVER_CLIENT_SVELTEKIT.createSvelteKitRiverClient<MyRiverRouter>('/api/river');
