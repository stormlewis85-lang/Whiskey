import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Camera, AlertCircle, RotateCcw } from 'lucide-react';

interface PhotoCaptureProps {
  onPhotoTaken: (imageData: string, mediaType: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoCapture({ onPhotoTaken, open, onOpenChange }: PhotoCaptureProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) return;

    // Reset state when dialog opens
    setError(null);
    setIsStarting(true);
    setCapturedImage(null);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Prefer rear camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setIsStarting(false);
      } catch (err) {
        console.error('Camera error:', err);
        setError("Camera access denied. Please allow camera permissions.");
        setIsStarting(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startCamera, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCapturedImage(null);
    onOpenChange(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image as base64 JPEG
    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(imageData);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      // Stop the camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      onPhotoTaken(capturedImage, 'image/jpeg');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Take Photo of Label</DialogTitle>
          <DialogDescription>
            Point your camera at the whiskey bottle label
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
          ) : capturedImage ? (
            // Show captured image
            <div className="aspect-[4/3]">
              <img
                src={capturedImage}
                alt="Captured bottle"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            // Show live camera feed
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[4/3] object-cover"
              />
              {isStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                  <Camera className="w-12 h-12 text-white/60 animate-pulse mb-2" />
                  <p className="text-white/60 text-sm">Starting camera...</p>
                </div>
              )}
              {/* Capture guide overlay */}
              {!isStarting && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
                  <p className="absolute bottom-6 left-0 right-0 text-center text-white/70 text-sm">
                    Center the label in frame
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />

        <div className="p-4 pt-2 space-y-2">
          {capturedImage ? (
            // Confirm/Retake buttons
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={retakePhoto}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button className="flex-1" onClick={confirmPhoto}>
                <Camera className="w-4 h-4 mr-2" />
                Use Photo
              </Button>
            </div>
          ) : (
            // Capture button
            <Button
              className="w-full"
              onClick={capturePhoto}
              disabled={isStarting || !!error}
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
