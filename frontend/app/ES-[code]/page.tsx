'use client';

import { useEffect } from 'react';

// Esta página simplemente redirige al dashboard con el filtro de estantería
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function ShelfRedirectPage({ params }: { params: { code: string } }) {
  console.log('🚀 SHELF REDIRECT PAGE LOADED for code:', params?.code);
  console.log('🚀 Current pathname:', typeof window !== 'undefined' ? window.location.pathname : 'SSR');
  
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose en ShelfRedirectPage');
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const urlCode = pathParts[pathParts.length - 1];
      
      console.log('🔄 pathParts:', pathParts);
      console.log('🔄 urlCode:', urlCode);
      
      const fullCode = urlCode.toUpperCase().startsWith('ES-') 
        ? urlCode.toUpperCase() 
        : `ES-${urlCode.toUpperCase()}`;
      
      console.log('🔄 Redirigiendo a dashboard con shelf:', fullCode);
      console.log('🔄 URL final:', `/dashboard?shelf=${fullCode}`);
      window.location.href = `/dashboard?shelf=${fullCode}`;
    } else {
      console.log('🔄 No estamos en el cliente aún');
    }
  }, []);

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
