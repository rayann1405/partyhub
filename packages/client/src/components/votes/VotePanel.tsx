import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Vote } from "lucide-react";
import api from "../../services/api";
import type { VoteTopic, VoteResult } from "../../types";
import type { Socket } from "socket.io-client";

interface Props {
  topic: VoteTopic;
  userVoteOptionId?: string;
  socket: Socket | null;
  isLoggedIn: boolean;
}

export function VotePanel({ topic, userVoteOptionId, socket, isLoggedIn }: Props) {
  const [results, setResults] = useState<VoteResult[]>(() =>
    topic.options.map((o) => ({
      id: o.id,
      label: o.label,
      value: o.value,
      count: o._count.votes,
      percentage: 0,
    }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(userVoteOptionId || null);
  const [voting, setVoting] = useState(false);

  const isClosed = new Date(topic.closesAt) < new Date();
  const total = results.reduce((s, r) => s + r.count, 0);
  const icon = topic.category === "BUDGET" ? "💰" : topic.category === "ENTRY_PRICE" ? "🎟️" : "📊";

  // Compute percentages
  useEffect(() => {
    setResults((prev) =>
      prev.map((r) => ({
        ...r,
        percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
      }))
    );
  }, [total]);

  // Listen for live updates
  useEffect(() => {
    if (!socket) return;
    const handler = (data: { topicId: string; results: VoteResult[] }) => {
      if (data.topicId === topic.id) setResults(data.results);
    };
    socket.on("vote:update", handler);
    return () => { socket.off("vote:update", handler); };
  }, [socket, topic.id]);

  const handleVote = useCallback(async (optionId: string) => {
    if (!isLoggedIn || isClosed || voting) return;
    setVoting(true);
    try {
      const { data } = await api.post(`/votes/${topic.id}`, { optionId });
      setResults(data);
      setSelectedId(selectedId === optionId ? null : optionId);
    } catch (err) {
      console.error("Vote error:", err);
    } finally {
      setVoting(false);
    }
  }, [topic.id, isLoggedIn, isClosed, voting, selectedId]);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          {icon} {topic.label}
        </h3>
        {isClosed && (
          <span className="badge bg-red-500/20 text-red-300">
            <Clock className="w-3 h-3" /> Fermé
          </span>
        )}
      </div>
      <p className="text-sm text-white/40 mb-5 flex items-center gap-1.5">
        <Vote className="w-3.5 h-3.5" />
        {total} vote{total > 1 ? "s" : ""}
      </p>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {results.map((option) => {
            const isSelected = selectedId === option.id;
            return (
              <motion.button
                key={option.id}
                layout
                onClick={() => handleVote(option.id)}
                disabled={isClosed || !isLoggedIn || voting}
                className={`w-full text-left rounded-xl p-4 relative overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-brand-500 bg-brand-500/10"
                    : "bg-white/5 hover:bg-white/10"
                } ${(isClosed || !isLoggedIn) ? "cursor-default" : "cursor-pointer"}`}
              >
                {/* Animated progress bar */}
                <motion.div
                  className={`absolute inset-y-0 left-0 ${
                    isSelected
                      ? "bg-gradient-to-r from-brand-600/40 to-brand-500/20"
                      : "bg-white/5"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${option.percentage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                    )}
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-white/40">{option.count}</span>
                    <span className={`font-bold tabular-nums ${isSelected ? "text-brand-300" : "text-white/60"}`}>
                      {option.percentage}%
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {!isLoggedIn && (
        <p className="text-sm text-white/30 mt-4 text-center">Connectez-vous pour voter</p>
      )}
    </div>
  );
}
