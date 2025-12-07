'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Esta página simplemente redirige al dashboard con el filtro de estantería
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function ShelfRedirectPage({ params }: { params: { code: string } }) {
  const router = useRouter();

  useEffect(() => {
    // Extraer el código de la URL
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const urlCode = pathParts[pathParts.length - 1];
      
      // Asegurarse de que tiene el prefijo ES-
      const fullCode = urlCode.toUpperCase().startsWith('ES-') 
        ? urlCode.toUpperCase() 
        : `ES-${urlCode.toUpperCase()}`;
      
      // Redirigir al dashboard con el parámetro shelf
      console.log('🔄 Redirigiendo a dashboard con shelf:', fullCode);
      router.push(`/dashboard?shelf=${fullCode}`);
    }
  }, [router]);

  // Mostrar un mensaje de carga mientras redirige
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a la estantería...</p>
      </div>
    </div>
  );
}
