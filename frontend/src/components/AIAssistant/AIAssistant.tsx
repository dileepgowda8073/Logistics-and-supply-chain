import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import clsx from 'clsx';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hi there! I am your SupplyWatch AI Assistant. You can ask me about delayed shipments, inventory levels, or active alerts.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Access global state for context
  const shipments = useStore(s => s.shipments);
  const inventoryItems = useStore(s => s.inventory);
  const alerts = useStore(s => s.alerts);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateResponse = (text: string) => {
    const lower = text.toLowerCase();
    let response = "I'm not sure about that. Could you ask about delays, alerts, or inventory?";

    if (lower.includes('delay') || lower.includes('late')) {
      const delayed = shipments.filter(s => s.status === 'delayed');
      if (delayed.length > 0) {
        response = `Currently, there are ${delayed.length} delayed shipments. The most critical one is ${delayed[0].order_id} heading to ${delayed[0].destination}.`;
      } else {
        response = "Good news! There are currently no delayed shipments on the map.";
      }
    } else if (lower.includes('inventory') || lower.includes('stock')) {
      const lowStock = inventoryItems?.filter(i => i.quantity < i.safety_stock) || [];
      if (lowStock.length > 0) {
        response = `Warning: You have ${lowStock.length} items below safety stock. ${lowStock[0].sku_id} at ${lowStock[0].warehouse_name} is critically low.`;
      } else {
        response = "All warehouses are currently operating above their safety stock requirements.";
      }
    } else if (lower.includes('alert') || lower.includes('issue')) {
      if (alerts.length > 0) {
        response = `There are ${alerts.length} unread alerts. A high priority alert reads: "${alerts[0].message}"`;
      } else {
        response = "Your supply chain is quiet right now. Zero unread alerts.";
      }
    } else if (lower.includes('route') || lower.includes('map')) {
      response = `There are ${shipments.length} active shipments currently being tracked on your live map.`;
    }

    return response;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const responseContent = generateResponse(userMsg);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: responseContent }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center gap-2",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100 hover:scale-110",
          "bg-gradient-to-r from-teal to-blue-500 text-navy-950"
        )}
      >
        <Bot size={24} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-navy-800/80 border-b border-navy-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal to-blue-500 flex items-center justify-center">
                  <Bot size={18} className="text-navy-950" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">SupplyWatch AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                    <span className="text-[10px] text-teal font-medium">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-navy-700 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={clsx(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "self-end flex-row-reverse" : "self-start"
                  )}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-navy-800 border border-navy-700">
                    {msg.role === 'assistant' ? <Bot size={12} className="text-teal" /> : <User size={12} className="text-gray-400" />}
                  </div>
                  <div className={clsx(
                    "p-3 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-teal/20 border border-teal/30 text-white rounded-tr-none" 
                      : "bg-navy-800 border border-navy-700 text-gray-200 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 max-w-[85%] self-start">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-navy-800 border border-navy-700">
                    <Bot size={12} className="text-teal" />
                  </div>
                  <div className="p-3 rounded-2xl bg-navy-800 border border-navy-700 text-gray-200 rounded-tl-none flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-teal" />
                    <span className="text-xs text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-navy-700 bg-navy-800/50">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your supply chain..."
                  className="w-full bg-navy-900 border border-navy-600 rounded-full py-2.5 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1.5 p-2 bg-teal rounded-full text-navy-950 disabled:opacity-50 disabled:bg-gray-600 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
