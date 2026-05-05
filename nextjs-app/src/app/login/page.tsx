'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') ?? '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 40,
          width: 360,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a2d58 0%, #a0192a 100%)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2d58', marginBottom: 4 }}>
            SAS Analytics
          </h1>
          <p style={{ fontSize: 13, color: '#888' }}>Singapore American School</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#555',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 6,
              }}
            >
              Dashboard Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1a2d58')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
          </div>

          {error && (
            <div
              style={{
                background: '#fff0f0',
                border: '1px solid #ffcccc',
                borderRadius: 6,
                padding: '8px 12px',
                marginBottom: 16,
                fontSize: 13,
                color: '#a0192a',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              background: loading ? '#9aa5bc' : '#1a2d58',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
