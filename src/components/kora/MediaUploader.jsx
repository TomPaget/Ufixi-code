import { useState, useRef } from "react";
import { Camera, Video, Mic, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function MediaUploader({ onUpload, isLoading }) {
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setMediaType(type);
    
    // Create preview
    if (type === "photo" || type === "video") {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview("audio");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      onUpload(file_url, mediaType, {
        description,
        location,
        duration
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setMediaType(null);
    setSelectedFile(null);
    setDescription("");
    setLocation("");
    setDuration("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadOptions = [
    { type: "photo", icon: Camera, label: "Photo", accept: "image/*" },
    { type: "video", icon: Video, label: "Video", accept: "video/*" },
    { type: "audio", icon: Mic, label: "Audio", accept: "audio/*" }
  ];

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="relative rounded-3xl overflow-hidden bg-slate-100">
              {mediaType === "photo" && (
                <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
              )}
              {mediaType === "video" && (
                <video src={preview} className="w-full h-64 object-cover" controls />
              )}
              {mediaType === "audio" && (
                <div className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-violet-700 font-medium">Audio Recording</span>
                  </div>
                </div>
              )}
              
              {!isLoading && !uploading && (
                <button
                  onClick={clearPreview}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {(uploading || isLoading) && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-medium">
                      {uploading ? "Uploading..." : "Analyzing..."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!uploading && !isLoading && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Describe the issue *
                  </label>
                  <Textarea
                    placeholder="What's wrong? Be as detailed as possible..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-500 min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Where is it located? *
                  </label>
                  <Input
                    placeholder="e.g., Kitchen sink, Bathroom ceiling, Living room wall..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    How long has it been like this? *
                  </label>
                  <Input
                    placeholder="e.g., Just noticed, 2 weeks, 3 months..."
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!description || !location || !duration}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Analyze Issue
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            {uploadOptions.map(({ type, icon: Icon, label, accept }) => (
              <label
                key={type}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
                  "border-slate-600 hover:border-blue-500 hover:bg-blue-500/10",
                  "active:scale-95"
                )}
              >
                <input
                  ref={type === "photo" ? fileInputRef : undefined}
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, type)}
                />
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">{label}</span>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}