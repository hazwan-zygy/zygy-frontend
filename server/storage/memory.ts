import { pdfDocuments, searchResults, type PdfDocument, type InsertPdfDocument, type SearchResult, type InsertSearchResult } from "@shared/schema";

export interface IStorage {
  // PDF Documents
  createPdfDocument(document: InsertPdfDocument): Promise<PdfDocument>;
  getPdfDocument(id: number): Promise<PdfDocument | undefined>;
  getAllPdfDocuments(): Promise<PdfDocument[]>;
  deletePdfDocument(id: number): Promise<void>;
  
  // Search Results
  createSearchResult(searchResult: InsertSearchResult): Promise<SearchResult>;
  getSearchResults(documentId: number, query: string): Promise<SearchResult | undefined>;
}

export class MemStorage implements IStorage {
  private pdfDocuments: Map<number, PdfDocument>;
  private searchResults: Map<string, SearchResult>;
  private currentPdfId: number;
  private currentSearchId: number;

  constructor() {
    this.pdfDocuments = new Map();
    this.searchResults = new Map();
    this.currentPdfId = 1;
    this.currentSearchId = 1;
  }

  async createPdfDocument(insertDocument: InsertPdfDocument): Promise<PdfDocument> {
    const id = this.currentPdfId++;
    const document: PdfDocument = {
      id,
      filename: insertDocument.filename,
      originalName: insertDocument.originalName,
      fileSize: insertDocument.fileSize,
      totalPages: insertDocument.totalPages,
      textContent: insertDocument.textContent || null,
      uploadedAt: new Date().toISOString(),
      docType: insertDocument.docType || 'pdf', 
    };
    this.pdfDocuments.set(id, document);
    return document;
  }

  async getPdfDocument(id: number): Promise<PdfDocument | undefined> {
    return this.pdfDocuments.get(id);
  }

  async getAllPdfDocuments(): Promise<PdfDocument[]> {
    return Array.from(this.pdfDocuments.values());
  }

  async deletePdfDocument(id: number): Promise<void> {
    this.pdfDocuments.delete(id);
  }

  async createSearchResult(insertSearchResult: InsertSearchResult): Promise<SearchResult> {
    const id = this.currentSearchId++;
    const searchResult: SearchResult = {
      ...insertSearchResult,
      id,
      createdAt: new Date().toISOString(),
    };
    const key = `${insertSearchResult.documentId}-${insertSearchResult.query}`;
    this.searchResults.set(key, searchResult);
    return searchResult;
  }

  async getSearchResults(documentId: number, query: string): Promise<SearchResult | undefined> {
    const key = `${documentId}-${query}`;
    return this.searchResults.get(key);
  }
}

export const storage = new MemStorage();
