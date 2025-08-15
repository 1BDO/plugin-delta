import { mock } from 'bun:test';
import type { Mock } from 'bun:test';

export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState: number = MockWebSocket.CONNECTING;
  public url: string;
  public send: Mock<() => void>;
  public close: Mock<() => void>;

  private handlers: { [key: string]: Function[] } = {
    message: [],
    close: [],
    error: [],
    open: []
  };

  public onopen: ((event: any) => void) | null = null;
  public onmessage: ((event: any) => void) | null = null;
  public onclose: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    this.send = mock();
    this.close = mock();
  }

  addEventListener(event: string, handler: Function): void {
    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].push(handler);

    // Map to on* handlers as well
    switch (event) {
      case 'open':
        this.onopen = handler as (event: any) => void;
        break;
      case 'message':
        this.onmessage = handler as (event: any) => void;
        break;
      case 'close':
        this.onclose = handler as (event: any) => void;
        break;
      case 'error':
        this.onerror = handler as (event: any) => void;
        break;
    }
  }

  removeEventListener(event: string, handler: Function): void {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
  }

  // Test helper methods
  triggerOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    const event = { type: 'open' };
    this.handlers.open?.forEach(handler => handler(event));
    this.onopen?.(event);
  }

  triggerMessage(data: any): void {
    if (this.readyState !== MockWebSocket.OPEN) return;
    const event = { data: JSON.stringify(data) };
    this.handlers.message?.forEach(handler => handler(event));
    this.onmessage?.(event);
  }

  triggerClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    const event = { code: 1000, reason: 'Normal closure' };
    this.handlers.close?.forEach(handler => handler(event));
    this.onclose?.(event);
  }

  triggerError(error: Error): void {
    const event = { error, message: error.message };
    this.handlers.error?.forEach(handler => handler(event));
    this.onerror?.(event);
  }
}