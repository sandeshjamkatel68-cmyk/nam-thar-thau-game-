import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { usePlayer } from '../../context/PlayerContext';
import { Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

export const ChatBox: React.FC = () => {
  const { chatMessages, sendMessage } = useChat();
  const { socketId } = usePlayer();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-surface-light/50">
        <h3 className="font-heading font-semibold text-white">Room Chat</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 min-h-[300px]">
        {chatMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.playerId === socketId;
            return (
              <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "self-end items-end" : "self-start items-start")}>
                {!isMe && <span className="text-xs text-text-secondary mb-1 ml-11">{msg.playerName}</span>}
                <div className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                  {!isMe && <Avatar name={msg.playerName} color={msg.avatarColor} size="sm" isConnected={undefined} className="shrink-0 mb-1" />}
                  <div 
                    className={cn(
                      "px-4 py-2 rounded-2xl text-sm break-words",
                      isMe ? "bg-primary text-white rounded-br-sm" : "bg-surface-light text-text-primary rounded-bl-sm"
                    )}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-surface-light/30 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-primary/50 transition-colors"
          maxLength={200}
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          className="p-2 bg-primary text-white rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
