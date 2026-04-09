import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { Plus, Calendar, Users, MessageCircle, Trash2, Edit, Eye } from "lucide-react";
import api from "../services/api";
import type { EventSummary } from "../types";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = () => {
    api.get("/events/admin?limit=50").then(({ data }) => {
      setEvents(data.events);
      setLoading(false);
    });
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Événement supprimé");
    } catch {
      toast.error("Erreur de suppression");
    }
  };

  const totalParticipants = events.reduce((s, e) => s + e._count.participations, 0);
  const totalComments = events.reduce((s, e) => s + e._count.comments, 0);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display font-extrabold text-3xl">Dashboard Admin</h1>
            <Link to="/events/new" className="btn-primary text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nouvel événement
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Calendar, label: "Événements", value: events.length, color: "text-brand-400" },
              { icon: Users, label: "Participants", value: totalParticipants, color: "text-cyan-400" },
              { icon: MessageCircle, label: "Commentaires", value: totalComments, color: "text-pink-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{value}</p>
                  <p className="text-sm text-white/40">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Events list */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-display font-semibold">Tous les événements</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-white/30">Chargement…</div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-4xl mb-2">🎈</p>
                <p className="text-white/40">Aucun événement créé</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {events.map((event) => (
                  <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{event.title}</h3>
                        <span className={`badge text-[10px] ${
                          event.status === "PUBLISHED" ? "bg-green-500/20 text-green-300" :
                          event.status === "DRAFT" ? "bg-yellow-500/20 text-yellow-300" :
                          "bg-white/10 text-white/50"
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/40">
                        {format(new Date(event.date), "d MMM yyyy · HH:mm", { locale: fr })} · {event._count.participations} participants
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link to={`/events/${event.id}`} className="p-2 text-white/30 hover:text-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(event.id, event.title)} className="p-2 text-white/30 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
