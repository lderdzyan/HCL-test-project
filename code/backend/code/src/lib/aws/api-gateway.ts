import * as Hapi from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import { APIGatewayClient, GetApiKeysCommand } from '@aws-sdk/client-api-gateway';
import { IConfig } from './config';

export const authenticate = (config: IConfig) => async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
  const apigClient = new APIGatewayClient({ region: config.region });
  const apiKey = request.headers['x-api-key'];
  if (apiKey == null) {
    throw Boom.unauthorized('API Key required.');
  }
// comment
  const response = await apigClient.send(new GetApiKeysCommand({ includeValues: true }));

  if (response.items != null && response.items.length > 0) {
    for (let item of response.items) {
      if (item.value === apiKey && item.enabled) {
        return h.authenticated({ credentials: { user: { pid: 'asda' } } });
      }
    }
  }

  throw Boom.unauthorized('API Key required.');
};
