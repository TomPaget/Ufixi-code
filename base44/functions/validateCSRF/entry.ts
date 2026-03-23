import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Middleware to validate CSRF token in backend functions
 * Use this in functions that modify data
 */
export async function validateCSRF(req) {
  const csrfToken = req.headers.get('X-CSRF-Token');
  
  if (!csrfToken) {
    throw new Error('CSRF token missing');
  }
  
  // In production, validate against server-stored token
  // For now, verify token format is valid
  if (csrfToken.length < 32) {
    throw new Error('Invalid CSRF token');
  }
  
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await req.json();
    
    // Validate token format
    const isValid = token && typeof token === 'string' && token.length >= 32;

    return Response.json({ valid: isValid });

  } catch (error) {
    return Response.json({ error: 'Validation failed' }, { status: 500 });
  }
});