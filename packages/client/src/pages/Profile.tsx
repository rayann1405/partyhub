import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Calendar, Vote, MessageCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import type { UserProfile, EventSummary } from "../types";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myEvents, setMyEvents] = useState<EventSummary[]>([]);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    api.get("/auth/me").then(({ data }) => setProfile(data));
    api.get("/events?limit=50").then(({ data }) => {
      setMyEvents(data.events);
    });
  }, [user, navigate]);

  const handleLogout = () => { logout(); navigate("/"); };

  if (!profile) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="glass rounded-2xl p-8 text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-3xl font-display font-bold mx-auto mb-4 glow">
              {profile.name.charAt(0)}
            </div>
            <h1 className="font-display font-bold text-2xl">{profile.name}</h1>
            <p className="text-white/40 text-sm">{profile.email}</p>
            {profile.role === "ADMIN" && (
              <span className="badge bg-brand-500/20 text-brand-300 mt-2">Admin</span>
            )}

            <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-white/5">
              {[
                { icon: Calendar, label: "Participations", value: profile._count.participations },
                { icon: Vote, label: "Votes", value: profile._count.votes },
                { icon: MessageCircle, label: "Commentaires", value: profile._count.comments },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center">
                  <div className="flex items-center justify-center gap-1 text-white/40 mb-1">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="font-display font-bold text-xl">{value}</p>
                  <p className="text-xs text-white/30">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="glass rounded-2xl p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Se déconnecter</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
