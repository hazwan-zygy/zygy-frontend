import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Download, 
  FileText,
  Trash2,
  Loader2
} from "lucide-react";

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

interface SearchOptions {
  matchCase: boolean;
  wholeWords: boolean;
}

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  searchResults: SearchResult[];
  currentResultIndex: number;
  searchOptions: SearchOptions;
  selectedDocument: PdfDocument | null;
  documents: PdfDocument[];
  onSearch: (query: string) => void;
  onSearchOptionsChange: (options: SearchOptions) => void;
  onNextResult: () => void;
  onPrevResult: () => void;
  onJumpToResult: (index: number) => void;
  onClearSearch: () => void;
  onSelectDocument: (document: PdfDocument) => void;
  onDeleteDocument: (id: number) => void;
  isSearching: boolean;
  highlightedPage: number | null;
  onChunkSelect: (page: number) => void;
  isDeleting: boolean;
}

export function MobileSearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  searchResults,
  currentResultIndex,
  searchOptions,
  selectedDocument,
  documents,
  onSearch,
  onSearchOptionsChange,
  onNextResult,
  onPrevResult,
  onJumpToResult,
  onClearSearch,
  onSelectDocument,
  onDeleteDocument,
  isSearching,
  highlightedPage,
  onChunkSelect,
  isDeleting,
}: MobileSearchOverlayProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search to prevent excessive API calls
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      onSearch(query);
    }, 1000); // 300ms delay
  }, [onSearch]);

  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Sync local query when the parent query changes (e.g., from a URL param)
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchOptionChange = useCallback((option: keyof SearchOptions, value: boolean) => {
    const newOptions = { ...searchOptions, [option]: value };
    onSearchOptionsChange(newOptions);
    if (localSearchQuery) {
      onSearch(localSearchQuery);
    }
  }, [searchOptions, onSearchOptionsChange, localSearchQuery, onSearch]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  const highlightSearchText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-200 px-1 rounded font-medium">
          {part}
        </span>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        absolute right-0 top-0 w-80 h-full bg-white shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Search Document</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 h-full overflow-y-auto pb-20">
          {/* Document Selection */}
          <div className="space-y-2">
            <Label htmlFor="document-select">Select Document</Label>
            <Select 
              value={selectedDocument?.id.toString() || ""} 
              onValueChange={(value) => {
                const doc = documents.find(d => d.id === parseInt(value));
                if (doc) onSelectDocument(doc);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a PDF document" />
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <FileText size={16} />
                      <span className="truncate">{doc.originalName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDocument && (
            <>
              {/* Document Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="text-blue-600" size={16} />
                    <span className="font-medium text-sm">{selectedDocument.originalName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteDocument(selectedDocument.id)}
                    disabled={isDeleting}
                    className="h-6 w-6 text-red-500 hover:text-red-700"
                  >
                    {isDeleting ? (
                      <Loader2 className="animate-spin" size={12} />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(selectedDocument.fileSize)}</span>
                  <span>{selectedDocument.totalPages} pages</span>
                </div>
              </div>

              <Separator />

              {/* Page Chunk Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Highlight Page</Label>
                  {highlightedPage && (
                    <Button
                      variant="link"
                      onClick={onClearSearch}
                      className="h-auto p-0 text-xs"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>
                {/* A scrollable container for the page buttons */}
                <div className="w-full overflow-x-auto rounded-md border bg-gray-50/50 p-1">
                  <div className="flex w-max space-x-2">
                    {Array.from({ length: selectedDocument.totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={highlightedPage === page ? "default" : "secondary"}
                          size="sm"
                          onClick={() => onChunkSelect(page)}
                          className="h-8 shrink-0 px-3"
                        >
                          Page {page}
                        </Button>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Search Input */}
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search text in PDF..."
                  value={localSearchQuery}
                  onChange={handleSearchInput}
                  className="pr-10"
                  disabled={isSearching}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {isSearching ? (
                    <Loader2 className="animate-spin text-gray-400" size={16} />
                  ) : (
                    <Search className="text-gray-400" size={16} />
                  )}
                </div>
              </div>

              {/* Search Options */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="match-case-mobile"
                    checked={searchOptions.matchCase}
                    onCheckedChange={(checked) => handleSearchOptionChange('matchCase', checked as boolean)}
                  />
                  <Label htmlFor="match-case-mobile" className="text-sm">Match case</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whole-words-mobile"
                    checked={searchOptions.wholeWords}
                    onCheckedChange={(checked) => handleSearchOptionChange('wholeWords', checked as boolean)}
                  />
                  <Label htmlFor="whole-words-mobile" className="text-sm">Whole words</Label>
                </div>
              </div>

              {/* Search Results Summary */}
              {searchResults.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {searchResults.length} results
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {currentResultIndex + 1} of {searchResults.length}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onPrevResult}
                        disabled={searchResults.length <= 1}
                        className="h-6 w-6"
                      >
                        <ChevronUp size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNextResult}
                        disabled={searchResults.length <= 1}
                        className="h-6 w-6"
                      >
                        <ChevronDown size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Results List */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <ScrollArea className="h-60">
                    <div className="space-y-2">
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            index === currentResultIndex 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            onJumpToResult(index);
                            onClose();
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              Page {result.pageNumber}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Result {index + 1}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {highlightSearchText(result.context, localSearchQuery)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* No Results State */}
              {localSearchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="mx-auto mb-2" size={32} />
                  <p className="text-sm">No results found for "{localSearchQuery}"</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    onClick={onClearSearch}
                    className="w-full justify-start text-sm"
                    disabled={!localSearchQuery}
                  >
                    <X className="mr-2" size={16} />
                    Clear search
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    disabled={searchResults.length === 0}
                  >
                    <Download className="mr-2" size={16} />
                    Export results
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
