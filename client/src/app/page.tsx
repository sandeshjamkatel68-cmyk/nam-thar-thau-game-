"use client";
import React, { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { usePlayer } from '../context/PlayerContext';
import { SocketEvents } from 'shared/types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { JoinForm } from '../components/lobby/JoinForm';
import { Play, Plus } from 'lucide-react';

export default function Home() {
  const { socket } = useSocket();
  const { playerName, setPlayerName, clientId } = usePlayer();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    
    setIsCreating(true);
    setPlayerName(nameInput.trim());
    
    socket.emit(SocketEvents.ROOM_CREATE, {
      playerName: nameInput.trim(),
      clientId
    });
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-12 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* Hero Section */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="px-4 py-1.5 rounded-full bg-surface-light border border-white/10 text-accent text-sm font-semibold tracking-widest uppercase mb-4 shadow-lg shadow-accent/10">
            Multiplayer Online
          </div>
          <h1 className="text-6xl md:text-8xl font-heading font-black text-white drop-shadow-2xl text-center leading-tight">
            नाम थर ठाउँ <br/>
            <span className="text-gradient">फलफुल</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary font-medium mt-4 max-w-2xl">
            The classic Nepali childhood game, now online. Race against friends to fill all categories before time runs out!
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
          <Card variant="interactive" padding="lg" onClick={() => setIsCreateModalOpen(true)} className="flex flex-col items-center text-center gap-4 group">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-heading font-bold text-white mb-2">Create Room</h3>
              <p className="text-text-secondary text-sm">Start a new game and invite your friends with a code.</p>
            </div>
          </Card>

          <Card variant="interactive" padding="lg" onClick={() => setIsJoinModalOpen(true)} className="flex flex-col items-center text-center gap-4 group">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-accent ml-1" />
            </div>
            <div>
              <h3 className="text-2xl font-heading font-bold text-white mb-2">Join Room</h3>
              <p className="text-text-secondary text-sm">Have a room code? Enter it here to join the fun.</p>
            </div>
          </Card>
        </div>

      </div>

      {/* Create Room Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Game">
        <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
          <Input
            label="Your Name"
            placeholder="Enter your display name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={20}
            required
            autoFocus
          />
          <Button type="submit" size="lg" className="w-full mt-2" isLoading={isCreating} disabled={!nameInput.trim()}>
            Create & Join
          </Button>
        </form>
      </Modal>

      {/* Join Room Modal */}
      <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} title="Join Game">
        <JoinForm />
      </Modal>

    </main>
  );
}
