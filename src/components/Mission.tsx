import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Target, 
  Users, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Plus, 
  Send,
  Layout,
  Trophy,
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Trash2,
  Link as LinkIcon,
  Play,
  ExternalLink,
  Maximize2
} from "lucide-react";
import { cn } from "../lib/utils";
import { openMediaInNewTab } from "../lib/mediaUtils";
import { Button } from "./Button";
import { Card } from "./Card";
import { MissionActivity, MissionCard, MediaItem } from "../types";
import { MISSION_TEMPLATES } from "../constants";

interface CreateMissionFormProps {
  onSubmit: (config: { title: string; teamCount: number; joinCode?: string }) => void;
  onCancel: () => void;
}

export const CreateMissionForm: React.FC<CreateMissionFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [teamCount, setTeamCount] = useState(10);
  const [joinCode, setJoinCode] = useState("");

  return (
    <Card className="p-8 space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight">CREATE MISSION</h2>
        <p className="text-zinc-500 font-medium">Set up a new team activity with mission cards.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Activity Title</label>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Morning Breakfast Mission"
            className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-black transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Access Password (Optional)</label>
          <input 
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Leave empty for no password"
            className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-black transition-all"
          />
          <p className="text-[10px] text-zinc-400 font-medium">If set, users must enter this password to join the mission board.</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Number of Teams</label>
            <span className="text-2xl font-black">{teamCount}</span>
          </div>
          <input 
            type="range"
            min="5"
            max="20"
            value={teamCount}
            onChange={(e) => setTeamCount(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-black"
          />
          <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
            <span>5 Teams</span>
            <span>20 Teams</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button 
          variant="primary" 
          className="flex-1" 
          disabled={!title}
          onClick={() => onSubmit({ title, teamCount, joinCode: joinCode.trim() || undefined })}
        >
          Create Activity
        </Button>
      </div>
    </Card>
  );
};

interface MissionBoardProps {
  mission: MissionActivity;
  onUpdateStatus: (status: string) => void;
  onAssignCard: (cardId: string, teamName: string, password?: string) => void;
  onSubmitResult: (cardId: string, result: string, password?: string, media?: MediaItem[]) => void;
  onViewMedia: (item: MediaItem) => void;
}

export const MissionBoard: React.FC<MissionBoardProps> = ({ 
  mission, 
  onUpdateStatus,
  onAssignCard,
  onSubmitResult,
  onViewMedia
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [cardPassword, setCardPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [resultText, setResultText] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectedCard = mission.cards?.find(c => c.id === selectedCardId);
  const selectedTemplate = selectedCard ? MISSION_TEMPLATES.find(t => t.id === selectedCard.templateId) : null;

  const handleClaim = () => {
    if (selectedCardId && teamName) {
      onAssignCard(selectedCardId, teamName, cardPassword.trim() || undefined);
      setSelectedCardId(null);
      setTeamName("");
      setCardPassword("");
      setError(null);
    }
  };

  const handleSubmit = () => {
    if (selectedCardId && resultText) {
      if (selectedCard?.password && selectedCard.password !== verifyPassword) {
        setError("Invalid card password. Only the assigned team can submit results.");
        return;
      }
      onSubmitResult(selectedCardId, resultText, verifyPassword, mediaItems);
      setSelectedCardId(null);
      setResultText("");
      setVerifyPassword("");
      setMediaItems([]);
      setError(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setMediaItems(prev => [...prev, { type, url: base64String, title: file.name }]);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  // If mission is closed, show summary view
  if (mission.status === "closed") {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600">
              <Trophy size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Activity Results</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter leading-none uppercase">{mission.title}</h2>
          </div>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            <ArrowLeft size={16} className="mr-2" /> Back to Home
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {mission.cards?.filter(c => c.status !== "available").map((card, idx) => {
            const template = MISSION_TEMPLATES.find(t => t.id === card.templateId);
            if (!template) return null;

            return (
              <Card key={card.id} className="p-8 space-y-6 border-l-8 border-l-emerald-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Team {card.teamName}</div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">{template.cardTitle}</h3>
                  </div>
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Mission Accomplished
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-zinc-100">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">The Mission</h4>
                      <p className="font-bold text-lg">{template.mission}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Task</h4>
                      <p className="text-zinc-600 text-sm">{template.teamTask}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Team Result</h4>
                    <div className="p-6 bg-zinc-50 rounded-2xl font-bold text-zinc-800 whitespace-pre-wrap min-h-[100px]">
                      {card.result || "No result submitted."}
                    </div>
                    {card.media && card.media.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {card.media.map((item, i) => (
                          <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-black group/media">
                            {item.type === "image" ? (
                              <img src={item.url} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <video src={item.url} controls className="w-full h-full object-cover" />
                            )}
                            <div 
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewMedia(item);
                              }}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-white bg-white/10 backdrop-blur-sm rounded-full w-10 h-10 p-0 hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewMedia(item);
                                  }}
                                >
                                  <Maximize2 size={18} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-white bg-white/10 backdrop-blur-sm rounded-full w-10 h-10 p-0 hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openMediaInNewTab(item.url);
                                  }}
                                >
                                  <ExternalLink size={18} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Target size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Active Mission</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter leading-none uppercase">{mission.title}</h2>
          <div className="flex items-center gap-4 text-zinc-400 font-medium text-sm">
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{mission.teamCount} Teams</span>
            </div>
            <div className="flex items-center gap-1">
              <Layout size={14} />
              <span>{mission.cards?.filter(c => c.status === "completed").length || 0} / {mission.teamCount} Completed</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mission.status === "active" ? (
            <Button variant="primary" onClick={() => onUpdateStatus("closed")}>
              Finish Activity
            </Button>
          ) : (
            <div className="px-4 py-2 bg-zinc-100 text-zinc-500 rounded-xl font-bold text-sm flex items-center gap-2">
              <CheckCircle2 size={16} />
              Activity Completed
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mission.cards?.map((card, idx) => {
          const template = MISSION_TEMPLATES.find(t => t.id === card.templateId);
          if (!template) return null;

          return (
            <Card 
              key={card.id}
              className={cn(
                "p-6 flex flex-col justify-between transition-all cursor-pointer group relative min-h-[380px]",
                card.status === "available" ? "hover:border-black" : 
                card.status === "assigned" ? "border-amber-200 bg-amber-50/30" :
                "border-emerald-200 bg-emerald-50/30"
              )}
              onClick={() => setSelectedCardId(card.id)}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-zinc-400">
                    {idx + 1}
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                    card.status === "available" ? "bg-zinc-100 text-zinc-500" :
                    card.status === "assigned" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {card.status}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{template.cardTitle}</h4>
                  <h3 className="text-xl font-black leading-tight group-hover:underline decoration-2 underline-offset-4">
                    {template.mission}
                  </h3>
                </div>

                {card.teamName && (
                  <div className="pt-4 border-t border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Assigned Team</div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      <Users size={14} className="text-zinc-400" />
                      {card.teamName}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                {card.status === "available" ? (
                  <div className="flex items-center gap-2 text-zinc-400 group-hover:text-black transition-colors">
                    <Plus size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Claim Mission</span>
                  </div>
                ) : card.status === "assigned" ? (
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">In Progress</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">View Result</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal for Card Interaction */}
      {selectedCard && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-[10px] font-bold tracking-widest uppercase inline-block">
                    Mission Card
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase">{selectedTemplate.cardTitle}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCardId(null)}>Close</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">The Mission</h4>
                    <p className="text-xl font-bold leading-tight">{selectedTemplate.mission}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Team Task</h4>
                    <p className="text-zinc-600 font-medium">{selectedTemplate.teamTask}</p>
                  </div>
                  {selectedTemplate.example && (
                    <div className="p-4 bg-zinc-50 rounded-2xl space-y-2">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Example</h4>
                      <p className="text-sm text-zinc-500 italic">{selectedTemplate.example}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {selectedCard.status === "available" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Enter Team Name</label>
                        <input 
                          type="text"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Team Alpha, etc."
                          className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-black transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Card Password (Optional)</label>
                        <input 
                          type="text"
                          value={cardPassword}
                          onChange={(e) => setCardPassword(e.target.value)}
                          placeholder="Set a password for this card"
                          className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-black transition-all"
                        />
                        <p className="text-[10px] text-zinc-400 font-medium">Only teams with this password can submit results.</p>
                      </div>
                      <Button 
                        variant="primary" 
                        className="w-full py-4 text-lg rounded-2xl"
                        disabled={!teamName}
                        onClick={handleClaim}
                      >
                        Claim this Mission
                      </Button>
                    </div>
                  ) : selectedCard.status === "assigned" ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-sm text-amber-800 font-medium">
                          Team <span className="font-black">{selectedCard.teamName}</span> is working on this mission.
                        </p>
                      </div>
                      {selectedCard.password && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Card Password</label>
                          <input 
                            type="password"
                            value={verifyPassword}
                            onChange={(e) => {
                              setVerifyPassword(e.target.value);
                              setError(null);
                            }}
                            placeholder="Enter card password to edit"
                            className={cn(
                              "w-full bg-zinc-100 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-black transition-all",
                              error && "ring-2 ring-red-500"
                            )}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Activity Result</label>
                        <textarea 
                          value={resultText}
                          onChange={(e) => setResultText(e.target.value)}
                          placeholder="Enter your team's findings or results here..."
                          rows={5}
                          className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-black transition-all resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Attachments</label>
                        <div className="flex flex-wrap gap-2">
                          {mediaItems.map((item, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 group">
                              {item.type === "image" ? (
                                <img src={item.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white">
                                  <Video size={20} />
                                </div>
                              )}
                              <button 
                                onClick={() => removeMedia(i)}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-black hover:bg-zinc-50 transition-all">
                            <ImageIcon size={20} className="text-zinc-400" />
                            <span className="text-[8px] font-bold uppercase">Image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "image")} />
                          </label>
                          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-black hover:bg-zinc-50 transition-all">
                            <Video size={20} className="text-zinc-400" />
                            <span className="text-[8px] font-bold uppercase">Video</span>
                            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, "video")} />
                          </label>
                        </div>
                      </div>

                      {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                      <Button 
                        variant="primary" 
                        className="w-full py-4 text-lg rounded-2xl"
                        disabled={!resultText || (selectedCard.password && !verifyPassword)}
                        onClick={handleSubmit}
                      >
                        Submit Results
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-sm text-emerald-800 font-medium">
                          Completed by <span className="font-black">{selectedCard.teamName}</span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Results</h4>
                        <div className="p-6 bg-zinc-50 rounded-2xl font-bold text-zinc-800 whitespace-pre-wrap">
                          {selectedCard.result}
                        </div>
                        {selectedCard.media && selectedCard.media.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {selectedCard.media.map((item, i) => (
                              <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-black group/media">
                                {item.type === "image" ? (
                                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <video src={item.url} controls className="w-full h-full object-cover" />
                                )}
                                <div 
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewMedia(item);
                                  }}
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-white bg-white/10 backdrop-blur-sm rounded-full w-10 h-10 p-0 hover:bg-white/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onViewMedia(item);
                                      }}
                                    >
                                      <Maximize2 size={18} />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-white bg-white/10 backdrop-blur-sm rounded-full w-10 h-10 p-0 hover:bg-white/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openMediaInNewTab(item.url);
                                      }}
                                    >
                                      <ExternalLink size={18} />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
