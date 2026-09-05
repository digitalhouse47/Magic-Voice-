import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TextToSpeech from './components/TextToSpeech';
import SpeechToText from './components/SpeechToText';
import MagicDialogue from './components/MagicDialogue';
import ImageToVoice from './components/ImageToVoice';
import Dashboard from './components/Dashboard';
import { AppTab } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.DASHBOARD:
        return (
            <>
                <Header title="Dasbor & Obrolan" subtitle="Bergabung dengan komunitas dan jelajahi Magic Voice." />
                <Dashboard />
            </>
        );
      case AppTab.TTS:
        return (
            <>
                <Header title="Teks ke Suara" subtitle="Ubah teks menjadi suara nyata dengan Magic Voice." />
                <TextToSpeech />
            </>
        );
      case AppTab.STT:
        return (
            <>
                <Header title="Suara ke Teks" subtitle="Transkripsi rekaman audio secara instan." />
                <SpeechToText />
            </>
        );
      case AppTab.DIALOGUE:
        return (
            <>
                <Header title="Dialog Ajaib" subtitle="Buat percakapan antara dua suara AI." />
                <MagicDialogue />
            </>
        );
      case AppTab.IMAGE_TO_VOICE:
        return (
            <>
                <Header title="Gambar ke Suara" subtitle="Unggah gambar dan dengarkan AI mendeskripsikannya." />
                <ImageToVoice />
            </>
        );
      default:
        return <TextToSpeech />;
    }
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on mobile when tab changes
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-white selection:bg-indigo-500/30">
      
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-700 text-white shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 pt-20 md:p-12 overflow-x-hidden transition-all duration-300">
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
        </div>
      </main>

    </div>
  );
};

export default App;