import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

interface VoteTopicForm {
  category: "BUDGET" | "ENTRY_PRICE" | "CUSTOM";
  label: string;
  closesAt: string;
  options: { label: string; value: number }[];
}

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    theme: "",
    maxCapacity: "",
  });

  const [voteTopics, setVoteTopics] = useState<VoteTopicForm[]>([
    {
      category: "BUDGET",
      label: "Budget de la soirée",
      closesAt: "",
      options: [
        { label: "300 000 FCFA", value: 300000 },
        { label: "500 000 FCFA", value: 500000 },
      ],
    },
    {
      category: "ENTRY_PRICE",
      label: "Prix d'entrée",
      closesAt: "",
      options: [
        { label: "Gratuit", value: 0 },
        { label: "2 000 FCFA", value: 2000 },
      ],
    },
  ]);

  const addOption = (topicIdx: number) => {
    const updated = [...voteTopics];
    updated[topicIdx].options.push({ label: "", value: 0 });
    setVoteTopics(updated);
  };

  const removeOption = (topicIdx: number, optIdx: number) => {
    const updated = [...voteTopics];
    updated[topicIdx].options.splice(optIdx, 1);
    setVoteTopics(updated);
  };

  const addTopic = () => {
    setVoteTopics([
      ...voteTopics,
      { category: "CUSTOM", label: "", closesAt: "", options: [{ label: "", value: 0 }, { label: "", value: 0 }] },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        date: new Date(form.date).toISOString(),
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : undefined,
        imageUrls: [],
        voteTopics: voteTopics
          .filter((t) => t.label && t.options.length >= 2)
          .map((t) => ({
            ...t,
            closesAt: t.closesAt ? new Date(t.closesAt).toISOString() : new Date(form.date).toISOString(),
          })),
      };
      const { data } = await api.post("/events", payload);
      toast.success("Événement créé ! 🎉");
      navigate(`/events/${data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.details?.[0]?.message || "Erreur de création");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-extrabold text-3xl mb-8">Créer un événement 🎉</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event info */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <h2 className="font-display font-semibold text-lg mb-2">Informations</h2>

              <div>
                <label className="block text-sm text-white/60 mb-1.5">Titre</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required placeholder="Nuit Néon 💡" />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[120px] resize-y" required placeholder="Décris ta soirée…" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Date et heure</label>
                  <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Lieu</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" required placeholder="Hall B — Campus" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Thème (optionnel)</label>
                  <input value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} className="input" placeholder="Néon, Mascarade…" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Capacité max (optionnel)</label>
                  <input type="number" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} className="input" placeholder="200" />
                </div>
              </div>
            </div>

            {/* Vote topics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg">Sondages de vote</h2>
                <button type="button" onClick={addTopic} className="btn-ghost text-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>

              {voteTopics.map((topic, ti) => (
                <div key={ti} className="glass rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <select
                      value={topic.category}
                      onChange={(e) => {
                        const updated = [...voteTopics];
                        updated[ti].category = e.target.value as any;
                        setVoteTopics(updated);
                      }}
                      className="input w-auto text-sm"
                    >
                      <option value="BUDGET">💰 Budget</option>
                      <option value="ENTRY_PRICE">🎟️ Prix d'entrée</option>
                      <option value="CUSTOM">📊 Personnalisé</option>
                    </select>
                    {voteTopics.length > 1 && (
                      <button type="button" onClick={() => setVoteTopics(voteTopics.filter((_, i) => i !== ti))} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    value={topic.label}
                    onChange={(e) => {
                      const updated = [...voteTopics];
                      updated[ti].label = e.target.value;
                      setVoteTopics(updated);
                    }}
                    className="input text-sm"
                    placeholder="Question du sondage"
                  />

                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Fin du vote</label>
                    <input
                      type="datetime-local"
                      value={topic.closesAt}
                      onChange={(e) => {
                        const updated = [...voteTopics];
                        updated[ti].closesAt = e.target.value;
                        setVoteTopics(updated);
                      }}
                      className="input text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-white/60">Options</label>
                    {topic.options.map((opt, oi) => (
                      <div key={oi} className="flex gap-2">
                        <input
                          value={opt.label}
                          onChange={(e) => {
                            const updated = [...voteTopics];
                            updated[ti].options[oi].label = e.target.value;
                            setVoteTopics(updated);
                          }}
                          className="input text-sm flex-1"
                          placeholder="Label (ex: 500 000 FCFA)"
                        />
                        <input
                          type="number"
                          value={opt.value}
                          onChange={(e) => {
                            const updated = [...voteTopics];
                            updated[ti].options[oi].value = Number(e.target.value);
                            setVoteTopics(updated);
                          }}
                          className="input text-sm w-32"
                          placeholder="Valeur"
                        />
                        {topic.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(ti, oi)} className="text-white/20 hover:text-red-400 p-2">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(ti)} className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 mt-1">
                      <Plus className="w-3.5 h-3.5" /> Option
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full text-lg py-4">
              {submitting ? "Création…" : "Publier l'événement 🚀"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
