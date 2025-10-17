import { S2_TOKEN } from '$env/static/private';
import { myRiverRouter } from '$lib/river/router';
import { RIVER_PROVIDERS, RIVER_SERVERS } from '@davis7dotsh/river-alpha';

const { POST, GET } = RIVER_SERVERS.createSvelteKitEndpointHandler({
	streams: myRiverRouter,
	resumableProviders: {
		// this is required so that we have the S2 access token available when resuming the stream
		s2: RIVER_PROVIDERS.s2RiverStorageProvider(S2_TOKEN)
	}
});

export { POST, GET };
