import { Provider, IAgentRuntime, ProviderResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const positionsProvider: Provider = {
  name: 'positions',
  description: 'Provides position data from Delta Exchange',
  private: true,
  dynamic: false,
  get: async (runtime: IAgentRuntime): Promise<ProviderResult> => {
    try {
      const deltaRestClient = runtime.getService('delta-restclient') as unknown as DeltaRestClient;
      if (!deltaRestClient) {
        throw new Error('DeltaRestClient service not found');
      }

      const positions = await deltaRestClient.getPositions();
      return {
        text: `Retrieved ${positions.result?.length || 0} positions`,
        data: positions.result || [],
      };
    } catch (error: any) {
      logger.error('Error in positionsProvider:', error.message);
      return {
        text: `Failed to retrieve positions: ${error.message}`,
        data: {},
      };
    }
  },
};
