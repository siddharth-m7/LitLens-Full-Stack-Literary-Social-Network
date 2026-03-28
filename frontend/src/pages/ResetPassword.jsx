import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              📚 BookShelf
            </Link>
          </div>
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-500 text-sm mb-6">This reset link is missing a token. Please request a new password reset.</p>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => setTimeout(() => navigate('/login'), 3000),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    if (password !== confirm) { setValidationError('Passwords do not match.'); return; }
    if (password.length < 6) { setValidationError('Password must be at least 6 characters.'); return; }
    mutation.mutate({ token, password });
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <Link to="/" className="text-xl font-bold text-gray-900">
            📚 BookShelf
          </Link>
        </div>

        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm p-8">

          {mutation.isSuccess ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Password reset</h3>
              <p className="text-gray-500 text-sm mb-1">Your password has been changed successfully.</p>
              <p className="text-gray-400 text-xs mb-6">Redirecting to sign in...</p>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your new password below.</p>

              {(validationError || mutation.error) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 text-sm">{validationError || mutation.error?.response?.data?.message || 'Reset failed. The link may have expired.'}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your new password"
                    className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {mutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Request a new reset link
                </Link>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
