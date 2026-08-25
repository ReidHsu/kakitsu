import 'fake-indexeddb/auto'

// jsdom 沒有 crypto.randomUUID 時補上（Node 25 通常已有）
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error minimal polyfill for test environment
  globalThis.crypto = { randomUUID: () => `test-${Math.random().toString(36).slice(2)}` }
}
