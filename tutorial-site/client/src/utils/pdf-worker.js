// pdf.js does its parsing in a Web Worker, which is a separate JavaScript
// realm -- the polyfills applied on the main thread do not exist in there.
// This wrapper is bundled as the worker in place of pdfjs-dist's own file,
// so both sides get the same built-ins.
import "./polyfills.js";
import "pdfjs-dist/build/pdf.worker.min.mjs";
