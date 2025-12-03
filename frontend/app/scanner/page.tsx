'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScannerPage() {
  const router = useRouter();
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('Cargando...');
  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let Html5Qrcode: any = null;

    // Cargar la librería dinámicamente
    const loadScanner = async () => {
      try {
        setDebugInfo('Cargando librería...');
        const html5QrcodeModule = await import('html5-qrcode');
        Html5Qrcode = html5QrcodeModule.Html5Qrcode;
        
        if (!isMountedRef.current) return;
        
        setDebugInfo('Librería cargada, inicializando scanner...');
        await startScanner(Html5Qrcode);
      } catch (err: any) {
        console.error('Error al cargar scanner:', err);
        if (isMountedRef.current) {
          setError(`Error al cargar scanner: ${err.message}`);
          setDebugInfo(`Error: ${err.message}`);
        }
      }
    };

    const startScanner = async (Html5QrcodeClass: any) => {
      try {
        // Esperar un momento para que el DOM esté listo
        await new Promise(resolve => setTimeout(resolve, 200));

        if (!isMountedRef.current) return;

        setDebugInfo('Inicializando scanner...');
        const scanner = new Html5QrcodeClass('qr-reader');
        scannerRef.current = scanner;

        // Configuración de escaneo optimizada para móviles
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        // Callback cuando se detecta un QR
        const onScanSuccess = (decodedText: string) => {
          if (isProcessingRef.current || !isMountedRef.current) return;
          isProcessingRef.current = true;

          console.log('✅ QR detectado:', decodedText);
          setResult(decodedText);
          setDebugInfo(`QR: ${decodedText}`);

          // Detener el scanner
          scanner.stop().then(() => {
            if (!isMountedRef.current) return;
            setIsScanning(false);

            // Extraer código del QR
            let itemCode = '';
            const urlMatch = decodedText.match(/\/(kf-\d{4})$/i);
            const directMatch = decodedText.match(/^(kf-\d{4})$/i);
            
            if (urlMatch) {
              itemCode = urlMatch[1].toLowerCase();
            } else if (directMatch) {
              itemCode = directMatch[1].toLowerCase();
            }

            if (itemCode) {
              console.log('✅ Redirigiendo a:', itemCode);
              setTimeout(() => {
                if (isMountedRef.current) {
                  router.push(`/${itemCode}`);
                }
              }, 500);
            } else {
              setError(`QR no válido: "${decodedText}". Debe contener un código kf-XXXX`);
              setDebugInfo(`Error: formato inválido`);
              setTimeout(() => {
                if (!isMountedRef.current) return;
                isProcessingRef.current = false;
                setError('');
                setResult('');
                setDebugInfo('Reintentando...');
                startScanner(Html5QrcodeClass);
              }, 3000);
            }
          }).catch((err: any) => {
            console.error('Error al detener:', err);
          });
        };

        const onScanFailure = (error: any) => {
          // Silenciar errores de escaneo normal
        };

        // Intentar iniciar con diferentes estrategias
        try {
          // Estrategia 1: Listar cámaras
          const cameras = await Html5QrcodeClass.getCameras();
          console.log('📷 Cámaras:', cameras);
          
          if (cameras && cameras.length > 0) {
            setDebugInfo(`${cameras.length} cámaras encontradas`);
            
            // Buscar cámara trasera
            let cameraId = cameras[cameras.length - 1].id;
            const rearCamera = cameras.find((cam: any) => 
              cam.label.toLowerCase().includes('back') || 
              cam.label.toLowerCase().includes('rear') ||
              cam.label.toLowerCase().includes('trasera') ||
              cam.label.toLowerCase().includes('environment')
            );
            
            if (rearCamera) {
              cameraId = rearCamera.id;
              setDebugInfo(`Usando: ${rearCamera.label.substring(0, 30)}...`);
            } else {
              setDebugInfo(`Usando: ${cameras[cameras.length - 1].label.substring(0, 30)}...`);
            }

            await scanner.start(cameraId, config, onScanSuccess, onScanFailure);
            
            if (isMountedRef.current) {
              setIsScanning(true);
              setDebugInfo('✅ Scanner activo');
            }
          } else {
            throw new Error('No se encontraron cámaras');
          }
        } catch (cameraError: any) {
          console.warn('⚠️ Error listando cámaras:', cameraError);
          setDebugInfo('Intentando con facingMode...');
          
          // Estrategia 2: facingMode environment
          try {
            await scanner.start(
              { facingMode: 'environment' },
              config,
              onScanSuccess,
              onScanFailure
            );
            
            if (isMountedRef.current) {
              setIsScanning(true);
              setDebugInfo('✅ Scanner activo (trasera)');
            }
          } catch (envErr: any) {
            console.warn('⚠️ Error con trasera:', envErr);
            setDebugInfo('Intentando cámara frontal...');
            
            // Estrategia 3: facingMode user
            try {
              await scanner.start(
                { facingMode: 'user' },
                config,
                onScanSuccess,
                onScanFailure
              );
              
              if (isMountedRef.current) {
                setIsScanning(true);
                setDebugInfo('✅ Scanner activo (frontal)');
              }
            } catch (userErr: any) {
              throw new Error(`No se pudo acceder a la cámara: ${userErr.message}`);
            }
          }
        }
      } catch (err: any) {
        console.error('❌ Error fatal:', err);
        if (isMountedRef.current) {
          setError(`Error: ${err.message || 'No se pudo iniciar el scanner'}`);
          setDebugInfo(`Error fatal: ${err.message}`);
        }
      }
    };

    loadScanner();

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.stop()
            .then(() => {
              if (scannerRef.current) {
                scannerRef.current.clear();
              }
            })
            .catch((err: any) => console.error('Error en cleanup:', err));
        } catch (err) {
          console.error('Error en cleanup:', err);
        }
      }
    };
  }, [router]);

  const handleStopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
        .then(() => {
          setIsScanning(false);
          router.push('/dashboard');
        })
        .catch((err: any) => {
          console.error('Error al detener:', err);
          router.push('/dashboard');
        });
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
        {/* Debug info siempre visible */}
        {debugInfo && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 text-sm">🔧</span>
              <p className="text-sm text-blue-900 font-mono break-all">{debugInfo}</p>
            </div>
          </div>
        )}

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
                <div>
                  <p className="text-sm text-blue-900">🔍 Buscando código QR...</p>
                  {debugInfo && (
                    <p className="text-xs text-blue-700 mt-1 font-mono">{debugInfo}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Debug info cuando hay error */}
          {debugInfo && error && (
            <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100">
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 text-xs">🔧</span>
                <div>
                  <p className="text-xs font-medium text-yellow-900">Info de Debug:</p>
                  <p className="text-xs text-yellow-700 mt-1 font-mono break-all">{debugInfo}</p>
                </div>
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
