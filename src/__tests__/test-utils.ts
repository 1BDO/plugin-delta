import { IAgentRuntime } from '@elizaos/core';
import { mock } from 'bun:test';

export const createMockRuntime = (): IAgentRuntime => {
  const runtime: any = {
    /* ---- Settings ---- */
    getSetting: mock(async (key: string) => {
      const map: Record<string, string> = {
        DELTA_API_KEY:    'test-key',
        DELTA_API_SECRET: 'test-secret',
        DELTA_WS_URL:     'ws://localhost:8080',
      };
      return map[key] ?? undefined;
    }),

    /* ---- Service retrieval ---- */
    getService: mock((name: string) => {
      if (name === 'delta-rest') {
        return {
          getProducts:        mock(async () => ({ result: [] })),
          getTickerBySymbol:  mock(async (s: string) => ({ result: { symbol: s, price: 50_000 } })),
          placeOrder:         mock(async (o: any) => ({ result: { id: '123', ...o } })),
          cancelOrder:        mock(async () => ({ result: {} })),
          getOptionChain:     mock(async () => ({ result: [] })),
          cancelAllOrders:    mock(async () => ({ result: {} })),
          setOrderLeverage:   mock(async () => ({ result: {} })),
          getOrderbook:       mock(async () => ({ result: {} })),
          getBalances:        mock(async () => ({ result: [] })),
          editOrder:          mock(async () => ({ result: {} })),
          closeAllPositions:  mock(async () => ({ result: {} })),
          createHeartbeat:    mock(async () => ({ result: {} })),
          ackHeartbeat:       mock(async () => ({ result: {} })),
          getHeartbeat:       mock(async () => ({ result: {} })),
          updateMmp:          mock(async () => ({ result: {} })),
          resetMmp:           mock(async () => ({ result: {} })),
        };
      }
      return null;
    }),

    /* ---- Minimal stubs for everything else ---- */
    agentId: 'test-agent-id',
    character: { name: 'Test' },
    plugins: [], providers: [], actions: [], evaluators: [], services: new Map(), events: new Map(),
    routes: [], fetch: null,

    /* ---- All remaining required IAgentRuntime methods ---- */
    setSetting:              mock(),
    registerService:         mock(),
    getAllServices:          mock(() => new Map()),
    registerPlugin:          mock(async () => {}),
    initialize:              mock(async () => {}),
    getMemoryManager:        mock(() => null),
    registerDatabaseAdapter: mock(),
    getConversationLength:   mock(() => 0),
    processActions:          mock(async () => {}),
    evaluate:                mock(async () => null),
    composeState:            mock(async () => ({} as any)),
    useModel:                mock(async () => null),
    registerModel:           mock(),
    getModel:                mock(() => undefined),
    registerEvent:           mock(),
    getEvent:                mock(() => undefined),
    emitEvent:               mock(async () => {}),
    registerTaskWorker:      mock(),
    getTaskWorker:           mock(() => undefined),
    stop:                    mock(async () => {}),
    init:                    mock(async () => {}),
    close:                   mock(async () => {}),
    ensureConnection:        mock(async () => {}),
    ensureParticipantInRoom: mock(async () => {}),
    ensureWorldExists:       mock(async () => {}),
    ensureRoomExists:        mock(async () => {}),

    /* ---- Database stubs ---- */
    getAgent:            mock(async () => null),
    getAgents:           mock(async () => []),
    createAgent:         mock(async () => true),
    updateAgent:         mock(async () => true),
    deleteAgent:         mock(async () => true),
    ensureAgentExists:   mock(async () => {}),
    ensureEmbeddingDimension: mock(async () => {}),
    getEntityById:            mock(async () => null),
    getEntitiesForRoom:       mock(async () => []),
    createEntity:             mock(async () => true),
    updateEntity:             mock(async () => {}),
    getComponent:             mock(async () => null),
    getComponents:            mock(async () => []),
    createComponent:          mock(async () => true),
    updateComponent:          mock(async () => {}),
    deleteComponent:          mock(async () => {}),
    getMemories:              mock(async () => []),
    getMemoryById:            mock(async () => null),
    getMemoriesByIds:         mock(async () => []),
    getMemoriesByRoomIds:     mock(async () => []),
    getCachedEmbeddings:      mock(async () => []),
    searchMemories:           mock(async () => []),
    createMemory:             mock(async () => 'fake-id' as any),
    removeMemory:             mock(async () => {}),
    removeAllMemories:        mock(async () => {}),
    countMemories:            mock(async () => 0),
    createWorld:  mock(async () => 'world-id' as any),
    getWorld:     mock(async () => null),
    getAllWorlds: mock(async () => []),
    updateWorld:  mock(async () => {}),
    getRoom:             mock(async () => null),
    createRoom:          mock(async () => 'room-id' as any),
    deleteRoom:          mock(async () => {}),
    updateRoom:          mock(async () => {}),
    getRoomsForParticipant:   mock(async () => []),
    getRoomsForParticipants:  mock(async () => []),
    getRooms:                 mock(async () => []),
    addParticipant:     mock(async () => true),
    removeParticipant:  mock(async () => true),
    getParticipantsForEntity: mock(async () => []),
    getParticipantsForRoom:   mock(async () => []),
    getParticipantUserState:  mock(async () => null),
    setParticipantUserState:  mock(async () => {}),
    createRelationship:  mock(async () => true),
    updateRelationship:  mock(async () => {}),
    getRelationship:     mock(async () => null),
    getRelationships:    mock(async () => []),
    getCache:   mock(async () => undefined),
    setCache:   mock(async () => true),
    deleteCache:mock(async () => true),
    log:        mock(async () => {}),
    getLogs:    mock(async () => []),
    deleteLog:  mock(async () => {}),
    createTask: mock(async () => 'task-id' as any),
    getTasks:   mock(async () => []),
    getTask:    mock(async () => null),
    getTasksByName: mock(async () => []),
    updateTask: mock(async () => {}),
    deleteTask: mock(async () => {}),
  };
  return runtime;
};