import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, Volume2, ShieldCheck, Zap, Repeat } from 'lucide-react';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
  title?: string;
  continuousMode?: boolean;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Live Camera GS1 Barcode Scanner',
  continuousMode = true
}) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastScanned, setLastScanned] = useState<string>('');
  const [scannedCount, setScannedCount] = useState<number>(0);
  const [isContinuous, setIsContinuous] = useState<boolean>(continuousMode);
  const [scanFlashToast, setScanFlashToast] = useState<string | null>(null);

  const [manualInput, setManualInput] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScanBarcodeRef = useRef<string>('');

  const handleManualSubmit = (codeToSubmit: string) => {
    const cleanCode = codeToSubmit.trim().replace(/^\][a-zA-Z0-9]{2}/, '').replace(/[\u001d\x1d]/g, '');
    if (!cleanCode) return;
    playBeepSound();
    setLastScanned(cleanCode);
    setScannedCount(prev => prev + 1);
    setScanFlashToast(`Scanned: ${cleanCode}`);
    setTimeout(() => setScanFlashToast(null), 1500);
    onScanSuccess(cleanCode);
    setManualInput('');
    if (!isContinuous) {
      stopScanner();
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setLastScanned('');
      setScannedCount(0);
      setScanFlashToast(null);
      setManualInput('');
      
      Html5Qrcode.getCameras()
        .then(deviceList => {
          if (deviceList && deviceList.length > 0) {
            setCameras(deviceList);
            const backCam = deviceList.find(cam => cam.label.toLowerCase().includes('back') || cam.label.toLowerCase().includes('environment'));
            const initialCamId = backCam ? backCam.id : deviceList[0].id;
            setSelectedCameraId(initialCamId);
            startScanner(initialCamId);
          } else {
            setErrorMessage('No camera devices detected on this system. Please plug in a webcam or scan via USB barcode reader.');
          }
        })
        .catch(err => {
          console.error('Camera access error:', err);
          setErrorMessage('Camera access permission denied or unavailable. Please allow browser camera access in site settings.');
        });
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async (cameraId: string) => {
    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode('camera-reader-viewport', {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX
        ]
      });

      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.333
        },
        (decodedText) => {
          // Clean decoded text: strip symbology prefixes like ]C1, ]e0 and control characters
          const cleanCode = decodedText.trim().replace(/^\][a-zA-Z0-9]{2}/, '').replace(/[\u001d\x1d]/g, '');
          const now = Date.now();
          // Debounce duplicate scans within 1.2 seconds
          if (cleanCode === lastScanBarcodeRef.current && (now - lastScanTimeRef.current) < 1200) {
            return;
          }

          lastScanTimeRef.current = now;
          lastScanBarcodeRef.current = cleanCode;

          // Feedback beep
          playBeepSound();
          setLastScanned(cleanCode);
          setScannedCount(prev => prev + 1);
          setScanFlashToast(`Scanned: ${cleanCode}`);

          setTimeout(() => {
            setScanFlashToast(null);
          }, 1500);

          onScanSuccess(cleanCode);

          // If NOT in continuous mode, stop and close
          if (!isContinuous) {
            stopScanner();
            onClose();
          }
        },
        () => {
          // Frame parse ignore
        }
      );

      setIsScanning(true);
      setErrorMessage('');
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      setIsScanning(false);
      setErrorMessage(err.message || 'Failed to start camera video stream.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCamId = e.target.value;
    setSelectedCameraId(newCamId);
    startScanner(newCamId);
  };

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6 pitch
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-amber-500/40 text-stone-100 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-amber-900/40 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-400 text-xs sm:text-sm tracking-wide line-clamp-1">{title}</h3>
              <p className="text-[10px] sm:text-[11px] text-amber-200/60 font-medium">
                {isContinuous ? '⚡ Hands-Free Continuous Mode Active' : 'Single Scan Mode'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Container */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 flex-1 flex flex-col items-center">
          
          {/* Controls Bar */}
          <div className="w-full flex items-center justify-between gap-2 text-xs bg-stone-950 px-3.5 py-2 rounded-xl border border-stone-800">
            {cameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="bg-stone-900 text-amber-300 font-medium border border-amber-900/60 rounded-lg px-2.5 py-1 outline-none text-xs"
              >
                {cameras.map(cam => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cam.id.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            )}

            <label className="flex items-center gap-2 text-stone-300 font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isContinuous}
                onChange={e => setIsContinuous(e.target.checked)}
                className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
              />
              <span className="flex items-center gap-1 text-amber-400">
                <Repeat className="w-3.5 h-3.5" /> Hands-Free Continuous Scan
              </span>
            </label>
          </div>

          {/* WebRTC Video Viewport */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-inner flex items-center justify-center">
            
            <div id="camera-reader-viewport" className="w-full h-full object-cover"></div>

            {/* Scan Flash Toast Notification */}
            {scanFlashToast && (
              <div className="absolute top-4 bg-emerald-500 text-stone-950 font-black text-xs px-4 py-2 rounded-full shadow-xl animate-bounce flex items-center gap-1.5 z-20">
                <CheckCircle2 className="w-4 h-4" /> {scanFlashToast}
              </div>
            )}

            {/* Laser HUD Overlay animation */}
            {isScanning && !errorMessage && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-64 h-36 border-2 border-dashed border-amber-400/80 rounded-xl relative shadow-[0_0_20px_rgba(217,119,6,0.3)]">
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce my-auto top-1/2"></div>
                  {/* Corner Targets */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400"></div>
                </div>
                <span className="mt-3 text-[11px] text-amber-300 font-mono tracking-widest uppercase bg-stone-950/80 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 shadow">
                  <Zap className="w-3 h-3 text-amber-400 animate-pulse" /> Align product barcode in box
                </span>
              </div>
            )}

            {/* Error Overlay */}
            {errorMessage && (
              <div className="absolute inset-0 bg-stone-950/90 p-6 flex flex-col items-center justify-center text-center space-y-3 z-30">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-xs text-stone-300 max-w-xs">{errorMessage}</p>
                <button
                  onClick={() => startScanner(selectedCameraId)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-lg"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Camera Access
                </button>
              </div>
            )}
          </div>

          {/* Success Status / Hits Counter */}
          {scannedCount > 0 ? (
            <div className="w-full bg-emerald-950/80 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Last Scanned: <code className="font-mono bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200">{lastScanned}</code>
              </span>
              <span className="bg-emerald-900 text-emerald-100 px-2.5 py-0.5 rounded-full font-mono font-black text-[11px]">
                {scannedCount} Item{scannedCount > 1 ? 's' : ''} Scanned
              </span>
            </div>
          ) : (
            <div className="w-full bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Compatible with EAN-13, EAN-8, Code-128 & GS1 DataMatrix
              </span>
              <span className="flex items-center gap-1 text-amber-400/80 font-mono">
                <Volume2 className="w-3 h-3" /> Audio Beep ON
              </span>
            </div>
          )}

          {/* Manual / USB Scanner Input Fallback */}
          <div className="w-full flex items-center gap-2 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <input
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && manualInput.trim()) {
                  e.preventDefault();
                  handleManualSubmit(manualInput);
                }
              }}
              placeholder="Or type/paste barcode manually (e.g. 8901234567890)..."
              className="flex-1 bg-stone-900 border border-stone-700 text-amber-300 placeholder-stone-500 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => {
                if (manualInput.trim()) {
                  handleManualSubmit(manualInput);
                }
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 shrink-0"
            >
              Simulate Scan
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <p className="text-[11px] text-stone-500 font-medium">Keep camera focused on barcode</p>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs rounded-xl font-bold transition-all cursor-pointer shadow-md"
          >
            Done Scanning ({scannedCount})
          </button>
        </div>

      </div>
    </div>
  );
};
