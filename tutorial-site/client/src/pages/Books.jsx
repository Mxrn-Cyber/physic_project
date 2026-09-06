import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import BookCard from "../components/BookCard.jsx";
import Pagination from "../components/Pagination.jsx";
import CatalogFilters from "../components/CatalogFilters.jsx";
import Seo from "../components/Seo.jsx";
import { itemListSchema, breadcrumbSchema } from "../utils/schema.js";
import { matchesAccess, matchesGrade, matchesQuery } from "../utils/grades.js";

// Matches the grid below (3 columns at lg), so a full page is exactly 3 neat
// rows instead of ending mid-row.
const PAGE_SIZE = 9;

export default function Books() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState("loading");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("");
  const [access, setAccess] = useState("");

  useEffect(() => {
    api
      .getBooks()
      .then(({ books }) => {
        setBooks(books);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const filtered = useMemo(
    () =>
      books.filter(
        (item) => matchesQuery(item, query) && matchesGrade(item, grade) && matchesAccess(item, access)
      ),
    [books, query, grade, access]
  );

  useEffect(() => {
    setPage(1);
  }, [query, grade, access]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageBooks = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const goToPage = (next) => {
    setPage(Math.min(Math.max(next, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Seo
        title={t.seo.books.title}
        description={t.seo.books.description}
        jsonLd={[
          breadcrumbSchema(
            [
              { name: t.nav.home, path: "/" },
              { name: t.seo.books.title, path: "/books" },
            ],
            lang
          ),
          books.length
            ? itemListSchema({
                name: t.seo.bookListName,
                items: books,
                basePath: "/books",
                lang,
              })
            : null,
        ].filter(Boolean)}
      />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.books.title}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {user ? t.books.loggedInSubtitle : t.books.loggedOutSubtitle}
      </p>

      {status === "loading" && (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">{t.common.loading}</p>
      )}
      {status === "error" && (
        <p className="mt-6 text-sm text-red-600">
          Couldn't load books right now. Please try again later.
        </p>
      )}
      {status === "ready" && books.length === 0 && (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">No books yet.</p>
      )}
      {status === "ready" && books.length > 0 && (
        <>
          <CatalogFilters
            query={query}
            onQueryChange={setQuery}
            grade={grade}
            onGradeChange={setGrade}
            access={access}
            onAccessChange={setAccess}
            placeholder={t.filters.searchBooks}
          />

          {filtered.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {t.filters.noMatches}
            </p>
          ) : (
            <>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pageBooks.map((book) => (
                  <BookCard key={book._id} book={book} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={goToPage}
                previousLabel={t.common.previous}
                nextLabel={t.common.next}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
