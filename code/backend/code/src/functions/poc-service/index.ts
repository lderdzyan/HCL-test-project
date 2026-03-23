import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import { userSubscription } from './handlers/taxamo-membership/user';

const BASE_PATH = '/api/poc-service';
const app = new Hono().use(cors({ origin: process.env.MS_GUI_URL ?? '', credentials: true }));


app.post(BASE_PATH + '/taxamo/subscribe/user', userSubscription);

export const handler = handle(app);
