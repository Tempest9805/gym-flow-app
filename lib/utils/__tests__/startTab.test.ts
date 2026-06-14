import { resolveStartRoute } from '@/lib/utils/startTab';

describe('resolveStartRoute', () => {
  it('defaults to index for null/undefined', () => {
    expect(resolveStartRoute(null)).toBe('index');
    expect(resolveStartRoute(undefined)).toBe('index');
  });

  it('defaults to index for an unrecognized value', () => {
    expect(resolveStartRoute('profile')).toBe('index');
    expect(resolveStartRoute('')).toBe('index');
  });

  it('keeps index', () => {
    expect(resolveStartRoute('index')).toBe('index');
  });

  it('resolves tree', () => {
    expect(resolveStartRoute('tree')).toBe('tree');
  });
});
