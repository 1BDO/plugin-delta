import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';
import { findInstrumentInText } from '../utils/instrument-parser';

export const getOrderbookAction: Action = {
  name: 'delta:get-orderbook',
  description: 'Fetches the order book for a given symbol.',
  similes: ['get orderbook', 'show orderbook', 'what is the orderbook for'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'What is the orderbook for BTCUSD?' },
      },
      {
        name: 'assistant',
        content: {
          text: 'I will fetch the orderbook for BTCUSD.',
          actions: ['delta:get-orderbook'],
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime) => {
    return !!runtime.getService<DeltaRestClient>('delta-rest');
  },
  handler: async (runtime: IAgentRuntime, memory: any): Promise<ActionResult> => {
    try {
      const client = runtime.getService<DeltaRestClient>('delta-rest');
      if (!client) {
        throw new Error('DeltaRestClient not initialized.');
      }
      const symbol = findInstrumentInText(memory?.content?.text);
      if (!symbol) {
        throw new Error('Symbol not provided in the message');
      }
      const orderbook = await client.getOrderbook(symbol);
      return {
        text: `Orderbook for ${symbol}: ${JSON.stringify(orderbook.result)}`,
        success: true,
        data: { orderbook: orderbook.result },
      };
    } catch (error: any) {
      logger.error('Error in getOrderbook action:', error.message);
      return {
        text: `Failed to retrieve orderbook: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
