import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { DeltaWebSocketService } from '../services/DeltaWebSocketService';
import { createMockRuntime } from './test-utils';

class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 0;
  send = mock(() => {});
  close = mock(() => {});
  constructor() {
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.();
    });
  }
  triggerMessage(data: any) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
  triggerClose() {
    this.readyState = 3;
    this.onclose?.();
  }
}
global.WebSocket = MockWebSocket as any;

describe('DeltaWebSocketService', () => {
  let svc: DeltaWebSocketService;
  let rt: ReturnType<typeof createMockRuntime>;

  beforeEach(() => {
    rt = createMockRuntime();
    svc = new DeltaWebSocketService(rt, 'ws://localhost:8080', 'test-key', 'test-secret');
  });
  afterEach(() => {
    mock.restore();
    svc.stop();
  });

  it('connects and authenticates', async () => {
    svc.connect();
    await new Promise(r => setTimeout(r, 10));
    const ws = (svc as any).ws as MockWebSocket;
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('"type":"auth"'));
  });

  it('handles incoming messages', async () => {
    svc.connect();
    await new Promise(r => setTimeout(r, 10));
    const spy = mock();
    svc.onTicker(spy);
    const ws = (svc as any).ws as MockWebSocket;
    ws.triggerMessage({ type: 'ticker', symbol: 'BTCUSD', price: 50000 });
    expect(spy).toHaveBeenCalledWith({ type: 'ticker', symbol: 'BTCUSD', price: 50000 });
  });

  it('subscribes to a channel', async () => {
    svc.connect();
    await new Promise(r => setTimeout(r, 10));
    svc.subscribeTicker(['BTCUSD']);
    const ws = (svc as any).ws as MockWebSocket;
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
      type: 'subscribe',
      payload: { channels: [{ name: 'v2/ticker', symbols: ['BTCUSD'] }] },
    }));
  });

  it('unsubscribes from a channel', async () => {
    svc.connect();
    await new Promise(r => setTimeout(r, 10));
    svc.unsubscribeTicker();
    const ws = (svc as any).ws as MockWebSocket;
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
      type: 'unsubscribe',
      payload: { channels: [{ name: 'v2/ticker' }] },
    }));
  });

  it('attempts reconnect on close', async () => {
    svc.connect();
    await new Promise(r => setTimeout(r, 10));
    const reconnectSpy = mock();
    (svc as any).reconnect = reconnectSpy;
    const ws = (svc as any).ws as MockWebSocket;
    ws.triggerClose();
    expect(reconnectSpy).toHaveBeenCalled();
  });
});