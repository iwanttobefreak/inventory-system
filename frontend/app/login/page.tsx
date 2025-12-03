'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      setAuth(token, user);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error de login:', err);
      
      // Mostrar error más detallado
      if (err.response) {
        // El servidor respondió con un error
        setError(err.response?.data?.error || `Error del servidor: ${err.response.status}`);
      } else if (err.request) {
        // La petición se hizo pero no hubo respuesta
        setError('No se pudo conectar al servidor. Verifica tu conexión.');
      } else {
        // Algo más falló
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">📹</h1>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Sistema de Inventario
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Gestión de equipos audiovisuales
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="admin@productora.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          <div className="text-center text-sm text-gray-600 mt-4">
            <p>Credenciales de prueba:</p>
            <p className="font-mono text-xs mt-1">admin@productora.com / admin123</p>
            
            {/* Debug info - se puede eliminar después */}
            <details className="mt-3 text-xs text-left">
              <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
                🔧 Info de Debug
              </summary>
              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                <p><strong>API URL:</strong> {apiUrl}</p>
                <p><strong>Window Location:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
              </div>
            </details>
          </div>
        </form>
      </div>
    </div>
  );
}
