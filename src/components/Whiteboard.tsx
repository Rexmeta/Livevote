import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Toolbar, Footer } from './BoardUI';

interface StickyNote {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface Group {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

const COLORS = ['bg-yellow-200', 'bg-green-200', 'bg-blue-200', 'bg-pink-200'];
const GROUP_COLORS = ['border-zinc-300 bg-zinc-50', 'border-blue-300 bg-blue-50', 'border-green-300 bg-green-50'];

export const Whiteboard: React.FC<{ userName: string }> = ({ userName }) => {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [otherCursors, setOtherCursors] = useState<Record<string, { x: number, y: number, name: string }>>({});
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io({ query: { userName } });

    socketRef.current.on('init', (state) => {
      setNotes(state.notes);
      setGroups(state.groups);
    });

    socketRef.current.on('note:created', (note) => {
      setNotes(prev => [...prev.filter(n => n.id !== note.id), note]);
    });

    socketRef.current.on('note:moved', ({ id, x, y }) => {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
    });

    socketRef.current.on('note:updated', ({ id, text, color }) => {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, text: text || n.text, color: color || n.color } : n));
    });

    socketRef.current.on('note:deleted', (id) => {
      setNotes(prev => prev.filter(n => n.id !== id));
    });

    socketRef.current.on('group:created', (group) => {
      setGroups(prev => [...prev.filter(g => g.id !== group.id), group]);
    });

    socketRef.current.on('group:moved', ({ id, x, y }) => {
      setGroups(prev => prev.map(g => g.id === id ? { ...g, x, y } : g));
    });

    socketRef.current.on('cursor:moved', ({ id, x, y, name }) => {
      setOtherCursors(prev => ({ ...prev, [id]: { x, y, name } }));
    });

    socketRef.current.on('user:disconnected', (id) => {
      setOtherCursors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userName]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (socketRef.current) {
        socketRef.current.emit('cursor:moved', { x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const addNote = () => {
    const gridSize = 200;
    const cols = Math.floor(window.innerWidth / gridSize);
    const newIndex = notes.length;
    const x = (newIndex % cols) * gridSize + 20;
    const y = Math.floor(newIndex / cols) * gridSize + 80;

    const newNote: StickyNote = {
      id: Math.random().toString(36).substring(2, 9),
      text: 'New Note',
      x,
      y,
      color: COLORS[notes.length % COLORS.length]
    };
    setNotes([...notes, newNote]);
    socketRef.current?.emit('note:created', newNote);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    socketRef.current?.emit('note:deleted', id);
  };

  const updateNotePosition = (id: string, x: number, y: number) => {
    setNotes(notes.map(note => note.id === id ? { ...note, x, y } : note));
    socketRef.current?.emit('note:moved', { id, x, y });
  };

  const updateNoteColor = (id: string, color: string) => {
    setNotes(notes.map(note => note.id === id ? { ...note, color } : note));
    socketRef.current?.emit('note:updated', { id, color });
  };

  const addGroup = () => {
    const newGroup: Group = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'New Group',
      x: 50 + groups.length * 50,
      y: 50 + groups.length * 50,
      width: 300,
      height: 200,
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length]
    };
    setGroups([...groups, newGroup]);
    socketRef.current?.emit('group:created', newGroup);
  };

  const updateGroupPosition = (id: string, x: number, y: number) => {
    setGroups(groups.map(group => group.id === id ? { ...group, x, y } : group));
    socketRef.current?.emit('group:moved', { id, x, y });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSpeed = 0.001;
    const newScale = Math.min(Math.max(scale - e.deltaY * zoomSpeed, 0.5), 2);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div 
      className="h-full w-full bg-zinc-100 relative overflow-hidden cursor-grab active:cursor-grabbing pb-12 pl-16"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Toolbar addNote={addNote} addGroup={addGroup} />
      <Footer scale={scale} setScale={setScale} />
      
      {Object.entries(otherCursors).map(([id, cursor]: [string, { x: number, y: number, name: string }]) => (
        <motion.div
          key={id}
          className="fixed z-50 pointer-events-none"
          animate={{ left: cursor.x, top: cursor.y }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1.5" />
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-md mt-1 ml-2 whitespace-nowrap">
            {cursor.name}
          </div>
        </motion.div>
      ))}

      <motion.div
        animate={{ scale, x: pan.x, y: pan.y }}
        className="w-full h-full"
      >
        {groups.map(group => (
          <motion.div
            key={group.id}
            drag
            dragMomentum={false}
            onDragEnd={(_, info) => updateGroupPosition(group.id, group.x + info.offset.x / scale, group.y + info.offset.y / scale)}
            className={`absolute p-4 border-2 rounded-xl ${group.color} cursor-move`}
            style={{ left: group.x, top: group.y, width: group.width, height: group.height }}
          >
            <input
              className="w-full bg-transparent font-bold focus:outline-none"
              defaultValue={group.title}
            />
          </motion.div>
        ))}
        {notes.map(note => (
          <motion.div
            key={note.id}
            drag
            dragMomentum={false}
            onDragEnd={(_, info) => updateNotePosition(note.id, note.x + info.offset.x / scale, note.y + info.offset.y / scale)}
            className={`absolute p-4 w-48 h-48 ${note.color} shadow-md rounded-lg cursor-move flex flex-col justify-between group`}
            style={{ left: note.x, top: note.y }}
          >
            <textarea
              className="w-full h-full bg-transparent resize-none focus:outline-none font-medium"
              defaultValue={note.text}
            />
            <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => updateNoteColor(note.id, color)}
                    className={`w-4 h-4 rounded-full ${color} border border-zinc-400`}
                  />
                ))}
              </div>
              <button onClick={() => deleteNote(note.id)} className="text-zinc-600 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
