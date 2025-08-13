import { Provider, IAgentRuntime, ProviderResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const balancesProvider: Provider = {
  name: 'balances',
  description: 'Provides balances data from Delta Exchange',
  private: true,
  dynamic: false,
  get: async (runtime: IAgentRuntime): Promise<ProviderResult> => {
    try {
      const deltaRestClient = runtime.getService('delta-restclient') as unknown as DeltaRestClient;
      if (!deltaRestClient) {
        throw new Error('DeltaRestClient service not found');
      }

      // Fetch balances from DeltaRestClient
      const balancesResponse = await deltaRestClient.getBalances();
      
      // Format the response
      const balances = balancesResponse.result || [];
      const totalBalance = balances.reduce((sum: number, balance: any) => sum + (parseFloat(balance.available) + parseFloat(balance.locked)), 0);
      
      return {
        text: `Total account balance: ${totalBalance.toFixed(2)} USDT. Retrieved ${balances.length} asset balances.`,
        data: balances,
      };
    } catch (error: any) {
      logger.error('Error in balancesProvider:', error.message);
      return {
        text: `Failed to retrieve balances: ${error.message}`,
        data: {},
      };
    }
  },
};
