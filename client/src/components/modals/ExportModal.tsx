import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, DownloadCloud } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Whiskey } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToPDF, exportDetailedPDF } from "@/lib/utils/export";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "excel" | "pdf-simple" | "pdf-detailed";

const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Get whiskey data for export
  const { data: whiskeys, isLoading, isError } = useQuery<Whiskey[]>({
    queryKey: ['/api/whiskeys'],
    enabled: isOpen, // Only fetch when modal is open
  });

  const handleExport = async () => {
    if (!whiskeys || whiskeys.length === 0) {
      toast({
        title: "No data to export",
        description: "Your whiskey collection is empty.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);

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
      }

      toast({
        title: "Export successful",
        description: "Your whiskey collection has been exported successfully."
      });
      onClose();
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your whiskey collection.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Export Collection</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <p className="text-gray-500 mb-4 text-sm">
            Choose a format to export your whiskey collection.
          </p>

          <RadioGroup
            value={exportFormat}
            onValueChange={(value) => setExportFormat(value as ExportFormat)}
            className="flex flex-col space-y-3"
          >
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-whiskey-50 cursor-pointer">
              <RadioGroupItem value="excel" id="excel" />
              <Label
                htmlFor="excel"
                className="flex items-center cursor-pointer w-full"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                <div>
                  <span className="font-medium">Excel Spreadsheet</span>
                  <p className="text-sm text-gray-500">Complete data in tabular format</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-whiskey-50 cursor-pointer">
              <RadioGroupItem value="pdf-simple" id="pdf-simple" />
              <Label
                htmlFor="pdf-simple"
                className="flex items-center cursor-pointer w-full"
              >
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                <div>
                  <span className="font-medium">Simple PDF</span>
                  <p className="text-sm text-gray-500">Basic collection overview</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-whiskey-50 cursor-pointer">
              <RadioGroupItem value="pdf-detailed" id="pdf-detailed" />
              <Label
                htmlFor="pdf-detailed"
                className="flex items-center cursor-pointer w-full"
              >
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                <div>
                  <span className="font-medium">Detailed PDF</span>
                  <p className="text-sm text-gray-500">Complete details with tasting notes</p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {isLoading && (
            <div className="flex justify-center mt-6">
              <div className="animate-spin h-6 w-6 border-2 border-whiskey-500 border-t-transparent rounded-full"></div>
            </div>
          )}

          {isError && (
            <div className="text-center mt-6 text-red-500">
              There was an error loading your whiskey collection data.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            className="bg-whiskey-600 hover:bg-whiskey-500 text-white w-full sm:w-auto"
            disabled={isLoading || isExporting}
          >
            {isExporting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Exporting...
              </>
            ) : (
              <>
                <DownloadCloud className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;