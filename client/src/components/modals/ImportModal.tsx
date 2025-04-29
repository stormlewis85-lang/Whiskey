import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { FileUpIcon, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportModal = ({ isOpen, onClose }: ImportModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import data");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.totalImported} whiskeys from your spreadsheet.`,
      });
      setFile(null);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    importMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">Import Collection</DialogTitle>
        </DialogHeader>
        
        <div className="p-1">
          <p className="text-gray-600 mb-4">Upload your Excel spreadsheet with your whiskey collection data.</p>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              dragActive ? "border-whiskey-400 bg-whiskey-100" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <Button
                  variant="outline"
                  className="mt-2 text-xs h-7 px-2"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <FileUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-1 text-sm text-gray-500">Drag and drop your Excel file here, or click to select</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 bg-whiskey-600 hover:bg-whiskey-500 text-white"
                >
                  Select File
                </Button>
              </>
            )}
          </div>

          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Expected Format</h4>
            <p className="text-sm text-gray-600 mb-2">Your spreadsheet should include the following columns:</p>
            <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1">
              <li>Name (required)</li>
              <li>Distillery</li>
              <li>Type (Bourbon, Scotch, etc.)</li>
              <li>Age</li>
              <li>Price</li>
              <li>Rating (0-5)</li>
              <li>Region</li>
              <li>ABV (%)</li>
            </ul>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              className="bg-whiskey-600 hover:bg-whiskey-500 text-white"
              disabled={!file || importMutation.isPending}
            >
              {importMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;
