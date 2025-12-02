'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

// Tamaños predefinidos de etiquetas (en mm)
const LABEL_SIZES = [
  { name: '6cm x 2cm (Pequeña)', width: 60, height: 20, id: '60x20' },
  { name: '7cm x 2.5cm (Mediana)', width: 70, height: 25, id: '70x25' },
  { name: '8cm x 3cm (Grande)', width: 80, height: 30, id: '80x30' },
  { name: '5cm x 3cm (Cuadrada)', width: 50, height: 30, id: '50x30' },
  { name: 'Personalizado', width: 60, height: 20, id: 'custom' },
];

interface LabelRange {
  start: number;
  end: number;
}

export default function LabelsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [selectedSize, setSelectedSize] = useState(LABEL_SIZES[0]);
  const [customWidth, setCustomWidth] = useState(60);
  const [customHeight, setCustomHeight] = useState(20);
  const [rangeInput, setRangeInput] = useState('1-10');
  const [ranges, setRanges] = useState<LabelRange[]>([{ start: 1, end: 10 }]);
  const [totalLabels, setTotalLabels] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, []);

  // Parsear rangos de entrada
  const parseRanges = (input: string): LabelRange[] => {
    const parsedRanges: LabelRange[] = [];
    const parts = input.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          parsedRanges.push({ start, end });
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num)) {
          parsedRanges.push({ start: num, end: num });
        }
      }
    }

    return parsedRanges;
  };

  // Actualizar rangos cuando cambia el input
  useEffect(() => {
    const parsed = parseRanges(rangeInput);
    setRanges(parsed);

    // Calcular total de etiquetas
    const total = parsed.reduce((sum, range) => sum + (range.end - range.start + 1), 0);
    setTotalLabels(total);
  }, [rangeInput]);

  // Generar vista previa automáticamente cuando cambian los parámetros
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timer);
  }, [selectedSize, customWidth, customHeight, rangeInput]);

  // Generar código con formato kf-XXXX
  const formatCode = (num: number): string => {
    return `kf-${num.toString().padStart(4, '0')}`;
  };

  // Generar todas las etiquetas en array
  const generateLabelCodes = (): string[] => {
    const codes: string[] = [];
    
    for (const range of ranges) {
      for (let i = range.start; i <= range.end; i++) {
        codes.push(formatCode(i));
      }
    }

    return codes;
  };

  // Generar PDF Blob (usado tanto para preview como para descarga)
  const generatePDFBlob = async (codes: string[]): Promise<Blob> => {
    // Dimensiones en mm
    const labelWidth = selectedSize.id === 'custom' ? customWidth : selectedSize.width;
    const labelHeight = selectedSize.id === 'custom' ? customHeight : selectedSize.height;
      
      // Crear PDF en orientación landscape para más espacio
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4', // 210 x 297 mm
      });

      // Márgenes de la página
      const pageMargin = 10;
      const pageWidth = 210;
      const pageHeight = 297;
      
      // Calcular cuántas etiquetas caben por fila y columna
      const labelsPerRow = Math.floor((pageWidth - 2 * pageMargin) / labelWidth);
      const labelsPerCol = Math.floor((pageHeight - 2 * pageMargin) / labelHeight);
      const labelsPerPage = labelsPerRow * labelsPerCol;

      // Cargar logo de Kairoframe
      const logoImg = await loadImage('/kairoframe-logo.png');

      let currentPage = 0;

      for (let i = 0; i < codes.length; i++) {
        const code = codes[i];
        const pageIndex = Math.floor(i / labelsPerPage);
        const indexInPage = i % labelsPerPage;

        // Nueva página si es necesario
        if (pageIndex > currentPage) {
          pdf.addPage();
          currentPage = pageIndex;
        }

        // Calcular posición en la página
        const row = Math.floor(indexInPage / labelsPerRow);
        const col = indexInPage % labelsPerRow;
        
        const x = pageMargin + col * labelWidth;
        const y = pageMargin + row * labelHeight;

        // Dibujar borde de etiqueta (opcional, para guía de corte)
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.1);
        pdf.rect(x, y, labelWidth, labelHeight);

        // Área del logo (izquierda, ~40% del ancho)
        const logoAreaWidth = labelWidth * 0.4;
        
        // Logo cuadrado: calcular tamaño óptimo - MÁRGENES MÍNIMOS
        const logoSize = Math.min(logoAreaWidth - 1, labelHeight - 1); // Margen mínimo de 0.5mm
        const logoX = x + 0.5 + (logoAreaWidth - 1 - logoSize) / 2; // Centrar en su área con margen mínimo
        const logoY = y + (labelHeight - logoSize) / 2;

        // Añadir logo cuadrado
        try {
          pdf.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize, undefined, 'FAST');
        } catch (error) {
          console.warn('Error añadiendo logo:', error);
        }

        // Área del QR y código (derecha, ~40% del ancho)
        const qrAreaWidth = labelWidth * 0.4;
        const qrAreaX = x + labelWidth - qrAreaWidth;
        
        // QR arriba - ocupar 70% del espacio vertical - MÁRGENES MÍNIMOS
        const qrSize = Math.min(qrAreaWidth - 1, (labelHeight * 0.7) - 1); // Margen mínimo
        const qrX = qrAreaX + (qrAreaWidth - qrSize) / 2; // Centrado horizontalmente
        const qrY = y + 2; // Margen superior de 2mm

        // Generar QR code
        const qrUrl = `https://kairoframe.lobo99.info/${code}`;
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        // Añadir QR
        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        // Código de texto DEBAJO del QR (horizontal) - MARGEN MÍNIMO
        const textY = qrY + qrSize + 0.5; // Margen mínimo de 0.5mm
        const textX = qrAreaX + (qrAreaWidth / 2); // Centrado en el área
        
        const codeText = code.toUpperCase();
        
        // Calcular tamaño de fuente para que el texto ocupe TODO el ancho del QR
        pdf.setFont('helvetica', 'bold');
        
        // Empezar con un tamaño grande y calcular el ancho del texto
        let fontSize = qrSize * 0.5; // Empezar con 50% del QR
        pdf.setFontSize(fontSize);
        let textWidth = pdf.getTextWidth(codeText);
        
        // Ajustar el tamaño de fuente para que el texto ocupe exactamente el ancho del QR
        const targetWidth = qrSize; // Queremos que ocupe todo el ancho del QR
        fontSize = (fontSize * targetWidth) / textWidth;
        
        // Limitar el tamaño máximo por si acaso
        fontSize = Math.min(fontSize, qrSize * 0.6);
        
        pdf.setFontSize(fontSize);
        
        // Añadir texto horizontal centrado debajo del QR
        pdf.text(codeText, textX, textY, {
          align: 'center',
          baseline: 'top'
        });
      }

      // Retornar el PDF como Blob
      return pdf.output('blob');
  };

  // Generar vista previa del PDF
  const generatePreview = async () => {
    try {
      const codes = generateLabelCodes();
      if (codes.length === 0) return;

      const pdfBlob = await generatePDFBlob(codes);
      const url = URL.createObjectURL(pdfBlob);
      
      // Limpiar URL anterior si existe
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
      
      setPreviewPdfUrl(url);
    } catch (error) {
      console.error('Error generando vista previa:', error);
    }
  };

  // Generar y descargar PDF
  const generatePDF = async () => {
    setGenerating(true);

    try {
      const codes = generateLabelCodes();
      const pdfBlob = await generatePDFBlob(codes);
      
      // Crear URL y descargar
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `etiquetas-kairoframe-${codes[0]}-${codes[codes.length - 1]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  // Helper para cargar imágenes
  const loadImage = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('No se pudo crear el contexto del canvas'));
        }
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            ← Volver al Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏷️ Generador de Etiquetas
          </h1>
          <p className="text-gray-600">
            Crea etiquetas profesionales con el logo de Kairoframe y códigos QR para tu inventario
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Configuración */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Configuración</h2>

            {/* Tamaño de Etiqueta */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño de Etiqueta
              </label>
              <select
                value={selectedSize.id}
                onChange={(e) => {
                  const size = LABEL_SIZES.find(s => s.id === e.target.value);
                  if (size) setSelectedSize(size);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {LABEL_SIZES.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dimensiones Personalizadas */}
            {selectedSize.id === 'custom' && (
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ancho (mm)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="200"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alto (mm)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 20)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Rangos de Códigos */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Códigos a Generar
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="Ej: 1-50 o 1-10,40-77,91,102,205"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                Formatos válidos:
              </p>
              <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                <li><code>1-50</code> → Genera del kf-0001 al kf-0050</li>
                <li><code>1-10,15-20</code> → Genera múltiples rangos</li>
                <li><code>1,5,10,25</code> → Códigos específicos</li>
              </ul>
            </div>

            {/* Información */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">📊 Resumen</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  <span className="font-medium">Tamaño:</span>{' '}
                  {selectedSize.id === 'custom' ? `${customWidth}mm x ${customHeight}mm` : `${selectedSize.width}mm x ${selectedSize.height}mm`}
                </p>
                <p>
                  <span className="font-medium">Total de etiquetas:</span> {totalLabels}
                </p>
                <p>
                  <span className="font-medium">Rangos:</span>{' '}
                  {ranges.map(r => r.start === r.end ? formatCode(r.start) : `${formatCode(r.start)}-${formatCode(r.end)}`).join(', ')}
                </p>
              </div>
            </div>

            {/* Botón Generar */}
            <button
              onClick={generatePDF}
              disabled={generating || totalLabels === 0}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Generando PDF...
                </>
              ) : (
                <>📄 Generar PDF ({totalLabels} etiquetas)</>
              )}
            </button>
          </div>

          {/* Panel de Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👁️ Vista Previa del PDF</h2>

            <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              {previewPdfUrl ? (
                <iframe
                  src={previewPdfUrl}
                  className="w-full h-full border-0"
                  title="Vista previa del PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📄</div>
                    <p>Generando vista previa...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-medium text-yellow-900 text-sm mb-1">💡 Consejos de Impresión</h4>
                <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Usa papel adhesivo de alta calidad</li>
                  <li>Configura la impresora a máxima calidad</li>
                  <li>Escala: 100% (sin ajustar al tamaño)</li>
                  <li>Recorta siguiendo las líneas grises</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-900 text-sm mb-1">✅ Distribución</h4>
                <p className="text-xs text-green-800">
                  • Logo: 40% izquierda<br />
                  • Espacio libre: 20% centro<br />
                  • QR: arriba (70% vertical)<br />
                  • Código: debajo QR (30% vertical)<br />
                  • (Código horizontal debajo del QR)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ejemplos */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Ejemplos de Uso</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Caso 1: Primera Hoja</h3>
              <p className="text-sm text-gray-600 mb-2">
                Generar las primeras 50 etiquetas para empezar tu inventario
              </p>
              <code className="block bg-gray-100 p-2 rounded text-sm">1-50</code>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Caso 2: Múltiples Rangos</h3>
              <p className="text-sm text-gray-600 mb-2">
                Generar varios rangos discontinuos en una sola hoja
              </p>
              <code className="block bg-gray-100 p-2 rounded text-sm">1-10,40-77,91</code>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Caso 3: Específicos</h3>
              <p className="text-sm text-gray-600 mb-2">
                Solo códigos puntuales que necesites reemplazar
              </p>
              <code className="block bg-gray-100 p-2 rounded text-sm">102,205,350</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
