import { myRiverRouter } from '$lib/river/router';
import { RIVER_SERVERS } from '@davis7dotsh/river-alpha';

export const { POST, GET } = RIVER_SERVERS.createSvelteKitEndpointHandler({
	streams: myRiverRouter
});
