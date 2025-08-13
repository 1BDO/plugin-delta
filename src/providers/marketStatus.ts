import { Provider, IAgentRuntime } from '@elizaos/core';
import { DeltaWebSocketService } from '../services/DeltaWebSocketService';

export const marketStatusProvider: Provider = {
  name: 'ANNOUNCEMENTS/MARKET_STATUS',
  private: false,
  dynamic: true,
  get: async (runtime: IAgentRuntime) => {
    const wsService = runtime.getService<DeltaWebSocketService>('delta-websocket');
    if (!wsService) {
      return { text: 'Delta WebSocket service not available.' };
    }

    // This is a placeholder for where you would get the latest announcements and market status
    // from the DeltaWebSocketService. For now, we will return a static message.
    const announcements = 'No new announcements.';
    const marketStatus = 'All systems operational.';

    return {
      text: `Announcements: ${announcements}\nMarket Status: ${marketStatus}`,
      data: {
        announcements,
        marketStatus,
      },
    };
  },
};
