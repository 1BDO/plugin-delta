import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';
import { findInstrumentInText } from '../utils/instrument-parser';

export const getOptionChainAction: Action = {
  name: 'get-option-chain',
  description: 'Retrieves the option chain for a given underlying asset and optional expiry from Delta Exchange.',
  similes: ['get options', 'show option chain', 'list options for'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'Show me the BTC option chain' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Fetching the BTC option chain.',
          actions: ['get-option-chain'],
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'get options for ETH expiring 2023-12-29' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Fetching the ETH option chain for expiry 2023-12-29.',
          actions: ['get-option-chain'],
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
      const parts = text.split(' ');
      const underlyingAsset = findInstrumentInText(text)?.replace('USD', '');
      const expiryIndex = parts.findIndex((p: string) => p === 'expiring');
      const expiry = expiryIndex !== -1 ? parts[expiryIndex + 1] : undefined;

      if (!underlyingAsset) {
        throw new Error('Underlying asset (BTC or ETH) not provided in the message');
      }

      await callback?.({
        text: `Understood. Fetching option chain for ${underlyingAsset.toUpperCase()} ${expiry ? `with expiry ${expiry}` : ''}...`,
      });

      const optionChain = await deltaRestClient.getOptionChain(underlyingAsset.toUpperCase(), expiry);
      return {
        text: `Retrieved option chain for ${underlyingAsset.toUpperCase()} ${expiry ? `with expiry ${expiry}` : ''}`,
        success: true,
        data: { optionChain: optionChain.result },
      };
    } catch (error: any) {
      logger.error('Error in getOptionChain action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to fetch the option chain: ${error.message}`,
      });
      return {
        text: `Failed to retrieve option chain: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
