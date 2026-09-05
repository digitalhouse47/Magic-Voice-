import React, { useState, useRef, useEffect, useMemo } from 'react';
import { VoiceName, SpeakingTone } from '../types';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData, audioBufferToWav } from '../utils/audio';
import { VOICE_META, TONE_DATA } from '../utils/constants';
import { Play, Square, Loader2, Sparkles, Download, Clock, Layers, Smile, Grid, History, Copy, Edit } from 'lucide-react';

interface GeneratedAudio {
  id: string;
  tone: SpeakingTone;
  buffer: AudioBuffer;
  blob: Blob;
}

interface TextHistoryItem {
  id: string;
  text: string;
  timestamp: number;
}

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState<string>("Halo! Selamat datang di Magic Voice. Saya bisa mengubah teks menjadi suara yang sangat nyata dengan berbagai emosi.");
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Kore);
  const [selectedTone, setSelectedTone] = useState<SpeakingTone>(SpeakingTone.Normal);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0); // Pitch in semitones (-12 to 12)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);
  
  // Store multiple results
  const [results, setResults] = useState<GeneratedAudio[]>([]);
  
  // History
  const [history, setHistory] = useState<TextHistoryItem[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('tts_text_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as TextHistoryItem[];
        // Filter 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const filtered = parsed.filter(item => item.timestamp >= sevenDaysAgo);
        setHistory(filtered);
        if (parsed.length !== filtered.length) {
          localStorage.setItem('tts_text_history', JSON.stringify(filtered));
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const addToHistory = (newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    
    setHistory(prev => {
      // Remove if already exists to move it to top
      const filtered = prev.filter(item => item.text !== trimmed);
      const newItem: TextHistoryItem = {
        id: Date.now().toString(),
        text: trimmed,
        timestamp: Date.now()
      };
      const updated = [newItem, ...filtered].slice(0, 50); // keep max 50 items
      localStorage.setItem('tts_text_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Update playback speed and pitch in real-time
  useEffect(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = playbackSpeed;
      sourceNodeRef.current.detune.value = pitch * 100; // Convert semitones to cents
    }
  }, [playbackSpeed, pitch]);

  // Calculate estimated duration based on word count
  // Avg speaking rate ~140 wpm. ~2.3 words per second.
  const estimatedDuration = useMemo(() => {
    const wordCount = text.trim().split(/\s+/).length;
    if (!text.trim()) return 0;
    const seconds = Math.ceil(wordCount / 2.3); 
    return seconds;
  }, [text]);

  const processAudioGeneration = async (toneToUse: SpeakingTone): Promise<GeneratedAudio> => {
    // Pass the tone to the service so it can prepend the correct instruction
    const base64Audio = await generateSpeech(text, selectedVoice, toneToUse);
    
    if (!audioContextRef.current) throw new Error("AudioContext not supported");
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

    const audioBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
    const wavBlob = audioBufferToWav(audioBuffer);

    return {
      id: Date.now().toString() + Math.random().toString(),
      tone: toneToUse,
      buffer: audioBuffer,
      blob: wavBlob
    };
  };

  const handleSingleGenerate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    stopAudio();
    setResults([]); // Clear previous results

    try {
      addToHistory(text);
      const result = await processAudioGeneration(selectedTone);
      setResults([result]);
      playBuffer(result.buffer, result.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate speech.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiGenerate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    stopAudio();
    setResults([]);

    // Select 4 distinct tones
    const tonesToGenerate = [
      SpeakingTone.Normal,
      SpeakingTone.Happy,
      SpeakingTone.Sad,
      SpeakingTone.Advertisement
    ];

    try {
      addToHistory(text);
      // Execute in parallel
      const promises = tonesToGenerate.map(tone => processAudioGeneration(tone));

      const generatedResults = await Promise.all(promises);
      setResults(generatedResults);

    } catch (err: any) {
      console.error(err);
      setError("Failed to generate variations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer, id: string) => {
    stopAudio(); // Stop any currently playing
    if (!audioContextRef.current) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackSpeed;
    source.detune.value = pitch * 100;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      setCurrentPlayingId(null);
      sourceNodeRef.current = null;
    };

    sourceNodeRef.current = source;
    source.start();
    setCurrentPlayingId(id);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setCurrentPlayingId(null);
  };

  const handleDownload = async (res: GeneratedAudio, format: 'wav' | 'mp3') => {
    try {
      let blobToDownload: Blob;
      if (format === 'mp3') {
        const { audioBufferToMp3 } = await import('../utils/audio');
        blobToDownload = await audioBufferToMp3(res.buffer);
      } else {
        blobToDownload = res.blob;
      }
      const toneName = TONE_DATA[res.tone].label;
      const url = URL.createObjectURL(blobToDownload);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magic-voice-${toneName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${format}`;
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

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 md:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Input Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-end">
                <label className="block text-sm font-medium text-slate-300">
                  Masukkan teks Anda
                </label>
                <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-500">
                        {text.length} karakter
                    </span>
                    <span className={`flex items-center gap-1 ${text.length > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>
                        <Clock className="w-3 h-3" />
                        Est. ~{estimatedDuration}d
                    </span>
                </div>
            </div>
            <textarea
              className="w-full h-64 bg-slate-800/50 border border-slate-600 rounded-xl p-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none font-light leading-relaxed text-lg"
              placeholder="Ketik sesuatu yang luar biasa di sini..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Results Area */}
            {results.length > 0 && (
                <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Hasil Audio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((res) => {
                           const toneData = TONE_DATA[res.tone];
                           return (
                            <div key={res.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => currentPlayingId === res.id ? stopAudio() : playBuffer(res.buffer, res.id)}
                                        className={`p-3 rounded-full transition-all ${
                                            currentPlayingId === res.id 
                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-110'
                                        }`}
                                    >
                                        {currentPlayingId === res.id ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                    </button>
                                    <div>
                                        <div className="text-sm font-bold text-white flex items-center gap-2">
                                            <span>{toneData.emoji}</span>
                                            Nada {toneData.label}
                                        </div>
                                        <div className="text-xs text-slate-400">Durasi: {res.buffer.duration.toFixed(1)}d</div>
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
                                                onClick={() => handleDownload(res, 'wav')}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                            >
                                                Format WAV
                                            </button>
                                            <button 
                                                onClick={() => handleDownload(res, 'mp3')}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700"
                                            >
                                                Format MP3
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                           )
                        })}
                    </div>
                </div>
            )}

            {/* History Area */}
            {history.length > 0 && (
              <div className="mt-8 space-y-3 border-t border-slate-700/50 pt-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Riwayat Teks (7 Hari Terakhir)
                </h3>
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {history.map(item => (
                    <div key={item.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex flex-col gap-2 group hover:border-slate-500 transition-colors">
                      <p className="text-sm text-slate-300 line-clamp-2">{item.text}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => navigator.clipboard.writeText(item.text)}
                            className="flex items-center gap-1 text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors"
                          >
                            <Copy className="w-3 h-3" /> Salin
                          </button>
                          <button 
                            onClick={() => setText(item.text)}
                            className="flex items-center gap-1 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors"
                          >
                            <Edit className="w-3 h-3" /> Gunakan
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-6">
            
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-5">
                
                {/* Tone Selection Grid */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Smile className="w-4 h-4 text-yellow-500" />
                        Gaya Bicara (Nada)
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.values(SpeakingTone).map((tone) => {
                            const data = TONE_DATA[tone];
                            const isSelected = selectedTone === tone;
                            return (
                                <button
                                    key={tone}
                                    onClick={() => setSelectedTone(tone)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                                        isSelected 
                                            ? 'bg-indigo-600 border-indigo-500 shadow-md transform scale-105' 
                                            : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="text-2xl mb-1">{data.emoji}</span>
                                    <span className={`text-[10px] font-medium text-center truncate w-full ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                        {data.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                    <label className="block text-sm font-medium text-slate-300">
                        Pilih Artis/Suara
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {Object.values(VoiceName).map((voice) => {
                            const meta = VOICE_META[voice];
                            const Icon = meta.icon;
                            return (
                                <button
                                    key={voice}
                                    onClick={() => setSelectedVoice(voice)}
                                    className={`flex items-center justify-between px-3 py-3 rounded-lg border transition-all text-sm group ${
                                    selectedVoice === voice
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${selectedVoice === voice ? 'bg-white/20' : 'bg-slate-800'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold">{meta.label}</div>
                                            <div className={`text-[10px] ${selectedVoice === voice ? 'text-indigo-200' : 'text-slate-500'}`}>
                                                {meta.gender} • {meta.style}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedVoice === voice && <Sparkles className="w-3 h-3 text-white" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Speed Control */}
                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                    <label className="block text-sm font-medium text-slate-300 flex justify-between items-center">
                        <span>Kecepatan</span>
                        <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded text-xs">{playbackSpeed.toFixed(1)}x</span>
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        <span>Lambat</span>
                        <span>Normal</span>
                        <span>Cepat</span>
                    </div>
                </div>

                {/* Pitch Control */}
                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                    <label className="block text-sm font-medium text-slate-300 flex justify-between items-center">
                        <span>Pitch (Intonasi)</span>
                        <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded text-xs">{pitch > 0 ? '+' : ''}{pitch}</span>
                    </label>
                    <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={pitch}
                        onChange={(e) => setPitch(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        <span>Rendah</span>
                        <span>Normal</span>
                        <span>Tinggi</span>
                    </div>
                </div>
            </div>

            <div className="pt-2 space-y-3">
                {/* Single Generation */}
                <button
                  onClick={handleSingleGenerate}
                  disabled={isLoading || !text}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>Buat Suara (Tunggal)</span>
                    </>
                  )}
                </button>

                {/* Multi Generation */}
                <button
                  onClick={handleMultiGenerate}
                  disabled={isLoading || !text}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                    <Layers className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                    <span>Buat 4 Variasi</span>
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;