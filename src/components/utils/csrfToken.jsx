// CSRF Token Management

const CSRF_TOKEN_KEY = 'fixquo_csrf_token';

/**
 * Generate a random CSRF token
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
}

/**
 * Get current CSRF token or generate new one
 */
export function getCSRFToken() {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) {
    token = generateCSRFToken();
  }
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token) {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  return token && token === storedToken;
}

/**
 * Clear CSRF token (on logout)
 */
export function clearCSRFToken() {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers = {}) {
  return {
    ...headers,
    'X-CSRF-Token': getCSRFToken()
  };
}