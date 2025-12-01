import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NomadBrainDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDataSubmit: (data: string) => void;
  conversationTitle: string;
}

export const NomadBrainDialog: React.FC<NomadBrainDialogProps> = ({
  isOpen,
  onClose,
  onDataSubmit,
  conversationTitle,
}) => {
  const [textData, setTextData] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; content: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: { name: string; content: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Only accept text files
      if (!file.type.startsWith('text/') && !file.name.endsWith('.txt') && !file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
        toast.error(`${file.name} is not a text file. Only text files are supported.`);
        continue;
      }

      try {
        const content = await file.text();
        newFiles.push({
          name: file.name,
          content: content,
        });
      } catch (error) {
        console.error(`Error reading ${file.name}:`, error);
        toast.error(`Failed to read ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      toast.success(`${newFiles.length} file(s) uploaded successfully`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    let combinedData = textData.trim();

    // Add file contents
    if (uploadedFiles.length > 0) {
      const fileContents = uploadedFiles.map(f => `\n\n--- File: ${f.name} ---\n${f.content}`).join('');
      combinedData = combinedData + fileContents;
    }

    if (!combinedData) {
      toast.error('Please enter text or upload files');
      return;
    }

    onDataSubmit(combinedData);
    
    // Reset
    setTextData('');
    setUploadedFiles([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Brain Data Upload
          </DialogTitle>
          <DialogDescription className="text-center">
            Upload text data for NOMAD to analyze patterns and make predictions
            <span className="block mt-2 text-xs">
              Conversation: <span className="font-semibold">{conversationTitle}</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <label className="text-sm font-medium">Enter Text Data</label>
            <Textarea
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
              placeholder="Paste message logs, data, or any text content here..."
              className="min-h-[150px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Or Upload Text Files</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.json,text/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Text Files (.txt, .csv, .json)
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
              <label className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</label>
              <ScrollArea className="flex-1 border rounded-md p-2">
                <div className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({(file.content.length / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
            <p className="font-semibold mb-1">💡 NOMAD will analyze:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Temporal patterns and frequency analysis</li>
              <li>Sentiment and communication dynamics</li>
              <li>Hidden correlations and anomalies</li>
              <li>Predictive insights based on patterns</li>
            </ul>
            <p className="mt-2 italic">More data = More accurate predictions</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={!textData.trim() && uploadedFiles.length === 0}
          >
            <Brain className="w-4 h-4 mr-2" />
            Analyze Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
