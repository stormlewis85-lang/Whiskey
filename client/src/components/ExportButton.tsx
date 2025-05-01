import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import ExportModal from "@/components/modals/ExportModal";

interface ExportButtonProps {
  className?: string;
}

const ExportButton = ({ className }: ExportButtonProps) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsExportModalOpen(true)}
        variant="outline"
        size="sm"
        className={`text-gray-700 hover:text-blue-700 hover:bg-blue-50 ${className || ''}`}
      >
        <DownloadIcon className="h-4 w-4 mr-1" />
        Export
      </Button>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </>
  );
};

export default ExportButton;