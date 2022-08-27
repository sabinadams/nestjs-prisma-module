import { vi } from 'vitest';

export default class MockClass {
  constructor(public options: any) {}
  getOptions() {
    return this.options;
  }

  $connect = vi.fn();
  $disconnect = vi.fn();
  $on = vi.fn();
  user = {
    count: vi.fn(() => 1),
  };
}
