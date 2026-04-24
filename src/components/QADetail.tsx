import { motion } from "motion/react";
import React, { useState, useEffect } from "react";
import { Send, ThumbsUp, Plus } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { QAQuestion, QACard, QAPage } from "../types";
import { subscribeToQuestions, addQuestion, voteQuestion, subscribeToPages, addPage } from "../services/firebaseService";

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', 
  '#a855f7', '#ec4899', '#64748b', '#06b6d4', '#84cc16'
];

export const QADetail = ({ 
  pollId, 
  userId,
  card,
  onBack,
  isAdmin
}: { 
  pollId: string; 
  userId: string;
  card: QACard;
  onBack: () => void;
  isAdmin: boolean;
}) => {
  const [pages, setPages] = useState<QAPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToPages(pollId, card.id, (data) => {
      setPages(data);
      if (data.length > 0 && !selectedPageId) {
        setSelectedPageId(data[0].id);
      }
    });
    return () => unsubscribe();
  }, [pollId, card.id, selectedPageId]);

  useEffect(() => {
    if (!selectedPageId) return;
    const unsubscribe = subscribeToQuestions(pollId, card.id, selectedPageId, (data) => {
      setQuestions(data.sort((a, b) => b.votes - a.votes));
    });
    return () => unsubscribe();
  }, [pollId, card.id, selectedPageId]);

  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || !selectedPageId) return;
    await addQuestion(pollId, card.id, selectedPageId, userId, newQuestion, selectedColor);
    setNewQuestion("");
    setIsColorPickerOpen(false);
  };

  const handleAddPage = async () => {
    if (!newPageTitle.trim()) return;
    await addPage(pollId, card.id, newPageTitle);
    setNewPageTitle("");
  };

  const filteredQuestions = filterColor 
    ? questions.filter(q => q.color === filterColor) 
    : questions;

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="px-0">← Back to Cards</Button>
      <div>
        <h2 className="text-2xl font-bold">{card.title}</h2>
        <p className="text-zinc-500">{card.description}</p>
      </div>
      
      <div className="space-y-4">
        {/* Topic Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-2 border-b border-zinc-200">
          {pages.map(page => (
            <motion.button
              key={page.id}
              onClick={() => setSelectedPageId(page.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                scale: selectedPageId === page.id ? (window.innerWidth < 640 ? 1.2 : 2) : 1,
                boxShadow: selectedPageId === page.id 
                  ? "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
                  : "none",
                zIndex: selectedPageId === page.id ? 10 : 0
              }}
              className={`p-4 text-left rounded-xl border transition-colors ${
                selectedPageId === page.id
                  ? "bg-white border-zinc-900 ring-1 ring-zinc-900"
                  : "bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100"
              }`}
            >
              <div className={`font-bold text-lg ${selectedPageId === page.id ? "text-zinc-900" : "text-zinc-700"}`}>
                {page.title}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {new Date(page.createdAt).toLocaleDateString()}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex gap-2 items-center bg-zinc-50 p-3 rounded-lg border border-zinc-200">
            <Input 
              value={newPageTitle} 
              onChange={(e) => setNewPageTitle(e.target.value)} 
              placeholder="새 주제 추가..."
              className="bg-white"
            />
            <Button onClick={handleAddPage} variant="outline" className="shrink-0">
              <Plus size={18} className="mr-1" /> 추가
            </Button>
          </div>
        )}
      </div>

      {selectedPageId && (
        <>
          <Card className="p-4 sm:p-6 space-y-4">
            <h3 className="font-bold">의견 입력하기</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  value={newQuestion} 
                  onChange={(e) => setNewQuestion(e.target.value)} 
                  onFocus={() => setIsColorPickerOpen(true)}
                  placeholder="Type your opinion here..."
                />
                {isColorPickerOpen && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-zinc-200 grid grid-cols-5 gap-2 z-20">
                    {COLORS.map(c => (
                      <button 
                        key={c} 
                        onClick={() => { setSelectedColor(c); setIsColorPickerOpen(false); }} 
                        className={`w-8 h-8 rounded-full border-2 ${selectedColor === c ? 'border-zinc-900' : 'border-transparent'}`} 
                        style={{ backgroundColor: c }} 
                      />
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleAddQuestion}><Send size={18} /></Button>
            </div>
          </Card>
          
          <div className="flex gap-2 items-center">
            <span className="text-sm text-zinc-500">필터:</span>
            <button onClick={() => setFilterColor(null)} className={`w-6 h-6 rounded-full border ${!filterColor ? 'ring-2 ring-zinc-900' : ''}`} style={{ background: 'linear-gradient(45deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #ec4899, #64748b, #06b6d4, #84cc16)' }} />
            {COLORS.map(c => (
              <button key={c} onClick={() => setFilterColor(c)} className={`w-6 h-6 rounded-full ${filterColor === c ? 'ring-2 ring-zinc-900' : ''}`} style={{ backgroundColor: c }} />
            ))}
          </div>

          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <Card 
                key={q.id} 
                className="p-4 flex justify-between items-center" 
                style={{ backgroundColor: q.color ? `${q.color}15` : 'white', borderColor: q.color || '#e4e4e7' }}
              >
                <div>
                  <p className="font-medium">{q.text}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Button variant="outline" onClick={() => voteQuestion(pollId, card.id, selectedPageId, q.id)}>
                  <ThumbsUp size={16} className="mr-2" /> {q.votes}
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
