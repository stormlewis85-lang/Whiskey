import { useState } from "react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/BottomNav";
import { BarcodeScanner } from "@/components/BarcodeScanner";

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [, navigate] = useLocation();

  const handleScanClick = () => {
    setScannerOpen(true);
  };

  const handleCodeScanned = (code: string) => {
    setScannerOpen(false);
    // Navigate to home with the scanned code as search query
    navigate(`/?barcode=${encodeURIComponent(code)}`);
  };

  return (
    <>
      <div className="pb-[100px] md:pb-0">
        {children}
      </div>
      <BottomNav onScanClick={handleScanClick} />
      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onCodeScanned={handleCodeScanned}
      />
    </>
  );
}
