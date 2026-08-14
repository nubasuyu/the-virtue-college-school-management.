import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../lib/axios';

export default function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false); // 👈 NEW: Prevents double-scanning
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('Click "Start Scanning" to begin.');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    const initScanner = async () => {
      try {
        const element = document.getElementById('qr-reader');
        if (!element) return;

        scannerRef.current = new Html5Qrcode('qr-reader');
        setIsCameraReady(true);
      } catch (err) {
        console.error('Failed to initialize scanner:', err);
        setMessage('Failed to initialize camera. Please check browser permissions.');
        setMessageType('error');
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    if (!scannerRef.current) {
      setMessage('Scanner not initialized. Please refresh the page.');
      setMessageType('error');
      return;
    }

    setMessage('Requesting camera access...');
    setMessageType('info');

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        onScanSuccess,
        () => {} // Ignore onScanFailure to prevent console spam
      );
      setScanning(true);
      setMessage('Scanning... Hold the ID card steady in the box.');
      setMessageType('info');
    } catch (err: any) {
      let errorMsg = 'Failed to start camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera access denied. Please allow camera permissions.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device.';
      }
      setMessage(errorMsg);
      setMessageType('error');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
        setMessage('Scanning stopped.');
        setMessageType('info');
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // 👈 NEW: If we are already processing a scan, ignore this duplicate frame
    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true; // Lock the scanner
    console.log('🎯 QR Code detected:', decodedText);
    
    await stopScanning();
    setMessage(`Scanned: ${decodedText}. Marking attendance...`);
    setMessageType('info');

    try {
      const response = await api.post('/attendance/scan', {
        admissionNo: decodedText, // Matches your backend perfectly
      });

      if (response.data.success) {
        setMessage(`✅ ${response.data.message}`);
        setMessageType('success');
      } else {
        setMessage(`⚠️ ${response.data.message}`);
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('API Error:', error);
      const errMsg = error.response?.data?.message || 'Failed to connect to server.';
      setMessage(`❌ Error: ${errMsg}`);
      setMessageType('error');
    } finally {
      // 👈 NEW: Release the lock and restart scanning after 3 seconds
      setTimeout(() => {
        isProcessingRef.current = false;
        if (!scanning) {
          startScanning();
        }
      }, 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">QR Code Attendance Scanner</h2>

      <div className="relative w-full max-w-md mx-auto mb-6">
        <div 
          id="qr-reader" 
          className="w-full rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100"
          style={{ minHeight: '300px' }}
        ></div>
        
        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg">
            <p className="text-gray-500">Initializing camera...</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center mb-6">
        {!scanning ? (
          <button
            onClick={startScanning}
            disabled={!isCameraReady}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              isCameraReady ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
          >
            Stop Scanning
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-center font-medium ${
          messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          messageType === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">How to use:</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Ensure you are using a device with a camera (laptop or phone).</li>
          <li>Click <strong>"Start Scanning"</strong> and allow camera access.</li>
          <li>Hold the student's ID card QR code steady inside the box.</li>
          <li>Attendance will be marked instantly, and the scanner will restart automatically.</li>
        </ol>
      </div>
    </div>
  );
}