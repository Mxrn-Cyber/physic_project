/* global use, db */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use("tutorial-site");

// Create a new document in the collection.
db.getCollection("courses").insertOne({});
