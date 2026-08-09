import * as mupdf from "mupdf";

const DEFAULT_WIDTH = 600;
const DEFAULT_QUALITY = 85;

// Renders page 1 of a PDF to a JPEG buffer, for use as an auto-generated
// book cover. Uses mupdf (WASM, no native compilation) rather than
// pdfjs-dist+canvas so this keeps working on Render without a native
// build step. mupdf's JS objects are garbage-collected -- there's no
// explicit destroy()/close() to call here.
export async function renderFirstPageAsJpeg(pdfBytes, { width = DEFAULT_WIDTH, quality = DEFAULT_QUALITY } = {}) {
  const doc = mupdf.Document.openDocument(Buffer.from(pdfBytes), "application/pdf");
  if (doc.countPages() < 1) {
    throw new Error("PDF has no pages to use as a cover");
  }

  const page = doc.loadPage(0);
  const [x0, y0, x1, y1] = page.getBounds();
  const pageWidth = x1 - x0;
  const pageHeight = y1 - y0;
  if (!(pageWidth > 0) || !(pageHeight > 0)) {
    throw new Error("Could not read the PDF's first page dimensions");
  }

  const scale = width / pageWidth;
  const matrix = mupdf.Matrix.scale(scale, scale);
  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
  const jpegBytes = pixmap.asJPEG(quality, false);
  return Buffer.from(jpegBytes);
}
