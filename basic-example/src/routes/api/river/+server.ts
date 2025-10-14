import { myRiverRouter } from '$lib/river/router';
import { RIVER_SERVERS } from '@davis7dotsh/river-alpha';

// this is all it takes, nothing else needed
// NOTE: this is sveltekit specific, more frameworks coming eventually...
export const { POST } = RIVER_SERVERS.createSvelteKitEndpointHandler(myRiverRouter);
