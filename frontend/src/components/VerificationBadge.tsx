import React, { useEffect, useState } from 'react';
import { getVerificationStatus, type VerificationStatusResponse } from '../services/verification';
import { useAuth } from '../contexts/AuthContext';

interface VerificationBadgeProps {
  className?: string;
  hideWhenDisabled?: boolean;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ className = '', hideWhenDisabled = true }) => {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<VerificationStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const s = await getVerificationStatus();
        setStatus(s);
      } catch {
        // fail silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (loading && !status) return null;
  if (!status) return null;
  if (hideWhenDisabled && status.enabled === false) return null;

  const variant = status.verified ? 'bg-green-100 text-green-800 border-green-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300';
  const text = status.verified ? 'Email verified' : 'Verify your email';

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded ${variant} ${className}`}
      title={status.verified ? 'Your email is verified' : 'Click to verify your email'}
      onClick={() => {
        if (!status.verified) {
          window.dispatchEvent(new CustomEvent('email-verification-required', { detail: { url: '/verify' } }));
        }
      }}
    >
      {text}
    </span>
  );
};

export default VerificationBadge;