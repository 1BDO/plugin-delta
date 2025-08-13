import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';
import { findInstrumentInText } from '../utils/instrument-parser';

export const getTickerAction: Action = {
  name: 'get-ticker',
  description: 'Retrieves ticker information for a specific product from Delta Exchange.',
  similes: ['get price', 'show price', 'what is the ticker for'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'What is the price of BTCUSD?' },
      },
      {
        name: 'assistant',
        content: {
          text: 'I will fetch the ticker for BTCUSD.',
          actions: ['get-ticker'],
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'show me the ticker for ETH' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Fetching the ticker for ETHUSD now.',
          actions: ['get-ticker'],
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'get ticker for solana' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Getting the ticker for SOLUSD.',
          actions: ['get-ticker'],
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    return !!runtime.getService('delta-rest');
  },
  handler: async (runtime: IAgentRuntime, message: any): Promise<ActionResult> => {
    try {
      const deltaRestClient = runtime.getService('delta-rest') as DeltaRestClient;
      if (!deltaRestClient) {
        throw new Error('DeltaRestClient service not found');
      }
      const symbol = findInstrumentInText(message?.content?.text);
      if (!symbol) {
        throw new Error('Product symbol not provided in the message');
      }

      const ticker = await deltaRestClient.getTickerBySymbol(symbol);
      return {
        text: `Ticker for ${symbol}: ${JSON.stringify(ticker.result)}`,
        success: true,
        data: { ticker: ticker.result },
      };
    } catch (error: any) {
      logger.error('Error in getTicker action:', error.message);
      return {
        text: `Failed to retrieve ticker: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
