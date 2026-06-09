'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportChat({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [messages, setMessages] = useState([
    { text: 'Вітаю! Чим можу допомогти?', sender: 'support', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [
      ...prev, 
      { text: input, sender: 'user', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setInput('');
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { text: 'Дякую за звернення! Наш спеціаліст підключиться до чату найближчим часом.', sender: 'support', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 w-[340px] bg-card border border-border rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-[100]"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="bg-primary/10 border-b border-border p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">IT Підтримка</h3>
                <p className="text-[10px] text-green-500 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Спеціаліст онлайн
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 custom-scrollbar bg-background/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${m.sender === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary text-gray-200 border border-border/50 rounded-tl-sm'}`}>
                  {m.text}
                </div>
                <span className="text-[9px] text-gray-500 mt-1.5 px-1">{m.time}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card flex gap-2 items-center">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Напишіть повідомлення..."
              className="flex-1 bg-secondary/50 border border-border rounded-full px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-primary/50 focus:bg-secondary transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send size={16} className="ml-1" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
