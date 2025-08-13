import { Provider, IAgentRuntime } from '@elizaos/core';
import { DeltaWebSocketService } from '../services/DeltaWebSocketService';

export const riskStateProvider: Provider = {
  name: 'RISK_STATE',
  private: false,
  dynamic: false,
  position: 3,
  get: async (runtime: IAgentRuntime) => {
    const wsService = runtime.getService<DeltaWebSocketService>('delta-websocket');
    if (!wsService) {
      return { text: 'Delta WebSocket service not available.' };
    }

    const portfolioMargins = wsService.getLatestPortfolioMargins();
    const riskText = Array.from(portfolioMargins.values())
      .map((pm) => {
        return `Liquidation Risk: ${pm.liquidation_risk}, Margin Shortfall: ${pm.margin_shortfall}`;
      })
      .join('\n');

    return {
      text: riskText,
      data: {
        portfolioMargins: Array.from(portfolioMargins.values()),
      },
    };
  },
};
