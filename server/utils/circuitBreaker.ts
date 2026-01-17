/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by stopping requests to failing services.
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing recovery)
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing - reject all requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerOptions {
  /** Name for logging and metrics */
  name: string;
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms before attempting recovery (half-open) */
  resetTimeout: number;
  /** Number of successful requests in half-open to close circuit */
  successThreshold: number;
  /** Optional timeout for individual requests */
  requestTimeout?: number;
  /** Callback when circuit state changes */
  onStateChange?: (from: CircuitState, to: CircuitState, name: string) => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private nextAttempt: number = 0;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  constructor(private options: CircuitBreakerOptions) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker '${this.options.name}' is OPEN`,
          this.options.name,
          this.state
        );
      }
    }

    try {
      // Execute with optional timeout
      const result = this.options.requestTimeout
        ? await this.executeWithTimeout(fn, this.options.requestTimeout)
        : await fn();

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${timeout}ms`)),
          timeout
        )
      ),
    ]);
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.totalSuccesses++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failures = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.totalFailures++;
    this.failures++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN immediately opens circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failures >= this.options.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    // Reset counters on state change
    this.failures = 0;
    this.successes = 0;

    if (newState === CircuitState.OPEN) {
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }

    // Log state change
    console.log(JSON.stringify({
      type: 'circuit_breaker_state_change',
      name: this.options.name,
      from: oldState,
      to: newState,
      timestamp: new Date().toISOString(),
    }));

    // Callback
    if (this.options.onStateChange) {
      this.options.onStateChange(oldState, newState, this.options.name);
    }
  }

  /**
   * Get current statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Check if circuit is allowing requests
   */
  isAllowing(): boolean {
    if (this.state === CircuitState.CLOSED) return true;
    if (this.state === CircuitState.HALF_OPEN) return true;
    if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttempt) {
      return true;
    }
    return false;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
  }
}

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly circuitName: string,
    public readonly state: CircuitState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Pre-configured circuit breakers for common services
 */
export const circuitBreakers = {
  openai: new CircuitBreaker({
    name: 'openai',
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    successThreshold: 2,
    requestTimeout: 60000, // 60 seconds
  }),

  anthropic: new CircuitBreaker({
    name: 'anthropic',
    failureThreshold: 5,
    resetTimeout: 30000,
    successThreshold: 2,
    requestTimeout: 60000,
  }),

  gemini: new CircuitBreaker({
    name: 'gemini',
    failureThreshold: 5,
    resetTimeout: 30000,
    successThreshold: 2,
    requestTimeout: 60000,
  }),

  database: new CircuitBreaker({
    name: 'database',
    failureThreshold: 3,
    resetTimeout: 10000, // 10 seconds
    successThreshold: 1,
    requestTimeout: 5000, // 5 seconds
  }),

  cloudStorage: new CircuitBreaker({
    name: 'cloudStorage',
    failureThreshold: 5,
    resetTimeout: 20000,
    successThreshold: 2,
    requestTimeout: 30000,
  }),
};

/**
 * Get all circuit breaker stats for monitoring
 */
export function getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
  return Object.fromEntries(
    Object.entries(circuitBreakers).map(([name, breaker]) => [
      name,
      breaker.getStats(),
    ])
  );
}
