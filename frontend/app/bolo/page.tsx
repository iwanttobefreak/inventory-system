'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { itemsAPI } from '@/lib/api';
import { Item } from '@/lib/types';

interface ScannedItem {
  code: string;
  name: string;
  status: 'success' | 'error';
  message: string;
  timestamp: Date;
}

type BoloMode = 'to-bolo' | 'from-bolo';

export default function BoloScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<BoloMode>('to-bolo');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ScannedItem | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Cargando...');
  const [itemsInUse, setItemsInUse] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);
  const audioSuccessRef = useRef<HTMLAudioElement | null>(null);
  const audioErrorRef = useRef<HTMLAudioElement | null>(null);

  // Cargar items en uso
  const loadItemsInUse = async () => {
    try {
      setLoadingItems(true);
      const response = await itemsAPI.getAll({ status: 'IN_USE' });
      setItemsInUse(response.data);
    } catch (error) {
      console.error('Error cargando items en uso:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  // Cargar items al montar el componente
  useEffect(() => {
    loadItemsInUse();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Crear sonidos
    audioSuccessRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audioErrorRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    
    let Html5Qrcode: any = null;

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
          setDebugInfo(`Error: ${err.message}`);
        }
      }
    };

    const startScanner = async (Html5QrcodeClass: any) => {
      try {
        await new Promise(resolve => setTimeout(resolve, 200));

        if (!isMountedRef.current) return;

        setDebugInfo('Inicializando scanner...');
        const scanner = new Html5QrcodeClass('qr-reader');
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        const onScanSuccess = async (decodedText: string) => {
          if (isProcessingRef.current || !isMountedRef.current) return;
          isProcessingRef.current = true;

          console.log('✅ QR detectado:', decodedText);
          setDebugInfo(`QR: ${decodedText}`);

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
            console.log('✅ Procesando item:', itemCode);
            await processItem(itemCode);
          } else {
            const errorItem: ScannedItem = {
              code: decodedText,
              name: 'QR inválido',
              status: 'error',
              message: 'Formato no válido. Debe ser kf-XXXX',
              timestamp: new Date(),
            };
            setCurrentItem(errorItem);
            setScannedItems(prev => [errorItem, ...prev]);
            if (audioErrorRef.current) audioErrorRef.current.play().catch(() => {});
            
            setTimeout(() => {
              if (!isMountedRef.current) return;
              isProcessingRef.current = false;
              setCurrentItem(null);
            }, 2000);
          }
        };

        const onScanFailure = (error: any) => {
          // Silenciar errores de escaneo normal
        };

        try {
          const cameras = await Html5QrcodeClass.getCameras();
          console.log('📷 Cámaras detectadas:', cameras);
          
          if (cameras && cameras.length > 0) {
            setDebugInfo(`${cameras.length} cámara${cameras.length > 1 ? 's' : ''} encontrada${cameras.length > 1 ? 's' : ''}`);
            
            let selectedCamera = cameras.find((cam: any) => {
              const label = cam.label.toLowerCase();
              return (label.includes('back') || label.includes('rear') || label.includes('trasera')) &&
                     (label.includes('0') || label.includes('main') || label.includes('wide') || label.includes('principal'));
            });
            
            if (!selectedCamera) {
              selectedCamera = cameras.find((cam: any) => {
                const label = cam.label.toLowerCase();
                return label.includes('back') || label.includes('rear') || 
                       label.includes('trasera') || label.includes('environment');
              });
            }
            
            if (!selectedCamera) {
              selectedCamera = cameras[cameras.length - 1];
            }
            
            const cameraLabel = selectedCamera.label.length > 40 
              ? selectedCamera.label.substring(0, 40) + '...' 
              : selectedCamera.label;
            
            console.log('📷 Cámara seleccionada:', selectedCamera);
            setDebugInfo(`Usando: ${cameraLabel}`);

            try {
              await scanner.start(selectedCamera.id, config, onScanSuccess, onScanFailure);
              
              if (isMountedRef.current) {
                setIsScanning(true);
                setDebugInfo(`✅ Scanner activo - ${cameraLabel}`);
              }
            } catch (startError: any) {
              console.error('❌ Error con cámara seleccionada:', startError);
              
              setDebugInfo('Cámara falló, probando otras...');
              let started = false;
              
              for (let i = 0; i < cameras.length && !started; i++) {
                if (cameras[i].id === selectedCamera.id) continue;
                
                try {
                  console.log(`🔄 Probando cámara ${i}:`, cameras[i].label);
                  setDebugInfo(`Probando: ${cameras[i].label.substring(0, 30)}...`);
                  
                  await scanner.start(cameras[i].id, config, onScanSuccess, onScanFailure);
                  
                  if (isMountedRef.current) {
                    setIsScanning(true);
                    const label = cameras[i].label.length > 40 
                      ? cameras[i].label.substring(0, 40) + '...' 
                      : cameras[i].label;
                    setDebugInfo(`✅ Scanner activo - ${label}`);
                    started = true;
                  }
                  break;
                } catch (err) {
                  console.warn(`⚠️ Falló cámara ${i}:`, err);
                  continue;
                }
              }
              
              if (!started) {
                throw new Error('No se pudo iniciar ninguna cámara');
              }
            }
          } else {
            throw new Error('No se encontraron cámaras');
          }
        } catch (cameraError: any) {
          console.warn('⚠️ Error listando cámaras:', cameraError);
          setDebugInfo('Intentando con facingMode...');
          
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
          setDebugInfo(`Error fatal: ${err.message}`);
        }
      }
    };

    loadScanner();

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
  }, [mode]);

  const processItem = async (itemCode: string) => {
    try {
      const targetStatus = mode === 'to-bolo' ? 'IN_USE' : 'AVAILABLE';
      const expectedCurrentStatus = mode === 'from-bolo' ? 'IN_USE' : undefined;
      
      const response = await itemsAPI.changeStatus(itemCode, targetStatus, expectedCurrentStatus);
      
      const successItem: ScannedItem = {
        code: itemCode,
        name: response.data.name,
        status: 'success',
        message: mode === 'to-bolo' 
          ? 'Marcado para el bolo ✓' 
          : 'Devuelto del bolo ✓',
        timestamp: new Date(),
      };
      
      setCurrentItem(successItem);
      setScannedItems(prev => [successItem, ...prev]);
      
      // Si se devolvió exitosamente, quitar de la lista de items en uso
      if (mode === 'from-bolo') {
        setItemsInUse(prev => prev.filter(item => item.code !== itemCode));
      }
      
      if (audioSuccessRef.current) audioSuccessRef.current.play().catch(() => {});
      
    } catch (error: any) {
      console.error('Error procesando item:', error);
      
      const errorMessage = error.response?.data?.error || 'Error al procesar';
      const errorItem: ScannedItem = {
        code: itemCode,
        name: 'Error',
        status: 'error',
        message: errorMessage,
        timestamp: new Date(),
      };
      
      setCurrentItem(errorItem);
      setScannedItems(prev => [errorItem, ...prev]);
      if (audioErrorRef.current) audioErrorRef.current.play().catch(() => {});
    }
    
    setTimeout(() => {
      if (!isMountedRef.current) return;
      isProcessingRef.current = false;
      setCurrentItem(null);
    }, 2000);
  };

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

  const switchMode = (newMode: BoloMode) => {
    setMode(newMode);
    setScannedItems([]);
    setCurrentItem(null);
    // Recargar items cuando se cambia de modo
    loadItemsInUse();
  };

  const getModeTitle = () => {
    return mode === 'to-bolo' ? '🎬 Salir al Bolo' : '🏠 Volver del Bolo';
  };

  const getModeDescription = () => {
    return mode === 'to-bolo' 
      ? 'Escanea los items que vas a llevar al rodaje'
      : 'Escanea los items que regresan del rodaje';
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
                {getModeTitle()}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow p-2 flex space-x-2">
          <button
            onClick={() => switchMode('to-bolo')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'to-bolo'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎬 Salir al Bolo
          </button>
          <button
            onClick={() => switchMode('from-bolo')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'from-bolo'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🏠 Volver del Bolo
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Description */}
        <div className="mb-4 text-center">
          <p className="text-gray-600">{getModeDescription()}</p>
        </div>

        {/* Debug info */}
        {debugInfo && (
          <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900 font-mono">{debugInfo}</p>
          </div>
        )}

        {/* Scanner */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="relative bg-black">
            <div id="qr-reader" className="w-full"></div>
          </div>

          {/* Current Item Feedback */}
          {currentItem && (
            <div className={`px-6 py-4 ${currentItem.status === 'success' ? 'bg-green-50 border-t border-green-100' : 'bg-red-50 border-t border-red-100'}`}>
              <div className="flex items-center space-x-3">
                <div className={`text-2xl ${currentItem.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {currentItem.status === 'success' ? '✅' : '❌'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${currentItem.status === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                    {currentItem.code}
                  </p>
                  <p className={`text-sm ${currentItem.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {currentItem.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scanning Status */}
          {isScanning && !currentItem && (
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-900">📱 Escaneando... Apunta al QR</p>
              </div>
            </div>
          )}
        </div>

        {/* Scanned Items History */}
        {scannedItems.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-900">
                📋 Items escaneados ({scannedItems.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {scannedItems.map((item, index) => (
                <div key={index} className={`px-6 py-3 flex items-center justify-between ${item.status === 'success' ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg ${item.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.status === 'success' ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{item.code}</p>
                      <p className="text-sm text-gray-600">{item.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${item.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setScannedItems([])}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                🗑️ Limpiar historial
              </button>
            </div>
          </div>
        )}

        {/* Items en uso (Bolo) */}
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                🎬 Items en el Bolo ({itemsInUse.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Equipos actualmente en uso
              </p>
            </div>
            <button
              onClick={loadItemsInUse}
              disabled={loadingItems}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loadingItems ? '🔄' : '🔄 Actualizar'}
            </button>
          </div>
          
          {loadingItems ? (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Cargando...</p>
            </div>
          ) : itemsInUse.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p className="text-4xl mb-2">📦</p>
              <p>No hay items en el bolo</p>
              <p className="text-sm mt-1">Escanea equipos para marcarlos como "En uso"</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {itemsInUse.map((item) => (
                <div key={item.code} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📹</span>
                    <div>
                      <p className="font-medium text-gray-900">{item.code}</p>
                      <p className="text-sm text-gray-600">{item.name}</p>
                      {item.category && (
                        <p className="text-xs text-gray-500">
                          {item.category.icon} {item.category.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      En uso
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-900 mb-3">💡 Instrucciones:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start space-x-2">
              <span>1.</span>
              <span>Selecciona el modo: "Salir al Bolo" o "Volver del Bolo"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>2.</span>
              <span>Apunta la cámara al código QR del equipo</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>3.</span>
              <span>El sistema validará automáticamente el estado</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>4.</span>
              <span>Para volver del bolo, el item debe estar previamente en estado "En uso"</span>
            </li>
          </ul>
        </div>

        {/* Cancel Button */}
        <div className="mt-6">
          <button
            onClick={handleStopScanning}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            ← Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
