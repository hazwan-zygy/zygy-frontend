// server/storage/json.ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { MemStorage } from "./memory";

const META_PATH = path.resolve(process.cwd(), "uploads", "metadata.json");

export class JsonStorage extends MemStorage {
  constructor() {
    super();
    this.load();                      // fire-and-forget
  }

  /* ---------- helpers ---------- */
  private async load() {
    try {
      const raw = await fs.readFile(META_PATH, "utf8");
      const data = JSON.parse(raw);
      // restore the two private maps
      // @ts-ignore – accessing private for brevity
      this.pdfDocuments  = new Map(data.pdfDocuments);
      // @ts-ignore
      this.currentPdfId  = data.currentPdfId;
    } catch { /* first run – nothing to load */ }
  }

  private async save() {
    // @ts-ignore
    const payload = {
      pdfDocuments: [...this.pdfDocuments],
      // @ts-ignore
      currentPdfId:  this.currentPdfId,
    };
    await fs.mkdir(path.dirname(META_PATH), { recursive: true });
    await fs.writeFile(META_PATH, JSON.stringify(payload));
  }

  /* ----------- overrides that mutate state ----------- */
  override async createPdfDocument(d) {
    const doc = await super.createPdfDocument(d);
    await this.save();
    return doc;
  }

  override async deletePdfDocument(id: number) {
    await super.deletePdfDocument(id);
    await this.save();
  }
}