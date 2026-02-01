import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onCodeScanned: (code: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarcodeScanner({ onCodeScanned, open, onOpenChange }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    // Reset scanned flag when dialog opens
    hasScannedRef.current = false;

    // Small delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          "barcode-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1.0,
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            // Prevent multiple scans
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;

            // Clear scanner first
            scanner.clear().catch(() => {});
            scannerRef.current = null;

            // Notify parent
            onCodeScanned(decodedText);
            onOpenChange(false);

            toast({
              title: "Code scanned successfully",
              description: `Barcode detected: ${decodedText}`,
            });
          },
          (error) => {
            // Ignore scan errors - these are normal while scanning
          }
        );

        scannerRef.current = scanner;
      } catch (err) {
        console.error('Failed to initialize scanner:', err);
        toast({
          title: "Scanner error",
          description: "Failed to start the barcode scanner.",
          variant: "destructive"
        });
      }
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(initTimer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, onCodeScanned, onOpenChange]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode or QR Code</DialogTitle>
          <DialogDescription>
            Position the barcode within the scanner frame.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <div id="barcode-reader" className="w-full" />
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
