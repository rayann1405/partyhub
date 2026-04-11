import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { SiteLogo } from "../brand/SiteLogo";
import { LogOut, LayoutDashboard, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 group">
            <SiteLogo variant="navbar" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className="btn-ghost text-sm">Événements</Link>
            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link to="/dashboard" className="btn-ghost text-sm flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                )}
                <Link to="/profile" className="btn-ghost text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4" /> {user.name}
                </Link>
                <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-1.5 text-red-400 hover:text-red-300">
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </>
            ) : (
              <Link to="/auth" className="btn-primary text-sm">Connexion</Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-white/70 hover:text-white">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <Link to="/" onClick={() => setOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-white/5">Événements</Link>
              {user ? (
                <>
                  {user.role === "ADMIN" && (
                    <Link to="/dashboard" onClick={() => setOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-white/5">Dashboard</Link>
                  )}
                  <Link to="/profile" onClick={() => setOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-white/5">{user.name}</Link>
                  <button onClick={handleLogout} className="w-full text-left py-2 px-4 rounded-lg hover:bg-white/5 text-red-400">Déconnexion</button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="block py-2 px-4 rounded-lg bg-brand-600 text-center font-semibold">Connexion</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
