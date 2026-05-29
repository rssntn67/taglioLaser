'use client';

import { signIn } from 'next-auth/react';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    });

    if (result?.error) {
      setError('Credenziali non valide');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  }

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center">
      <div className="bg-white border border-border p-10 w-full max-w-sm">
        <h1 className="text-2xl font-black text-ink mb-8">Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white py-2 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
