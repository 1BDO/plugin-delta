import { z } from 'zod';

export const deltaConfigSchema = z.object({
  // Required API credentials
  apiKey: z.string().min(1, 'Delta Exchange API key is required'),
  apiSecret: z.string().min(1, 'Delta Exchange API secret is required'),
  
  // Optional configuration
  baseUrl: z.string().url().optional().default('https://api.delta.exchange'),
  wsUrl: z.string().url().optional().default('wss://socket.delta.exchange'),
  sandbox: z.boolean().optional().default(false),
  
  // Trading configuration
  maxPositionSize: z.number().positive().optional().default(100000), // USD
  maxOrderSize: z.number().positive().optional().default(10000), // USD
  defaultLeverage: z.number().positive().optional().default(10),
  
  // Risk management
  enableRiskChecks: z.boolean().optional().default(true),
  maxDailyLoss: z.number().positive().optional().default(1000), // USD
  maxOpenOrders: z.number().positive().optional().default(50),
  
  // WebSocket configuration
  wsReconnectInterval: z.number().positive().optional().default(5000), // ms
  wsHeartbeatInterval: z.number().positive().optional().default(30000), // ms
  wsMaxReconnectAttempts: z.number().positive().optional().default(10),
  
  // Rate limiting
  rateLimitRequests: z.number().positive().optional().default(120), // per minute
  rateLimitWindow: z.number().positive().optional().default(60000), // ms
  symbols: z.string().array().optional().default(['all']),
});

export type DeltaConfig = z.infer<typeof deltaConfigSchema>;

export const defaultDeltaConfig: Partial<DeltaConfig> = {
  baseUrl: 'https://api.delta.exchange',
  wsUrl: 'wss://socket.delta.exchange',
  sandbox: false,
  maxPositionSize: 100000,
  maxOrderSize: 10000,
  defaultLeverage: 10,
  enableRiskChecks: true,
  maxDailyLoss: 1000,
  maxOpenOrders: 50,
  wsReconnectInterval: 5000,
  wsHeartbeatInterval: 30000,
  wsMaxReconnectAttempts: 10,
  rateLimitRequests: 120,
  rateLimitWindow: 60000,
};