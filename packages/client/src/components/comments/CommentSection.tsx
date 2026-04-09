import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import type { Comment } from "../../types";
import type { Socket } from "socket.io-client";

interface Props {
  eventId: string;
  initialComments: Comment[];
  socket: Socket | null;
}

export function CommentSection({ eventId, initialComments, socket }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuthStore();

  // Live comments
  useEffect(() => {
    if (!socket) return;
    const handler = (comment: Comment) => {
      setComments((prev) => [comment, ...prev]);
    };
    socket.on("comment:new", handler);
    return () => { socket.off("comment:new", handler); };
  }, [socket]);

  const handleSubmit = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/events/${eventId}/comments`, { content: content.trim() });
      setContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="font-display font-semibold text-lg mb-5">
        💬 Commentaires ({comments.length})
      </h3>

      {/* Input */}
      {user ? (
        <div className="flex gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-sm font-bold shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Ajouter un commentaire…"
              className="input text-sm flex-1"
              maxLength={1000}
            />
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || sending}
              className="btn-primary px-4 py-2 text-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/30 mb-6">Connectez-vous pour commenter</p>
      )}

      {/* Comments list */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex gap-3 group"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                {comment.user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">{comment.user.name}</span>
                  <span className="text-xs text-white/30">
                    {format(new Date(comment.createdAt), "d MMM · HH:mm", { locale: fr })}
                  </span>
                </div>
                <p className="text-sm text-white/70 mt-0.5 break-words">{comment.content}</p>
              </div>
              {user && (user.id === comment.user.id || user.role === "ADMIN") && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <p className="text-center text-white/20 py-8 text-sm">Aucun commentaire pour l'instant</p>
        )}
      </div>
    </div>
  );
}
