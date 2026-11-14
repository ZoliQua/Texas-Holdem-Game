import { vi } from 'vitest';

/** Makes `(pointer: coarse)` match (or not) in jsdom, optionally on a landscape phone; call before rendering. */
export function setCoarsePointer(coarse: boolean, o: { landscape?: boolean } = {}): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    // Queries that also ask for a landscape screen match only when `landscape` is set.
    matches: coarse && query.includes('coarse') && (!query.includes('landscape') || (o.landscape ?? false)),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: globalThis.matchMedia });
}

// jsdom has no PointerEvent: without it fireEvent drops clientX/clientY/pointerId.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  Object.defineProperty(window, 'PointerEvent', { configurable: true, value: PointerEventPolyfill });
  Object.defineProperty(globalThis, 'PointerEvent', { configurable: true, value: PointerEventPolyfill });
}
