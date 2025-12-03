'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScannerPage() {
  const router = useRouter();
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Inicializar el scanner
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        // Configuración de escaneo
        const config = {
          fps: 10, // Frames por segundo
          qrbox: { width: 250, height: 250 }, // Área de escaneo
          aspectRatio: 1.0,
        };

        // Callback cuando se detecta un QR
        const onScanSuccess = (decodedText: string) => {
          // Evitar procesar múltiples escaneos del mismo código
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;

          console.log('QR detectado:', decodedText);
          setResult(decodedText);

          // Detener el scanner
          scanner.stop().then(() => {
            setIsScanning(false);

            // Extraer el código del item de la URL del QR
            // Formato esperado: https://kairoframe.lobo99.info/kf-0001
            // o http://localhost:3000/kf-0001
            const match = decodedText.match(/\/(kf-\d{4})$/i);

            if (match) {
              const itemCode = match[1].toLowerCase();
              // Redirigir al item
              setTimeout(() => {
                router.push(`/${itemCode}`);
              }, 500);
            } else {
              setError('QR no válido. Debe ser un código del inventario (kf-XXXX).');
              // Reintentar después de 3 segundos
              setTimeout(() => {
                isProcessingRef.current = false;
                setError('');
                setResult('');
                startScanner();
              }, 3000);
            }
          });
        };

        const onScanFailure = (error: any) => {
          // No mostrar errores de escaneo fallido (es normal que falle muchas veces)
          // console.warn('Scan error:', error);
        };

        // Intentar usar la cámara trasera en móviles
        try {
          await scanner.start(
            { facingMode: 'environment' }, // Cámara trasera
            config,
            onScanSuccess,
            onScanFailure
          );
          setIsScanning(true);
        } catch (err) {
          // Si falla la cámara trasera, intentar con cualquier cámara
          await scanner.start(
            { facingMode: 'user' }, // Cámara frontal
            config,
            onScanSuccess,
            onScanFailure
          );
          setIsScanning(true);
        }
      } catch (err: any) {
        console.error('Error al iniciar scanner:', err);
        setError('Error al acceder a la cámara. Verifica los permisos.');
      }
    };

    startScanner();

    // Cleanup al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [router]);

  const handleStopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
        router.push('/dashboard');
      }).catch(console.error);
    } else {
      router.push('/dashboard');
    }
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
          <div className="relative bg-black">
            <div id="qr-reader" className="w-full"></div>
          </div>

          {/* Resultado o Error */}
          {result && !error && (
            <div className="px-6 py-4 bg-green-50 border-t border-green-100">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-900">✅ QR escaneado correctamente</p>
                  <p className="text-xs text-green-700 mt-1 font-mono break-all">{result}</p>
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
                  <p className="text-sm font-medium text-red-900">❌ Error</p>
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

          {/* Estado del scanner */}
          {isScanning && !result && !error && (
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-900">🔍 Buscando código QR...</p>
              </div>
            </div>
          )}

          {/* Ayuda */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Consejos:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Mantén el QR dentro del cuadro verde</li>
              <li>• Asegúrate de tener buena iluminación</li>
              <li>• Mantén la cámara estable</li>
              <li>• El QR debe estar enfocado y visible</li>
              <li>• Acerca o aleja la cámara si no detecta el código</li>
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
        {!error && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>📱 La primera vez, el navegador te pedirá permiso para acceder a la cámara</p>
            <p className="mt-1">🔒 Los permisos son necesarios para escanear códigos QR</p>
          </div>
        )}
      </div>
    </div>
  );
}
