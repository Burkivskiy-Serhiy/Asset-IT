import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any | null;
}

export default function QRCodeModal({ isOpen, onClose, asset }: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !asset) return null;

  const qrValue = asset.inventoryId || asset.id;

  const handlePrint = () => {
    const printContent = qrRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Друк QR-коду - ${asset.name}</title>
          <style>
            body { 
              font-family: sans-serif; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
            }
            .container {
              text-align: center;
              border: 1px solid #ccc;
              padding: 40px;
              border-radius: 10px;
            }
            h2 { margin-bottom: 10px; }
            p { margin-top: 5px; color: #555; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${asset.name}</h2>
            <div style="margin: 20px 0;">
              ${printContent.innerHTML}
            </div>
            <p><strong>S/N:</strong> ${asset.serial_number || 'Відсутній'}</p>
            <p><strong>INV:</strong> ${asset.inventoryId}</p>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b border-border/50">
              <h3 className="font-semibold text-white">QR-код Активу</h3>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center">
              <div ref={qrRef} className="bg-white p-4 rounded-xl shadow-inner mb-6">
                <QRCodeSVG value={qrValue} size={200} level="H" />
              </div>
              
              <div className="text-center mb-6">
                <h4 className="text-lg font-bold text-white mb-1">{asset.name}</h4>
                <p className="text-sm text-gray-400 mb-0.5">S/N: {asset.serial_number || 'Не вказано'}</p>
                <p className="text-sm text-gray-400">INV: {asset.inventoryId}</p>
              </div>

              <button 
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/80 hover:to-blue-500 text-white py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-primary/20"
              >
                <Printer size={18} />
                Роздрукувати
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
