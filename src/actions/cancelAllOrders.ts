import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';
import { findInstrumentInText } from '../utils/instrument-parser';

export const cancelAllOrdersAction: Action = {
  name: 'cancel-all-orders',
  description: 'Cancels all open orders on Delta Exchange, optionally filtered by product ID or contract types.',
  similes: ['cancel all', 'nuke my orders', 'clear all orders'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'Cancel all my orders.' },
      },
      {
        name: 'assistant',
        content: {
          text: 'I will cancel all of your open orders.',
          actions: ['cancel-all-orders'],
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'Nuke my BTCUSD orders.' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Cancelling all open orders for BTCUSD.',
          actions: ['cancel-all-orders'],
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

      const text = message.content.text.toLowerCase();
      const symbol = findInstrumentInText(text);

      const filters: { product_id?: string; contract_types?: string[] } = {};
      if (symbol) {
        const products = await deltaRestClient.getProducts();
        const product = products.result.find(
          (p: any) => p.symbol.toLowerCase() === symbol.toLowerCase()
        );
        if (product) {
          filters.product_id = product.id;
        }
      }

      await callback?.({
        text: `Understood. Cancelling all orders${symbol ? ` for ${symbol.toUpperCase()}` : ''}...`,
      });

      const result = await deltaRestClient.cancelAllOrders(Object.keys(filters).length > 0 ? filters : undefined);
      return {
        text: `Cancelled all orders${symbol ? ` for ${symbol.toUpperCase()}` : ''}.`,
        success: true,
        data: { result },
      };
    } catch (error: any) {
      logger.error('Error in cancelAllOrders action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to cancel all orders: ${error.message}`,
      });
      return {
        text: `Failed to cancel all orders: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
