import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface CreateWhiteboardModalProps {
  onClose: () => void;
  onCreate: (config: { title: string; description: string; password?: string }) => void;
}

export const CreateWhiteboardModal: React.FC<CreateWhiteboardModalProps> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Whiteboard</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-800">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Board Title" />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Board Description" />
          <Input label="Password (Optional)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <Button className="w-full" onClick={() => { onCreate({ title, description, password }); onClose(); }}>
            Create Board
          </Button>
        </div>
      </div>
    </div>
  );
};
