import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading)
    return (
      <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">{t.common.loading}</div>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
