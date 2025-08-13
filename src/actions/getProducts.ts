import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const getProductsAction: Action = {
  name: 'delta:get-products',
  description: 'Retrieves a list of all available trading products from Delta Exchange.',
  similes: ['list products', 'get markets', 'show all tradable symbols'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'What can I trade here?' },
      },
      {
        name: 'assistant',
        content: {
          text: 'I will fetch the list of all available products for you.',
          actions: ['delta:get-products'],
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    return !!runtime.getService('delta-rest');
  },
  handler: async (runtime: IAgentRuntime, message: any, state?: any, options?: any, callback?: any): Promise<ActionResult> => {
    try {
      const deltaRestClient = runtime.getService('delta-rest') as DeltaRestClient;
      if (!deltaRestClient) {
        throw new Error('DeltaRestClient service not found');
      }

      await callback?.({
        text: 'Understood. Fetching all tradable products...',
      });

      const products = await deltaRestClient.getProducts();
      return {
        text: `Retrieved ${products.result.length} products from Delta Exchange.`,
        success: true,
        data: { products: products.result },
      };
    } catch (error: any) {
      logger.error('Error in getProducts action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to fetch the products: ${error.message}`,
      });
      return {
        text: `Failed to retrieve products: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
