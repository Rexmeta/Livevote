import React, { useState, useEffect } from "react";
import { Trash2, Lock, Clock, BarChart3 } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { QACard } from "../types";
import { subscribeToQACards, deleteQACard, updateQACard } from "../services/firebaseService";

export const AdminQA = ({ 
  pollId,
  setConfirmTitle,
  setConfirmMessage,
  setConfirmAction,
  setShowConfirmModal
}: { 
  pollId: string;
  setConfirmTitle: (title: string) => void;
  setConfirmMessage: (message: string) => void;
  setConfirmAction: (action: (() => void) | null) => void;
  setShowConfirmModal: (show: boolean) => void;
}) => {
  const [cards, setCards] = useState<QACard[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToQACards(pollId, (cards) => {
      setCards(cards);
    });
    return () => unsubscribe();
  }, [pollId]);

  const handleDelete = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("handleDelete called for card:", cardId);
    setConfirmTitle("Delete Card");
    setConfirmMessage("Are you sure you want to delete this card?");
    
    // Set the action to be executed only when the confirm button in the modal is clicked
    setConfirmAction(() => async () => {
      console.log("CONFIRM ACTION EXECUTED for card:", cardId);
      try {
        await deleteQACard(pollId, cardId);
        console.log("Card deleted successfully:", cardId);
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete card. Please check your permissions.");
      }
    });
    
    console.log("setShowConfirmModal(true) called");
    setShowConfirmModal(true);
  };

  const handleUpdatePassword = async (cardId: string, password: string) => {
    await updateQACard(pollId, cardId, { password: password || null });
    alert("Password updated!");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Q&A Card Management</h2>
      <div className="grid gap-4">
        {cards.map((card) => (
          <Card key={card.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold">{card.title}</div>
              <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(card.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Input 
                type="password"
                placeholder="New Password"
                className="w-32"
                onBlur={(e) => handleUpdatePassword(card.id, e.target.value)}
              />
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={(e) => handleDelete(e, card.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
