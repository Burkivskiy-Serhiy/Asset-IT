import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCode = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      html5QrCode.current = new Html5Qrcode("qr-reader");
      setIsScanning(true);
      
      await html5QrCode.current.start(
        { facingMode: "environment" }, // Prefer back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          stopScanner();
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore frequent "not found" errors during active scanning
        }
      );
    } catch (err: any) {
      console.error("Помилка камери:", err);
      setError("Не вдалося отримати доступ до камери. Перевірте дозволи.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrCode.current && html5QrCode.current.isScanning) {
      html5QrCode.current.stop().then(() => {
        html5QrCode.current?.clear();
      }).catch(console.error);
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="flex justify-between items-center p-5 border-b border-white/5 bg-black/20">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Camera size={18} className="text-primary" /> 
                Сканер QR-коду
              </h3>
              <button onClick={handleClose} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-black/40">
              {error ? (
                <div className="text-red-400 text-center py-10 px-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <p className="font-medium mb-2">Помилка камери</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[300px] mx-auto rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  {/* Container for html5-qrcode */}
                  <div id="qr-reader" className="w-full h-full bg-black"></div>
                  
                  {/* Decorative Scanner Overlay */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-primary/30 rounded-xl"></div>
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/50 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>
              )}
              
              <p className="text-gray-400 text-sm mt-6 text-center">
                Наведіть камеру на QR-код або штрих-код активу для його автоматичного пошуку.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
