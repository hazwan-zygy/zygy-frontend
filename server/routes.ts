// File: server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertPdfDocumentSchema } from "@shared/schema";
import { z } from "zod";
import type { Request } from "express";
import fs from "node:fs";
import path from "node:path";
import pdfParse from "pdf-parse";
// Import the pdfjs library for server-side processing
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

/** Represents a source chunk from the RAG embedding service. */
interface RagSource {
  doc_id: number;
  page_num: number;
  score: number;
  text: string;
  keyword?: string;
}

// --- RAG Integration Helpers ---
const EMBEDDING_SERVICE_URL = "http://139.162.30.108:5001";

async function indexDocumentInPythonService(documentId: number, pdfBuffer: Buffer) {
  try {
    const pdfData = new Uint8Array(pdfBuffer);
    const pdf = await pdfjs.getDocument(pdfData).promise;
    const pagesPayload = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      
      if (pageText.trim().length > 20) { // Only index pages with meaningful content
        pagesPayload.push({ doc_id: documentId, page_num: i, text: pageText });
      }
    }
    
    if (pagesPayload.length > 0) {
      console.log(`[RAG] Indexing ${pagesPayload.length} pages for doc ${documentId}`);
      const res = await fetch(`${EMBEDDING_SERVICE_URL}/index_pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: pagesPayload }),
      });
      if (!res.ok) throw new Error(`Embedding service responded with ${res.status}`);
    }
  } catch (error) {
    console.error(`[RAG] Failed to index document ${documentId}:`, error);
  }
}

async function deleteDocumentFromPythonService(documentId: number) {
  try {
    console.log(`[RAG] Deleting document ${documentId} from embedding service`);
    await fetch(`${EMBEDDING_SERVICE_URL}/delete_document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_id: documentId }),
    });
  } catch (error) {
    console.error(`[RAG] Failed to delete document ${documentId} from service:`, error);
  }
}

// (Existing multer setup...)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});


export async function registerRoutes(app: Express): Promise<Server> {
  // (Keep all GET routes as they are)
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllPdfDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });
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
  app.get("/api/documents/:id/file", async (req, res) => {
    const id = +req.params.id;
    const doc = await storage.getPdfDocument(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    const filePath = path.resolve(process.cwd(), "uploads", doc.filename);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: "File missing on disk" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${doc.originalName}"`,
    );
    fs.createReadStream(filePath).pipe(res);
  });
  app.get("/api/documents/:id/page/:pageNumber", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const pageNumber = parseInt(req.params.pageNumber);
      const document = await storage.getPdfDocument(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (pageNumber < 1 || pageNumber > document.totalPages) {
        return res.status(400).json({ error: "Invalid page number" });
      }
      const filePath = path.resolve(process.cwd(), "uploads", document.filename);
      const pdfBuffer = await fs.promises.readFile(filePath);
      const pdfData = new Uint8Array(pdfBuffer);
      const pdf = await pdfjs.getDocument(pdfData).promise;
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      res.json({ id: documentId, page: pageNumber, text: pageText });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve page content" });
    }
  });

  // MODIFIED Upload a PDF document
  app.post(
    "/api/documents/upload",
    upload.single("pdf"),
    async (req: MulterRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        const file = req.file;
        const uploadsDir = path.resolve(process.cwd(), "uploads");
        await fs.promises.mkdir(uploadsDir, { recursive: true });
        const storedFilename = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(uploadsDir, storedFilename);
        await fs.promises.writeFile(filePath, file.buffer);
        
        const parsed = await pdfParse(file.buffer);
        const documentData = {
          filename: storedFilename,
          originalName: file.originalname,
          fileSize: file.size,
          totalPages: parsed.numpages,
          textContent: parsed.text,
        };
        const validatedData = insertPdfDocumentSchema.parse(documentData);
        const document = await storage.createPdfDocument(validatedData);

        // Asynchronously index the document in the Python service.
        // We don't await this, so the UI responds faster.
        indexDocumentInPythonService(document.id, file.buffer);

        res.json(document);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ error: "Invalid document data", details: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to upload document" });
      }
    },
  );

  // (Keep existing search route)
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
      const filePath = path.resolve(process.cwd(), "uploads", document.filename);
      const pdfBuffer = await fs.promises.readFile(filePath);
      const searchResults = await performTextSearchOnPdfBuffer(pdfBuffer, query, {
        matchCase,
        wholeWords,
      });
      res.json(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      res.status(500).json({ error: "Failed to search document" });
    }
  });

  // --- NEW RAG CHAT ENDPOINT ---
  app.post("/api/documents/:id/chat", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { query } = req.body;
      if (!query) return res.status(400).json({ error: "Query is required" });
      
      console.log(`[RAG] Received chat query for doc ${documentId}: "${query}"`);

      const searchRes = await fetch(`${EMBEDDING_SERVICE_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Request up to 3 sources from the embedding service
        body: JSON.stringify({ query, doc_id: documentId, top_k: 3 }), 
      });

      if (!searchRes.ok) throw new Error(`Embedding service responded with ${searchRes.status}`);
      
      const searchData = await searchRes.json();
      const sources: RagSource[] = searchData.results || [];

      if (sources.length === 0) {
        return res.json({ 
          response: "I couldn't find any relevant information in the document for that question. Please try rephrasing.",
          sources: [] 
        });
      }

      // --- Generate a more sophisticated response ---
      const pageNumbers = sources.map((s) => s.page_num).sort((a, b) => a - b);
      const uniquePageNumbers = Array.from(new Set(pageNumbers));
      
      // Combine context from sources for a better summary
      const combinedContext = sources.map((s) => s.text).join("\n\n---\n\n");

      // This is a placeholder for a real LLM call. In a real system, you would send
      // the `query` and `combinedContext` to an LLM (like GPT) to get a natural language answer.
      // For now, we'll create a structured response based on the retrieved context.
      // const botResponse = `Based on information from page(s) ${uniquePageNumbers.join(', ')}, here's what I found:\n\n- "${sources[0].text.substring(0, 150)}..."`;

      const context = sources.map((s) => s.text).join("\n\n---\n\n");

      console.log("[RAG] Sending context to LLM for answer generation.");
      const answerRes = await fetch(`${EMBEDDING_SERVICE_URL}/generate_answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      });

      if (!answerRes.ok) throw new Error(`LLM generation service responded with ${answerRes.status}`);
      
      const answerData = await answerRes.json();
      const botResponse = answerData.answer;

      return res.json({
        response: botResponse,
        sources: sources.map((s) => ({
          doc_id: s.doc_id,
          page_num: s.page_num,
          score: s.score,
          keyword: s.keyword,
        })),
      });

    } catch (error) {
      console.error("[RAG] Chat endpoint failed:", error);
      res.status(500).json({ 
        error: "Failed to get a response. The RAG service may be down.",
        response: "I'm having trouble connecting to my knowledge base. Please ensure the embedding service is running and try again.",
        sources: []
      });
    }
  });

  app.post("/api/documents/:id/chat-stream", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { query } = req.body;
      if (!query) return res.status(400).json({ error: "Query is required" });

      // Step 1: Get sources (same as before)
      const searchRes = await fetch(`${EMBEDDING_SERVICE_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, doc_id: documentId, top_k: 3 }),
      });
      if (!searchRes.ok) throw new Error(`Embedding service responded with ${searchRes.status}`);
      const searchData = await searchRes.json();
      const sources: RagSource[] = searchData.results || [];
      const context = sources.map((s) => s.text).join("\n\n---\n\n");

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Flush the headers to establish the connection

      // Step 2: Immediately send the sources to the client as the first event
      const sourcePayload = sources.map((s) => ({
        doc_id: s.doc_id,
        page_num: s.page_num,
        score: s.score,
        keyword: s.keyword,
      }));
      res.write(`data: ${JSON.stringify({ sources: sourcePayload })}\n\n`);

      // If no sources, we can still ask the LLM, it will likely say it can't answer.
      // Now, start the stream from the Python service.
      
      // Step 3: Call the new Python streaming endpoint and pipe the response
      const streamRes = await fetch(`${EMBEDDING_SERVICE_URL}/stream_answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      });

      if (!streamRes.body) {
        throw new Error("The response from the streaming service has no body.");
      }

      // Pipe the stream from Python directly to the client
      const reader = streamRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // `value` is a Uint8Array
        res.write(value);
      }
      
      res.end(); // End the response when the stream is finished

    } catch (error) {
      console.error("[RAG Stream] Chat endpoint failed:", error);
      // If an error occurs, try to send a final error event before closing
      res.write(`data: ${JSON.stringify({ error: "An internal error occurred." })}\n\n`);
      res.end();
    }
  });

  // MODIFIED Delete a PDF document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await deleteDocumentFromPythonService(id); // RAG Integration
      await storage.deletePdfDocument(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// (Existing search function, with a small fix for result indexing)
async function performTextSearchOnPdfBuffer(
  pdfBuffer: Buffer,
  query: string,
  options: { matchCase?: boolean; wholeWords?: boolean },
) {
  const { matchCase = false, wholeWords = false } = options;
  const results: any[] = [];
  const searchQuery = matchCase ? query : query.toLowerCase();

  const pdfData = new Uint8Array(pdfBuffer);
  const pdf = await pdfjs.getDocument(pdfData).promise;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    const searchText = matchCase ? pageText : pageText.toLowerCase();

    let startIndex = 0;
    while (startIndex < searchText.length) {
      let index = searchText.indexOf(searchQuery, startIndex);
      if (index === -1) break;

      if (wholeWords) {
        const beforeChar = index > 0 ? searchText[index - 1] : " ";
        const afterChar =
          index + searchQuery.length < searchText.length
            ? searchText[index + searchQuery.length]
            : " ";
        if (!/\W/.test(beforeChar) || !/\W/.test(afterChar)) {
          startIndex = index + 1;
          continue;
        }
      }

      const contextStart = Math.max(0, index - 30);
      const contextEnd = Math.min(
        pageText.length,
        index + searchQuery.length + 30,
      );
      const context = pageText.substring(contextStart, contextEnd);

      results.push({
        context,
        pageNumber: i,
        matchStart: index - contextStart,
        matchEnd: index - contextStart + searchQuery.length,
      });

      startIndex = index + searchQuery.length;
    }
  }

  // Assign a unique index to each result for the frontend key
  return results.map((r, idx) => ({ ...r, index: idx }));
}