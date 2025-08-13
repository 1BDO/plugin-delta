import { Provider, IAgentRuntime } from '@elizaos/core';
import { DeltaWebSocketService } from '../services/DeltaWebSocketService';

export const marketStateProvider: Provider = {
  name: 'MARKET_STATE',
  private: false,
  dynamic: false,
  position: 1,
  get: async (runtime: IAgentRuntime) => {
    const wsService = runtime.getService<DeltaWebSocketService>('delta-websocket');
    if (!wsService) {
      return { text: 'Delta WebSocket service not available.' };
    }

    const tickers = wsService.getLatestTickers();
    const tickersText = Array.from(tickers.values())
      .map((ticker) => {
        return `Symbol: ${ticker.symbol}, Mark Price: ${ticker.mark_price}, Spot Price: ${ticker.spot_price}`;
      })
      .join('\n');

    return {
      text: tickersText,
      data: {
        tickers: Array.from(tickers.values()),
      },
    };
  },
};
