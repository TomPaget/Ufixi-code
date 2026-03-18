import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Star, Phone, Mail, Heart, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/kora/MobileSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

const specialtyColors = {
  plumbing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  electrical: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hvac: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  carpentry: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  roofing: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  painting: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  general: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  appliances: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  other: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
};

export default function Contractors() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [showDialog, setShowDialog] = useState(false);
  const [editingContractor, setEditingContractor] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    specialty: "general",
    phone: "",
    email: "",
    rating: 5,
    notes: "",
    is_favorite: false
  });

  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ["contractors"],
    queryFn: () => base44.entities.Contractor.list("-created_date")
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contractor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["contractors"]);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contractor.update(id, data),
    onMutate: async ({ id, data }) => {
      // Only optimistically update for non-dialog saves (e.g. favorite toggle)
      if (!showDialog) {
        await queryClient.cancelQueries(["contractors"]);
        const previous = queryClient.getQueryData(["contractors"]);
        queryClient.setQueryData(["contractors"], (old = []) =>
          old.map((c) => c.id === id ? { ...c, ...data } : c)
        );
        return { previous };
      }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["contractors"], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["contractors"]);
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contractor.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(["contractors"]);
      const previous = queryClient.getQueryData(["contractors"]);
      queryClient.setQueryData(["contractors"], (old = []) => old.filter((c) => c.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["contractors"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries(["contractors"]),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      specialty: "general",
      phone: "",
      email: "",
      rating: 5,
      notes: "",
      is_favorite: false
    });
    setEditingContractor(null);
  };

  const handleEdit = (contractor) => {
    setEditingContractor(contractor);
    setFormData(contractor);
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingContractor) {
      updateMutation.mutate({ id: editingContractor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleFavorite = (contractor) => {
    updateMutation.mutate({
      id: contractor.id,
      data: { ...contractor, is_favorite: !contractor.is_favorite }
    });
  };

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark"
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50"
    )}>
      <header className={cn(
        "sticky top-0 z-10 backdrop-blur-lg border-b",
        theme === "dark"
          ? "bg-slate-900/80 border-slate-700/50"
          : "bg-white/80 border-slate-200"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-xl",
                theme === "dark"
                  ? "hover:bg-slate-800 text-slate-400"
                  : "hover:bg-slate-100 text-slate-600"
              )}
              onClick={() => navigate(createPageUrl("Home"))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={cn(
              "font-semibold text-lg",
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            )}>My Contractors</h1>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="h-11 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn(
                "rounded-2xl h-32 animate-pulse",
                theme === "dark" ? "bg-slate-800" : "bg-slate-100"
              )} />
            ))}
          </div>
        ) : contractors.length > 0 ? (
          contractors.map((contractor, i) => (
            <motion.div
              key={contractor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-2xl p-4 border",
                theme === "dark"
                  ? "bg-slate-800 border-slate-700/50"
                  : "bg-white border-slate-200"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={cn(
                      "font-semibold",
                      theme === "dark" ? "text-slate-100" : "text-slate-900"
                    )}>{contractor.name}</h3>
                    <button
                      onClick={() => toggleFavorite(contractor)}
                      className="w-11 h-11 flex items-center justify-center rounded-xl -mr-2"
                      aria-label={contractor.is_favorite ? "Remove from favourites" : "Add to favourites"}
                    >
                      <Heart className={cn(
                        "w-5 h-5",
                        contractor.is_favorite
                          ? "fill-red-500 text-red-500"
                          : theme === "dark" ? "text-slate-500" : "text-slate-400"
                      )} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full border",
                      specialtyColors[contractor.specialty]
                    )}>
                      {contractor.specialty.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3 h-3",
                            i < contractor.rating
                              ? "fill-amber-400 text-amber-400"
                              : theme === "dark" ? "text-slate-600" : "text-slate-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {contractor.notes && (
                <p className={cn(
                  "text-sm mb-3",
                  theme === "dark" ? "text-slate-400" : "text-slate-600"
                )}>
                  {contractor.notes}
                </p>
              )}

              <div className="flex items-center gap-2">
                {contractor.phone && (
                  <a
                    href={`tel:${contractor.phone}`}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm min-h-[44px]",
                      theme === "dark"
                        ? "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                )}
                {contractor.email && (
                  <a
                    href={`mailto:${contractor.email}`}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm min-h-[44px]",
                      theme === "dark"
                        ? "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
                <Button
                  variant="ghost"
                  onClick={() => handleEdit(contractor)}
                  className={cn(
                    "h-11 px-3 text-sm",
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  )}
                >
                  Edit
                </Button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className={cn(
            "text-center py-16 rounded-2xl",
            theme === "dark"
              ? "bg-slate-800/50 border border-slate-700/50"
              : "bg-white border border-slate-200"
          )}>
            <Wrench className={cn(
              "w-12 h-12 mx-auto mb-4",
              theme === "dark" ? "text-slate-600" : "text-slate-300"
            )} />
            <p className={cn(
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            )}>No contractors saved yet</p>
            <Button
              onClick={() => setShowDialog(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Add Your First Contractor
            </Button>
          </div>
        )}
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={cn(
          "max-w-lg mx-4 rounded-3xl",
          theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            )}>
              {editingContractor ? "Edit Contractor" : "Add Contractor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label className={cn(theme === "dark" ? "text-slate-300" : "text-slate-700")}>
                Name *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={cn(
                  "mt-1",
                  theme === "dark"
                    ? "bg-slate-700 border-slate-600 text-slate-100"
                    : "bg-white border-slate-200"
                )}
                required
              />
            </div>

            <div>
              <Label className={cn(theme === "dark" ? "text-slate-300" : "text-slate-700")}>
                Specialty *
              </Label>
              <MobileSelect
                value={formData.specialty}
                onChange={(val) => setFormData({...formData, specialty: val})}
                className="w-full mt-1"
                options={[
                  { value: "plumbing", label: "Plumbing" },
                  { value: "electrical", label: "Electrical" },
                  { value: "hvac", label: "HVAC" },
                  { value: "carpentry", label: "Carpentry" },
                  { value: "roofing", label: "Roofing" },
                  { value: "painting", label: "Painting" },
                  { value: "general", label: "General" },
                  { value: "appliances", label: "Appliances" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={cn(theme === "dark" ? "text-slate-300" : "text-slate-700")}>
                  Phone
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={cn(
                    "mt-1",
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600 text-slate-100"
                      : "bg-white border-slate-200"
                  )}
                />
              </div>
              <div>
                <Label className={cn(theme === "dark" ? "text-slate-300" : "text-slate-700")}>
                  Rating
                </Label>
                <MobileSelect
                  value={formData.rating.toString()}
                  onChange={(val) => setFormData({...formData, rating: parseInt(val)})}
                  className="w-full mt-1"
                  options={[1,2,3,4,5].map(n => ({ value: n.toString(), label: `${n} Star${n > 1 ? 's' : ''}` }))}
                />
              </div>
            </div>

            <div>
              <Label className={cn(theme === "dark" ? "text-slate-300" : "text-slate-700")}>
                Email
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={cn(
                  "mt-1",
                  theme === "dark"
                    ? "bg-slate-700 border-slate-600 text-slate-100"
                    : "bg-white border-slate-200"
                )}
              />
            </div>

            <div>
              <Label className={cn(theme === "dark" ? "text-slate-300" : "text-slate-700")}>
                Notes
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className={cn(
                  "mt-1 min-h-20",
                  theme === "dark"
                    ? "bg-slate-700 border-slate-600 text-slate-100"
                    : "bg-white border-slate-200"
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              {editingContractor && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Delete this contractor?")) {
                      deleteMutation.mutate(editingContractor.id);
                      setShowDialog(false);
                    }
                  }}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Delete
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {editingContractor ? "Update" : "Add"} Contractor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}