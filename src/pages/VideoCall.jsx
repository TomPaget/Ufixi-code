import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  Monitor,
  Upload,
  FileText,
  X,
  Send,
  MessageSquare,
  Camera,
  CameraOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function VideoCall() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const consultationId = urlParams.get("id");

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [callStartTime, setCallStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioTranscript, setAudioTranscript] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: consultation, isLoading } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: async () => {
      const consultations = await base44.entities.VideoConsultation.filter({ id: consultationId });
      return consultations[0];
    },
    enabled: !!consultationId
  });

  const updateConsultationMutation = useMutation({
    mutationFn: (data) => base44.entities.VideoConsultation.update(consultationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["consultation", consultationId]);
    }
  });

  // Initialize media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        mediaStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Mark consultation as in progress
        if (consultation?.status === "scheduled") {
          updateConsultationMutation.mutate({ status: "in_progress" });
          setCallStartTime(Date.now());
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    if (consultation) {
      initMedia();
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [consultation]);

  // Timer
  useEffect(() => {
    if (!callStartTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime]);

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioOn(!isAudioOn);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });
        screenStreamRef.current = stream;
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);

        // Stop screen share when user stops it from browser
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newDocs = [...(consultation.shared_documents || []), file_url];
      setUploadedDocs(prev => [...prev, { name: file.name, url: file_url }]);
      updateConsultationMutation.mutate({ shared_documents: newDocs });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      sender: user.full_name,
      message: chatMessage,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage("");
  };

  const endCall = async () => {
    // Stop all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Process with AI
    try {
      const { data } = await base44.functions.invoke('processVideoConsultation', {
        consultationId,
        chatMessages,
        audioTranscript,
        duration: elapsedTime
      });

      await updateConsultationMutation.mutateAsync({
        status: "completed",
        ai_transcript: data.transcript,
        ai_key_points: data.keyPoints,
        ai_action_items: data.actionItems
      });
    } catch (error) {
      console.error("AI processing failed:", error);
      await updateConsultationMutation.mutateAsync({ status: "completed" });
    }

    navigate(createPageUrl(`ConsultationSummary?id=${consultationId}`));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading consultation...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 relative">
        {/* Remote Video (or placeholder) */}
        <div className="absolute inset-0 bg-slate-800">
          <video 
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Waiting for {consultation?.tradesperson_name || consultation?.customer_name}...</p>
            </div>
          </div>
        </div>

        {/* Screen Share */}
        {isScreenSharing && (
          <div className="absolute top-4 right-4 w-64 h-48 bg-slate-700 rounded-xl overflow-hidden border-2 border-blue-500">
            <video
              ref={screenShareRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Local Video */}
        <div className="absolute bottom-20 right-4 w-48 h-36 bg-slate-700 rounded-xl overflow-hidden border-2 border-slate-600">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <CameraOff className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur px-4 py-2 rounded-full text-white font-mono">
          {formatTime(elapsedTime)}
        </div>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="absolute right-0 top-0 bottom-20 w-80 bg-white shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Chat & Documents</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 font-medium mb-1">{msg.sender}</p>
                    <p className="text-sm text-slate-700">{msg.message}</p>
                  </div>
                ))}

                {uploadedDocs.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-slate-500 font-medium mb-2">Shared Documents</p>
                    {uploadedDocs.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 mb-2"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700 truncate">{doc.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
                    className="flex-1 min-h-[60px]"
                  />
                  <Button onClick={sendChatMessage} size="icon" className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                <label className="flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleDocumentUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-600">Upload Document</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="h-20 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-4 px-4">
        <Button
          variant={isAudioOn ? "default" : "destructive"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleAudio}
        >
          {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          variant={isVideoOn ? "default" : "destructive"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleVideo}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleScreenShare}
        >
          <Monitor className="w-5 h-5" />
        </Button>

        <Button
          variant={showChat ? "default" : "outline"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="w-5 h-5" />
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full w-14 h-14 ml-4"
          onClick={endCall}
        >
          <Phone className="w-6 h-6 rotate-135" />
        </Button>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}