import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  requestVerification,
  confirmVerification,
  getVerificationStatus,
  type VerificationStatusResponse
} from '../services/verification';

type Mode = 'confirm' | 'request';

const Verify: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<VerificationStatusResponse | null>(null);
  const [message, setMessage] = useState<string>('');

  const token = params.get('token') || '';
  const emailParam = params.get('email') || '';

  const mode: Mode = useMemo(() => {
    return token && emailParam ? 'confirm' : 'request';
  }, [token, emailParam]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const s = await getVerificationStatus();
        setStatus(s);
      } catch (_) {
        // Fail silent; status is optional for this page
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    if (mode === 'confirm') {
      const doConfirm = async () => {
        setLoading(true);
        try {
          const res = await confirmVerification(emailParam, token);
          setMessage(res.message || 'Email verified successfully');
          toast.success('Email verified successfully');
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || 'Invalid or expired token';
          setMessage(msg);
          toast.error(msg);
        } finally {
          setLoading(false);
        }
      };
      doConfirm();
    }
  }, [mode, emailParam, token]);

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      const res = await requestVerification(email);
      setMessage(res.message || 'If the email exists, a verification was sent');
      toast.success('If the email exists, a verification was sent');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to process verification request';
      setMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-slate-800 shadow-xl rounded-xl">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-gray-100">Email Verification</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Use your verification link or request a new one.
          </p>
        </div>

        {status && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10A8 8 0 11.001 9.999 8 8 0 0118 10zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 text-sm">
                <div>
                  <strong>Status:</strong> {status.verified ? 'Verified' : 'Unverified'}
                </div>
                {status.verifiedAt && (
                  <div>
                    <strong>Verified At:</strong> {new Date(status.verifiedAt).toLocaleString()}
                  </div>
                )}
                <div>
                  <strong>Verification Enabled:</strong> {status.enabled ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'confirm' ? (
          <div className="space-y-6">
            <p className="text-gray-700 dark:text-gray-300">
              Confirming verification for <span className="font-mono">{emailParam}</span>...
            </p>
            {message && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 text-sm">
                {message}
              </div>
            )}
            <div className="flex gap-2">
              <button
                className={`group relative flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Go to Dashboard
              </button>
              <button
                className={`group relative flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                onClick={() => navigate('/profile')}
                disabled={loading}
              >
                View Profile
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={onRequest}>
            <div className="rounded-md shadow-sm">
              <div>
                <label htmlFor="verify-email" className="sr-only">Email address</label>
                <input
                  id="verify-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              We will send a verification link if the email exists.
            </p>

            <div>
              <button
                type="submit"
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send Verification Email'}
              </button>
            </div>

            {message && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-4 text-sm">
                {message}
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={() => navigate('/login')}
              >
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Verify;