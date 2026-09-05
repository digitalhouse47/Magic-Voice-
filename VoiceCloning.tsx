import React, { useState, useRef } from 'react';
import { Upload, Mic, Play, Pause, Trash2, Download, AlertCircle, Sparkles, Loader2, FileAudio, Key } from 'lucide-react';
import { cloneVoice, generateClonedSpeech } from '../services/elevenLabsService';
import { playClickSound } from '../utils/sound';

interface ClonedResult {
  id: string;
  text: string;
  audioBlob: Blob;
  duration: number;
}

const VoiceCloning: React.FC = () => {
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ClonedResult[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if API key is provided
  const hasApiKey = Boolean(process.env.ELEVENLABS_API_KEY);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('audio/')) {
        setReferenceFile(file);
        setError(null);
      } else {
        setError('Harap unggah file audio yang valid (MP3, WAV).');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setReferenceFile(file);
        setError(null);
      } else {
        setError('Harap unggah file audio yang valid (MP3, WAV).');
      }
    }
  };

  const handleGenerate = async () => {
    if (!referenceFile) {
      setError("Silakan unggah suara referensi terlebih dahulu.");
      return;
    }
    if (!text.trim()) {
      setError("Silakan masukkan teks yang ingin diubah menjadi suara.");
      return;
    }

    playClickSound();
    setIsLoading(true);
    setError(null);
    
    try {
      const voiceId = await cloneVoice(referenceFile, `Clone_${Date.now()}`);
      const audioBlob = await generateClonedSpeech(voiceId, text);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const tempAudio = new Audio(audioUrl);
      tempAudio.addEventListener('loadedmetadata', () => {
        const newResult: ClonedResult = {
          id: Date.now().toString(),
          text,
          audioBlob,
          duration: tempAudio.duration
        };
        setResults(prev => [newResult, ...prev]);
        setIsLoading(false);
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal membuat kloning suara.');
      setIsLoading(false);
    }
  };

  const togglePlay = (result: ClonedResult) => {
    playClickSound();
    if (currentPlayingId === result.id) {
      audioRef.current?.pause();
      setCurrentPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(URL.createObjectURL(result.audioBlob));
      newAudio.onended = () => setCurrentPlayingId(null);
      newAudio.play();
      audioRef.current = newAudio;
      setCurrentPlayingId(result.id);
    }
  };

  const handleDownload = async (res: ClonedResult, format: 'wav' | 'mp3') => {
    try {
      let blobToDownload: Blob;
      if (format === 'mp3') {
        // Voice Cloning from ElevenLabs is already MP3, but we can process it if needed.
        blobToDownload = res.audioBlob; 
      } else {
        // If we strictly needed WAV we could convert, but ElevenLabs defaults to MP3.
        blobToDownload = res.audioBlob; 
      }
      const url = URL.createObjectURL(blobToDownload);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-clone-${res.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download audio", err);
      setError("Gagal mengekspor audio.");
    }
    setExportMenuId(null);
  };

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center mb-6 shadow-xl relative">
            <Key className="w-10 h-10 text-indigo-400" />
            <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 border-2 border-slate-950 rounded-full animate-pulse"></div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Konfigurasi API Diperlukan</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Fitur <strong className="text-white">Kloning Suara (Zero-Shot)</strong> adalah teknologi AI premium yang membutuhkan pemrosesan tingkat tinggi. Saat ini, tidak ada layanan AI publik yang menyediakan fitur ini secara gratis tanpa akun.
        </p>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-left w-full">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
             <AlertCircle className="w-5 h-5 text-indigo-400" /> Cara Mengaktifkan:
          </h3>
          <ol className="list-decimal list-inside text-sm text-slate-300 space-y-3">
            <li>Daftar akun di platform <strong>ElevenLabs</strong>.</li>
            <li>Pastikan Anda berlangganan tier yang mendukung <strong>Instant Voice Cloning</strong> (seperti tier Starter).</li>
            <li>Dapatkan API Key Anda dari pengaturan profil.</li>
            <li>Buka ikon roda gigi (Settings) di AI Studio ini, lalu tambahkan variabel baru: <code className="bg-slate-800 px-2 py-1 rounded text-indigo-300 font-mono">ELEVENLABS_API_KEY</code>.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Editor Section */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Upload Audio Reference */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
          
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
            <Mic className="w-5 h-5 text-indigo-400" />
            Suara Referensi (Untuk Dikloning)
          </h2>
          
          {!referenceFile ? (
            <div 
              className="border-2 border-dashed border-slate-700 bg-slate-950/50 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-900 transition-colors relative z-10"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300 mb-1">
                Klik atau seret file audio ke sini
              </p>
              <p className="text-xs text-slate-500">
                Format: MP3, WAV (Max: 10MB) - Durasi ideal: 1 menit.
              </p>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="audio/*"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-4 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-400">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white truncate max-w-[200px] md:max-w-xs">{referenceFile.name}</p>
                  <p className="text-xs text-indigo-300">Siap untuk dikloning</p>
                </div>
              </div>
              <button 
                onClick={() => setReferenceFile(null)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Hapus referensi"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Text Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                Tulis Teks
            </h2>
            <div className="relative z-10">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ketik teks yang ingin Anda ubah menjadi suara di sini..."
                className="w-full h-40 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
              <div className="absolute bottom-4 right-4 text-xs text-slate-500 font-mono">
                {text.length} karakter
              </div>
            </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || !text.trim() || !referenceFile}
          className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
            isLoading || !text.trim() || !referenceFile
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-900/40 hover:scale-[1.01]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> 
              Memproses Kloning...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Buat Suara Kloning
            </>
          )}
        </button>

        {error && (
            <div className="p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
        )}

      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Hasil Kloning</h3>
        
        {results.length === 0 ? (
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
             <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <FileAudio className="w-8 h-8 text-slate-600" />
             </div>
             <p className="text-slate-400 text-sm">Belum ada hasil kloning suara.</p>
           </div>
        ) : (
           <div className="space-y-3">
             {results.map((res) => (
                <div key={res.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors group">
                    <p className="text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                        "{res.text}"
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => togglePlay(res)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                    currentPlayingId === res.id 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {currentPlayingId === res.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                            </button>
                            <div>
                                <div className="text-xs font-bold text-white">Suara Kloning</div>
                                <div className="text-xs text-slate-400">Durasi: {res.duration ? res.duration.toFixed(1) : '...'}d</div>
                            </div>
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setExportMenuId(exportMenuId === res.id ? null : res.id)}
                                className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 bg-slate-800 border border-slate-600 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                            >
                                <Download className="w-4 h-4" /> Export
                            </button>
                            
                            {exportMenuId === res.id && (
                                <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10">
                                    <button 
                                        onClick={() => handleDownload(res, 'mp3')}
                                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                    >
                                        Format MP3
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
             ))}
           </div>
        )}
      </div>

    </div>
  );
};

export default VoiceCloning;

