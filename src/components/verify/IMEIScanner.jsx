import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { FiCamera, FiAlertCircle, FiX } from "react-icons/fi";

/**
 * IMEIScanner
 * Camera-based QR code / barcode scanner styled with Tailwind CSS.
 *
 * Props:
 *  - onScan(rawValue: string): callback when a code is detected
 *  - onClose(): callback when the user dismisses the scanner
 */
const IMEIScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef(null);
  const containerId = "imei-qr-reader";

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(containerId);
    scannerRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 260, height: 200 },
      aspectRatio: 1.33,
      supportedScanTypes: [], // QR, EAN, Code128, etc.
    };

    const onSuccess = (decodedText) => {
      html5QrCode
        .stop()
        .then(() => onScan(decodedText))
        .catch(() => onScan(decodedText));
    };

    const onFailure = () => {
      // Silent frame-by-frame check
    };

    html5QrCode
      .start({ facingMode: "environment" }, config, onSuccess, onFailure)
      .then(() => setIsStarting(false))
      .catch((err) => {
        setIsStarting(false);
        if (err?.name === "NotAllowedError" || String(err).includes("NotAllowed")) {
          setError("Camera permission was denied. Please allow camera access in your browser settings and try again.");
        } else if (err?.name === "NotFoundError" || String(err).includes("NotFound")) {
          setError("No camera was detected on this device.");
        } else {
          setError("Could not activate camera. Please use manual IMEI entry instead.");
        }
      });

    return () => {
      html5QrCode.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Scanner Viewport */}
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-inner relative min-h-[260px] flex items-center justify-center">
        <div id={containerId} className="w-full h-full [&_video]:rounded-xl" />

        {isStarting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/90 text-slate-300">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-sky-400" />
            <span className="text-xs font-medium tracking-wide">Starting camera viewfinder...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-sm">
          <FiAlertCircle className="text-lg shrink-0 mt-0.5" />
          <p className="flex-1 leading-relaxed text-xs sm:text-sm font-medium">{error}</p>
        </div>
      )}

      {!error && !isStarting && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium text-center">
          <FiCamera className="text-sky-500 shrink-0" />
          <span>Point camera at the IMEI barcode or carton QR on the box</span>
        </div>
      )}

      <button
        id="verify-close-scanner-btn"
        onClick={onClose}
        type="button"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-semibold shadow-sm transition-all"
      >
        <FiX className="text-base" />
        Cancel Scan
      </button>
    </div>
  );
};

export default IMEIScanner;
