import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker, CircuitState, CircuitBreakerError } from '../../server/utils/circuitBreaker';

describe('CircuitBreaker', () => {
  const options = {
    name: 'test-service',
    failureThreshold: 2,
    resetTimeout: 100, // 100ms for fast testing
    successThreshold: 2,
    requestTimeout: 50,
  };

  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker(options);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });



  it('starts in CLOSED state', () => {
    expect(breaker.getStats().state).toBe(CircuitState.CLOSED);
    expect(breaker.isAllowing()).toBe(true);
  });

  it('executes successful functions and records successes', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await breaker.execute(fn);

    expect(result).toBe('success');
    expect(breaker.getStats().totalSuccesses).toBe(1);
    expect(breaker.getStats().state).toBe(CircuitState.CLOSED);
  });

  it('records failures and opens circuit when threshold is reached', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('failure'));

    // First failure
    await expect(breaker.execute(fn)).rejects.toThrow('failure');
    expect(breaker.getStats().failures).toBe(1);
    expect(breaker.getStats().state).toBe(CircuitState.CLOSED);

    // Second failure - should open
    await expect(breaker.execute(fn)).rejects.toThrow('failure');
    expect(breaker.getStats().state).toBe(CircuitState.OPEN);
    expect(breaker.isAllowing()).toBe(false);
  });

  it('throws CircuitBreakerError when state is OPEN', async () => {
    const failFn = vi.fn().mockRejectedValue(new Error('fail'));
    
    // Open the circuit
    await expect(breaker.execute(failFn)).rejects.toThrow();
    await expect(breaker.execute(failFn)).rejects.toThrow();
    
    expect(breaker.getStats().state).toBe(CircuitState.OPEN);

    // Try to execute again
    const targetFn = vi.fn().mockResolvedValue('won\'t run');
    await expect(breaker.execute(targetFn)).rejects.toThrow(CircuitBreakerError);
    await expect(breaker.execute(targetFn)).rejects.toThrow(/is OPEN/);
    expect(targetFn).not.toHaveBeenCalled();
  });

  it('transitions to HALF_OPEN after resetTimeout', async () => {
    const failFn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(breaker.execute(failFn)).rejects.toThrow();
    await expect(breaker.execute(failFn)).rejects.toThrow();
    
    expect(breaker.getStats().state).toBe(CircuitState.OPEN);

    // Advance time
    vi.advanceTimersByTime(options.resetTimeout + 1);

    expect(breaker.isAllowing()).toBe(true);

    const successFn = vi.fn().mockResolvedValue('ok');
    const result = await breaker.execute(successFn);

    expect(result).toBe('ok');
    expect(breaker.getStats().state).toBe(CircuitState.HALF_OPEN);
  });

  it('closes circuit after successThreshold in HALF_OPEN', async () => {
    // Open and then advance to HALF_OPEN
    const failFn = vi.fn().mockRejectedValue(new Error('fail'));
    await breaker.execute(failFn).catch(() => {});
    await breaker.execute(failFn).catch(() => {});
    vi.advanceTimersByTime(options.resetTimeout + 1);

    const successFn = vi.fn().mockResolvedValue('ok');
    
    // First success in HALF_OPEN
    await breaker.execute(successFn);
    expect(breaker.getStats().state).toBe(CircuitState.HALF_OPEN);
    expect(breaker.getStats().successes).toBe(1);

    // Second success in HALF_OPEN - should close
    await breaker.execute(successFn);
    expect(breaker.getStats().state).toBe(CircuitState.CLOSED);
    expect(breaker.getStats().successes).toBe(0); // Reset after transition
    expect(breaker.getStats().failures).toBe(0);
  });

  it('immediately re-opens if failure occurs in HALF_OPEN', async () => {
    // Open and then advance to HALF_OPEN
    const failFn = vi.fn().mockRejectedValue(new Error('fail'));
    await breaker.execute(failFn).catch(() => {});
    await breaker.execute(failFn).catch(() => {});
    vi.advanceTimersByTime(options.resetTimeout + 1);

    // Fail in HALF_OPEN
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    expect(breaker.getStats().state).toBe(CircuitState.OPEN);
  });

  it('enforces request timeout if configured', async () => {
    const slowFn = () => new Promise(resolve => setTimeout(() => resolve('done'), 100));
    
    const promise = breaker.execute(slowFn);
    vi.advanceTimersByTime(options.requestTimeout + 10);
    
    await expect(promise).rejects.toThrow(/timeout/);
  });


  it('resets failures on success in CLOSED state', async () => {
    const failFn = vi.fn().mockRejectedValue(new Error('fail'));
    const successFn = vi.fn().mockResolvedValue('ok');

    await expect(breaker.execute(failFn)).rejects.toThrow();
    expect(breaker.getStats().failures).toBe(1);

    await breaker.execute(successFn);
    expect(breaker.getStats().failures).toBe(0);
  });

  it('can be manually reset', async () => {
    const failFn = vi.fn().mockRejectedValue(new Error('fail'));
    await breaker.execute(failFn).catch(() => {});
    await breaker.execute(failFn).catch(() => {});
    
    expect(breaker.getStats().state).toBe(CircuitState.OPEN);
    
    breaker.reset();
    expect(breaker.getStats().state).toBe(CircuitState.CLOSED);
    expect(breaker.getStats().totalRequests).toBe(0);
  });

  it('calls onStateChange callback', async () => {
    let callbackCalled = false;
    let states: string[] = [];
    
    const breakerWithCB = new CircuitBreaker({
      name: 'callback-test',
      failureThreshold: 1,
      resetTimeout: 1000,
      successThreshold: 1,
      onStateChange: (from, to) => {
        callbackCalled = true;
        states = [from, to];
      }
    });
    
    const failFn = vi.fn().mockRejectedValue(new Error('fail'));
    await breakerWithCB.execute(failFn).catch(() => {});

    expect(callbackCalled).toBe(true);
    expect(states).toEqual(['CLOSED', 'OPEN']);
  });




});
