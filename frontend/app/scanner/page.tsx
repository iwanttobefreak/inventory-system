'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useZxing } from 'react-zxing';

export default function ScannerPage() {
  const router = useRouter();
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(true);

  const { ref } = useZxing({
    onDecodeResult(result) {
      const text = result.getText();
      setResult(text);
      setIsScanning(false);
      
      // Extraer el código del item de la URL del QR
      // Formato esperado: https://kairoframe.lobo99.info/kf-0001
      // o http://localhost:3000/kf-0001
      const match = text.match(/\/(kf-\d{4})$/i);
      
      if (match) {
        const itemCode = match[1].toLowerCase();
        // Redirigir al item
        router.push(`/${itemCode}`);
      } else {
        setError('QR no válido. Debe ser un código del inventario (kf-XXXX).');
        // Reintentar después de 3 segundos
        setTimeout(() => {
          setIsScanning(true);
          setError('');
          setResult('');
        }, 3000);
      }
    },
    onError(error) {
      console.error('Error del scanner:', error);
      setError('Error al acceder a la cámara. Verifica los permisos.');
    },
  });

  const handleStopScanning = () => {
    setIsScanning(false);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleStopScanning}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                📱 Escanear QR
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Instrucciones */}
          <div className="bg-primary-50 border-b border-primary-100 px-6 py-4">
            <p className="text-sm text-primary-900">
              📸 Apunta la cámara hacia el código QR del equipo
            </p>
          </div>

          {/* Video del scanner */}
          {isScanning && (
            <div className="relative">
              <video
                ref={ref as any}
                className="w-full"
                style={{ maxHeight: '500px', objectFit: 'cover' }}
              />
              
              {/* Overlay con marco de escaneo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-primary-500 rounded-lg relative">
                  {/* Esquinas animadas */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  
                  {/* Línea de escaneo animada */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="scan-line"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resultado o Error */}
          {result && !error && (
            <div className="px-6 py-4 bg-green-50 border-t border-green-100">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-900">QR escaneado correctamente</p>
                  <p className="text-xs text-green-700 mt-1 font-mono">{result}</p>
                  <p className="text-xs text-green-600 mt-2">Redirigiendo...</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="px-6 py-4 bg-red-50 border-t border-red-100">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                  {error.includes('permisos') && (
                    <p className="text-xs text-red-600 mt-2">
                      💡 Ve a Configuración del navegador y permite el acceso a la cámara
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ayuda */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Consejos:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Mantén el QR dentro del marco</li>
              <li>• Asegúrate de tener buena iluminación</li>
              <li>• Mantén la cámara estable</li>
              <li>• El QR debe estar enfocado y visible</li>
            </ul>
          </div>

          {/* Botón de cancelar */}
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleStopScanning}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Nota sobre permisos */}
        {isScanning && !error && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>La primera vez, el navegador te pedirá permiso para acceder a la cámara</p>
          </div>
        )}
      </div>

      {/* CSS para animación */}
      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        .scan-line {
          width: 100%;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(59, 130, 246, 0.8),
            transparent
          );
          animation: scan 2s linear infinite;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
