import { myRiverRouter } from '$lib/river/router';
import { RIVER_SERVERS } from '@davis7dotsh/river-alpha';

export const { POST } = RIVER_SERVERS.createSvelteKitEndpointHandler(myRiverRouter);
