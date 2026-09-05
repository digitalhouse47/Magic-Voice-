import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { PROVINCES } from '../utils/constants';
import { Send, LogOut, Info, MessageCircle, UserCircle, MapPin } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user from local storage if exists
  useEffect(() => {
    const savedName = localStorage.getItem('magic_voice_name');
    const savedProv = localStorage.getItem('magic_voice_province');
    if (savedName && savedProv) {
      setName(savedName);
      setProvince(savedProv);
      setIsJoined(true);
      // Add a welcome back message
      setMessages([{
        id: 'system-1',
        sender: 'MagicBot',
        province: 'System',
        text: `Welcome back, ${savedName}! You are connected to the ${savedProv} channel.`,
        timestamp: new Date(),
        isMe: false
      }]);
    }
  }, []);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = () => {
    if (name.trim() && province) {
      localStorage.setItem('magic_voice_name', name);
      localStorage.setItem('magic_voice_province', province);
      setIsJoined(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'MagicBot',
        province: 'System',
        text: `Welcome, ${name} from ${province}! Start chatting now.`,
        timestamp: new Date(),
        isMe: false
      }]);
    }
  };

  const handleLeave = () => {
    localStorage.removeItem('magic_voice_name');
    localStorage.removeItem('magic_voice_province');
    setIsJoined(false);
    setName("");
    setProvince("");
    setMessages([]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: name,
      province: province,
      text: messageText,
      timestamp: new Date(),
      isMe: true
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText("");

    // Simulate a reply for demo purposes
    setTimeout(() => {
      const replies = [
        "That's interesting!",
        "Hello from Jakarta!",
        "Can you share more about that?",
        "Magic Voice is awesome.",
        "Nice to meet you."
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'RandomUser',
        province: PROVINCES[Math.floor(Math.random() * PROVINCES.length)],
        text: randomReply,
        timestamp: new Date(),
        isMe: false
      };
      setMessages(prev => [...prev, botMessage]);
    }, 2000);
  };

  if (!isJoined) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Info Card */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-xl">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                    <Info className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">App Information</h2>
             </div>
             <p className="text-slate-300 mb-4 leading-relaxed">
                Welcome to <span className="text-indigo-400 font-semibold">Magic Voice Development</span>. 
                This application leverages the power of Gemini 2.5 and 3.0 models to provide state-of-the-art voice synthesis and recognition.
             </p>
             <ul className="space-y-3 text-slate-400 text-sm">
                <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span> Text to Speech with multiple realistic voices.
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span> Speech to Text transcription.
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span> Dialogue generation between two AI agents.
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span> Image understanding converted to speech.
                </li>
             </ul>
          </div>

          {/* Join Form */}
          <div className="bg-indigo-900/20 backdrop-blur border border-indigo-500/30 rounded-2xl p-8 shadow-xl flex flex-col justify-center">
             <h2 className="text-2xl font-bold mb-6 text-center">Join Community Chat</h2>
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Enter your nickname"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Province</label>
                    <select 
                        value={province} 
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">Select Province</option>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <button 
                    onClick={handleJoin}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50 transition-all mt-2"
                >
                    Join Group
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
       {/* Info Sidebar (Desktop) */}
       <div className="hidden md:flex flex-col w-1/3 space-y-6">
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <UserCircle className="text-indigo-400" /> My Profile
              </h3>
              <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                      <span>Name:</span>
                      <span className="text-white font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                      <span>Province:</span>
                      <span className="text-white font-medium">{province}</span>
                  </div>
              </div>
              <button 
                onClick={handleLeave}
                className="w-full mt-6 py-2 border border-red-500/50 text-red-300 hover:bg-red-900/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Leave Group
              </button>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 flex-1">
             <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                 <Info className="text-blue-400" /> Announcements
             </h3>
             <p className="text-slate-400 text-sm leading-relaxed">
                 Magic Voice uses Google's latest Gemini models. 
                 <br/><br/>
                 Note: Chat messages are simulated in this demo environment.
             </p>
          </div>
       </div>

       {/* Chat Area */}
       <div className="flex-1 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-full">
                      <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                      <h2 className="font-bold">Magic Community Group</h2>
                      <p className="text-xs text-green-400 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                      </p>
                  </div>
              </div>
              <button onClick={handleLeave} className="md:hidden text-slate-400 hover:text-white">
                  <LogOut className="w-5 h-5" />
              </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[80%] ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              msg.isMe ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                          }`}>
                              {msg.sender[0].toUpperCase()}
                          </div>
                          <div className={`rounded-2xl px-4 py-2 ${
                              msg.isMe 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                          }`}>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-bold ${msg.isMe ? 'text-indigo-200' : 'text-orange-400'}`}>
                                      {msg.sender}
                                  </span>
                                  {!msg.isMe && (
                                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5 bg-slate-900/50 px-1.5 rounded">
                                        <MapPin className="w-2 h-2" /> {msg.province}
                                    </span>
                                  )}
                              </div>
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                          </div>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 px-2">
                          {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                  </div>
              ))}
              <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/50 border-t border-slate-700">
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                    placeholder="Type your message..."
                  />
                  <button 
                    type="submit" 
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-900/30"
                  >
                      <Send className="w-5 h-5" />
                  </button>
              </div>
          </form>
       </div>
    </div>
  );
};

export default Dashboard;