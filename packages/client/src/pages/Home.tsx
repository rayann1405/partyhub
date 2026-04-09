import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Search } from "lucide-react";
import api from "../services/api";
import { EventCard } from "../components/events/EventCard";
import type { EventSummary } from "../types";

export default function HomePage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/events?limit=20").then(({ data }) => {
      setEvents(data.events);
      setLoading(false);
    });
  }, []);

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase()) ||
      (e.theme || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-600/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 badge bg-brand-500/20 text-brand-300 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Les meilleures soirées étudiantes
            </div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-4">
              Découvre, vote,{" "}
              <span className="text-gradient">participe</span>
            </h1>
            <p className="text-lg text-white/50 mb-8">
              Trouve les prochaines soirées, vote pour le budget et le prix d'entrée,
              et inscris-toi en un clic.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un événement, lieu, thème…"
                className="input pl-12"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Events grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse glass rounded-2xl">
                <div className="h-36 bg-white/5 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-white/5 rounded w-3/4" />
                  <div className="h-4 bg-white/5 rounded w-full" />
                  <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎶</p>
            <p className="text-white/40 text-lg">Aucun événement trouvé</p>
            {search && (
              <button onClick={() => setSearch("")} className="btn-ghost text-sm mt-2">
                Effacer la recherche
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
