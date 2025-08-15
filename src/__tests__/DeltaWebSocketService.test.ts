// MOVE THIS TO THE VERY TOP - BEFORE ALL IMPORTS
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 1; // Set to OPEN immediately
  
  send: ReturnType<typeof mock>;
  close: ReturnType<typeof mock>;
  
  constructor() {
    this.send = mock(() => {});
    this.close = mock(() => {});
    
    // Immediately trigger open
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.();
    }, 0);
  }
  
  triggerMessage(data: any) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
  
  triggerClose() {
    this.readyState = 3;
    this.onclose?.();
  }
}

// SET GLOBAL MOCK BEFORE ANY IMPORTS
global.WebSocket = MockWebSocket as any;

// NOW IMPORT YOUR MODULES
import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { DeltaWebSocketService } from '../services/DeltaWebSocketService';
import { createMockRuntime } from './test-utils';

// Rest of your test code...