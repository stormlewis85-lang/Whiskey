import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import { exportToExcel, exportToPDF, exportDetailedPDF, exportToJSON, exportToCSV } from "@/lib/utils/export";
import { Loader2, FileSpreadsheet, FileText, FileJson, FileDown, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "excel" | "csv" | "json" | "pdf-simple" | "pdf-detailed";

const formatOptions: { value: ExportFormat; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "excel", label: "Excel Spreadsheet", description: "Best for editing and analysis (.xlsx)", icon: <FileSpreadsheet className="h-4 w-4 text-green-600" /> },
  { value: "csv", label: "CSV File", description: "Universal format for any spreadsheet app", icon: <FileDown className="h-4 w-4 text-blue-600" /> },
  { value: "json", label: "JSON Data", description: "Full data with reviews for backup/import", icon: <FileJson className="h-4 w-4 text-amber-600" /> },
  { value: "pdf-simple", label: "Simple PDF", description: "Clean table format for printing", icon: <FileText className="h-4 w-4 text-red-600" /> },
  { value: "pdf-detailed", label: "Detailed PDF Report", description: "Full details including tasting notes", icon: <FileText className="h-4 w-4 text-purple-600" /> },
];

const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch whiskey data for export
  const { data: whiskeys, isLoading } = useQuery({
    queryKey: ["/api/whiskeys"],
    enabled: isOpen,
  });

  const handleExport = async () => {
    if (!whiskeys || isLoading || !Array.isArray(whiskeys)) return;

    setIsExporting(true);

    try {
      switch (exportFormat) {
        case "excel":
          exportToExcel(whiskeys);
          break;
        case "csv":
          exportToCSV(whiskeys);
          break;
        case "json":
          exportToJSON(whiskeys);
          break;
        case "pdf-simple":
          exportToPDF(whiskeys);
          break;
        case "pdf-detailed":
          exportDetailedPDF(whiskeys);
          break;
        default:
          console.error("Invalid export format");
          return;
      }

      toast({
        title: "Export successful!",
        description: `Your collection has been exported as ${exportFormat.toUpperCase()}.`,
      });

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your collection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const collectionCount = Array.isArray(whiskeys) ? whiskeys.length : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Collection
          </DialogTitle>
          <DialogDescription>
            Export your {collectionCount} whiskey{collectionCount !== 1 ? 's' : ''} to your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
            <div className="space-y-3">
              {formatOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    exportFormat === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                  onClick={() => setExportFormat(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">{option.icon}</div>
                    <Label htmlFor={option.value} className="cursor-pointer flex-1">
                      <span className="font-medium">{option.label}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || isExporting || collectionCount === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;