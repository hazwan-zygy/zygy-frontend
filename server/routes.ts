import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertPdfDocumentSchema, insertSearchResultSchema } from "@shared/schema";
import { z } from "zod";
import type { Request } from "express";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all PDF documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllPdfDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get a specific PDF document
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getPdfDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // Upload a PDF document
  app.post("/api/documents/upload", upload.single('pdf'), async (req: MulterRequest, res) => {
    try {
      console.log('Upload request received:', {
        hasFile: !!req.file,
        contentType: req.get('content-type'),
        fileDetails: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      });
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      
      // For now, we'll create a mock document entry
      // In a real implementation, you would use a PDF parsing library like pdf-parse
      const documentData = {
        filename: `${Date.now()}-${file.originalname}`,
        originalName: file.originalname,
        fileSize: file.size,
        totalPages: 1, // This would be determined by PDF parsing
        textContent: "Sample PDF content for demonstration", // This would be extracted from PDF
      };

      const validatedData = insertPdfDocumentSchema.parse(documentData);
      const document = await storage.createPdfDocument(validatedData);
      
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid document data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Search text in a PDF document
  app.post("/api/documents/:id/search", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { query, matchCase, wholeWords } = req.body;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const document = await storage.getPdfDocument(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Check if we have cached search results
      const cachedResults = await storage.getSearchResults(documentId, query);
      if (cachedResults) {
        return res.json(cachedResults.results);
      }

      // Perform search in document text content
      const searchResults = performTextSearch(document.textContent || "", query, { matchCase, wholeWords });
      
      // Cache the search results
      const searchResultData = {
        documentId,
        query,
        results: searchResults,
      };

      await storage.createSearchResult(searchResultData);
      
      res.json(searchResults);
    } catch (error) {
      res.status(500).json({ error: "Failed to search document" });
    }
  });

  // Delete a PDF document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePdfDocument(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function performTextSearch(text: string, query: string, options: { matchCase?: boolean; wholeWords?: boolean }) {
  const { matchCase = false, wholeWords = false } = options;
  
  let searchText = matchCase ? text : text.toLowerCase();
  let searchQuery = matchCase ? query : query.toLowerCase();
  
  const results = [];
  let startIndex = 0;
  
  while (startIndex < searchText.length) {
    let index = searchText.indexOf(searchQuery, startIndex);
    
    if (index === -1) break;
    
    // Check for whole word match if required
    if (wholeWords) {
      const beforeChar = index > 0 ? searchText[index - 1] : ' ';
      const afterChar = index + searchQuery.length < searchText.length ? searchText[index + searchQuery.length] : ' ';
      
      if (!/\W/.test(beforeChar) || !/\W/.test(afterChar)) {
        startIndex = index + 1;
        continue;
      }
    }
    
    // Extract context around the match
    const contextStart = Math.max(0, index - 50);
    const contextEnd = Math.min(text.length, index + searchQuery.length + 50);
    const context = text.substring(contextStart, contextEnd);
    
    results.push({
      index,
      context,
      pageNumber: 1, // This would be calculated based on PDF page breaks
      matchStart: index - contextStart,
      matchEnd: index - contextStart + searchQuery.length,
    });
    
    startIndex = index + 1;
  }
  
  return results;
}
