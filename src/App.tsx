/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Vote, 
  BarChart3, 
  ChevronRight, 
  Copy, 
  Check, 
  ArrowLeft, 
  Share2,
  Users,
  Clock,
  Zap,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  Link as LinkIcon,
  Trash2,
  ExternalLink,
  Play,
  FileText
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import socket from "./socket";
import { cn } from "./lib/utils";
import { Poll, VoteResult, AppView, MediaItem, Team } from "./types";

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className,
  disabled = false,
  type = "button"
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) => {
  const variants = {
    primary: "bg-black text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    outline: "border border-zinc-200 text-zinc-900 hover:bg-zinc-50",
    ghost: "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className, onClick }) => (
  <div 
    onClick={onClick}
    className={cn("bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm", className)}
  >
    {children}
  </div>
);

const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  label,
  type = "text",
  className 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  label?: string;
  type?: string;
  className?: string;
}) => (
  <div className={cn("space-y-1.5", className)}>
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
    />
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [currentPollId, setCurrentPollId] = useState<string | null>(null);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [pollData, setPollData] = useState<Poll | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [activePolls, setActivePolls] = useState<any[]>([]);
  const [userId] = useState(() => {
    const saved = localStorage.getItem("vote_user_id");
    if (saved) return saved;
    const id = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("vote_user_id", id);
    return id;
  });

  // Fetch active polls for home screen
  useEffect(() => {
    if (view === "home") {
      fetch("/api/polls")
        .then(res => res.json())
        .then(data => setActivePolls(data))
        .catch(err => console.error("Error fetching active polls:", err));
    }
  }, [view]);

  // Check URL for direct poll access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pollId = params.get("poll");
    const mode = params.get("mode") as AppView;

    if (pollId) {
      setCurrentPollId(pollId);
      if (mode === "team-upload") {
        setView("team-upload");
      } else if (mode === "results") {
        setView("results");
      } else {
        setView("vote");
      }
    }
  }, []);

  // Socket listeners
  useEffect(() => {
    socket.on("results-update", (updatedResults: VoteResult[]) => {
      setResults(updatedResults);
    });

    socket.on("poll-updated", (update: Partial<Poll>) => {
      setPollData(prev => prev ? { ...prev, ...update } : null);
    });

    return () => {
      socket.off("results-update");
      socket.off("poll-updated");
    };
  }, []);

  // Fetch poll data when currentPollId changes
  useEffect(() => {
    if (currentPollId) {
      fetch(`/api/polls/${currentPollId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            alert("Poll not found");
            setView("home");
            return;
          }
          setPollData(data);
          setResults(data.results || []);
          socket.emit("join-poll", currentPollId);
        })
        .catch(err => console.error("Error fetching poll:", err));
    }
  }, [currentPollId]);

  const navigateTo = (newView: AppView, pollId?: string) => {
    const url = new URL(window.location.href);
    if (pollId) {
      url.searchParams.set("poll", pollId);
      setCurrentPollId(pollId);
      
      if (newView === "results") {
        url.searchParams.set("mode", "results");
      } else if (newView === "team-upload") {
        url.searchParams.set("mode", "team-upload");
      } else {
        url.searchParams.delete("mode");
      }
      url.searchParams.delete("team");
      setCurrentTeamId(null);
    } else {
      url.searchParams.delete("poll");
      url.searchParams.delete("team");
      url.searchParams.delete("mode");
      setCurrentPollId(null);
      setCurrentTeamId(null);
      setPollData(null);
    }
    window.history.pushState({}, "", url);
    setView(newView);
  };

  const handleCreatePoll = (config: any) => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const joinCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const registrationCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const newPoll: Poll = {
      id,
      type: config.type,
      title: config.title,
      questions: config.questions.map((q: any, i: number) => ({
        id: `q-${i}-${Date.now()}`,
        text: q.text,
        options: q.options
      })),
      teams: [],
      status: config.type === "general" ? "voting" : "setup",
      joinCode,
      registrationCode,
      deadline: config.deadline ? Date.now() + config.deadline * 60000 : undefined,
      createdAt: Date.now()
    };
    socket.emit("create-poll", newPoll);
    navigateTo("results", id);
  };

  const handleRegisterTeam = (teamName: string, media: MediaItem[]) => {
    if (!currentPollId) return;
    socket.emit("register-team", {
      pollId: currentPollId,
      teamName,
      media
    });
  };

  const handleUpdateStatus = (status: Poll["status"]) => {
    if (!currentPollId) return;
    socket.emit("update-poll-status", {
      pollId: currentPollId,
      status
    });
  };

  const handleVote = (responses: { questionId: string; teamId?: string; optionIndex: number }[]) => {
    if (!currentPollId) return;
    socket.emit("vote", {
      pollId: currentPollId,
      responses,
      userId
    });
    localStorage.setItem(`voted_${currentPollId}`, "true");
    navigateTo("results", currentPollId);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigateTo("home")}
          >
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-lg tracking-tight">LiveVote</span>
          </div>
          
          <div className="flex items-center gap-2">
            {view !== "home" && (
              <Button variant="ghost" onClick={() => navigateTo("home")}>
                Home
              </Button>
            )}
            {view === "home" && (
              <Button onClick={() => setView("create")}>
                <Plus size={18} />
                New Poll
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-6">
                <motion.h1 
                  className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9]"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  REAL-TIME <br />
                  <span className="text-zinc-400 italic font-serif font-light">VOTING</span> FOR EVENTS
                </motion.h1>
                <p className="text-zinc-500 text-lg max-w-xl mx-auto">
                  Create instant polls, share with a link, and watch results roll in live. 
                  Perfect for presentations, meetups, and workshops.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button 
                    className="w-full sm:w-auto px-8 py-4 text-lg rounded-2xl" 
                    onClick={() => setView("create")}
                  >
                    Create a Poll
                  </Button>
                  <JoinPollBox onJoin={(id) => navigateTo("vote", id)} />
                </div>
              </div>

              {activePolls.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 text-center">Active Polls</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activePolls.map(poll => (
                      <Card 
                        key={poll.id} 
                        className="cursor-pointer hover:border-black transition-all group relative overflow-hidden"
                        onClick={() => {
                          if (poll.status === "setup" && poll.type === "popularity") {
                            navigateTo("team-upload", poll.id);
                          } else {
                            navigateTo("vote", poll.id);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            poll.type === "popularity" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {poll.type}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400">#{poll.joinCode}</span>
                        </div>
                        <h3 className="font-bold group-hover:text-black transition-colors">{poll.title}</h3>
                        <div className="mt-4 flex items-center gap-1 text-xs text-zinc-400 font-medium">
                          <Users size={12} />
                          <span>{poll.status === "voting" ? "Voting Live" : "Registration Open"}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                <FeatureCard 
                  icon={<Zap className="text-amber-500" />}
                  title="Instant Setup"
                  description="No account required. Create a poll in seconds and start collecting votes."
                />
                <FeatureCard 
                  icon={<BarChart3 className="text-blue-500" />}
                  title="Live Results"
                  description="Watch the charts update in real-time as your audience casts their votes."
                />
                <FeatureCard 
                  icon={<Users className="text-emerald-500" />}
                  title="Unlimited Users"
                  description="Scale from a small meeting to a large conference without missing a beat."
                />
              </div>
            </motion.div>
          )}

          {view === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-xl mx-auto"
            >
              <CreatePollForm 
                onSubmit={handleCreatePoll} 
                onCancel={() => setView("home")} 
              />
            </motion.div>
          )}

          {view === "vote" && pollData && (
            <motion.div
              key="vote"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto"
            >
              <VoteInterface 
                poll={pollData} 
                onVote={handleVote} 
                onViewResults={() => navigateTo("results", currentPollId!)}
              />
            </motion.div>
          )}

          {view === "results" && pollData && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <ResultsDashboard 
                poll={pollData} 
                results={results} 
                onVoteAgain={() => navigateTo("vote", currentPollId!)}
                onUpdateStatus={handleUpdateStatus}
              />
            </motion.div>
          )}

          {view === "team-upload" && pollData && (
            <motion.div
              key="team-upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto"
            >
              <TeamRegistrationView 
                poll={pollData}
                onRegister={handleRegisterTeam}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-50">
            <Zap size={14} />
            <span className="text-xs font-semibold uppercase tracking-widest">LiveVote Engine v1.0</span>
          </div>
          <p className="text-zinc-400 text-sm">
            Built for real-time interaction. No data is sold, just votes counted.
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---

function JoinPollBox({ onJoin }: { onJoin: (id: string) => void }) {
  const [code, setCode] = useState("");
  return (
    <div className="flex items-center bg-white border border-zinc-200 rounded-2xl p-1 pl-4 w-full sm:w-auto shadow-sm">
      <input 
        type="text" 
        placeholder="Enter Code (e.g. AB12)" 
        className="bg-transparent border-none focus:outline-none text-sm font-mono uppercase w-32"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      <Button 
        variant="secondary" 
        className="rounded-xl px-4 py-2"
        onClick={() => code && onJoin(code)}
      >
        Join
      </Button>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="flex flex-col gap-4 hover:border-zinc-300 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="font-bold">{title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
      </div>
    </Card>
  );
}

function CreatePollForm({ onSubmit, onCancel }: { onSubmit: (config: any) => void; onCancel: () => void }) {
  const [type, setType] = useState<"general" | "popularity">("general");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ text: "", options: ["", ""] }]);
  const [deadline, setDeadline] = useState("10"); // minutes

  const addQuestion = () => setQuestions([...questions, { text: "", options: ["", ""] }]);
  const removeQuestion = (qIndex: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== qIndex));
    }
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push("");
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    if (questions[qIndex].options.length > 2) {
      const newQuestions = [...questions];
      newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
      setQuestions(newQuestions);
    }
  };

  const updateQuestionText = (qIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].text = value;
    setQuestions(newQuestions);
  };

  const updateOptionText = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const isFormValid = useMemo(() => {
    if (!title.trim()) return false;
    if (type === "general") {
      return questions.every(q => q.text.trim() && q.options.every(o => o.trim()));
    } else {
      // Popularity mode only needs the first question text
      return questions[0].text.trim() !== "";
    }
  }, [title, type, questions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit({
        type,
        title,
        // For popularity, we only send the first question and clear its options
        questions: type === "popularity" 
          ? [{ ...questions[0], options: [] }] 
          : questions,
        deadline: type === "popularity" ? parseInt(deadline) : undefined
      });
    }
  };

  return (
    <Card className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Create New Evaluation</h2>
        <p className="text-zinc-500 text-sm">Choose your evaluation type and set up the details.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setType("general")}
          className={cn(
            "p-4 rounded-2xl border-2 text-left transition-all space-y-2",
            type === "general" ? "border-black bg-zinc-50" : "border-zinc-100 hover:border-zinc-200"
          )}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", type === "general" ? "bg-black text-white" : "bg-zinc-100 text-zinc-400")}>
            <FileText size={20} />
          </div>
          <div>
            <p className="font-bold">General Poll</p>
            <p className="text-xs text-zinc-500">Multiple questions, instant voting.</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setType("popularity")}
          className={cn(
            "p-4 rounded-2xl border-2 text-left transition-all space-y-2",
            type === "popularity" ? "border-black bg-zinc-50" : "border-zinc-100 hover:border-zinc-200"
          )}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", type === "popularity" ? "bg-black text-white" : "bg-zinc-100 text-zinc-400")}>
            <Users size={20} />
          </div>
          <div>
            <p className="font-bold">Popularity Vote</p>
            <p className="text-xs text-zinc-500">Team registration, media uploads.</p>
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-6">
          <Input 
            label="Evaluation Title" 
            placeholder="e.g. Hackathon Final Presentations" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {type === "popularity" && (
            <Input 
              label="Registration Deadline (minutes)" 
              type="number"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-8">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
            {type === "general" ? "Evaluation Criteria" : "Popularity Question"}
          </label>
          
          {(type === "general" ? questions : [questions[0]]).map((q, qIndex) => (
            <div key={qIndex} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-6 relative">
              {type === "general" && questions.length > 1 && (
                <button 
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              )}
              
              <Input 
                label={type === "general" ? `Question ${qIndex + 1}` : "What are we voting for?"} 
                placeholder={type === "general" ? "What would you like to ask?" : "e.g. Who had the best presentation?"} 
                value={q.text}
                onChange={(e) => updateQuestionText(qIndex, e.target.value)}
              />

              {type === "general" && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">Options</label>
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white"
                      />
                      {q.options.length > 2 && (
                        <button 
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Plus className="rotate-45" size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-2 py-3 bg-white" 
                    onClick={() => addOption(qIndex)}
                  >
                    <Plus size={18} />
                    Add Option
                  </Button>
                </div>
              )}
            </div>
          ))}

          {type === "general" && (
            <Button 
              variant="secondary" 
              className="w-full py-4 border-2 border-zinc-200" 
              onClick={addQuestion}
            >
              <Plus size={18} />
              Add Another Question
            </Button>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1 py-4 rounded-2xl" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1 py-4 rounded-2xl"
            disabled={!isFormValid}
          >
            Launch {type === "general" ? "Poll" : "Registration"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function MediaGallery({ media }: { media: MediaItem[] }) {
  if (media.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {media.map((item, index) => (
        <div key={index} className="group relative bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200">
          {item.type === "image" && (
            <img src={item.url} alt={item.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
          )}
          {item.type === "video" && (
            <div className="w-full h-48 bg-black flex items-center justify-center">
              <Video className="text-white/50" size={48} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
                  <Play fill="currentColor" size={24} />
                </a>
              </div>
            </div>
          )}
          {item.type === "audio" && (
            <div className="w-full h-48 flex flex-col items-center justify-center gap-2">
              <Music className="text-zinc-400" size={48} />
              <audio controls className="w-full px-4">
                <source src={item.url} />
              </audio>
            </div>
          )}
          {item.type === "link" && (
            <div className="w-full h-48 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <FileText className="text-zinc-400" size={48} />
              <p className="font-medium text-sm line-clamp-2">{item.title || item.url}</p>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                View Resource <ExternalLink size={12} />
              </a>
            </div>
          )}
          {item.title && (
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white text-xs font-medium">
              {item.title}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TeamRegistrationView({ poll, onRegister }: { poll: Poll; onRegister: (teamName: string, media: MediaItem[]) => void }) {
  const [teamName, setTeamName] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<MediaItem["type"]>("image");
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const addMedia = () => {
    if (!newUrl) return;
    const newItem: MediaItem = { type: newType, url: newUrl, title: newTitle };
    setMedia([...media, newItem]);
    setNewUrl("");
    setNewTitle("");
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!teamName.trim()) return;
    onRegister(teamName, media);
    setIsSubmitted(true);
  };

  if (!isJoined) {
    return <JoinCodeGate poll={poll} onJoin={() => setIsJoined(true)} mode="register" />;
  }

  if (isSubmitted) {
    return (
      <Card className="text-center py-16 space-y-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <Check size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Registration Complete!</h2>
          <p className="text-zinc-500">Your team "{teamName}" has been registered successfully.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Back to Home
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Team Registration</h2>
        <p className="text-zinc-500">Register your team and upload your project materials for evaluation.</p>
      </div>

      <div className="space-y-6">
        <Input 
          label="Team Name" 
          placeholder="Enter your team name" 
          value={teamName} 
          onChange={(e) => setTeamName(e.target.value)} 
        />

        <div className="space-y-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Project Materials</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["image", "video", "audio", "link"] as const).map(type => (
              <button
                key={type}
                onClick={() => setNewType(type)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  newType === type ? "border-black bg-white shadow-sm" : "border-transparent text-zinc-400 hover:text-zinc-600"
                )}
              >
                {type === "image" && <ImageIcon size={20} />}
                {type === "video" && <Video size={20} />}
                {type === "audio" && <Music size={20} />}
                {type === "link" && <LinkIcon size={20} />}
                <span className="text-[10px] font-bold uppercase">{type}</span>
              </button>
            ))}
          </div>
          
          <div className="space-y-3">
            <Input 
              placeholder="Resource URL (e.g. https://...)" 
              value={newUrl} 
              onChange={(e) => setNewUrl(e.target.value)} 
            />
            <Input 
              placeholder="Title (optional)" 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)} 
            />
            <Button variant="outline" className="w-full py-3 bg-white" onClick={addMedia} disabled={!newUrl}>
              <Plus size={18} />
              Add to Gallery
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Current Gallery</h3>
          {media.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 text-sm">
              No assets added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {media.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
                      {item.type === "image" && <ImageIcon size={18} />}
                      {item.type === "video" && <Video size={18} />}
                      {item.type === "audio" && <Music size={18} />}
                      {item.type === "link" && <LinkIcon size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title || "Untitled Resource"}</p>
                      <p className="text-xs text-zinc-400 truncate max-w-[200px]">{item.url}</p>
                    </div>
                  </div>
                  <button onClick={() => removeMedia(index)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-100">
        <Button className="w-full py-4 rounded-2xl text-lg" onClick={handleSubmit} disabled={!teamName.trim()}>
          Complete Registration
        </Button>
      </div>
    </Card>
  );
}

function JoinCodeGate({ poll, onJoin, mode = "vote" }: { poll: Poll; onJoin: () => void; mode?: "vote" | "register" }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const expectedCode = mode === "register" ? poll.registrationCode : poll.joinCode;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.toUpperCase() === expectedCode) {
      onJoin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <Card className="max-w-md mx-auto space-y-8 py-12">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
          {mode === "register" ? <Upload size={32} /> : <Zap size={32} />}
        </div>
        <h2 className="text-2xl font-bold">{mode === "register" ? "Enter Registration Code" : "Enter Join Code"}</h2>
        <p className="text-zinc-500 text-sm">
          {mode === "register" 
            ? "Please enter the 4-digit registration code to upload your team's results." 
            : `Please enter the 4-digit code to join this ${poll.type === "popularity" ? "evaluation" : "poll"}.`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <input 
            type="text" 
            maxLength={4}
            placeholder="0000" 
            className={cn(
              "w-full text-center text-5xl font-mono font-bold tracking-[0.5em] py-6 rounded-2xl border-2 transition-all focus:outline-none uppercase",
              error ? "border-red-500 bg-red-50 text-red-500" : "border-zinc-100 focus:border-black bg-zinc-50"
            )}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoFocus
          />
          {error && <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest">Invalid Code</p>}
        </div>
        <Button type="submit" className="w-full py-4 rounded-2xl text-lg">
          {mode === "register" ? "Start Upload" : "Join Now"}
        </Button>
      </form>
    </Card>
  );
}

function VoteInterface({ poll, onVote, onViewResults }: { poll: Poll; onVote: (responses: { questionId: string; teamId?: string; optionIndex: number }[]) => void; onViewResults: () => void }) {
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [isJoined, setIsJoined] = useState(false);
  const hasVoted = localStorage.getItem(`voted_${poll.id}`) === "true";

  const handleSelect = (questionId: string, teamId: string | undefined, optionIndex: number) => {
    const key = teamId ? `${questionId}_${teamId}` : questionId;
    setSelections(prev => ({ ...prev, [key]: optionIndex }));
  };

  const isComplete = useMemo(() => {
    if (poll.type === "popularity") {
      return selections[poll.questions[0].id] !== undefined;
    }
    if (poll.teams.length > 0) {
      return poll.teams.every(team => 
        poll.questions.every(q => selections[`${q.id}_${team.id}`] !== undefined)
      );
    }
    return poll.questions.every(q => selections[q.id] !== undefined);
  }, [poll, selections]);

  const handleSubmit = () => {
    let responses: any[] = [];
    if (poll.type === "popularity") {
      const optionIndex = selections[poll.questions[0].id];
      const selectedTeam = poll.teams[optionIndex];
      responses = [{
        questionId: poll.questions[0].id,
        teamId: selectedTeam.id,
        optionIndex: 0
      }];
    } else {
      responses = Object.entries(selections).map(([key, optionIndex]) => {
        const parts = key.split("_");
        const questionId = parts[0];
        const teamId = parts[1];
        return {
          questionId,
          teamId,
          optionIndex: optionIndex as number
        };
      });
    }
    onVote(responses);
  };

  if (!isJoined && !hasVoted) {
    return <JoinCodeGate poll={poll} onJoin={() => setIsJoined(true)} />;
  }

  if (poll.status === "setup") {
    return (
      <Card className="text-center py-16 space-y-6">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
          <Clock size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Voting hasn't started yet</h2>
          <p className="text-zinc-500">
            {poll.type === "popularity" ? "Teams are currently uploading their materials." : "The organizer hasn't opened the poll yet."}
            Please check back later.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </Card>
    );
  }

  if (poll.type === "popularity" && poll.teams.length === 0) {
    return (
      <Card className="text-center py-16 space-y-6">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
          <Users size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">No Teams Registered</h2>
          <p className="text-zinc-500">Wait for teams to register their projects before voting starts.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-400">
            <Vote size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">
              {poll.type === "popularity" ? "Popularity Vote" : "Live Evaluation"} • {poll.id}
            </span>
          </div>
          {hasVoted && (
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
              <Check size={12} />
              ALREADY VOTED
            </div>
          )}
        </div>
        <h2 className="text-3xl font-bold tracking-tight leading-tight">{poll.title}</h2>
      </div>

      <div className="space-y-16">
        {poll.type === "popularity" ? (
          <div className="space-y-10">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{poll.questions[0].text}</h3>
              <div className="grid grid-cols-1 gap-6">
                {poll.teams.map((team, index) => {
                  const isSelected = selections[poll.questions[0].id] === index;
                  return (
                    <div key={team.id} className={cn(
                      "p-6 rounded-3xl border-2 transition-all space-y-6",
                      isSelected ? "border-black bg-white shadow-lg" : "border-zinc-100 bg-zinc-50"
                    )}>
                      <div className="flex justify-between items-start">
                        <h4 className="text-lg font-bold">{team.name}</h4>
                        <button
                          onClick={() => handleSelect(poll.questions[0].id, undefined, index)}
                          className={cn(
                            "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                            isSelected ? "bg-black text-white" : "bg-white text-zinc-400 border border-zinc-200 hover:border-zinc-400"
                          )}
                        >
                          {isSelected ? "Selected" : "Select Team"}
                        </button>
                      </div>
                      <MediaGallery media={team.media} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : poll.teams.length > 0 ? (
          poll.teams.map((team, tIndex) => (
            <div key={team.id} className="space-y-8 p-8 bg-zinc-50 rounded-3xl border border-zinc-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Users size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Team {tIndex + 1}</span>
                </div>
                <h3 className="text-2xl font-bold">{team.name}</h3>
              </div>

              <MediaGallery media={team.media} />

              <div className="space-y-10 pt-4">
                {poll.questions.map((q, qIndex) => (
                  <div key={q.id} className="space-y-4">
                    <h4 className="font-bold text-zinc-600 flex gap-2 items-center">
                      <span className="text-xs px-2 py-0.5 bg-zinc-200 rounded text-zinc-500">{qIndex + 1}</span>
                      {q.text}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((option, oIndex) => {
                        const isSelected = selections[`${q.id}_${team.id}`] === oIndex;
                        return (
                          <button
                            key={oIndex}
                            onClick={() => handleSelect(q.id, team.id, oIndex)}
                            className={cn(
                              "text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between group text-sm",
                              isSelected 
                                ? "border-black bg-white shadow-sm" 
                                : "border-transparent bg-white/50 hover:bg-white hover:border-zinc-200"
                            )}
                          >
                            <span className={cn("font-medium", isSelected ? "text-black" : "text-zinc-500")}>
                              {option}
                            </span>
                            {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-12">
            {poll.questions.map((q, qIndex) => (
              <div key={q.id} className="space-y-6">
                <h3 className="text-xl font-bold flex gap-3 items-center">
                  <span className="text-zinc-300">0{qIndex + 1}</span>
                  {q.text}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((option, oIndex) => {
                    const isSelected = selections[q.id] === oIndex;
                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleSelect(q.id, undefined, oIndex)}
                        className={cn(
                          "text-left px-6 py-4 rounded-2xl border-2 transition-all flex items-center justify-between group",
                          isSelected 
                            ? "border-black bg-white shadow-md scale-[1.02]" 
                            : "border-transparent bg-zinc-50 hover:bg-white hover:border-zinc-200"
                        )}
                      >
                        <span className={cn("font-bold", isSelected ? "text-black" : "text-zinc-500")}>
                          {option}
                        </span>
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected ? "border-black bg-black text-white" : "border-zinc-200 group-hover:border-zinc-400"
                        )}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-10 border-t border-zinc-100 flex flex-col gap-4">
        <Button 
          className="w-full py-5 rounded-2xl text-xl font-bold shadow-xl shadow-black/10" 
          disabled={!isComplete || hasVoted}
          onClick={handleSubmit}
        >
          {hasVoted ? "Vote Submitted" : "Submit Evaluation"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onViewResults}>
          View Live Results
        </Button>
      </div>
    </Card>
  );
}

function ResultsDashboard({ poll, results, onVoteAgain, onUpdateStatus }: { poll: Poll; results: VoteResult[]; onVoteAgain: () => void; onUpdateStatus: (status: Poll["status"]) => void }) {
  const [copied, setCopied] = useState(false);
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const hasVoted = localStorage.getItem(`voted_${poll.id}`) === "true";

  useEffect(() => {
    if (poll.deadline && poll.status === "setup") {
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = poll.deadline! - now;
        if (diff <= 0) {
          setTimeLeft("EXPIRED");
          clearInterval(interval);
        } else {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [poll.deadline, poll.status]);

  const getChartData = (question: any, teamId?: string) => {
    return question.options.map((option: string, index: number) => {
      const result = results.find(r => r.questionId === question.id && r.optionIndex === index && (teamId ? r.teamId === teamId : !r.teamId));
      return {
        name: option,
        votes: result ? result.count : 0,
        index
      };
    });
  };

  const totalParticipants = useMemo(() => {
    if (poll.questions.length === 0) return 0;
    const firstQResults = results.filter(r => r.questionId === poll.questions[0].id);
    return firstQResults.reduce((sum, r) => sum + r.count, 0);
  }, [poll, results]);

  const copyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("poll", poll.id);
    url.searchParams.delete("mode");
    url.searchParams.delete("team");
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUploadLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("poll", poll.id);
    url.searchParams.set("mode", "team-upload");
    url.searchParams.delete("team");
    navigator.clipboard.writeText(url.toString());
    setCopiedTeamId("upload");
    setTimeout(() => setCopiedTeamId(null), 2000);
  };

  const COLORS = ['#000000', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "px-3 py-1 text-white text-xs font-bold rounded-full flex items-center gap-1.5",
              poll.status === "voting" ? "bg-emerald-500" : poll.status === "closed" ? "bg-zinc-500" : "bg-amber-500"
            )}>
              {poll.status === "voting" && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
              {poll.status.toUpperCase()}
            </div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              ID: {poll.id} • JOIN CODE: {poll.joinCode} 
              {poll.type === "popularity" && poll.status === "setup" && ` • REG CODE: ${poll.registrationCode}`}
            </span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight leading-tight">{poll.title}</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {poll.status === "setup" && (
            <Button onClick={() => onUpdateStatus("voting")} className="bg-emerald-600 hover:bg-emerald-700">
              Start Voting
            </Button>
          )}
          {poll.status === "voting" && (
            <Button onClick={() => onUpdateStatus("closed")} variant="outline">
              Close Voting
            </Button>
          )}
          {poll.status === "closed" && (
            <Button onClick={() => onUpdateStatus("voting")} variant="outline">
              Reopen Voting
            </Button>
          )}
          <Button variant="outline" onClick={copyLink} className="rounded-xl">
            {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
            {copied ? "Copied!" : "Share Voting Link"}
          </Button>
        </div>
      </div>

      {poll.status === "setup" && poll.type === "popularity" && (
        <div className="space-y-6">
          <Card className="bg-amber-50 border-amber-200">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                <Upload size={24} />
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-amber-900">Team Registration Phase</h3>
                    <p className="text-amber-700 text-sm">Teams are registering and uploading materials.</p>
                  </div>
                  {timeLeft && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Time Remaining</p>
                      <p className="text-2xl font-mono font-bold text-amber-900">{timeLeft}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    className="bg-white border-amber-200 text-amber-900" 
                    onClick={copyUploadLink}
                  >
                    {copiedTeamId === "upload" ? <Check size={18} /> : <Copy size={18} />}
                    {copiedTeamId === "upload" ? "Link Copied!" : "Copy Team Registration Link"}
                  </Button>
                  <div className="text-xs text-amber-600 font-medium">
                    {poll.teams.length} teams registered so far
                  </div>
                </div>
                {poll.teams.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {poll.teams.map(team => (
                      <div key={team.id} className="px-3 py-1 bg-white border border-amber-100 rounded-full text-xs font-medium text-amber-800">
                        {team.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="font-bold">Voting Question</h3>
            <div className="flex gap-2">
              <input 
                type="text"
                className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={poll.questions[0]?.text || ""}
                onChange={(e) => {
                  const newQuestions = [...poll.questions];
                  if (newQuestions[0]) {
                    newQuestions[0].text = e.target.value;
                  } else {
                    newQuestions[0] = { id: "q-popularity", text: e.target.value, options: [] };
                  }
                  socket.emit("update-poll-questions", { pollId: poll.id, questions: newQuestions });
                }}
                placeholder="e.g. Who had the best presentation?"
              />
            </div>
            <p className="text-xs text-zinc-400 italic">This question will be shown to voters. Options will be automatically set to the registered team names.</p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          {poll.type === "popularity" ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Popularity Results</h3>
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                  {results.length} Total Votes
                </div>
              </div>
              
              <Card className="p-8">
                <div className="space-y-8">
                  {poll.teams.map((team, index) => {
                    const teamVotes = results.filter(r => r.teamId === team.id).length;
                    const percentage = results.length > 0 ? (teamVotes / results.length) * 100 : 0;
                    
                    return (
                      <div key={team.id} className="space-y-3">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="font-bold text-lg">{team.name}</p>
                            <p className="text-xs text-zinc-400 font-medium">{teamVotes} votes</p>
                          </div>
                          <p className="font-mono font-bold text-xl">{percentage.toFixed(1)}%</p>
                        </div>
                        <div className="h-4 bg-zinc-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-black rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
                {poll.teams.map(team => (
                  <div key={team.id} className="space-y-4">
                    <h4 className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">{team.name} Materials</h4>
                    <MediaGallery media={team.media} />
                  </div>
                ))}
              </div>
            </div>
          ) : poll.teams.length > 0 ? (
            poll.teams.map((team) => (
              <div key={team.id} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-500">
                    <Users size={16} />
                  </div>
                  <h3 className="text-xl font-bold">{team.name} Results</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {poll.questions.map((q, qIndex) => {
                    const data = getChartData(q, team.id);
                    const qTotal = data.reduce((sum: number, d: any) => sum + d.votes, 0);
                    
                    return (
                      <div key={q.id}>
                        <Card className="flex flex-col p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-sm flex items-center gap-2">
                            <span className="text-zinc-300">{qIndex + 1}</span>
                            {q.text}
                          </h4>
                          <div className="text-[10px] font-bold text-zinc-400">
                            {qTotal} votes
                          </div>
                        </div>

                        <div className="w-full h-[150px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
                              <XAxis type="number" hide />
                              <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={80} 
                                axisLine={false} 
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 500, fill: '#71717a' }}
                              />
                              <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={16}>
                                {data.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </div>
                  );
                })}
                </div>
              </div>
            ))
          ) : (
            poll.questions.map((q, qIndex) => {
              const data = getChartData(q);
              const qTotal = data.reduce((sum: number, d: any) => sum + d.votes, 0);
              
              return (
                <div key={q.id}>
                  <Card className="flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-bold text-lg flex items-center gap-3">
                        <span className="text-zinc-300">0{qIndex + 1}</span>
                        {q.text}
                      </h3>
                      <div className="text-sm font-medium text-zinc-500">
                        {qTotal} votes
                      </div>
                    </div>

                    <div className="w-full h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100} 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 12, fontWeight: 500, fill: '#71717a' }}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f8f8f8' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="votes" radius={[0, 8, 8, 0]} barSize={24}>
                            {data.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-black text-white border-none sticky top-24">
            <div className="space-y-4">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Evaluation Summary</p>
              <div className="space-y-6">
                <div>
                  <p className="text-3xl font-bold">{totalParticipants}</p>
                  <p className="text-zinc-400 text-sm">Total voters</p>
                </div>
                <div className="h-px bg-zinc-800" />
                <div>
                  <p className="text-xl font-bold">{poll.teams.length}</p>
                  <p className="text-zinc-400 text-sm">Teams evaluated</p>
                </div>
              </div>
              
              <div className="pt-6 space-y-3">
                <Button variant="outline" className="w-full justify-start bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800" onClick={onVoteAgain} disabled={poll.status !== "voting"}>
                  <Vote size={18} />
                  {hasVoted ? "Update My Vote" : "Vote Now"}
                </Button>
                <Button variant="outline" className="w-full justify-start bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800" onClick={() => window.location.href = "/"}>
                  <Plus size={18} />
                  New Evaluation
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
