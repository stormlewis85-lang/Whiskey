import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onCodeScanned: (code: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarcodeScanner({ onCodeScanned, open, onOpenChange }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<Array<InputDeviceInfo>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  // Refs for proper cleanup
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const isStoppingRef = useRef(false);
  const scannerIdRef = useRef(`scanner-${Date.now()}`);

  // Stop scanner with proper cleanup
  const stopScanner = useCallback(async () => {
    // Prevent multiple simultaneous stop calls
    if (isStoppingRef.current) return;

    if (scannerRef.current) {
      isStoppingRef.current = true;
      try {
        const scanner = scannerRef.current;
        const state = scanner.getState();

        // Only try to stop if scanner is actually running
        if (state === 2) { // Html5QrcodeScannerState.SCANNING
          await scanner.stop();
        }

        // Clear the scanner to remove DOM elements properly
        try {
          scanner.clear();
        } catch (clearError) {
          // Ignore clear errors - DOM might already be gone
          console.log('Scanner clear (expected on unmount):', clearError);
        }
      } catch (error) {
        // Ignore stop errors during cleanup
        console.log('Scanner stop (may be expected):', error);
      } finally {
        scannerRef.current = null;
        isStoppingRef.current = false;
        if (isMountedRef.current) {
          setScanning(false);
        }
      }
    }
  }, []);

  // Start scanner with proper initialization
  const startScanner = useCallback(async () => {
    if (!selectedCamera || !containerRef.current || !isMountedRef.current) return;
    if (scannerRef.current) {
      // Scanner already exists, stop it first
      await stopScanner();
    }

    try {
      // Create new scanner instance using the unique ID
      const scanner = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = scanner;

      if (isMountedRef.current) {
        setScanning(true);
      }

      await scanner.start(
        { deviceId: selectedCamera },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (isMountedRef.current) {
            handleCodeScanned(decodedText);
          }
        },
        (errorMessage) => {
          // Handle scan errors silently - these are normal during scanning
          // console.log(errorMessage);
        }
      );
    } catch (error) {
      console.error('Error starting scanner:', error);
      if (isMountedRef.current) {
        toast({
          title: "Scanner error",
          description: "Failed to start the barcode scanner. Please try again.",
          variant: "destructive"
        });
        setScanning(false);
      }
    }
  }, [selectedCamera, stopScanner]);

  const handleCodeScanned = useCallback((code: string) => {
    // Stop scanner first, then notify parent
    stopScanner().then(() => {
      if (isMountedRef.current) {
        onCodeScanned(code);
        onOpenChange(false);
        toast({
          title: "Code scanned successfully",
          description: `Barcode detected: ${code}`,
        });
      }
    });
  }, [onCodeScanned, onOpenChange, stopScanner]);

  // Check for camera permissions and available devices
  useEffect(() => {
    if (!open) return;

    // Reset mounted flag when dialog opens
    isMountedRef.current = true;
    // Generate a new unique ID for this session
    scannerIdRef.current = `scanner-${Date.now()}`;

    let initTimer: NodeJS.Timeout | null = null;

    const checkPermissions = async () => {
      try {
        // Request camera permission explicitly
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        // If we got here, permission was granted
        // Close this stream as we'll reopen with the scanner
        stream.getTracks().forEach(track => track.stop());

        if (!isMountedRef.current) return;

        // Now get the list of cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (!isMountedRef.current) return;

        setCameras(videoDevices as InputDeviceInfo[]);

        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
          setPermission(true);
        } else {
          setPermission(false);
          toast({
            title: "No cameras found",
            description: "Your device doesn't have any cameras available for scanning.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error checking camera permissions:', error);
        if (isMountedRef.current) {
          setPermission(false);
          toast({
            title: "Camera access denied",
            description: "Please grant camera permissions to use the barcode scanner.",
            variant: "destructive"
          });
        }
      }
    };

    // Small delay to ensure DOM is ready
    initTimer = setTimeout(() => {
      checkPermissions();
    }, 100);

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (initTimer) {
        clearTimeout(initTimer);
      }
      // Stop scanner synchronously if possible
      stopScanner();
    };
  }, [open, stopScanner]);

  // Auto-start scanner when permission is granted and camera is selected
  useEffect(() => {
    if (!open || !permission || !selectedCamera) return;

    let startTimer: NodeJS.Timeout | null = null;

    // Delay scanner start to ensure DOM is fully rendered
    startTimer = setTimeout(() => {
      if (isMountedRef.current && !scannerRef.current) {
        startScanner();
      }
    }, 300);

    return () => {
      if (startTimer) {
        clearTimeout(startTimer);
      }
    };
  }, [open, permission, selectedCamera, startScanner]);

  const handleDialogClose = useCallback(() => {
    stopScanner().then(() => {
      onOpenChange(false);
    });
  }, [stopScanner, onOpenChange]);

  const handleCameraChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCamera = e.target.value;
    stopScanner().then(() => {
      if (isMountedRef.current) {
        setSelectedCamera(newCamera);
      }
    });
  }, [stopScanner]);

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode or QR Code</DialogTitle>
          <DialogDescription>
            Position the barcode or QR code within the scanner frame.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {permission === false && (
            <div className="p-4 bg-red-50 text-red-800 rounded-md">
              <p>Camera access is required to scan barcodes. Please grant camera permissions and try again.</p>
            </div>
          )}

          {permission === true && (
            <>
              {cameras.length > 1 && (
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedCamera || ''}
                  onChange={handleCameraChange}
                >
                  {cameras.map(camera => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.substring(0, 5)}...`}
                    </option>
                  ))}
                </select>
              )}

              <div
                ref={containerRef}
                id={scannerIdRef.current}
                className="overflow-hidden rounded-lg aspect-square relative bg-black"
              >
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                    <Camera className="w-16 h-16 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
          </DialogClose>

          {permission === true && (
            scanning ? (
              <Button type="button" variant="destructive" onClick={stopScanner}>
                Stop Scanning
              </Button>
            ) : (
              <Button type="button" onClick={startScanner}>
                Start Scanning
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
