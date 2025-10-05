import { myRiverRouter } from '$lib/river/router';
import { RIVER_SERVER } from '@davis7dotsh/river-alpha';

export const { POST } = RIVER_SERVER.createServerEndpointHandler(myRiverRouter);
