// Express 4 does not forward a rejected promise from an async route handler
// to the error-handling middleware automatically. If an awaited call throws
// (a bad ObjectId, a DB hiccup, anything) inside a plain `async (req, res) =>
// {...}` handler that isn't wrapped, the rejection goes unhandled -- at best
// the request just hangs, at worst Node kills the whole process.
//
// Wrap every async route handler with this so errors always reach
// `next(err)` and the app's global error handler in index.js.
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
