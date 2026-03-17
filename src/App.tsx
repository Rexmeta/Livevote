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
  FileText,
  Layout,
  Target,
  Trophy,
  Send,
  CheckCircle2,
  Lock,
  Shield,
  Settings,
  Maximize2,
  LogOut,
  Home
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { auth, storage } from "./firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { 
  subscribeToPolls, 
  subscribeToMissions, 
  subscribeToPoll, 
  subscribeToMission, 
  subscribeToVotes,
  getPoll,
  getMission,
  castVote,
  updatePoll,
  updateMission,
  createPoll,
  createMission,
  getUserProfile,
  createUserProfile,
  deletePoll as apiDeletePoll,
  deleteMission as apiDeleteMission,
  arrayUnion,
  arrayRemove,
  increment
} from "./services/firebaseService";
import { cn } from "./lib/utils";
import { openMediaInNewTab } from "./lib/mediaUtils";
import { Poll, VoteResult, AppView, MediaItem, Team, MissionActivity, MissionCard, User } from "./types";
import { MISSION_TEMPLATES } from "./constants";
import { PasswordModal } from "./components/PasswordModal";
import { CreateMissionForm, MissionBoard } from "./components/Mission";
import { MediaViewer } from "./components/MediaViewer";
import { Button } from "./components/Button";
import { Card } from "./components/Card";
import { Input } from "./components/Input";

// --- Constants ---

// --- Components ---

// --- Admin Dashboard ---

function AdminDashboard({ token, onNavigate }: { token: string; onNavigate: (view: AppView, id?: string) => void }) {
  const [polls, setPolls] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pollsData = await new Promise<any[]>((resolve) => {
        const unsubscribe = subscribeToPolls((data) => {
          unsubscribe();
          resolve(data);
        });
      });
      const missionsData = await new Promise<any[]>((resolve) => {
        const unsubscribe = subscribeToMissions((data) => {
          unsubscribe();
          resolve(data);
        });
      });
      setPolls(pollsData);
      setMissions(missionsData);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deletePoll = async (id: string) => {
    await apiDeletePoll(id);
    await fetchData();
  };

  const deleteMission = async (id: string) => {
    await apiDeleteMission(id);
    await fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><Clock className="animate-spin text-zinc-300" size={48} /></div>;

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">ADMIN DASHBOARD</h2>
          <p className="text-zinc-500 font-medium">Manage all active and past activities</p>
        </div>
        <Button onClick={fetchData} variant="ghost">Refresh</Button>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Vote size={20} />
            Polls ({polls.length})
          </h3>
          <div className="grid gap-4">
            {polls.map(poll => (
              <Card key={poll.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">{poll.title}</div>
                  <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                    <span>ID: {poll.id} • Status: {poll.status} • Created: {new Date(poll.createdAt).toLocaleDateString()}</span>
                    <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded font-bold">{poll.teamCount || 0} Teams</span>
                    <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded font-bold">{poll.voteCount || 0} Voters</span>
                    {poll.joinCode && <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded font-mono font-bold">JOIN: {poll.joinCode}</span>}
                    {poll.registrationCode && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono font-bold">REG: {poll.registrationCode}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onNavigate("results", poll.id)}>View</Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => {
                    {
                      setConfirmTitle("투표 삭제");
                      setConfirmMessage("정말 이 투표를 삭제하시겠습니까?");
                      setConfirmAction(() => () => deletePoll(poll.id));
                      setShowConfirmModal(true);
                    }
                  }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target size={20} />
            Missions ({missions.length})
          </h3>
          <div className="grid gap-4">
            {missions.map(mission => (
              <Card key={mission.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">{mission.title}</div>
                  <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                    <span>ID: {mission.id} • Status: {mission.status} • Teams: {mission.teamCount}</span>
                    {mission.joinCode && <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded font-mono font-bold">JOIN: {mission.joinCode}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("mission", mission.id);
                    window.history.pushState({}, "", url);
                    // Instead of reload, we should ideally have a way to trigger the URL check logic
                    // For now, let's just navigate to home and then the URL check might handle it if we are lucky
                    // Or better, just call the navigateToMission logic if we had access to it.
                    // Since we are in a subcomponent, we can pass it down.
                    window.location.reload(); 
                  }}>View</Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => {
                    {
                      setConfirmTitle("미션 삭제");
                      setConfirmMessage("정말 이 미션을 삭제하시겠습니까?");
                      setConfirmAction(() => () => deleteMission(mission.id));
                      setShowConfirmModal(true);
                    }
                  }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// --- Auth Component ---

function Auth({ onAuthSuccess, onCancel }: { onAuthSuccess: (user: User, token: string) => void; onCancel: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getUserProfile(userCredential.user.uid);
        const isAdminEmail = (userCredential.user.email?.toLowerCase() === "btobkorea@gmail.com" || email.toLowerCase() === "btobkorea@gmail.com");
        
        if (profile) {
          if (isAdminEmail && profile.role !== "admin") {
            profile.role = "admin";
          }
          onAuthSuccess(profile, await userCredential.user.getIdToken());
        } else {
          // Fallback if profile missing
          const fallbackUser: User = {
            id: userCredential.user.uid,
            email: userCredential.user.email || email,
            role: isAdminEmail ? "admin" : "user"
          };
          onAuthSuccess(fallbackUser, await userCredential.user.getIdToken());
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const role = email === "btobkorea@gmail.com" ? "admin" : "user";
        const newUser: User = {
          id: userCredential.user.uid,
          email: email,
          role: role
        };
        await createUserProfile(newUser);
        onAuthSuccess(newUser, await userCredential.user.getIdToken());
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/network-request-failed") {
        setError("Network error: Please check your connection or try again. If this persists, the Firebase project might still be provisioning.");
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tighter uppercase">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-zinc-500 font-medium">
          {mode === "login" ? "Login to manage your activities" : "Join us to start creating polls and missions"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Email Address</label>
          <Input 
            type="email" 
            placeholder="you@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Password</label>
          <Input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {mode === "signup" && (
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Confirm Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="pt-2 space-y-3">
          <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
            {loading ? "Processing..." : (mode === "login" ? "Login" : "Sign Up")}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>

      <div className="pt-4 text-center">
        <button 
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-sm font-bold text-zinc-500 hover:text-black transition-colors"
        >
          {mode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </button>
      </div>
    </Card>
  );
}

// --- Main App ---

export default function App() {
  const [topTab, setTopTab] = useState<"vote" | "mission">("vote");
  const [view, setView] = useState<AppView>("home");
  const [currentPollId, setCurrentPollId] = useState<string | null>(null);
  const [currentMissionId, setCurrentMissionId] = useState<string | null>(null);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [pollData, setPollData] = useState<Poll | null>(null);
  const [missionData, setMissionData] = useState<MissionActivity | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [activePolls, setActivePolls] = useState<any[]>([]);
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [pendingMissionId, setPendingMissionId] = useState<string | null>(null);
  const [pendingPollId, setPendingPollId] = useState<string | null>(null);
  const [pendingPollView, setPendingPollView] = useState<AppView | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("vote_token"));
  const [userId] = useState(() => {
    const saved = localStorage.getItem("vote_user_id");
    if (saved) return saved;
    const id = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("vote_user_id", id);
    return id;
  });
  const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);
  const [resetCardId, setResetCardId] = useState<string | null>(null);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [joinCodeInfo, setJoinCodeInfo] = useState<{ title: string; joinCode?: string; registrationCode?: string } | null>(null);

  // Check/Register user and role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        const isAdminEmail = firebaseUser.email?.toLowerCase() === "btobkorea@gmail.com";
        
        if (profile) {
          // Force admin role if email matches, even if Firestore is out of sync
          if (isAdminEmail && profile.role !== "admin") {
            profile.role = "admin";
          }
          setUser(profile);
        } else {
          // Fallback if profile doesn't exist in Firestore yet
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            role: isAdminEmail ? "admin" : "user"
          });
        }
        setToken(await firebaseUser.getIdToken());
      } else {
        setUser(null);
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    setView("home");
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    setView("home");
  };

  // Fetch active polls for home screen
  useEffect(() => {
    if (view === "home") {
      if (topTab === "vote") {
        return subscribeToPolls(setActivePolls);
      } else {
        return subscribeToMissions(setActiveMissions);
      }
    }
  }, [view, topTab]);

  // Handle socket events for missions
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (currentMissionId) {
      unsubscribe = subscribeToMission(currentMissionId, (data) => {
        if (data) setMissionData(data);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentMissionId]);

  const navigateToMission = (missionId: string) => {
    const mission = activeMissions.find(m => m.id === missionId);
    if (mission?.hasPassword) {
      setPendingMissionId(missionId);
      setShowPasswordModal(true);
      setPasswordInput("");
      setPasswordError(false);
      return;
    }
    
    setTopTab("mission");
    setCurrentMissionId(missionId);
    setMissionData(null); // Reset to show loading spinner
    setView("results"); // We'll reuse 'results' view for the mission board
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("mission", missionId);
    url.searchParams.delete("poll");
    url.searchParams.delete("mode");
    window.history.pushState({}, "", url);

    getMission(missionId).then(data => {
      if (!data) {
        setMissionData(null);
        setView("home");
        return;
      }
      setMissionData(data);
    }).catch(err => {
      console.error("Error fetching mission:", err);
      setMissionData(null);
      setView("home");
    });
  };

  const handlePasswordSubmit = () => {
    if (pendingMissionId) {
      getMission(pendingMissionId).then(data => {
        if (data && data.joinCode === passwordInput) {
          setTopTab("mission");
          setCurrentMissionId(pendingMissionId);
          setMissionData(null); // Reset to show loading spinner
          setView("results");
          setMissionData(data);
          
          // Update URL
          const url = new URL(window.location.href);
          url.searchParams.set("mission", pendingMissionId);
          url.searchParams.delete("poll");
          url.searchParams.delete("mode");
          window.history.pushState({}, "", url);

          setShowPasswordModal(false);
          setPendingMissionId(null);
        } else {
          setPasswordError(true);
        }
      }).catch(err => console.error("Error verifying password:", err));
    } else if (pendingPollId && pendingPollView) {
      getPoll(pendingPollId).then(data => {
        if (data && data.joinCode === passwordInput) {
          setTopTab("vote");
          setCurrentPollId(pendingPollId);
          setPollData(null);
          
          const url = new URL(window.location.href);
          url.searchParams.set("poll", pendingPollId);
          if (pendingPollView === "results") {
            url.searchParams.set("mode", "results");
          } else if (pendingPollView === "team-upload") {
            url.searchParams.set("mode", "team-upload");
          }
          window.history.pushState({}, "", url);

          setView(pendingPollView);
          setPollData(data);
          setShowPasswordModal(false);
          setPendingPollId(null);
          setPendingPollView(null);
        } else {
          setPasswordError(true);
        }
      }).catch(err => console.error("Error verifying password:", err));
    }
  };

  const handleShowCodes = async (type: "poll" | "mission", id: string, title: string) => {
    try {
      const data = type === "poll" ? await getPoll(id) : await getMission(id);
      if (data) {
        setJoinCodeInfo({
          title,
          joinCode: data.joinCode,
          registrationCode: (data as any).registrationCode
        });
        setShowJoinCodeModal(true);
      }
    } catch (err) {
      console.error("Error fetching codes:", err);
    }
  };

  const handleCreateMission = (config: { title: string; teamCount: number; joinCode?: string }) => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Assign templates to cards (cycling through templates if teamCount > 10)
    const cards: MissionCard[] = Array.from({ length: config.teamCount }).map((_, i) => ({
      id: `card-${i}-${Date.now()}`,
      templateId: MISSION_TEMPLATES[i % MISSION_TEMPLATES.length].id,
      status: "available"
    }));

    if (!user) return;
    const newMission: MissionActivity = {
      id,
      title: config.title,
      teamCount: config.teamCount,
      cards,
      status: "active",
      ...(config.joinCode && { joinCode: config.joinCode }),
      uid: user.id,
      createdAt: Date.now(),
      joinedCount: 0
    };

    createMission(newMission)
    .then(() => {
      navigateToMission(id);
    })
    .catch(err => console.error("Error creating mission:", err));
  };

  const handleAssignCard = async (cardId: string, teamName: string, password?: string) => {
    if (!currentMissionId || !missionData) return;
    const updatedCards = missionData.cards.map(c => 
      c.id === cardId ? { ...c, teamName, password, status: "assigned" as const } : c
    );
    const newJoinedCount = (missionData.joinedCount || 0) + 1;
    await updateMission(currentMissionId, { cards: updatedCards, joinedCount: newJoinedCount });
  };

  const handleSubmitMissionResult = async (cardId: string, result: string, password?: string, media?: MediaItem[]) => {
    if (!currentMissionId) return;
    
    const latestMission = await getMission(currentMissionId);
    if (!latestMission) return;
    
    const card = latestMission.cards.find(c => c.id === cardId);
    if (card?.password && card.password !== password) {
      alert("Invalid card password");
      return;
    }
    
    const updatedCards = latestMission.cards.map(c => 
      c.id === cardId ? { ...c, result, media, status: "completed" as const } : c
    );
    await updateMission(currentMissionId, { cards: updatedCards });
  };

  // Check URL for direct poll or mission access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pollId = params.get("poll");
    const missionId = params.get("mission");
    const mode = params.get("mode") as AppView;

    if (pollId) {
      setTopTab("vote");
      setCurrentPollId(pollId);
      if (mode === "team-upload") {
        setView("team-upload");
      } else if (mode === "results") {
        setView("results");
      } else {
        setView("vote");
      }
    } else if (missionId) {
      setTopTab("mission");
      setCurrentMissionId(missionId);
      setView("results");
      getMission(missionId)
        .then(data => setMissionData(data))
        .catch(err => console.error("Error fetching mission:", err));
    }
  }, []);

  // Socket listeners
  useEffect(() => {
    let unsubscribePoll: (() => void) | undefined;
    let unsubscribeVotes: (() => void) | undefined;

    if (currentPollId) {
      unsubscribePoll = subscribeToPoll(currentPollId, (data) => {
        setPollData(data);
      });
      unsubscribeVotes = subscribeToVotes(currentPollId, (updatedResults) => {
        setResults(updatedResults);
      });
    }

    return () => {
      if (unsubscribePoll) unsubscribePoll();
      if (unsubscribeVotes) unsubscribeVotes();
    };
  }, [currentPollId]);

  // Fetch poll data when currentPollId changes
  useEffect(() => {
    if (currentPollId) {
      getPoll(currentPollId)
        .then(data => {
          if (!data) {
            alert("Poll not found");
            setView("home");
            return;
          }
          setPollData(data);
        })
        .catch(err => console.error("Error fetching poll:", err));
    }
  }, [currentPollId]);

  const navigateTo = (newView: AppView, pollId?: string) => {
    const url = new URL(window.location.href);
    if (pollId) {
      const poll = activePolls.find(p => p.id === pollId);
      if (poll?.hasPassword) {
        setPendingPollId(pollId);
        setPendingPollView(newView);
        setShowPasswordModal(true);
        setPasswordInput("");
        setPasswordError(false);
        return;
      }

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
      url.searchParams.delete("mission");
      url.searchParams.delete("team");
      url.searchParams.delete("mode");
      setCurrentPollId(null);
      setCurrentMissionId(null);
      setCurrentTeamId(null);
      setPollData(null);
      setMissionData(null);
    }
    window.history.pushState({}, "", url);
    setView(newView);
  };

  const handleCreatePoll = (config: any) => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const joinCode = config.password || null;
    const registrationCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    if (!user) return;
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
      deadline: config.deadline ? Date.now() + config.deadline * 60000 : null,
      uid: user.id,
      createdAt: Date.now(),
      teamCount: 0,
      voteCount: 0
    };

    createPoll(newPoll)
    .then(() => {
      navigateTo("results", id);
    })
    .catch(err => console.error("Error creating poll:", err));
  };

  const handleRegisterTeam = async (teamName: string, description: string, media: MediaItem[]) => {
    if (!currentPollId) return;
    const newTeam: Team = {
      id: Math.random().toString(36).substring(2, 8).toUpperCase(),
      name: teamName,
      description,
      media
    };
    await updatePoll(currentPollId, { teams: arrayUnion(newTeam) as any, teamCount: increment(1) });
  };

  const handleUpdateStatus = async (id: string, status: Poll["status"] | MissionActivity["status"]) => {
    if (topTab === "vote") {
      await updatePoll(id, { status: status as Poll["status"] });
    } else {
      await updateMission(id, { status: status as MissionActivity["status"] });
    }
  };

  const handleDeleteTeam = async (pollId: string, teamId: string) => {
    if (!pollData) return;
    
    const teamToRemove = pollData.teams.find(t => t.id === teamId);
    if (!teamToRemove) return;

    setConfirmTitle("팀 삭제");
    setConfirmMessage("정말 이 팀을 삭제하시겠습니까? 모든 데이터가 삭제됩니다.");
    setConfirmAction(() => async () => {
      await updatePoll(pollId, { teams: arrayRemove(teamToRemove) as any, teamCount: increment(-1) });
    });
    setShowConfirmModal(true);
  };

  const handleResetMissionCard = async (missionId: string, cardId: string, password: string) => {
    if (!missionData) return;
    
    const card = missionData.cards.find(c => c.id === cardId);
    if (!card) return;

    if (card.password && password !== card.password) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    const updatedCards = missionData.cards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          status: "available" as const,
          teamName: null as any,
          password: null as any,
          result: null as any,
          media: null as any
        };
      }
      return card;
    });

    const newJoinedCount = Math.max((missionData.joinedCount || 0) - 1, 0);
    await updateMission(missionId, { cards: updatedCards, joinedCount: newJoinedCount });
    setResetCardId(null);
    setShowPasswordModal(false);
  };

  const handleVote = async (responses: { questionId: string; teamId?: string; optionIndex: number }[]) => {
    console.log("handleVote called", { currentPollId, responses });
    if (!currentPollId) return;
    if (localStorage.getItem(`voted_${currentPollId}`)) {
      alert("이미 투표하셨습니다.");
      return;
    }
    const userId = user?.id || `guest_${Math.random().toString(36).substring(2, 10)}`;
    console.log("Casting vote for user:", userId);
    await castVote(currentPollId, userId, responses);
    localStorage.setItem(`voted_${currentPollId}`, "true");
    navigateTo("results", currentPollId);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center">
            <nav className="flex items-center bg-zinc-100 p-1 rounded-xl">
              <button 
                onClick={() => { setTopTab("vote"); setView("home"); }}
                className={cn(
                  "px-3 sm:px-4 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2",
                  topTab === "vote" ? "bg-white shadow-sm text-black" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Vote size={14} />
                Live Vote
              </button>
              <button 
                onClick={() => { setTopTab("mission"); setView("home"); }}
                className={cn(
                  "px-3 sm:px-4 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2",
                  topTab === "mission" ? "bg-white shadow-sm text-black" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Target size={14} />
                Team Mission
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {(user?.role === "admin" || user?.email?.toLowerCase() === "btobkorea@gmail.com") && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setView("admin")}
                className={cn("px-2 sm:px-3 border border-zinc-200 bg-zinc-50", view === "admin" && "bg-zinc-200 border-zinc-400")}
              >
                <Shield size={18} className="text-black" />
                <span className="ml-2">Admin</span>
              </Button>
            )}
            {user ? (
              <Button variant="ghost" onClick={handleLogout} size="sm" className="px-2 sm:px-3">
                <LogOut size={18} />
                <span className="hidden md:inline ml-2">Logout</span>
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setView("auth")} size="sm" className="px-2 sm:px-3">
                <Users size={18} />
                <span className="hidden md:inline ml-2">Login</span>
              </Button>
            )}
            {view !== "home" && (
              <Button variant="ghost" onClick={() => setView("home")} size="sm" className="px-2 sm:px-3">
                <Home size={18} />
                <span className="hidden md:inline ml-2">Home</span>
              </Button>
            )}
            <Button 
              variant="primary" 
              size="sm"
              className="rounded-full px-3 sm:px-5 h-9"
              onClick={() => {
                if (!user) {
                  setView("auth");
                } else {
                  setView("create");
                }
              }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline ml-1.5">Create</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <AnimatePresence mode="wait">
          {view === "auth" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <Auth onAuthSuccess={handleAuthSuccess} onCancel={() => setView("home")} />
            </motion.div>
          )}

          {view === "admin" && user?.role === "admin" && token && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AdminDashboard token={token} onNavigate={(v, id) => navigateTo(v, id)} />
            </motion.div>
          )}

          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="max-w-2xl">
                <h2 className="text-5xl sm:text-6xl font-black tracking-tighter leading-[0.9] mb-6">
                  {topTab === "vote" ? "REAL-TIME VOTING MADE SIMPLE." : "TEAM MISSIONS FOR COLLABORATION."}
                </h2>
                <p className="text-xl text-zinc-500 font-medium leading-relaxed">
                  {topTab === "vote" 
                    ? "Engage your audience with live polls, popularity contests, and instant results."
                    : "Assign creative tasks to teams and share results in real-time."}
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
                  <Button 
                    className="w-full sm:w-auto px-8 py-4 text-lg rounded-2xl" 
                    onClick={() => {
                      if (!user) {
                        setView("auth");
                      } else {
                        setView("create");
                      }
                    }}
                  >
                    Create a {topTab === "vote" ? "Poll" : "Mission"}
                  </Button>
                  {topTab === "vote" && <JoinPollBox onJoin={(id) => navigateTo("vote", id)} />}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topTab === "vote" ? (
                  activePolls.map((poll) => (
                    <Card 
                      key={poll.id} 
                      className="group hover:border-black transition-all cursor-pointer p-8 flex flex-col justify-between aspect-square"
                      onClick={() => {
                        const isAdmin = user?.role === "admin" || poll.uid === user?.id;
                        if (poll.type === "popularity" && poll.status === "setup") {
                          if (isAdmin) {
                            navigateTo("results", poll.id);
                          } else {
                            navigateTo("team-upload", poll.id);
                          }
                        } else {
                          navigateTo("vote", poll.id);
                        }
                      }}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {poll.hasPassword && <Lock size={12} className="text-zinc-600" />}
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase",
                              poll.type === "popularity" ? "bg-violet-100 text-violet-700" :
                              poll.status === "closed" ? "bg-zinc-200 text-zinc-600" : 
                              poll.status === "voting" ? "bg-emerald-100 text-emerald-600" :
                              "bg-blue-100 text-blue-600"
                            )}>
                              {poll.type === "popularity" ? "인기 투표" : (poll.status === "setup" ? "Registration" : poll.status)}
                            </div>
                          </div>
                          <div className="text-xs font-bold text-zinc-300">#{poll.id}</div>
                        </div>
                        <h3 className="text-2xl font-bold leading-tight group-hover:underline decoration-2 underline-offset-4">
                          {poll.title}
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          {poll.type === "popularity" && (
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Users size={14} />
                              <span className="text-[10px] font-bold uppercase tracking-widest">{poll.teams.length} Registered</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Vote size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{poll.voteCount || 0} Voted</span>
                          </div>
                        </div>
                        {(user?.role === "admin" || poll.uid === user?.id) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest bg-zinc-100 hover:bg-zinc-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowCodes("poll", poll.id, poll.title);
                            }}
                          >
                            <Shield size={12} className="mr-1" />
                            Show Codes
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <BarChart3 size={16} />
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {poll.status === "setup" ? "Register Team" : "View Results"}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  activeMissions.map((mission) => (
                    <Card 
                      key={mission.id} 
                      className="group hover:border-emerald-500 transition-all cursor-pointer p-8 flex flex-col justify-between aspect-square"
                      onClick={() => navigateToMission(mission.id)}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {mission.hasPassword && <Lock size={12} className="text-emerald-600" />}
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase",
                              mission.status === "closed" ? "bg-zinc-200 text-zinc-600" : "bg-emerald-100 text-emerald-600"
                            )}>
                              {mission.status === "closed" ? "Completed" : "Active"}
                            </div>
                          </div>
                          <div className="text-xs font-bold text-zinc-300">#{mission.id}</div>
                        </div>
                        <h3 className="text-2xl font-bold leading-tight group-hover:underline decoration-2 underline-offset-4">
                          {mission.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Users size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">
                              {mission.cards.filter(c => c.status === 'completed').length} / {mission.teamCount} Completed
                            </span>
                          </div>
                          {(user?.role === "admin" || mission.uid === user?.id) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest bg-zinc-100 hover:bg-zinc-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowCodes("mission", mission.id, mission.title);
                              }}
                            >
                              <Shield size={12} className="mr-1" />
                              Codes
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                        <div className="flex items-center gap-2 text-zinc-400">
                          {mission.status === "closed" ? <Trophy size={16} /> : <Target size={16} />}
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {mission.status === "closed" ? "View Results" : "Enter Mission Board"}
                          </span>
                        </div>
                        <div className={cn(
                          "w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center transition-all",
                          mission.status === "closed" 
                            ? "group-hover:bg-zinc-800 group-hover:text-white" 
                            : "group-hover:bg-emerald-500 group-hover:text-white"
                        )}>
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </Card>
                  ))
                )}

                <Card 
                  className="border-dashed border-2 border-zinc-200 bg-transparent hover:border-black hover:bg-zinc-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 aspect-square"
                  onClick={() => {
                    if (!user) {
                      setView("auth");
                    } else {
                      setView("create");
                    }
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                    <Plus size={24} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold">Create New {topTab === "vote" ? "Poll" : "Mission"}</div>
                    <div className="text-xs text-zinc-400 font-medium">Start a new activity in seconds</div>
                  </div>
                </Card>
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
              {topTab === "vote" ? (
                <CreatePollForm 
                  onSubmit={handleCreatePoll} 
                  onCancel={() => setView("home")} 
                />
              ) : (
                <CreateMissionForm 
                  onSubmit={handleCreateMission}
                  onCancel={() => setView("home")}
                />
              )}
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
                user={user}
                onVote={handleVote} 
                onViewResults={() => navigateTo("results", currentPollId!)}
                onViewMedia={(item) => setViewingMedia(item)}
              />
            </motion.div>
          )}

          {view === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {topTab === "vote" && pollData ? (
                <ResultsDashboard 
                  poll={pollData} 
                  results={results} 
                  user={user}
                  onVoteAgain={() => navigateTo("vote", currentPollId!)}
                  onUpdateStatus={handleUpdateStatus}
                  onDeleteTeam={handleDeleteTeam}
                  onViewMedia={(item) => setViewingMedia(item)}
                />
              ) : topTab === "mission" && missionData && !missionData.error ? (
                <MissionBoard
                  mission={missionData}
                  user={user}
                  onUpdateStatus={(status) => handleUpdateStatus(missionData.id, status)}
                  onResetCard={(cardId) => {
                    setResetCardId(cardId);
                    setShowPasswordModal(true);
                  }}
                  onAssignCard={handleAssignCard}
                  onSubmitResult={handleSubmitMissionResult}
                  onViewMedia={(item) => setViewingMedia(item)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-zinc-500 font-medium">Loading activity data...</p>
                </div>
              )}
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
                onViewMedia={(item) => setViewingMedia(item)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MediaViewer item={viewingMedia} onClose={() => setViewingMedia(null)} />
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setResetCardId(null);
        }}
        onConfirm={(password) => {
          if (resetCardId && missionData) {
            handleResetMissionCard(missionData.id, resetCardId, password);
          }
        }}
        title="카드 리셋"
        message="이 작업은 모든 팀 진행 상황을 영구적으로 삭제하며 되돌릴 수 없습니다. 비밀번호를 입력하여 확인해주세요."
      />

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

      {/* Password Modal */}
      <AnimatePresence>
        {showJoinCodeModal && joinCodeInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="space-y-2 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-black" size={32} />
                </div>
                <h3 className="text-2xl font-black tracking-tighter uppercase">{joinCodeInfo.title}</h3>
                <p className="text-zinc-500 font-medium text-sm">Admin Access: Join Codes</p>
              </div>

              <div className="space-y-4">
                {joinCodeInfo.joinCode && (
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Join Code (Password)</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-mono font-bold tracking-wider">{joinCodeInfo.joinCode}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          navigator.clipboard.writeText(joinCodeInfo.joinCode!);
                        }}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                )}
                {joinCodeInfo.registrationCode && (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Registration Code</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-mono font-bold tracking-wider text-blue-600">{joinCodeInfo.registrationCode}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600"
                        onClick={() => {
                          navigator.clipboard.writeText(joinCodeInfo.registrationCode!);
                        }}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                )}
                {!joinCodeInfo.joinCode && !joinCodeInfo.registrationCode && (
                  <p className="text-center text-zinc-500 py-4">No codes set for this activity.</p>
                )}
              </div>

              <Button className="w-full py-4 rounded-2xl" onClick={() => setShowJoinCodeModal(false)}>
                Close
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="space-y-2 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black tracking-tighter uppercase">{confirmTitle}</h3>
                <p className="text-zinc-500 font-medium text-sm">{confirmMessage}</p>
                <p className="text-red-500 font-bold text-xs mt-2">이 작업은 되돌릴 수 없습니다.</p>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 py-4 rounded-2xl" onClick={() => setShowConfirmModal(false)}>
                  취소
                </Button>
                <Button className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-700" onClick={() => {
                  confirmAction?.();
                  setShowConfirmModal(false);
                }}>
                  삭제
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
                  <p className="text-zinc-500 text-sm font-medium">This mission activity is password protected.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Enter Password</label>
                    <Input 
                      type="password"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setPasswordError(false);
                      }}
                      placeholder="••••"
                      className={cn(
                        "text-center text-2xl tracking-[0.5em] font-black",
                        passwordError && "border-red-500 ring-red-500"
                      )}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                    />
                    {passwordError && (
                      <p className="text-xs text-red-500 font-bold text-center">Incorrect password. Please try again.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      className="flex-1"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPendingMissionId(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      className="flex-1"
                      onClick={handlePasswordSubmit}
                      disabled={!passwordInput}
                    >
                      Enter
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
        placeholder="Enter Poll ID (e.g. AB12)" 
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
  const [password, setPassword] = useState("");
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
        password: password.trim() || undefined,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input 
              label="Evaluation Title" 
              placeholder="e.g. Hackathon Final Presentations" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input 
              label="Access Password (Optional)" 
              placeholder="Leave blank for public" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>

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

function MediaGallery({ media, onViewMedia }: { media: MediaItem[]; onViewMedia: (item: MediaItem) => void }) {
  if (media.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {media.map((item, index) => (
        <div key={index} className="group relative bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200">
          {item.type === "image" ? (
            <>
              <img src={item.url} alt={item.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
              <div 
                className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewMedia(item);
                }}
              >
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
            </>
          ) : item.type === "video" ? (
            <div className="w-full h-48 bg-black flex items-center justify-center">
              <Video className="text-white/50" size={48} />
              <div 
                className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewMedia(item);
                }}
              >
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
                  <Play fill="currentColor" size={24} />
                </Button>
              </div>
            </div>
          ) : null}
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

function TeamRegistrationView({ poll, onRegister, onViewMedia }: { poll: Poll; onRegister: (teamName: string, description: string, media: MediaItem[]) => void; onViewMedia: (item: MediaItem) => void }) {
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<MediaItem["type"]>("image");
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `media/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload error:", error);
          setError("Failed to upload file. Please try again.");
          setUploadProgress(null);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setMedia(prev => [...prev, { type, url: downloadURL, title: file.name }]);
          setUploadProgress(null);
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload file. Please try again.");
      setUploadProgress(null);
    }
  };

  const handleSubmit = async () => {
    if (!teamName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onRegister(teamName, description, media);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      try {
        const errorInfo = JSON.parse(err.message);
        setError(errorInfo.error || "Failed to register team. Please try again.");
      } catch {
        setError("Failed to register team. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isJoined && !isSubmitted && poll.registrationCode) {
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

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Team Description</label>
          <textarea 
            className="w-full p-4 rounded-2xl border border-zinc-200 focus:border-black focus:ring-1 focus:ring-black transition-all min-h-[100px] text-sm"
            placeholder="Tell us about your team and project..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Project Materials</h3>
          
          <div className="flex flex-wrap gap-3 mb-6">
            {media.map((item, i) => (
              <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-sm border border-zinc-200 group">
                {item.type === "image" ? (
                  <img src={item.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white">
                    <Video size={24} />
                  </div>
                )}
                <div 
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewMedia(item);
                  }}
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewMedia(item);
                    }}
                    className="w-8 h-8 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
                  >
                    <Maximize2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMedia(i);
                    }}
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            
            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-black hover:bg-zinc-50 transition-all">
              <ImageIcon size={24} className="text-zinc-400" />
              <span className="text-[10px] font-bold uppercase">Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "image")} />
            </label>
            
            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-black hover:bg-zinc-50 transition-all">
              <Video size={24} className="text-zinc-400" />
              <span className="text-[10px] font-bold uppercase">Video</span>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, "video")} />
            </label>

            {uploadProgress !== null && (
              <div className="w-full col-span-full mt-2">
                <div className="w-full bg-zinc-200 rounded-full h-2.5">
                  <div className="bg-black h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Uploading: {Math.round(uploadProgress)}%</p>
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-zinc-200 pt-6">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Or Add via Link</p>
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
            
            <div className="flex gap-2">
              <Input 
                placeholder="Resource URL (e.g. https://...)" 
                value={newUrl} 
                onChange={(e) => setNewUrl(e.target.value)} 
                className="flex-1"
              />
              <Button variant="outline" onClick={addMedia} disabled={!newUrl} className="mt-6">Add</Button>
            </div>
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

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="pt-6 border-t border-zinc-100">
        <Button 
          className="w-full py-4 rounded-2xl text-lg" 
          onClick={handleSubmit} 
          disabled={!teamName.trim() || isSubmitting}
        >
          {isSubmitting ? "Registering..." : "Complete Registration"}
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
        <h2 className="text-2xl font-bold">{mode === "register" ? "Enter Registration Code" : "Enter Access Password"}</h2>
        <p className="text-zinc-500 text-sm">
          {mode === "register" 
            ? "Please enter the 4-digit registration code to upload your team's results." 
            : `Please enter the password to join this ${poll.type === "popularity" ? "evaluation" : "poll"}.`}
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

function VoteInterface({ poll, user, onVote, onViewResults, onViewMedia }: { poll: Poll; user: User | null; onVote: (responses: { questionId: string; teamId?: string; optionIndex: number }[]) => void; onViewResults: () => void; onViewMedia: (item: MediaItem) => void }) {
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [isJoined, setIsJoined] = useState(false);
  const hasVoted = localStorage.getItem(`voted_${poll.id}`) === "true";
  console.log("VoteInterface state:", { isJoined, hasVoted, pollStatus: poll.status });

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
  console.log("isComplete:", isComplete);

  const handleSubmit = () => {
    console.log("handleSubmit called", { selections, poll });
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
    console.log("Submitting responses:", responses);
    onVote(responses);
  };

  if (!isJoined && !hasVoted && poll.joinCode) {
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => {
            // Re-trigger data fetch if possible, but don't reload page
            const url = new URL(window.location.href);
            window.history.pushState({}, "", url);
          }}>
            Refresh
          </Button>
          {(user?.role === "admin" || poll.uid === user?.id) && (
            <Button onClick={onViewResults}>
              Go to Dashboard
            </Button>
          )}
        </div>
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => {
            // Re-trigger data fetch if possible, but don't reload page
            const url = new URL(window.location.href);
            window.history.pushState({}, "", url);
          }}>
            Refresh
          </Button>
          {(user?.role === "admin" || poll.uid === user?.id) && (
            <Button onClick={onViewResults}>
              Go to Dashboard
            </Button>
          )}
        </div>
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
                      <MediaGallery media={team.media} onViewMedia={onViewMedia} />
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

              <MediaGallery media={team.media} onViewMedia={onViewMedia} />

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

function ResultsDashboard({ poll, results, user, onVoteAgain, onUpdateStatus, onDeleteTeam, onViewMedia }: { 
  poll: Poll; 
  results: VoteResult[]; 
  user: User | null; 
  onVoteAgain: () => void; 
  onUpdateStatus: (id: string, status: Poll["status"]) => void; 
  onDeleteTeam: (pollId: string, teamId: string) => void;
  onViewMedia: (item: MediaItem) => void 
}) {
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
          {(user?.role === "admin" || poll.uid === user?.id) && (
            <div className="flex flex-wrap gap-2">
              {poll.status === "setup" && (
                <Button onClick={() => onUpdateStatus(poll.id, "voting")} className="bg-emerald-600 hover:bg-emerald-700">
                  Start Voting
                </Button>
              )}
              {poll.status === "voting" && (
                <>
                  <Button onClick={() => onUpdateStatus(poll.id, "setup")} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                    Back to Registration
                  </Button>
                  <Button onClick={() => onUpdateStatus(poll.id, "closed")} variant="primary">
                    Close Voting
                  </Button>
                </>
              )}
              {poll.status === "closed" && (
                <>
                  <Button onClick={() => onUpdateStatus(poll.id, "setup")} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                    Back to Registration
                  </Button>
                  <Button onClick={() => onUpdateStatus(poll.id, "voting")} variant="outline">
                    Reopen Voting
                  </Button>
                </>
              )}
            </div>
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
                onChange={async (e) => {
                  const newQuestions = [...poll.questions];
                  if (newQuestions[0]) {
                    newQuestions[0].text = e.target.value;
                  } else {
                    newQuestions[0] = { id: "q-popularity", text: e.target.value, options: [] };
                  }
                  await updatePoll(poll.id, { questions: newQuestions });
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
                <h3 className="text-2xl font-bold">
                  {poll.status === "setup" ? "Registered Teams" : "Popularity Results"}
                </h3>
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                  {poll.status === "setup" ? `${poll.teams.length} Teams` : `${results.length} Total Votes`}
                </div>
              </div>
              
              {poll.status !== "setup" && (
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
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {poll.teams.map(team => (
                  <Card key={team.id} className="p-6 space-y-6 border-zinc-100 hover:border-zinc-300 transition-all">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xl font-black uppercase tracking-tight">{team.name}</h4>
                        <div className="flex items-center gap-2">
                          {(user?.role === "admin" || poll.uid === user?.id) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => onDeleteTeam(poll.id, team.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                          {poll.status !== "setup" && (
                            <div className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold">
                              {results.filter(r => r.teamId === team.id).length} votes
                            </div>
                          )}
                        </div>
                      </div>
                      {team.description && (
                        <p className="text-zinc-500 text-sm font-medium leading-relaxed">{team.description}</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Uploaded Materials</h5>
                      {team.media && team.media.length > 0 ? (
                        <MediaGallery media={team.media} onViewMedia={onViewMedia} />
                      ) : (
                        <div className="py-8 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2">
                          <ImageIcon className="text-zinc-300" size={24} />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No materials uploaded</span>
                        </div>
                      )}
                    </div>
                  </Card>
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
