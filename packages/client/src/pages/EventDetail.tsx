import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Calendar, MapPin, Users, ArrowLeft, UserPlus, UserMinus, Share2,
} from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useEventRoom } from "../hooks/useSocket";
import { VotePanel } from "../components/votes/VotePanel";
import { CommentSection } from "../components/comments/CommentSection";
import type { EventDetail as EventDetailType } from "../types";
import toast from "react-hot-toast";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const { user } = useAuthStore();
  const socket = useEventRoom(id);

  const isParticipating = event?.participations.some((p) => p.userId === user?.id) || false;

  useEffect(() => {
    if (!id) return;
    api.get(`/events/${id}`).then(({ data }) => {
      setEvent(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const toggleParticipation = async () => {
    if (!user || !event) return;
    setJoining(true);
    try {
      if (isParticipating) {
        await api.delete(`/events/${event.id}/leave`);
        setEvent((prev) =>
          prev ? { ...prev, participations: prev.participations.filter((p) => p.userId !== user.id) } : prev
        );
        toast.success("Inscription annulée");
      } else {
        await api.post(`/events/${event.id}/join`);
        setEvent((prev) =>
          prev ? { ...prev, participations: [...prev.participations, { userId: user.id }] } : prev
        );
        toast.success("Inscrit ! 🎉");
      }
    } catch (err: any) {
      const msg = err.response?.data?.error;
      if (msg === "EVENT_FULL") toast.error("Événement complet !");
      else toast.error("Erreur, réessayez");
    } finally {
      setJoining(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié !");
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-4">
        <p className="text-5xl">😢</p>
        <p className="text-white/50">Événement introuvable</p>
        <Link to="/" className="btn-ghost text-sm">Retour</Link>
      </div>
    );
  }

  const themeGradients: Record<string, string> = {
    "Néon / Fluo": "from-green-400/20 to-cyan-400/20",
    "Mascarade": "from-amber-400/20 to-rose-500/20",
    "Tropical / Beach": "from-orange-400/20 to-yellow-300/20",
  };
  const gradient = themeGradients[event.theme || ""] || "from-brand-600/20 to-pink-600/20";

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Header */}
      <div className={`bg-gradient-to-b ${gradient} to-transparent`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Tous les événements
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                {event.theme && (
                  <span className="badge bg-white/10 text-white/70 mb-3">{event.theme}</span>
                )}
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-3">{event.title}</h1>

                <div className="flex flex-wrap gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-400" />
                    {format(new Date(event.date), "EEEE d MMMM yyyy · HH:mm", { locale: fr })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-pink-400" />
                    {event.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    {event.participations.length}
                    {event.maxCapacity ? `/${event.maxCapacity}` : ""} participant{event.participations.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleShare} className="btn-ghost px-3 py-2 text-sm">
                  <Share2 className="w-4 h-4" />
                </button>
                {user && (
                  <button
                    onClick={toggleParticipation}
                    disabled={joining}
                    className={isParticipating ? "btn-ghost text-sm flex items-center gap-2" : "btn-primary text-sm flex items-center gap-2"}
                  >
                    {isParticipating ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isParticipating ? "Se désinscrire" : "Participer"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column: description + comments */}
          <div className="lg:col-span-3 space-y-8">
            {/* Description */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-semibold text-lg mb-3">À propos</h2>
              <p className="text-white/70 whitespace-pre-line leading-relaxed">{event.description}</p>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                  {event.creator.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{event.creator.name}</p>
                  <p className="text-xs text-white/40">Organisateur</p>
                </div>
              </div>
            </div>

            {/* Comments */}
            <CommentSection
              eventId={event.id}
              initialComments={event.comments}
              socket={socket}
            />
          </div>

          {/* Right column: votes */}
          <div className="lg:col-span-2 space-y-6">
            {event.voteTopics.length > 0 ? (
              event.voteTopics.map((topic) => (
                <VotePanel
                  key={topic.id}
                  topic={topic}
                  userVoteOptionId={event.userVotes[topic.id]}
                  socket={socket}
                  isLoggedIn={!!user}
                />
              ))
            ) : (
              <div className="glass rounded-2xl p-6 text-center text-white/30">
                <p className="text-3xl mb-2">🗳️</p>
                <p>Pas de vote pour cet événement</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
