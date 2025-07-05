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
  // Get all PDF documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllPdfDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get a specific PDF document's metadata
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

  // Get a specific PDF document's file content
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

  // Upload a PDF document
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

  // Get a specific page's text content
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

      // Read the stored PDF file into a buffer
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

      // Read the stored PDF file into a buffer
      const filePath = path.resolve(process.cwd(), "uploads", document.filename);
      const pdfBuffer = await fs.promises.readFile(filePath);

      // Perform the page-aware search
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

/**
 * Performs a page-aware search on a PDF buffer.
 */
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
        index,
        context,
        pageNumber: i, // <-- The correct page number
        matchStart: index - contextStart,
        matchEnd: index - contextStart + searchQuery.length,
      });

      startIndex = index + searchQuery.length;
    }
  }

  return results;
}