import { useState, useEffect } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useLocation
} from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Quiz from "./pages/Quiz";
import Tutor from "./pages/Tutor";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Admin from "./pages/Admin";
import Timetable from "./pages/Timetable";
import Sidebar from "./components/Sidebar";

function AppContent() {
  const location = useLocation();
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ uid: "local-user" });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const isAuthPage = location.pathname === "/auth" || location.pathname === "/";

  if (!isAuthPage && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (location.pathname === "/auth" && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {!isAuthPage && <Sidebar />}
      <main className="flex-1 overflow-y-auto relative text-slate-900">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/tutor" element={<Tutor />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
