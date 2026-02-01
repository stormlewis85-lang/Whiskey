import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Camera, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onCodeScanned: (code: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarcodeScanner({ onCodeScanned, open, onOpenChange }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    // Reset state when dialog opens
    setError(null);
    setIsStarting(true);
    hasScannedRef.current = false;

    let scanner: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" }, // Force rear camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Prevent multiple scans
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;

            // Stop scanner then notify parent
            scanner?.stop().then(() => {
              scannerRef.current = null;
              onCodeScanned(decodedText);
              onOpenChange(false);
              toast({
                title: "Code scanned",
                description: `Barcode: ${decodedText}`,
              });
            }).catch(() => {
              // Still notify even if stop fails
              onCodeScanned(decodedText);
              onOpenChange(false);
            });
          },
          () => {
            // Ignore scan errors - normal during scanning
          }
        );

        setIsStarting(false);
      } catch (err) {
        console.error('Scanner error:', err);
        setError("Camera access denied. Please allow camera permissions.");
        setIsStarting(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, onCodeScanned, onOpenChange]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Point your camera at the barcode
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black">
          {error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-destructive/10">
              <AlertCircle className="w-12 h-12 text-destructive mb-3" />
              <p className="text-destructive font-medium">{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleClose}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <div
                id="barcode-reader"
                className="w-full aspect-square"
              />
              {isStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                  <Camera className="w-12 h-12 text-white/60 animate-pulse mb-2" />
                  <p className="text-white/60 text-sm">Starting camera...</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 pt-2">
          <Button variant="outline" className="w-full" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
