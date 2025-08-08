import { useState, useRef, useCallback, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Trash2,
  LogOut,
  Search,
  AlertCircle,
  User,
  Bell,
  Mail,
  Atom
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { PDFViewer } from "@/components/pdf-viewer";
import { SearchInterface } from "@/components/search-interface";
import { ChatInterface } from "@/components/chat-interface";
import { MobileSearchOverlay } from "@/components/mobile-search-overlay";
import { useAuth0 } from "@auth0/auth0-react";

interface PdfDocument {
  id: number;
  filename: string;
  originalName: string;
  fileSize: number;
  totalPages: number;
  textContent?: string;
  uploadedAt: string;
  docType?: 'pdf' | 'excel';
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
  const [documentLoadError, setDocumentLoadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { logout } = useAuth0();
  const [, navigate] = useLocation();
  
  // Match the route for deep linking
  const [, params] = useRoute("/documents/:docId/page/:pageNum");

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<PdfDocument[]>({
    queryKey: ["/api/documents"],
  });

  // Fetch specific document when URL contains docId
  const { data: urlDocument, isLoading: urlDocumentLoading, error: urlDocumentError } = useQuery<PdfDocument>({
    queryKey: [`/api/documents/${params?.docId}`],
    enabled: !!params?.docId && !documentsLoading,
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
      // Navigate to the new document
      navigate(`/documents/${document.id}/page/1`);
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
      // Navigate back to home
      navigate("/");
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
    // 1. Define all allowed MIME types in an array for easy checking.
      const allowedTypes = [
        "application/pdf",
        "application/vnd.ms-excel", // for .xls files
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // for .xlsx files
      ];

      // 2. Check if the uploaded file's type is included in our list.
      if (file && allowedTypes.includes(file.type)) {
        uploadMutation.mutate(file);
      } else {
        // 3. Update the toast message to be more helpful.
        toast({
          title: "Invalid File Type",
          description: "Please select a valid PDF or Excel file.",
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

  const handleChunkSelect = useCallback((page: number, keywordToHighlight?: string, shouldHighlight: boolean = true) => {
    setSearchResults([]);
    setSearchTerm(keywordToHighlight || "");
    setCurrentPage(page);
    
    if (shouldHighlight) {
      setHighlightedPage(page);
    }
    
    // Update URL to reflect the current page
    if (selectedDocument) {
      navigate(`/documents/${selectedDocument.id}/page/${page}`);
    }
  }, [selectedDocument, navigate]);

  const handleSelectDocument = useCallback((document: PdfDocument) => {
    setSelectedDocument(document);
    // Navigate to the document's first page
    navigate(`/documents/${document.id}/page/1`);
  }, [navigate]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Update URL to reflect the current page
    if (selectedDocument) {
      navigate(`/documents/${selectedDocument.id}/page/${page}`);
    }
  }, [selectedDocument, navigate]);

  // Effect for handling deep links from the URL
  useEffect(() => {
    if (!params?.docId) {
      return;
    }

    const docId = parseInt(params.docId, 10);
    const pageNum = parseInt(params.pageNum, 10);

    // First, try to find the document from the URL query
    if (urlDocument) {
      const needsUpdate = selectedDocument?.id !== docId || currentPage !== pageNum;
      
      if (needsUpdate) {
        console.log(`[Deep Link] Loading document ${docId}, page ${pageNum}`);
        setSelectedDocument(urlDocument);
        setCurrentPage(pageNum);
        setDocumentLoadError(null);
        
        // Check for search query in URL
        const searchParams = new URLSearchParams(window.location.search);
        const queryFromUrl = searchParams.get("q");
        
        if (queryFromUrl) {
          setHighlightedPage(null);
          setSearchTerm(queryFromUrl);
          searchMutation.mutate({
            documentId: urlDocument.id,
            query: queryFromUrl.trim(),
            options: searchOptions,
          });
        } else {
          handleChunkSelect(pageNum, undefined, false);
        }
      }
    } else if (urlDocumentError) {
      setDocumentLoadError(`Document ${docId} not found or could not be loaded.`);
      setSelectedDocument(null);
    }
  }, [params, urlDocument, urlDocumentError, selectedDocument, currentPage, handleChunkSelect, searchMutation, searchOptions]);

  // Handle document loading error
  if (documentLoadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Not Found</h1>
                <p className="mt-2 text-sm text-gray-600">{documentLoadError}</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full mt-4"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-800/10 via-cyan-700/10 to-cyan-900/10 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-br from-cyan-950 via-cyan-900 to-cyan-800 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <img src="zygy-logo-dark.png" alt="Logo" width="250" height="80"></img>
                  {/* <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Atom className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full animate-pulse"></div> */}
                </div>
                <span className="text-xl font-bold text-white">Zygy</span>
              </div>
              <nav className="ml-8">
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-slate-900"
                  onClick={() => window.location.href = "/"}
                  >
                    Home
                  </Button>
                </div>
              </nav>
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-slate-900">
                <Mail className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-slate-900">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-slate-900">
                <User className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
                aria-label="Log out"
                className="group relative h-11 px-4 border-slate-200 hover:border-red-200 bg-white/70 backdrop-blur-sm hover:bg-red-50 text-slate-700 hover:text-red-700 font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] shadow-lg shadow-slate-200/50 hover:shadow-red-200/50"
              >
                <span className="mr-2">Sign Out</span>
                <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Top Row - PDF Viewer and Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
          
          {/* PDF Viewer */}
          <div className="lg:col-span-3 h-full">
            <Card className="h-full flex flex-col border-0 shadow-xl shadow-slate-200/50 bg-black/70 backdrop-blur-sm">
              <CardHeader className="pb-6 bg-gradient-to-r from-gray-700/80 to-gray-600/70 backdrop-blur-sm border-b border-slate-200/50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-white">
                      PDF Document
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {selectedDocument && (
                      <>
                        <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg shadow-black/10">
                          <span className="text-sm font-medium text-slate-100">
                            Page {currentPage} of {selectedDocument.totalPages}
                          </span>
                        </div>
                        
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg border border-slate-600/30 shadow-lg shadow-black/10 p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                            className="h-8 w-8 hover:bg-slate-200/50 text-slate-300 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-300"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <div className="w-px h-5 bg-slate-600/50 mx-1"></div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePageChange(Math.min(selectedDocument.totalPages, currentPage + 1))}
                            disabled={currentPage >= selectedDocument.totalPages}
                            className="h-8 w-8 hover:bg-slate-200/50 text-slate-300 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-300"
                          >
                            <ChevronRight className="w-4 h-4" />
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
                  onPageChange={handlePageChange}
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
        {/* !isMobile && (
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
              onSelectDocument={handleSelectDocument}
              onDeleteDocument={(id) => deleteMutation.mutate(id)}
              isSearching={searchMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          </div>
        ) */}
      </main>

      {/* Mobile Search Overlay */}
      {/* {isMobile && (
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
          onSelectDocument={handleSelectDocument}
          onDeleteDocument={(id) => deleteMutation.mutate(id)}
          isSearching={searchMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      )} */}
    </div>
  );
}