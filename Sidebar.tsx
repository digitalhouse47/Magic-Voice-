import React, { useState, useEffect } from 'react';
import { AppTab } from '../types';
import { 
  Mic, Volume2, MessageSquareText, Image, Sparkles, LayoutDashboard, 
  Crown, ExternalLink, X, ChevronLeft, ChevronRight, ShoppingCart 
} from 'lucide-react';
import { playHoverSound, playClickSound } from '../utils/sound';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const [showPromo, setShowPromo] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  const promoImages = [
    "https://cdn.lynkid.my.id/products/22-01-2026/1769083060691_5983019.webp",
    "https://cdn.lynkid.my.id/products/22-01-2026/1769083060770_8809735.webp",
    "https://cdn.lynkid.my.id/products/27-01-2026/1769453661496_8247208.webp"
  ];

  // Auto-slide functionality
  useEffect(() => {
    let interval: any;
    if (showPromo) {
        interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % promoImages.length);
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [showPromo]);

  const handleOpenPromo = () => {
    playClickSound();
    setShowPromo(true);
  };

  const handleClosePromo = () => {
    playClickSound();
    setShowPromo(false);
    setCurrentSlide(0);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
      e.stopPropagation();
      playClickSound();
      setCurrentSlide((prev) => (prev + 1) % promoImages.length);
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
      e.stopPropagation();
      playClickSound();
      setCurrentSlide((prev) => (prev - 1 + promoImages.length) % promoImages.length);
  };
  
  // Menu structure
  const mainMenu = [
    { id: AppTab.DASHBOARD, label: 'Dasbor & Obrolan', icon: LayoutDashboard },
  ];

  // Updated Feature Menu Order: TTS -> DIALOGUE -> STT -> IMAGE -> VOICE CLONING
  const featureMenu = [
    { id: AppTab.TTS, label: 'Teks ke Suara', icon: Volume2 },
    { id: AppTab.DIALOGUE, label: 'Dialog Ajaib', icon: MessageSquareText },
    { id: AppTab.STT, label: 'Suara ke Teks', icon: Mic },
    { id: AppTab.IMAGE_TO_VOICE, label: 'Gambar ke Suara', icon: Image },
    { id: AppTab.VOICE_CLONING, label: 'Kloning Suara', icon: Sparkles, isComingSoon: true },
  ];

  const handleTabChange = (item: any) => {
    playClickSound();
    if (item.isComingSoon) {
      setComingSoonFeature(item.label);
      return;
    }
    setActiveTab(item.id);
  };

  const renderButton = (item: any) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleTabChange(item)}
        onMouseEnter={() => playHoverSound()}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 translate-x-1' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
        }`}
      >
        <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
        <span className="font-medium text-sm relative z-10 flex-1 text-left">{item.label}</span>
        
        {isActive && !item.isComingSoon && (
          <>
             <Sparkles className="w-3 h-3 ml-auto text-indigo-300 relative z-10" />
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Coming Soon Modal */}
      {comingSoonFeature && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                playClickSound();
                setComingSoonFeature(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Segera Hadir!</h3>
            <p className="text-slate-400 text-center text-sm mb-6">
              Fitur <strong className="text-white">{comingSoonFeature}</strong> sedang dalam tahap pengembangan dan akan segera tersedia di pembaruan berikutnya.
            </p>
            <button
              onClick={() => {
                playClickSound();
                setComingSoonFeature(null);
              }}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all shadow-lg hover:scale-[1.02]"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        {/* Logo Area */}
        <div className="p-6 flex flex-col items-center border-b border-slate-800 bg-slate-900 z-20 relative">
          {/* Mobile Close Button */}
          <button onClick={onClose} className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>

          <div className="w-48 px-4 mb-2 hover:scale-105 transition-transform duration-500 drop-shadow-2xl">
            <img 
              src="https://uniflouw.com/images/Magic%20Voice%20White.png" 
              alt="Magic Voice Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          <p className="text-[10px] text-indigo-400 font-medium mt-1">Development by Fito</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col">
          
          {/* Main Section */}
          <div className="mb-2 flex-shrink-0">
            <p className="px-4 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 opacity-80">
              Menu Utama
            </p>
            <div className="space-y-1">
              {mainMenu.map(renderButton)}
            </div>
          </div>

          {/* Separator / Divider */}
          <div className="my-6 border-t border-slate-800 relative flex-shrink-0">
              <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-slate-900 px-2 text-[10px] text-slate-600 font-mono">
                  AI TOOLS
              </div>
          </div>

          {/* Features Section */}
          <div className="flex-shrink-0">
            <p className="px-4 text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 opacity-80">
              Fitur Canggih
            </p>
            <div className="space-y-2">
              {featureMenu.map(renderButton)}
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Promotion Section (Hard Selling) */}
          <div className="mt-8 mb-2">
            <button 
              onClick={handleOpenPromo}
              onMouseEnter={() => playHoverSound()}
              className="w-full block relative overflow-hidden rounded-xl group ring-1 ring-amber-500/50 hover:ring-amber-400 transition-all transform hover:scale-[1.02] text-left"
            >
                {/* Background with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900"></div>
                
                {/* Content */}
                <div className="relative p-4 flex flex-col items-center text-center z-10">
                    <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg mb-3 shadow-lg shadow-orange-900/40">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    
                    <h3 className="text-amber-100 font-bold text-sm mb-1 flex items-center gap-1">
                      MAGIC AI Pro
                    </h3>
                    
                    <p className="text-[10px] text-slate-300 font-medium leading-relaxed mb-3 opacity-90">
                      Tools untuk Affiliate Produk, buat gambar lebih Profesional & Menarik.
                    </p>
                    
                    <div className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-md flex items-center justify-center gap-1 group-hover:from-amber-400 group-hover:to-orange-500 transition-all">
                      Beli Sekarang <ExternalLink className="w-3 h-3" />
                    </div>
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
            </button>
          </div>

        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 z-20">
          <div className="bg-slate-950/50 rounded-lg p-3 text-xs text-slate-500 text-center font-medium border border-slate-800 hover:border-slate-700 transition-colors">
            Hak Cipta @2026 by Fito
          </div>
        </div>
      </div>

      {/* PROMO MODAL */}
      {showPromo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClosePromo}></div>
            <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Close Button */}
                <button 
                    onClick={handleClosePromo}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20 bg-black/20 p-1 rounded-full hover:bg-black/50"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-center mb-6 text-amber-100 flex items-center justify-center gap-2">
                    <Crown className="w-6 h-6 text-amber-400" />
                    MAGIC AI Pro
                </h3>

                {/* Slideshow */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-6 group border border-slate-700 bg-black shadow-inner">
                    {promoImages.map((img, idx) => (
                        <div 
                            key={idx} 
                            className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-contain" />
                        </div>
                    ))}
                    
                    {/* Controls */}
                    <button 
                        onClick={handlePrevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 backdrop-blur-sm"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleNextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 backdrop-blur-sm"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {promoImages.map((_, idx) => (
                            <div 
                                key={idx}
                                className={`h-1.5 rounded-full transition-all shadow-sm ${idx === currentSlide ? 'bg-amber-400 w-6' : 'bg-white/40 w-1.5'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Buy Button */}
                <div className="space-y-4">
                  <a 
                      href="https://lynk.id/fitodotcom/6y6p7jx2plk4"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={playClickSound}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-900/40 flex items-center justify-center gap-2 transform transition-transform hover:scale-[1.02]"
                  >
                      <ShoppingCart className="w-5 h-5" />
                      Beli Sekarang
                  </a>
                  
                  <p className="text-center text-xs text-slate-500">
                      Tingkatkan penjualan Anda dengan fitur premium MAGIC AI Pro.
                  </p>
                </div>

            </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
