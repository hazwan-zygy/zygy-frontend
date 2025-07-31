import { pgTable, text, serial, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export const docTypeEnum = pgEnum('doc_type_enum', ['pdf', 'excel']);

export const pdfDocuments = pgTable("pdf_documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  totalPages: integer("total_pages").notNull(),
  textContent: text("text_content"),
  uploadedAt: text("uploaded_at").notNull(),
  docType: docTypeEnum('doc_type').notNull().default('pdf'),
});

export const searchResults = pgTable("search_results", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  query: text("query").notNull(),
  results: jsonb("results").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertPdfDocumentSchema = createInsertSchema(pdfDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const insertSearchResultSchema = createInsertSchema(searchResults).omit({
  id: true,
  createdAt: true,
});

export type InsertPdfDocument = z.infer<typeof insertPdfDocumentSchema>;
export type PdfDocument = typeof pdfDocuments.$inferSelect;
export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;
export type SearchResult = typeof searchResults.$inferSelect;
