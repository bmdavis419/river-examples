import { RIVER_CLIENT } from '@davis7dotsh/river-alpha';
import { type MyRiverRouter } from './router';

export const myRiverClient = RIVER_CLIENT.createClientCaller<MyRiverRouter>('/api/river');
