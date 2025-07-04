import { useCallback, useRef, useState } from "react";
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
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
  searchQuery: string;
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

  console.log("[PDFViewer Render] Props received:", {
    searchQuery,
    currentPage,
    currentResultIndex,
    activeResult: searchResults[currentResultIndex],
  });

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>();

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
          const event = {
            target: { files: [file] },
          } as React.ChangeEvent<HTMLInputElement>;
          onFileUpload(event);
        }
      }
    },
    [onFileUpload],
  );

  // --- FIX IS HERE ---
  // Get the currently active search result
  const activeResult = searchResults[currentResultIndex];

  const renderText = useCallback(
    ({ str }: { str: string }) => {
      // --- DEBUG LINE 2 ---
      // Log every time the renderer is called for a piece of text.
      console.log(`[renderText Called] for page ${currentPage}`, { textChunk: str });

      // Condition to activate highlighting:
      if (!searchQuery || !activeResult || currentPage !== activeResult.pageNumber) {
        // --- DEBUG LINE 3 ---
        // This will tell us if we are exiting early.
        console.log("  -> Bypassing highlight logic.");
        return str;
      }

      // --- DEBUG LINE 4 ---
      // If we passed the check, log that we are attempting to highlight.
      console.log("  -> Applying highlight logic...");

      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const parts = str.split(new RegExp(`(${escapedQuery})`, "gi"));

      // --- DEBUG LINE 5 ---
      // See how the text was split. If this array has only 1 item, the match failed.
      console.log("    -> Split parts:", parts);

      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark key={i} className="bg-yellow-300 rounded px-0.5 animate-pulse-highlight">
                {part}
              </mark>
            ) : (
              part
            ),
          )}
        </>
      );
    },
    [searchQuery, activeResult, currentPage],
  );

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
                onChange={onFileUpload}
                className="hidden"
              />
            </>
          )}
        </div>
      </div>
    );
  }

  const fileUrl = `/api/documents/${document.id}/file`;
  const options = { cMapUrl: "/cmaps/", standardFontDataUrl: "/standard_fonts/" };
  
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

      <div className="flex justify-center p-4">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            if (currentPage > numPages) onPageChange(1);
          }}
          loading={
            <Loader2 className="animate-spin text-blue-600 mt-20" size={32} />
          }
        >
          <Page
            key={currentPage} // Adding a key forces a re-mount, ensuring highlight logic re-runs
            pageNumber={currentPage}
            width={800}
            renderTextLayer
            renderAnnotationLayer
            customTextRenderer={renderText}
          />
        </Document>
      </div>
    </div>
  );
}