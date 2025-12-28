import { useState, useEffect } from 'react';
import { getCSRFToken } from '@/components/utils/csrfToken';

/**
 * Secure form wrapper that adds CSRF protection
 */
export default function SecureForm({ children, onSubmit, className, ...props }) {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    setCsrfToken(getCSRFToken());
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Add CSRF token to form data
    const formData = new FormData(e.target);
    formData.append('_csrf', csrfToken);
    
    if (onSubmit) {
      onSubmit(e, formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      <input type="hidden" name="_csrf" value={csrfToken} />
      {children}
    </form>
  );
}