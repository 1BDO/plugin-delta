import { Provider, IAgentRuntime, ProviderResult, logger } from '@elizaos/core';
import { DeltaWebSocketService } from '../services/DeltaWebSocketService';

export const marketDataProvider: Provider = {
  name: 'market-data',
  description: 'Provides market data from Delta Exchange',
  private: true,
  dynamic: false,
  get: async (runtime: IAgentRuntime): Promise<ProviderResult> => {
    try {
      const deltaWebSocketService = runtime.getService('delta-websocket') as DeltaWebSocketService;
      if (!deltaWebSocketService) {
        throw new Error('DeltaWebSocketService service not found');
      }

      // Get ticker data from the WebSocket service
      const ticker = await new Promise((resolve) => {
        const unsubscribe = deltaWebSocketService.onTicker((data) => {
          resolve(data);
          unsubscribe();
        });
      });

      return {
        text: `Market data: ${JSON.stringify(ticker)}`,
        data: ticker as any,
      };
    } catch (error: any) {
      logger.error('Error in marketDataProvider:', error.message);
      return {
        text: `Failed to retrieve market data: ${error.message}`,
        data: {},
      };
    }
  },
};
