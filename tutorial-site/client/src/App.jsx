import { Routes, Route, Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import NavBar from "./components/NavBar.jsx";
import BackgroundDecor from "./components/BackgroundDecor.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Videos from "./pages/Videos.jsx";
import Books from "./pages/Books.jsx";
import VideoDetail from "./pages/VideoDetail.jsx";
import BookDetail from "./pages/BookDetail.jsx";
import About from "./pages/About.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <div className="relative isolate min-h-screen bg-gray-50 font-sans dark:bg-gray-950">
      <BackgroundDecor />
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/videos/:id" element={<VideoDetail />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
      <footer className="mt-16 border-t border-gray-200 bg-white/50 backdrop-blur dark:border-gray-800 dark:bg-gray-950/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md shadow-red-500/30">
              <BookOpen size={16} />
            </span>
            <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              ReanPhysics
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            <Link to="/videos" className="hover:text-red-600 dark:hover:text-red-400">
              Videos
            </Link>
            <Link to="/books" className="hover:text-red-600 dark:hover:text-red-400">
              Books
            </Link>
            <Link to="/about" className="hover:text-red-600 dark:hover:text-red-400">
              About
            </Link>
          </div>
        </div>
        <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
          ReanPhysics — sample project, not production-hardened.
        </div>
      </footer>
    </div>
  );
}
