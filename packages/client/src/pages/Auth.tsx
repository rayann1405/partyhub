import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, PartyPopper } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { login, register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Bienvenue !");
      } else {
        await register(email, password, name);
        toast.success("Compte créé !");
      }
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.error;
      if (msg === "EMAIL_TAKEN") toast.error("Cet email est déjà utilisé");
      else if (msg === "INVALID_CREDENTIALS") toast.error("Email ou mot de passe incorrect");
      else if (msg === "VALIDATION_ERROR") {
        const details = err.response?.data?.details;
        toast.error(details?.[0]?.message || "Données invalides");
      } else toast.error("Erreur, réessayez");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center mx-auto mb-4 glow">
            <PartyPopper className="w-8 h-8" />
          </div>
          <h1 className="font-display font-bold text-3xl mb-1">
            {mode === "login" ? "Content de te revoir" : "Rejoins la fête"}
          </h1>
          <p className="text-white/50 text-sm">
            {mode === "login" ? "Connecte-toi pour voter et participer" : "Crée ton compte en 30 secondes"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Nom complet</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input"
                required
                minLength={2}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@email.com"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                className="input pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Chargement…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-white/40 mt-6">
          {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-brand-400 hover:text-brand-300 font-semibold"
          >
            {mode === "login" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
