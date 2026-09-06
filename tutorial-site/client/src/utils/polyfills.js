// pdf.js 6 assumes a handful of JavaScript built-ins that browsers only
// shipped very recently. Without them a book renders as blank white pages
// with "getOrInsertComputed is not a function" in the console and nothing
// visible on the page to explain it -- verified against Chrome 141, where
// every page came out empty. Chrome 148 has them; the cut-off is around
// Chrome 142, which is newer than a great many phones in use.
//
// pdfjs-dist's own "legacy" build is not an escape hatch: it calls the same
// methods. This file is imported first in main.jsx, and again inside
// utils/pdf-worker.js because a Web Worker is a separate JavaScript realm
// and inherits none of this.
//
// Map/WeakMap.prototype.getOrInsert and getOrInsertComputed -- the TC39
// "upsert" proposal (ES2026). pdf.js uses them in 16 places on the main
// thread and 15 more inside the worker.
for (const Ctor of [Map, WeakMap]) {
  const proto = Ctor.prototype;

  if (typeof proto.getOrInsert !== "function") {
    Object.defineProperty(proto, "getOrInsert", {
      value(key, value) {
        if (!this.has(key)) this.set(key, value);
        return this.get(key);
      },
      writable: true,
      configurable: true,
    });
  }

  if (typeof proto.getOrInsertComputed !== "function") {
    Object.defineProperty(proto, "getOrInsertComputed", {
      value(key, callbackfn) {
        if (!this.has(key)) this.set(key, callbackfn(key));
        return this.get(key);
      },
      writable: true,
      configurable: true,
    });
  }
}

// Used in 27 places. Shipped in Chrome 119 -- still newer than plenty of the
// phones this site is meant to reach.
if (typeof Promise.withResolvers !== "function") {
  Object.defineProperty(Promise, "withResolvers", {
    value() {
      let resolve;
      let reject;
      const promise = new this((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    },
    writable: true,
    configurable: true,
  });
}

// Math.sumPrecise (also ES2026) showed up as a warning from inside the
// worker while rendering text -- caught by pdf.js, so nothing crashed, but a
// code path silently fell back. Summing left to right is not the
// exact-rounding algorithm the specification describes; it is accurate
// enough for the glyph metrics this is used for, and only ever runs on
// browsers that lack the real thing.
if (typeof Math.sumPrecise !== "function") {
  Object.defineProperty(Math, "sumPrecise", {
    value(items) {
      let sum = 0;
      for (const n of items) sum += Number(n);
      return sum;
    },
    writable: true,
    configurable: true,
  });
}
