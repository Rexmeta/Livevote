import React, { useState, useEffect } from "react";
import { Send, ThumbsUp, Plus, X } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { QAQuestion, QACard } from "../types";
import { subscribeToQACards, addQACard, subscribeToQuestions, addQuestion, voteQuestion } from "../services/firebaseService";

export const QA = ({ 
  pollId, 
  userId,
  showCreateModal,
  setShowCreateModal,
  onSelectCard
}: { 
  pollId: string; 
  userId: string;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  onSelectCard: (card: QACard) => void;
}) => {
  const [cards, setCards] = useState<QACard[]>([]);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [newCardPassword, setNewCardPassword] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToQACards(pollId, setCards);
    return () => unsubscribe();
  }, [pollId]);

  const handleAddCard = async () => {
    if (!newCardTitle.trim() || !newCardDescription.trim()) return;
    await addQACard(pollId, userId, newCardTitle, newCardDescription, newCardPassword);
    setNewCardTitle("");
    setNewCardDescription("");
    setNewCardPassword("");
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 space-y-4 w-full max-w-md">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Create Q&A Card</h2>
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}><X size={18} /></Button>
            </div>
            <div className="space-y-2">
              <Input 
                value={newCardTitle} 
                onChange={(e) => setNewCardTitle(e.target.value)} 
                placeholder="Card Title..."
              />
              <Input 
                value={newCardDescription} 
                onChange={(e) => setNewCardDescription(e.target.value)} 
                placeholder="Card Description..."
              />
              <Input 
                type="password"
                value={newCardPassword} 
                onChange={(e) => setNewCardPassword(e.target.value)} 
                placeholder="Password (optional)..."
              />
              <Button onClick={handleAddCard} className="w-full"><Plus size={18} className="mr-2" /> Create Card</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.length > 0 ? (
          cards.map((card) => (
            <Card key={card.id} className="p-6 cursor-pointer hover:border-black aspect-square flex flex-col justify-between" onClick={() => onSelectCard(card)}>
              <h3 className="text-lg font-bold">{card.title}</h3>
              <p className="text-sm text-zinc-600 line-clamp-3">{card.description}</p>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center text-zinc-500 py-12">
            No Q&A cards found. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
};
