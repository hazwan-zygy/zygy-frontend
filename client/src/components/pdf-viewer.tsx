import { useCallback, useRef, useState, useEffect } from "react";
import { Document, Page } from "@/lib/reactPdf";
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
  // --- CHANGE 1: Update the prop to expect a File, not the full event ---
  onFileUpload: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
  searchQuery: string;
}

function highlightPattern(text: string, pattern: string): string {
  if (!pattern || !pattern.trim()) {
    return text;
  }
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedPattern, 'gi');
  return text.replace(regex, (value) => `<mark>${value}</mark>`);
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
  searchQuery,
}: PDFViewerProps) {
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>();

  console.log("[PDFViewer Render] Props received:", {
    searchQuery,
    currentPage,
    currentResultIndex,
    activeResult: searchResults[currentResultIndex],
  });

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropZoneRef.current) {
        dropZoneRef.current.classList.remove("border-blue-400", "bg-blue-50");
      }
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type === "application/pdf") {
          // --- CHANGE 2: Call onFileUpload directly with the file. No more fake events! ---
          onFileUpload(file);
        }
      }
    },
    [onFileUpload],
  );
  
  // --- CHANGE 3: Create a handler to adapt the input's onChange event to our new prop type ---
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      onFileUpload(file);
    }
  };

  useEffect(() => {
    if (!viewerRef.current || searchResults.length === 0) {
      return;
    }

    // Find and remove the class from any previously active highlight
    const previousActive = viewerRef.current.querySelector('.search-highlight--active');
    if (previousActive) {
      previousActive.classList.remove('search-highlight--active');
    }

    const activeResult = searchResults[currentResultIndex];
    if (!activeResult || activeResult.pageNumber !== currentPage) {
      return;
    }

    // Find all results that are supposed to be on the current page
    const resultsOnPage = searchResults.filter(
      (result) => result.pageNumber === currentPage
    );

    // Find the index of our active result WITHIN the list of results for this page
    const indexOnPage = resultsOnPage.findIndex(
      (result) => result.index === activeResult.index
    );
      
    if (indexOnPage === -1) {
      return;
    }
      
    // Get all rendered <mark> elements. Their order should match the order of resultsOnPage.
    const markElements = viewerRef.current.querySelectorAll('.react-pdf__Page__textContent mark');
      
    const targetElement = markElements[indexOnPage];
    
    if (targetElement) {
      // Add the animation class
      targetElement.classList.add('search-highlight--active');
      
      // Scroll the element into view for better UX
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }

  }, [currentResultIndex, currentPage, searchResults, document]); 

  const activeResult = searchResults[currentResultIndex];

  const customTextRenderer = useCallback(
    (textItem: any) => highlightPattern(textItem.str, searchQuery),
    [searchQuery]
  );

  const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log("[Document Load Success] Pages:", numPages);
    setNumPages(numPages);
    if (currentPage > numPages) {
      onPageChange(1);
    }
  }, [currentPage, onPageChange]);

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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Uploading PDF...
              </h3>
              <p className="text-gray-500">
                Please wait while we process your document
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="text-blue-600" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload PDF Document
              </h3>
              <p className="text-gray-500 mb-4">
                Drag and drop a PDF file here or click to browse
              </p>
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
                // --- CHANGE 4: Use the new handler for the input ---
                onChange={handleInputChange}
                className="hidden"
              />
            </>
          )}
        </div>
      </div>
    );
  }

  const fileUrl = `/api/documents/${document.id}/file`;
  
  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600" size={20} />
            <div>
              <h3 className="font-medium">{document.originalName}</h3>
              <p className="text-sm text-gray-500">
                {Math.round(document.fileSize / 1024)} KB •{" "}
                {(numPages ?? document.totalPages) || "?"} pages
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

      <div ref={viewerRef} className="flex justify-center p-4">
        <Document
          file={fileUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={
            <Loader2 className="animate-spin text-blue-600 mt-20" size={32} />
          }
        >
          <Page
            key={currentPage} 
            pageNumber={currentPage}
            width={800}
            renderTextLayer={true}
            renderAnnotationLayer={false}
            customTextRenderer={customTextRenderer}
          />
        </Document>
      </div>
    </div>
  );
}