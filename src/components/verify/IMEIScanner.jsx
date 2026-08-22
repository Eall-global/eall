import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  FiCamera,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
  FiUploadCloud,
  FiImage,
} from "react-icons/fi";

/**
 * IMEIScanner
 * Robust camera-based QR / barcode scanner with file upload fallback.
 * Uses html5-qrcode with intelligent camera discovery, back-camera priority,
 * and photo upload support.
 *
 * Props:
 *  - onScan(rawValue: string): callback when a code is detected
 *  - onClose(): callback when the user dismisses the scanner
 */
const IMEIScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [isScanningFile, setIsScanningFile] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);
  const containerId = "imei-qr-reader";

  // Dynamic QR box sizing based on viewport
  const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const size = Math.floor(minEdge * 0.75);
    return {
      width: Math.max(size, 200),
      height: Math.max(size, 200),
    };
  };

  const handleDetected = (decodedText) => {
    if (scannerRef.current) {
      try {
        scannerRef.current
          .stop()
          .catch(() => { })
          .finally(() => {
            onScan(decodedText);
          });
      } catch {
        onScan(decodedText);
      }
    } else {
      onScan(decodedText);
    }
  };

  const startScannerWithCamera = async (cameraIdOrConfig) => {
    if (!scannerRef.current) return;
    setIsStarting(true);
    setError(null);

    const config = {
      fps: 15,
      qrbox: qrboxFunction,
      aspectRatio: 1.333333,
    };

    try {
      // If scanner is already running, stop first
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.start(
        cameraIdOrConfig,
        config,
        (decodedText) => {
          handleDetected(decodedText);
        },
        () => {
          // Silent frame check
        }
      );

      if (isMountedRef.current) {
        setIsStarting(false);
      }
    } catch (err) {
      console.warn("Scanner start error:", err);
      if (isMountedRef.current) {
        setIsStarting(false);
        const errStr = String(err);
        if (
          err?.name === "NotAllowedError" ||
          errStr.includes("NotAllowed") ||
          errStr.includes("Permission")
        ) {
          setError(
            "Camera permission was denied. Please allow camera access in your browser or upload a photo of the barcode below."
          );
        } else if (
          err?.name === "NotFoundError" ||
          errStr.includes("NotFound") ||
          errStr.includes("DevicesNotFoundError")
        ) {
          setError(
            "No camera was found on this device. You can upload a photo of the box label instead."
          );
        } else if (err?.name === "NotReadableError" || errStr.includes("in use")) {
          setError(
            "Camera is currently in use by another application. Please close it and retry."
          );
        } else {
          // Attempt fallback to facingMode: environment
          if (typeof cameraIdOrConfig === "string") {
            try {
              await scannerRef.current.start(
                { facingMode: "environment" },
                config,
                handleDetected,
                () => { }
              );
              if (isMountedRef.current) setIsStarting(false);
              return;
            } catch (fallbackErr) {
              console.warn("Fallback error:", fallbackErr);
            }
          }
          setError(
            "Unable to start live camera feed. Please upload a photo of the barcode below or enter the IMEI manually."
          );
        }
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    // Discover available camera devices
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMountedRef.current) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/rear/environment camera
          const rearCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear") ||
              d.label.toLowerCase().includes("environment") ||
              d.label.toLowerCase().includes("0")
          );
          const targetId = rearCam ? rearCam.id : devices[devices.length - 1].id;
          setActiveCameraId(targetId);
          startScannerWithCamera(targetId);
        } else {
          // Fallback to constraints
          startScannerWithCamera({ facingMode: "environment" });
        }
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        startScannerWithCamera({ facingMode: "environment" });
      });

    return () => {
      isMountedRef.current = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => { });
          }
          scannerRef.current.clear();
        } catch {
          // ignore cleanup errors
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle camera switch (e.g. front vs back)
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setActiveCameraId(nextCamId);
    startScannerWithCamera(nextCamId);
  };

  // Handle scanning from an uploaded photo/screenshot
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    setIsScanningFile(true);
    setError(null);

    try {
      // Stop live camera if running to free resources
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      const decodedText = await scannerRef.current.scanFile(file, true);
      handleDetected(decodedText);
    } catch (err) {
      console.warn("File scan error:", err);
      setError(
        "Could not detect a clear barcode or QR code in the uploaded image. Please try another photo or enter manually."
      );
    } finally {
      setIsScanningFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 w-full">
      {/* Scanner Viewport Container */}
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-xl relative min-h-[300px] flex flex-col items-center justify-center">
        {/* html5-qrcode target div with styling overrides */}
        <div
          id={containerId}
          className="w-full min-h-[300px] [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:rounded-xl [&_img]:hidden [&_#qr-shaded-region]:border-sky-400/80"
        />

        {/* Loading Spinner overlay */}
        {isStarting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 text-slate-200 z-10">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-slate-700 border-t-sky-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-300">
              Initializing camera viewfinder...
            </span>
          </div>
        )}

        {/* File scanning loading overlay */}
        {isScanningFile && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 text-slate-200 z-10">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-slate-700 border-t-indigo-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-300">
              Analyzing photo for barcode / QR...
            </span>
          </div>
        )}

        {/* Floating camera switch button if multiple cameras found */}
        {cameras.length > 1 && !isStarting && !error && (
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-semibold border border-white/20 backdrop-blur-md flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            title="Switch camera"
          >
            <FiRefreshCw className="text-xs" />
            Switch Camera
          </button>
        )}
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="w-full max-w-md flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm text-left">
          <FiAlertCircle className="text-lg shrink-0 mt-0.5 text-rose-600" />
          <p className="flex-1 leading-relaxed font-medium">{error}</p>
        </div>
      )}

      {/* Scanning instruction hint */}
      {!error && !isStarting && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium text-center">
          <FiCamera className="text-sky-500 shrink-0 text-base" />
          <span>Point camera at the barcode or carton QR on the product box</span>
        </div>
      )}

      {/* Actions: Upload Image Photo or Cancel */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
          id="imei-file-upload"
        />

        <label
          htmlFor="imei-file-upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 hover:border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-700 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <FiImage className="text-base" />
          Upload Box Photo
        </label>

        <button
          id="verify-close-scanner-btn"
          onClick={onClose}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <FiX className="text-base" />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default IMEIScanner;
