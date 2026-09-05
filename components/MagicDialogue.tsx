import React, { useState, useRef, useEffect } from 'react';
import { VoiceName, SpeakingTone } from '../types';
import { generateDialogueAudio } from '../services/geminiService';
import { decode, decodeAudioData, audioBufferToWav } from '../utils/audio';
import { VOICE_META } from '../utils/constants';
import { Play, Square, Loader2, MessageSquareText, User, PenTool, Plus, Trash2, ArrowRightLeft, Download, Layers, Sparkles } from 'lucide-react';

type BuilderLine = {
    id: number;
    speaker: 'S1' | 'S2';
    text: string;
};

interface GeneratedDialogueResult {
    id: string;
    buffer: AudioBuffer;
    blob: Blob;
    timestamp: Date;
    variationName: string;
}

const MagicDialogue: React.FC = () => {
  // Manual Mode State (Default)
  const [manualLines, setManualLines] = useState<BuilderLine[]>([
    { id: 1, speaker: 'S1', text: '' },
    { id: 2, speaker: 'S2', text: '' }
  ]);

  // Shared State
  const [tone, setTone] = useState<SpeakingTone>(SpeakingTone.Normal);
  const [speaker1, setSpeaker1] = useState<VoiceName>(VoiceName.Fenrir);
  const [speaker2, setSpeaker2] = useState<VoiceName>(VoiceName.Puck);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Results State
  const [results, setResults] = useState<GeneratedDialogueResult[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    return () => audioContextRef.current?.close();
  }, []);

  const getFormattedScript = () => {
    return manualLines
        .filter(l => l.text.trim() !== '')
        .map(l => {
            const name = l.speaker === 'S1' ? speaker1 : speaker2;
            return `${name}: ${l.text}`;
        }).join('\n');
  };

  const processGeneration = async (variationLabel: string): Promise<GeneratedDialogueResult> => {
     const formattedScript = getFormattedScript();
     if (!formattedScript) throw new Error("Please enter some dialogue text.");

     // Note: We are not explicitly passing 'tone' to the API as a parameter because the current SDK/Model
     // infers tone from context/text. However, we could prepend stage directions if needed.
     // For now, we rely on the generative variance of the model for "variations".
     const base64Audio = await generateDialogueAudio(formattedScript, speaker1, speaker2);

     if (!audioContextRef.current) throw new Error("AudioContext not supported");
     if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

     const audioBytes = decode(base64Audio);
     const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
     const wavBlob = audioBufferToWav(audioBuffer);

     return {
        id: Date.now().toString() + Math.random().toString(),
        buffer: audioBuffer,
        blob: wavBlob,
        timestamp: new Date(),
        variationName: variationLabel
     };
  };

  const handleGenerate = async () => {
    if (manualLines.every(l => !l.text.trim())) return;

    setIsLoading(true);
    setError(null);
    stopAudio();
    setResults([]);

    try {
      const result = await processGeneration("Single Take");
      setResults([result]);
      playBuffer(result.buffer, result.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate dialogue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiGenerate = async () => {
    if (manualLines.every(l => !l.text.trim())) return;

    setIsLoading(true);
    setError(null);
    stopAudio();
    setResults([]);

    try {
        const variations = ["Variation 1", "Variation 2", "Variation 3", "Variation 4"];
        const promises = variations.map(label => processGeneration(label));
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
    stopAudio();
    if (!audioContextRef.current) return;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
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
  
  const downloadAudio = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Manual Builder Handlers
  const addLine = () => {
    setManualLines(prev => {
        const lastSpeaker = prev[prev.length - 1]?.speaker;
        return [
            ...prev,
            { id: Date.now(), speaker: lastSpeaker === 'S1' ? 'S2' : 'S1', text: '' }
        ];
    });
  };

  const removeLine = (id: number) => {
    setManualLines(prev => prev.filter(l => l.id !== id));
  };

  const updateLineText = (id: number, text: string) => {
    setManualLines(prev => prev.map(l => l.id === id ? { ...l, text } : l));
  };

  const toggleLineSpeaker = (id: number) => {
    setManualLines(prev => prev.map(l => l.id === id ? { ...l, speaker: l.speaker === 'S1' ? 'S2' : 'S1' } : l));
  };

  const renderSpeakerSelect = (
    label: string, 
    value: VoiceName, 
    onChange: (val: VoiceName) => void,
    colorClass: string
  ) => {
    const meta = VOICE_META[value];
    const Icon = meta.icon;

    return (
        <div className="space-y-2">
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${colorClass}`}>
                <User className="w-3 h-3" /> {label}
            </label>
            <div className="relative group">
                <select 
                    value={value}
                    onChange={(e) => onChange(e.target.value as VoiceName)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-3 pr-10 py-3 text-white appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    {Object.values(VoiceName).map(v => (
                        <option key={v} value={v}>
                            {VOICE_META[v].label} ({VOICE_META[v].gender})
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Icon className="w-4 h-4 text-slate-400" />
                </div>
            </div>
            <p className="text-[10px] text-slate-500">
                {meta.style}
            </p>
        </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 md:p-8 shadow-2xl">
            
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800">
                <div className="p-3 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
                    <PenTool className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Script Builder</h2>
                    <p className="text-slate-400 text-sm">Create and direct a conversation between two AI voices.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Left Column: Configuration & Inputs */}
                <div className="space-y-6">
                    
                    {/* Speaker Configuration (Always Visible) */}
                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {renderSpeakerSelect("Speaker 1", speaker1, setSpeaker1, "text-indigo-400")}
                            {renderSpeakerSelect("Speaker 2", speaker2, setSpeaker2, "text-purple-400")}
                        </div>
                        
                        <div className="pt-2 border-t border-slate-800">
                             <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Speaking Tone
                            </label>
                            <select 
                                value={tone}
                                onChange={(e) => setTone(e.target.value as SpeakingTone)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {Object.values(SpeakingTone).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* MANUAL MODE INPUTS */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-slate-300">Dialogue Script</label>
                            <span className="text-xs text-slate-500">Build your conversation line by line</span>
                        </div>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {manualLines.map((line, index) => (
                                <div key={line.id} className="flex gap-2 items-start group">
                                    <button
                                        onClick={() => toggleLineSpeaker(line.id)}
                                        className={`flex-shrink-0 w-20 py-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border ${
                                            line.speaker === 'S1' 
                                                ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/50' 
                                                : 'bg-purple-900/30 border-purple-500/50 text-purple-300 hover:bg-purple-900/50'
                                        }`}
                                        title="Click to switch speaker"
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                            {line.speaker === 'S1' ? 'S1' : 'S2'}
                                        </span>
                                        <ArrowRightLeft className="w-3 h-3 opacity-50" />
                                    </button>
                                    
                                    <textarea
                                        value={line.text}
                                        onChange={(e) => updateLineText(line.id, e.target.value)}
                                        placeholder={`Enter text for ${line.speaker === 'S1' ? 'Speaker 1' : 'Speaker 2'}...`}
                                        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-[66px]"
                                    />
                                    
                                    <button 
                                        onClick={() => removeLine(line.id)}
                                        className="flex-shrink-0 w-8 h-[66px] flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <button
                            onClick={addLine}
                            className="w-full py-2 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 hover:bg-slate-800/50 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Line
                        </button>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 space-y-3">
                         <button
                            onClick={handleGenerate}
                            disabled={isLoading || manualLines.every(l => !l.text.trim())}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                            <span>Generate Dialogue (Single)</span>
                        </button>

                         <button
                            onClick={handleMultiGenerate}
                            disabled={isLoading || manualLines.every(l => !l.text.trim())}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            <Layers className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                            <span>Generate 4 Variations</span>
                        </button>

                        {error && <div className="mt-4 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">{error}</div>}
                    </div>
                </div>

                {/* Right Column: Results List */}
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-6 flex flex-col h-full min-h-[500px]">
                     <div className="flex items-center justify-between mb-4 sticky top-0 bg-transparent">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquareText className="w-4 h-4" /> 
                            Generated Results
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {results.length > 0 ? (
                            results.map((res) => (
                                <div key={res.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between group hover:border-indigo-500/50 transition-colors animate-in fade-in slide-in-from-bottom-2">
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
                                                {res.variationName}
                                                <span className="text-[10px] bg-slate-800 px-2 rounded text-slate-400 font-normal">
                                                    {tone}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Duration: {res.buffer.duration.toFixed(1)}s • {res.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => downloadAudio(res.blob, `magic-dialogue-${res.variationName.replace(/\s+/g, '-')}`)}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Download WAV"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
                                <MessageSquareText className="w-16 h-16 mb-4 stroke-1" />
                                <p className="text-sm text-center">
                                    Build your script and click Generate.<br/>
                                    Audio results will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MagicDialogue;