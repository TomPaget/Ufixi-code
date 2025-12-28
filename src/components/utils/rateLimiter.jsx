// Client-side rate limiter for expensive operations

class RateLimiter {
  constructor(maxCalls, timeWindow) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindow;
    this.calls = new Map();
  }

  canMakeCall(key) {
    const now = Date.now();
    const userCalls = this.calls.get(key) || [];
    
    // Remove expired calls
    const validCalls = userCalls.filter(timestamp => now - timestamp < this.timeWindow);
    
    if (validCalls.length >= this.maxCalls) {
      const oldestCall = Math.min(...validCalls);
      const waitTime = Math.ceil((this.timeWindow - (now - oldestCall)) / 1000);
      return { 
        allowed: false, 
        waitTime,
        message: `Rate limit exceeded. Please wait ${waitTime} seconds.`
      };
    }
    
    validCalls.push(now);
    this.calls.set(key, validCalls);
    
    return { allowed: true };
  }

  reset(key) {
    this.calls.delete(key);
  }

  getRemainingCalls(key) {
    const now = Date.now();
    const userCalls = this.calls.get(key) || [];
    const validCalls = userCalls.filter(timestamp => now - timestamp < this.timeWindow);
    return Math.max(0, this.maxCalls - validCalls.length);
  }
}

// Create rate limiters for different operations
export const aiAnalysisLimiter = new RateLimiter(5, 60000); // 5 calls per minute
export const fileUploadLimiter = new RateLimiter(10, 60000); // 10 uploads per minute
export const searchLimiter = new RateLimiter(30, 60000); // 30 searches per minute

export function checkRateLimit(limiter, userId) {
  const result = limiter.canMakeCall(userId);
  if (!result.allowed) {
    throw new Error(result.message);
  }
  return result;
}