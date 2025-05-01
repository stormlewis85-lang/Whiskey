import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import { exportToExcel, exportToPDF, exportDetailedPDF } from "@/lib/utils/export";
import { Loader2 } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "excel" | "pdf-simple" | "pdf-detailed";

const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch whiskey data for export
  const { data: whiskeys, isLoading } = useQuery({
    queryKey: ["/api/whiskeys"],
    enabled: isOpen, // Only fetch when modal is open
  });
  
  const handleExport = async () => {
    if (!whiskeys || isLoading || !Array.isArray(whiskeys)) return;
    
    setIsExporting(true);
    
    try {
      switch (exportFormat) {
        case "excel":
          exportToExcel(whiskeys);
          break;
        case "pdf-simple":
          exportToPDF(whiskeys);
          break;
        case "pdf-detailed":
          exportDetailedPDF(whiskeys);
          break;
        default:
          console.error("Invalid export format");
      }
      
      // Close modal after export
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Collection</DialogTitle>
          <DialogDescription>
            Choose a format to export your whiskey collection data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="excel" id="excel" />
              <Label htmlFor="excel" className="cursor-pointer">
                <span className="font-medium">Excel Spreadsheet</span>
                <p className="text-sm text-gray-500">Export to Excel (.xlsx) format with all data</p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="pdf-simple" id="pdf-simple" />
              <Label htmlFor="pdf-simple" className="cursor-pointer">
                <span className="font-medium">Simple PDF</span>
                <p className="text-sm text-gray-500">Clean table format with essential details</p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf-detailed" id="pdf-detailed" />
              <Label htmlFor="pdf-detailed" className="cursor-pointer">
                <span className="font-medium">Detailed PDF</span>
                <p className="text-sm text-gray-500">Full details including review notes</p>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isLoading || isExporting}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              "Export Now"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;