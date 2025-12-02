'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { itemsAPI } from '@/lib/api';

export default function NewItemPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [nextCode, setNextCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Obtener el siguiente código disponible
    fetchNextCode();
  }, []);

  const fetchNextCode = async () => {
    try {
      const response = await itemsAPI.getNextCode();
      setNextCode(response.data.code);
    } catch (error) {
      console.error('Error fetching next code:', error);
      alert('Error al obtener el siguiente código');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = () => {
    if (nextCode) {
      // Redirigir a la página del código para crear el item
      router.push(`/${nextCode}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-lg text-gray-600">Generando código...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-6">📦</div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Nuevo Item
        </h1>
        
        <p className="text-gray-600 mb-6">
          El próximo código disponible es:
        </p>
        
        <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6 mb-6">
          <div className="text-4xl font-bold text-primary-600">
            {nextCode.toUpperCase()}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-8">
          Este código se asignará automáticamente al crear el item
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleRedirect}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
          >
            ✅ Continuar con este código
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
