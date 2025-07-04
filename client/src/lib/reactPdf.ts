import { pdfjs } from "react-pdf";

/*
 * pdf.worker.min.mjs has to be shipped separately.  
 * The URL constructor below lets Vite rewrite the import
 * and place the worker next to your bundle.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/* You can tweak defaults here if you like */
export { Document, Page, pdfjs } from "react-pdf";