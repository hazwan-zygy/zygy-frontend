import { useState, useRef, useCallback, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Upload, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Menu,
  X,
  FileText,
  Download,
  Trash2,
  SquareDashedMousePointer
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { PDFViewer } from "@/components/pdf-viewer";
import { SearchInterface } from "@/components/search-interface";
import { ChatInterface } from "@/components/chat-interface";
import { MobileSearchOverlay } from "@/components/mobile-search-overlay";
import { useLocation } from "wouter";

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

export default function PDFViewerPage() {
  const [selectedDocument, setSelectedDocument] = useState<PdfDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [searchOptions, setSearchOptions] = useState({
    matchCase: false,
    wholeWords: false,
  });
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [highlightedPage, setHighlightedPage] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Match the route for deep linking
  const [, params] = useRoute("/documents/:docId/page/:pageNum");

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<PdfDocument[]>({
    queryKey: ["/api/documents"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("pdf", file);
      const response = await apiRequest("POST", "/api/documents/upload", formData);
      return response.json();
    },
    onSuccess: (document: PdfDocument) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setSelectedDocument(document);
      toast({
        title: "PDF uploaded successfully",
        description: `${document.originalName} has been uploaded and is ready for search.`,
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async ({ documentId, query, options }: { documentId: number; query: string; options: typeof searchOptions }) => {
      const response = await apiRequest("POST", `/api/documents/${documentId}/search`, {
        query,
        ...options,
      });
      return response.json();
    },
    onSuccess: (results: SearchResult[]) => {
      setSearchResults(results);
      setCurrentResultIndex(0);
      if (results.length > 0) {
        toast({
          title: "Search completed",
          description: `Found ${results.length} result${results.length === 1 ? "" : "s"}.`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Search failed",
        description: "Failed to search document. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("DELETE", `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setSelectedDocument(null);
      setSearchResults([]);
      setSearchTerm("");
      toast({
        title: "Document deleted",
        description: "The PDF document has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = useCallback((file: File) => {
    if (file && file.type === "application/pdf") {
      uploadMutation.mutate(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a valid PDF file.",
        variant: "destructive",
      });
    }
  }, [uploadMutation, toast]);

  const handleSearch = useCallback((query: string) => {
    setHighlightedPage(null);
    setSearchTerm(query);

    if (!selectedDocument || !query.trim()) {
      setSearchResults([]);
      return;
    }
    
    searchMutation.mutate({
      documentId: selectedDocument.id,
      query: query.trim(),
      options: searchOptions,
    });
  }, [selectedDocument, searchOptions, searchMutation, setHighlightedPage]);

  const handleNextResult = useCallback(() => {
    if (searchResults.length > 0) {
      setCurrentResultIndex((prev) => (prev + 1) % searchResults.length);
    }
  }, [searchResults.length]);

  const handlePrevResult = useCallback(() => {
    if (searchResults.length > 0) {
      setCurrentResultIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  }, [searchResults.length]);

  const handleJumpToResult = useCallback((index: number) => {
    setCurrentResultIndex(index);
    if (searchResults[index]) {
      setCurrentPage(searchResults[index].pageNumber);
    }
  }, [searchResults]);

  const handleClearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchTerm("");
    setHighlightedPage(null);
  }, []);

  const handleChunkSelect = useCallback((page: number, keywordToHighlight?: string) => {
    // Clear any previous full-text search results
    setSearchResults([]);
    
    // This is the key change: set the search term for highlighting.
    // If a keyword is provided, use it. Otherwise, clear the term.
    setSearchTerm(keywordToHighlight || "");
    
    // Navigate to the correct page
    setCurrentPage(page);
    
    // Visually highlight the entire page container
    setHighlightedPage(page);
  }, []); // Dependencies are removed because we are using setter functions which are stable.

  // Effect for handling deep links from the URL, now reactive to SPA navigation
  useEffect(() => {
    // Guard against running before documents are loaded or URL params are available
    if (documents.length === 0 || !params?.docId) {
      return;
    }

    const docId = parseInt(params.docId, 10);
    const pageNum = parseInt(params.pageNum, 10);
    const docToSelect = documents.find((d) => d.id === docId);

    // If the document from the URL doesn't exist, do nothing
    if (!docToSelect || !(pageNum > 0 && pageNum <= docToSelect.totalPages)) {
      return;
    }

    // Check if the URL state is different from the current component state.
    // This is the key change: it allows updates even when a document is already selected.
    const needsUpdate =
      selectedDocument?.id !== docId || currentPage !== pageNum;

    if (needsUpdate) {
      console.log(`[Deep Link] Navigating to Doc ${docId}, Page ${pageNum}`);
      setSelectedDocument(docToSelect);
      
      // Check for a search query in the URL (optional but good to keep)
      const searchParams = new URLSearchParams(window.location.search);
      const queryFromUrl = searchParams.get("q");

      if (queryFromUrl) {
        // If there's a search query, run the search
        setHighlightedPage(null);
        setSearchTerm(queryFromUrl);
        searchMutation.mutate({
          documentId: docToSelect.id,
          query: queryFromUrl.trim(),
          options: searchOptions,
        });
        // Also jump to the correct page while search happens
        setCurrentPage(pageNum);
      } else {
        // If no search query, just select and highlight the page chunk
        handleChunkSelect(pageNum);
      }
    }
  }, [documents, params, selectedDocument, currentPage, handleChunkSelect]); 

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/whale.svg" alt="Whale logo" className="w-10 h-10" />
              <h1 className="text-xl font-semibold text-gray-900">Zygy Demo</h1>
            </div>
            
            {/* Mobile search toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileSearch(true)}
                className="lg:hidden"
              >
                <Search size={20} />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Top Row - PDF Viewer and Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
          
          {/* PDF Viewer */}
          <div className="lg:col-span-3 h-full">
            <Card className="h-full flex flex-col bg-zinc-700">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white">PDF Document</CardTitle>
                  <div className="flex items-center space-x-2">
                    {selectedDocument && (
                      <>
                        <span className="text-sm text-gray-50 text-white pr-4">
                          Page {currentPage} of {selectedDocument.totalPages}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage <= 1}
                          >
                            <ChevronLeft size={16} />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setCurrentPage(prev => Math.min(selectedDocument.totalPages, prev + 1))}
                            disabled={currentPage >= selectedDocument.totalPages}
                          >
                            <ChevronRight size={16} />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <PDFViewer
                  document={selectedDocument}
                  searchResults={searchResults}
                  currentResultIndex={currentResultIndex}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onFileUpload={handleFileUpload}
                  fileInputRef={fileInputRef}
                  isUploading={uploadMutation.isPending}
                  searchQuery={searchTerm}
                  highlightedPage={highlightedPage}
                />
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          {!isMobile && (
            <div className="lg:col-span-2 h-full shadow-2xl">
              <ChatInterface
                selectedDocument={selectedDocument}
                onSourceClick={handleChunkSelect}
                highlightedPage={highlightedPage}
                onClearHighlight={handleClearSearch}
              />
            </div>
          )}
        </div>

        {/* Bottom Row - Search Interface (Full Width) */}
        {!isMobile && (
          <div className="h-80">
            <SearchInterface
              searchQuery={searchTerm}
              searchResults={searchResults}
              currentResultIndex={currentResultIndex}
              searchOptions={searchOptions}
              selectedDocument={selectedDocument}
              documents={documents}
              onSearch={handleSearch}
              onSearchOptionsChange={setSearchOptions}
              onNextResult={handleNextResult}
              onPrevResult={handlePrevResult}
              onJumpToResult={handleJumpToResult}
              onClearSearch={handleClearSearch}
              onChunkSelect={handleChunkSelect}
              highlightedPage={highlightedPage}
              onSelectDocument={setSelectedDocument}
              onDeleteDocument={(id) => deleteMutation.mutate(id)}
              isSearching={searchMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          </div>
        )}
      </main>

      {/* Mobile Search Overlay */}
      {isMobile && (
        <MobileSearchOverlay
          isOpen={showMobileSearch}
          onClose={() => setShowMobileSearch(false)}
          searchQuery={searchTerm}
          searchResults={searchResults}
          currentResultIndex={currentResultIndex}
          searchOptions={searchOptions}
          selectedDocument={selectedDocument}
          documents={documents}
          onSearch={handleSearch}
          onSearchOptionsChange={setSearchOptions}
          onNextResult={handleNextResult}
          onPrevResult={handlePrevResult}
          onJumpToResult={handleJumpToResult}
          onClearSearch={handleClearSearch}
          onChunkSelect={handleChunkSelect}
          highlightedPage={highlightedPage}
          onSelectDocument={setSelectedDocument}
          onDeleteDocument={(id) => deleteMutation.mutate(id)}
          isSearching={searchMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}