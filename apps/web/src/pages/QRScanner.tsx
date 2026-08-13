import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../lib/axios';

export default function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('Click "Start Scanning" to begin.');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    console.log('📷 [QRScanner] Component mounted. Initializing Html5Qrcode...');
    
    // Ensure the DOM element exists before initializing
    const initScanner = async () => {
      try {
        const element = document.getElementById('qr-reader');
        if (!element) {
          console.error('❌ [QRScanner] Element #qr-reader not found in DOM!');
          return;
        }

        scannerRef.current = new Html5Qrcode('qr-reader');
        console.log('✅ [QRScanner] Html5Qrcode initialized successfully.');
        setIsCameraReady(true);
      } catch (err) {
        console.error('❌ [QRScanner] Failed to initialize scanner:', err);
        setMessage('Failed to initialize camera. Please check browser permissions.');
        setMessageType('error');
      }
    };

    initScanner();

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch((err) => console.error('Cleanup stop error:', err));
        scannerRef.current.clear().catch((err) => console.error('Cleanup clear error:', err));
      }
    };
  }, []); // Empty dependency array ensures this runs only once

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
        { facingMode: 'environment' }, // Prefer back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        onScanFailure
      );
      setScanning(true);
      setMessage('Scanning... Hold the ID card steady in the box.');
      setMessageType('info');
      console.log('✅ [QRScanner] Camera started successfully.');
    } catch (err: any) {
      console.error('❌ [QRScanner] Failed to start camera:', err);
      
      let errorMsg = 'Failed to start camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera access denied. Please allow camera permissions in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
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
        console.log('⏹️ [QRScanner] Camera stopped.');
      } catch (err) {
        console.error('❌ [QRScanner] Error stopping camera:', err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    console.log('🎯 [QRScanner] QR Code detected:', decodedText);
    
    // Pause scanning temporarily
    await stopScanning();
    setMessage(`Scanned: ${decodedText}. Marking attendance...`);
    setMessageType('info');

    try {
      const response = await api.post('/attendance/scan', {
        admissionNo: decodedText,
      });

      if (response.data.success) {
        setMessage(`✅ ${response.data.message}`);
        setMessageType('success');
      } else {
        setMessage(`❌ ${response.data.message}`);
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('❌ [QRScanner] API Error:', error);
      const errMsg = error.response?.data?.message || 'Failed to connect to server.';
      setMessage(`❌ Error: ${errMsg}`);
      setMessageType('error');
    }

    // Auto-restart scanning after 4 seconds
    setTimeout(() => {
      if (!scanning) {
        startScanning();
      }
    }, 4000);
  };

  const onScanFailure = (error: any) => {
    // QR scan failures are normal and happen every frame when no QR is in view.
    // We intentionally do NOT log this to avoid spamming the console.
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">QR Code Attendance Scanner</h2>

      {/* Scanner Container */}
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

      {/* Controls */}
      <div className="flex gap-4 justify-center mb-6">
        {!scanning ? (
          <button
            onClick={startScanning}
            disabled={!isCameraReady}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              isCameraReady 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop Scanning
          </button>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg text-center font-medium ${
          messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          messageType === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {message}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How to use:
        </h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Ensure you are using a device with a camera (laptop or phone).</li>
          <li>Click <strong>"Start Scanning"</strong> and allow camera access when prompted.</li>
          <li>Hold the student's ID card QR code steady inside the scanning box.</li>
          <li>Attendance will be marked instantly, and the scanner will restart automatically.</li>
        </ol>
      </div>
    </div>
  );
}