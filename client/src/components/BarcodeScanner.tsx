import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Camera, X } from 'lucide-react';
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for camera permissions and available devices
  useEffect(() => {
    if (!open) return;

    const checkPermissions = async () => {
      try {
        // Check if we already have permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
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
        setPermission(false);
        toast({
          title: "Camera access denied",
          description: "Please grant camera permissions to use the barcode scanner.",
          variant: "destructive"
        });
      }
    };

    checkPermissions();

    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    if (!selectedCamera || !containerRef.current) return;
    
    try {
      // Initialize scanner
      scannerRef.current = new Html5Qrcode('scanner-container');
      setScanning(true);

      await scannerRef.current.start(
        { deviceId: selectedCamera },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Handle scan errors silently
          console.log(errorMessage);
        }
      );
    } catch (error) {
      console.error('Error starting scanner:', error);
      toast({
        title: "Scanner error",
        description: "Failed to start the barcode scanner. Please try again.",
        variant: "destructive"
      });
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  const handleCodeScanned = (code: string) => {
    stopScanner();
    onCodeScanned(code);
    onOpenChange(false);
    toast({
      title: "Code scanned successfully",
      description: `Barcode detected: ${code}`,
    });
  };

  const handleDialogClose = () => {
    stopScanner();
    onOpenChange(false);
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (scanning) {
      stopScanner();
    }
    setSelectedCamera(e.target.value);
  };

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
                id="scanner-container"
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
            <Button type="button" variant="outline">
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