import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Home, CreditCard, User } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          TutorHub
        </Link>

        <nav className="flex items-center gap-1">
          <Link to="/" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link to="/courses" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            <BookOpen className="h-4 w-4" /> Courses
          </Link>
          <Link to="/pricing" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            <CreditCard className="h-4 w-4" /> Pricing
          </Link>
          {user && (
            <Link to="/dashboard" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              <User className="h-4 w-4" /> Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-gray-500 sm:inline">{user.email}</span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
