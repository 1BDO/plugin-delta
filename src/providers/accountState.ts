import { Provider, IAgentRuntime } from '@elizaos/core';
import { DeltaWebSocketService } from '../services/DeltaWebSocketService';

export const accountStateProvider: Provider = {
  name: 'ACCOUNT_STATE',
  private: false,
  dynamic: false,
  position: 2,
  get: async (runtime: IAgentRuntime) => {
    const wsService = runtime.getService<DeltaWebSocketService>('delta-websocket');
    if (!wsService) {
      return { text: 'Delta WebSocket service not available.' };
    }

    const positions = wsService.getLatestPositions();
    const orders = wsService.getLatestOrders();
    const margins = wsService.getLatestMargins();

    const positionsText = Array.from(positions.values())
      .map((p) => `Position: ${p.symbol}, Size: ${p.size}, Entry Price: ${p.entry_price}`)
      .join('\n');
    const ordersText = Array.from(orders.values())
      .map((o) => `Order: ${o.symbol}, Size: ${o.size}, Price: ${o.limit_price}`)
      .join('\n');
    const marginsText = Array.from(margins.values())
      .map((m) => `Margin for ${m.asset_symbol}: ${m.balance}`)
      .join('\n');

    return {
      text: `Positions:\n${positionsText}\n\nOrders:\n${ordersText}\n\nMargins:\n${marginsText}`,
      data: {
        positions: Array.from(positions.values()),
        orders: Array.from(orders.values()),
        margins: Array.from(margins.values()),
      },
    };
  },
};
