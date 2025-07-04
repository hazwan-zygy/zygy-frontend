import { useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2 } from "lucide-react";

interface PdfDocument {
  id: number;
  filename: string;
  originalName: string;
  fileSize: number;
  totalPages: number;
  textContent?: string;
  uploadedAt: string;
}

interface SearchResult {
  index: number;
  context: string;
  pageNumber: number;
  matchStart: number;
  matchEnd: number;
}

interface PDFViewerProps {
  document: PdfDocument | null;
  searchResults: SearchResult[];
  currentResultIndex: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
}

export function PDFViewer({
  document,
  searchResults,
  currentResultIndex,
  currentPage,
  onPageChange,
  onFileUpload,
  fileInputRef,
  isUploading,
}: PDFViewerProps) {
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("border-blue-400", "bg-blue-50");
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-blue-400", "bg-blue-50");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-blue-400", "bg-blue-50");
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        // Create a synthetic event to trigger the file upload
        const event = {
          target: { files: [file] },
        } as React.ChangeEvent<HTMLInputElement>;
        onFileUpload(event);
      }
    }
  }, [onFileUpload]);

  const highlightSearchText = useCallback((text: string) => {
    if (!searchResults.length || currentResultIndex < 0) return text;
    
    const currentResult = searchResults[currentResultIndex];
    if (!currentResult) return text;
    
    // Simple text highlighting - in a real implementation, this would be more sophisticated
    const beforeMatch = text.substring(0, currentResult.matchStart);
    const match = text.substring(currentResult.matchStart, currentResult.matchEnd);
    const afterMatch = text.substring(currentResult.matchEnd);
    
    return (
      <span>
        {beforeMatch}
        <span className="bg-yellow-200 px-1 rounded font-medium animate-pulse-highlight">
          {match}
        </span>
        {afterMatch}
      </span>
    );
  }, [searchResults, currentResultIndex]);

  if (!document) {
    return (
      <div
        ref={dropZoneRef}
        className="h-full flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all duration-300"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {isUploading ? (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="text-blue-600 animate-spin" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Uploading PDF...</h3>
              <p className="text-gray-500">Please wait while we process your document</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="text-blue-600" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload PDF Document</h3>
              <p className="text-gray-500 mb-4">Drag and drop a PDF file here or click to browse</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="mr-2" size={16} />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={onFileUpload}
                className="hidden"
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Document Info */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600" size={20} />
            <div>
              <h3 className="font-medium text-gray-900">{document.originalName}</h3>
              <p className="text-sm text-gray-500">
                {Math.round(document.fileSize / 1024)} KB • {document.totalPages} pages
              </p>
            </div>
          </div>
          {searchResults.length > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {searchResults.length} matches
            </Badge>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="p-4 space-y-4">
        {/* Simulated PDF pages */}
        {Array.from({ length: document.totalPages }, (_, i) => (
          <Card key={i} className="pdf-page bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-4">Page {i + 1}</div>
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-3">
                  {document.originalName} - Page {i + 1}
                </h3>
                <div className="space-y-3 text-gray-700">
                  <p>
                    {highlightSearchText(document.textContent || 
                      `This is sample content for page ${i + 1} of the PDF document. In a real implementation, this would show the actual extracted text from the PDF file using libraries like PDF.js or pdf-parse.`
                    )}
                  </p>
                  {searchResults.length > 0 && (
                    <p>
                      Search functionality is working! The text "{searchResults[0]?.context || 'search term'}" has been found and highlighted in this document.
                    </p>
                  )}
                  <p>
                    Additional content would continue here, showing the full text content of the PDF page with proper formatting and layout preservation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
