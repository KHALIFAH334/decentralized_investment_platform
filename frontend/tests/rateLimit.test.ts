import { checkRateLimit, RATE_LIMITS } from '../src/lib/rateLimit';

describe('rateLimit.ts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests within the limit', () => {
    const ip = '1.2.3.4';
    const config = { maxRequests: 2, windowMs: 1000 };

    const res1 = checkRateLimit(ip, config);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(1);

    const res2 = checkRateLimit(ip, config);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(0);
  });

  it('blocks requests exceeding the limit', () => {
    const ip = '5.6.7.8';
    const config = { maxRequests: 1, windowMs: 1000 };

    const res1 = checkRateLimit(ip, config);
    expect(res1.allowed).toBe(true);

    const res2 = checkRateLimit(ip, config);
    expect(res2.allowed).toBe(false);
    expect(res2.remaining).toBe(0);
    expect(res2.resetMs).toBeGreaterThan(0);
  });

  it('resets the limit after the window expires', () => {
    const ip = '9.10.11.12';
    const config = { maxRequests: 1, windowMs: 1000 };

    checkRateLimit(ip, config);
    expect(checkRateLimit(ip, config).allowed).toBe(false);

    // Fast-forward time past the window
    jest.advanceTimersByTime(1001);

    const res = checkRateLimit(ip, config);
    expect(res.allowed).toBe(true);
  });
});
