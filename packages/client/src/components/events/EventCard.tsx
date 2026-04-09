import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, MapPin, Users, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { EventSummary } from "../../types";

interface Props {
  event: EventSummary;
  index?: number;
}

const themeColors: Record<string, string> = {
  "Néon / Fluo": "from-green-400 to-cyan-400",
  "Mascarade": "from-amber-400 to-rose-500",
  "Tropical / Beach": "from-orange-400 to-yellow-300",
};

export function EventCard({ event, index = 0 }: Props) {
  const gradient = themeColors[event.theme || ""] || "from-brand-500 to-pink-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link
        to={`/events/${event.id}`}
        className="block group glass-hover rounded-2xl overflow-hidden"
      >
        {/* Header gradient */}
        <div className={`h-36 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
          {event.imageUrls[0] ? (
            <img src={event.imageUrls[0]} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-60">🎉</span>
            </div>
          )}
          {event.theme && (
            <span className="absolute top-3 right-3 badge bg-black/40 text-white backdrop-blur-sm">
              {event.theme}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-display font-bold text-lg mb-2 group-hover:text-gradient transition-colors line-clamp-1">
            {event.title}
          </h3>
          <p className="text-sm text-white/50 mb-4 line-clamp-2">{event.description}</p>

          <div className="space-y-2 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span>{format(new Date(event.date), "EEEE d MMMM · HH:mm", { locale: fr })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 text-sm text-white/40">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{event._count.participations}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{event._count.comments}</span>
            </div>
            {event.maxCapacity && (
              <span className="ml-auto text-xs">
                {event._count.participations}/{event.maxCapacity} places
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
