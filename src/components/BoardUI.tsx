import React from 'react';
import { Plus, Trash2, Palette, Type, Square, Circle, LayoutGrid, MessageSquare, Share2, BarChart3 } from 'lucide-react';
import { Button } from './Button';

export const Header: React.FC<{ userName: string }> = ({ userName }) => (
  <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 z-50">
    <div className="font-bold text-xl">Canva-like Board</div>
    <div className="flex items-center gap-4">
      <div className="flex -space-x-2">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">
          {userName.substring(0, 2).toUpperCase()}
        </div>
      </div>
      <Button variant="ghost" size="icon"><Plus size={20} /></Button>
      <Button variant="ghost" size="icon"><BarChart3 size={20} /></Button>
      <Button variant="ghost" size="icon"><MessageSquare size={20} /></Button>
      <Button className="flex items-center gap-2">
        <Share2 size={18} /> Share
      </Button>
    </div>
  </header>
);

export const Toolbar: React.FC<{ addNote: () => void; addGroup: () => void }> = ({ addNote, addGroup }) => (
  <aside className="fixed left-0 top-14 bottom-0 w-16 bg-white border-r border-zinc-200 flex flex-col items-center py-4 gap-4 z-40">
    <Button variant="ghost" size="icon" onClick={addNote} title="Add Sticky Note"><Type size={24} /></Button>
    <Button variant="ghost" size="icon" onClick={addGroup} title="Add Group"><LayoutGrid size={24} /></Button>
    <Button variant="ghost" size="icon"><Square size={24} /></Button>
    <Button variant="ghost" size="icon"><Circle size={24} /></Button>
  </aside>
);

export const Footer: React.FC<{ scale: number; setScale: (s: number) => void }> = ({ scale, setScale }) => (
  <footer className="fixed bottom-0 left-0 right-0 h-12 bg-white border-t border-zinc-200 flex items-center justify-between px-4 z-50">
    <div className="flex items-center gap-2">
      <input 
        type="range" 
        min="0.5" 
        max="2" 
        step="0.1" 
        value={scale} 
        onChange={(e) => setScale(parseFloat(e.target.value))}
        className="w-32"
      />
      <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
    </div>
  </footer>
);
