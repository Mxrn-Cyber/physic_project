import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  FileDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Video,
  BookMarked,
  Gift,
} from "lucide-react";
import { api } from "../api/client.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import VideoCard from "../components/VideoCard.jsx";
import BookCard from "../components/BookCard.jsx";

const SLIDES = [
  {
    src: "https://images.playgroundai.com/bee3455d-36bc-4fcc-99a7-6d0b938d7272.jpeg?c=1",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkLoI4VpNpzULZRyYMjVlCzAdO5dHxfrhlTM5PU0D60Hp6ZwiGj5PuvObA&s=10",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrJE2jwMd2F8q3Nu12UAh4FyhWPngtU9yx8dEqAO6EtZLFf2sfs7E5Esw&s=10",
  },
];

const PREVIEW_COUNT = 6;

function CategorySection({ title, seeMoreTo, seeMoreLabel, items }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-16 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900 dark:text-gray-100">
          <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-red-600 to-rose-600" />
          {title}
        </h2>
        <Link
          to={seeMoreTo}
          className="rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          {seeMoreLabel} &rarr;
        </Link>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items}
      </div>
    </div>
  );
}

function Slideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const goTo = (i) => setIndex((i + SLIDES.length) % SLIDES.length);

  return (
    // Full-bleed: breaks out of the page's max-w-5xl/px-4 container so the
    // banner spans the whole viewport width edge-to-edge, and is tall
    // enough on larger screens to read as a full-screen hero rather than a
    // small boxed card.
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="relative overflow-hidden shadow-2xl shadow-red-900/10 dark:shadow-black/40">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((slide) => (
            <div
              key={slide.src}
              className="relative h-[46vh] min-h-[320px] w-full flex-shrink-0 sm:h-[60vh] sm:min-h-[420px] sm:max-h-[640px]"
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover"
              />
              {}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <p className="absolute bottom-8 left-6 right-16 text-left text-lg font-semibold text-white drop-shadow sm:left-12 sm:text-2xl">
                {slide.alt}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-2 text-white backdrop-blur-md transition hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 sm:left-6 sm:p-3"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-2 text-white backdrop-blur-md transition hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 sm:right-6 sm:p-3"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-8 right-6 flex gap-1.5 sm:right-12">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-8 bg-gradient-to-r from-red-500 to-orange-400"
                  : "w-2.5 bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsStrip({ videoCount, bookCount, freeCount }) {
  const stats = [
    { icon: Video, value: videoCount, label: "Videos" },
    { icon: BookMarked, value: bookCount, label: "Books" },
    { icon: Gift, value: freeCount, label: "Free to start" },
  ];

  return (
    <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 divide-x divide-gray-200 rounded-2xl border border-gray-200 bg-white/70 shadow-sm backdrop-blur dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex flex-col items-center gap-1 px-4 py-5">
          <Icon className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-2xl font-extrabold text-transparent">
            {value}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.getVideos(), api.getBooks()])
      .then(([{ videos }, { books }]) => {
        if (cancelled) return;
        setVideos(videos);
        setBooks(books);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const previewVideos = videos.slice(0, PREVIEW_COUNT);
  const previewBooks = books.slice(0, PREVIEW_COUNT);
  const freeCount = [...videos, ...books].filter((i) => i.isFree).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <div className="mb-12">
        <Slideshow />
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        <Sparkles className="h-3.5 w-3.5" /> Khmer &amp; English &middot; Buy
        only what you need
      </span>

      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
        {t.home.heroTitle1}{" "}
        <span className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 bg-clip-text text-transparent">
          {t.home.heroTitle2}
        </span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
        {t.home.heroSubtitle}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/videos"
          className="rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-red-500/30 transition hover:shadow-xl hover:shadow-red-500/40"
        >
          {t.home.browse}
        </Link>
        <Link
          to="/about"
          className="rounded-lg border border-gray-300 bg-white/60 px-5 py-2.5 font-semibold text-gray-700 backdrop-blur transition hover:bg-white dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t.home.aboutCta}
        </Link>
      </div>

      <StatsStrip
        videoCount={videos.length}
        bookCount={books.length}
        freeCount={freeCount}
      />

      <div className="mt-16 grid gap-6 text-left sm:grid-cols-3">
        {[
          {
            icon: Play,
            title: t.home.featureVideoTitle,
            body: t.home.featureVideoBody,
          },
          {
            icon: FileDown,
            title: t.home.featurePdfTitle,
            body: t.home.featurePdfBody,
          },
          {
            icon: CheckCircle2,
            title: t.home.featureProgressTitle,
            body: t.home.featureProgressBody,
          },
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="group rounded-2xl border border-gray-200 bg-white/60 p-5 backdrop-blur transition hover:-translate-y-1 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/10 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:border-red-500/40"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white dark:bg-red-500/10 dark:text-red-400">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {body}
            </p>
          </div>
        ))}
      </div>

      {status === "loading" && (
        <p className="mt-16 text-sm text-gray-500 dark:text-gray-400">
          {t.common.loading}
        </p>
      )}
      {status === "error" && (
        <p className="mt-16 text-sm text-red-600">
          Couldn't load content right now. Please try again later.
        </p>
      )}

      <CategorySection
        title={t.videos.title}
        seeMoreTo="/videos"
        seeMoreLabel={t.common.seeMore}
        items={previewVideos.map((v) => (
          <VideoCard key={v._id} video={v} />
        ))}
      />

      <CategorySection
        title={t.books.title}
        seeMoreTo="/books"
        seeMoreLabel={t.common.seeMore}
        items={previewBooks.map((b) => (
          <BookCard key={b._id} book={b} />
        ))}
      />
    </div>
  );
}
