import { RIVER_CLIENT_SVELTEKIT } from '@davis7dotsh/river-alpha';
import type { MyRiverRouter } from './router.js';

export const myRiverClient =
	RIVER_CLIENT_SVELTEKIT.createSvelteKitRiverClient<MyRiverRouter>('/api/river');
