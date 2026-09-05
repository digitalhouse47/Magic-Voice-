import React, { useState, useRef, useEffect } from 'react';
import { VoiceName, SpeakingTone, ImageContentMode } from '../types';
import { generateTextFromImage, generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData, blobToBase64, audioBufferToWav } from '../utils/audio';
import { VOICE_META } from '../utils/constants';
import { Play, Square, Loader2, Image as ImageIcon, Sparkles, Download, ScanEye, Volume2, Wand2 } from 'lucide-react';

const ImageToVoice: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string>("");
  
  // Configuration States
  const [tone, setTone] = useState<SpeakingTone>(SpeakingTone.Normal);
  const [voice, setVoice] = useState<VoiceName>(VoiceName.Zephyr);
  const [contentMode, setContentMode] = useState<ImageContentMode>(ImageContentMode.Description);
  
  // Split loading states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    return () => audioContextRef.current?.close();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setGeneratedText(""); // Reset text on new image
      setCurrentAudioBlob(null);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setError(null);
    setGeneratedText("");
    
    try {
        const base64Image = await blobToBase64(selectedImage);
        // Pass the selected Content Mode to the service
        const description = await generateTextFromImage(base64Image, selectedImage.type, tone, contentMode);
        setGeneratedText(description);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to analyze image.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!generatedText) return;
    setIsGeneratingAudio(true);
    setError(null);
    stopAudio();

    try {
        const base64Audio = await generateSpeech(generatedText, voice);

        if (!audioContextRef.current) throw new Error("AudioContext not supported");
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
        
        const wavBlob = audioBufferToWav(audioBuffer);
        setCurrentAudioBlob(wavBlob);

        playBuffer(audioBuffer);

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to generate speech.");
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      setIsPlaying(false);
      sourceNodeRef.current = null;
    };
    sourceNodeRef.current = source;
    source.start();
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };
  
  const downloadAudio = () => {
    if (!currentAudioBlob) return;
    const url = URL.createObjectURL(currentAudioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magic-content-${contentMode.split(' ')[0]}-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 md:p-8 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left: Upload & Config */}
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 transition-colors hover:border-slate-500 bg-slate-900/30">
                        {imagePreview ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden group">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur text-sm">
                                        Change Image
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center h-48 cursor-pointer">
                                <ImageIcon className="w-12 h-12 text-slate-500 mb-2" />
                                <span className="text-slate-400 font-medium">Upload an Image</span>
                                <span className="text-slate-600 text-xs mt-1">JPG, PNG supported</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>

                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800 space-y-4">
                        <div className="space-y-2">
                             <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-indigo-400 flex items-center gap-1">
                                <Wand2 className="w-3 h-3" /> Content Mode (Gaya Konten)
                            </label>
                            <select 
                                value={contentMode}
                                onChange={(e) => setContentMode(e.target.value as ImageContentMode)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            >
                                {Object.values(ImageContentMode).map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Voice Artist</label>
                                <select 
                                    value={voice}
                                    onChange={(e) => setVoice(e.target.value as VoiceName)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    {Object.values(VoiceName).map(v => (
                                        <option key={v} value={v}>
                                            {VOICE_META[v].label} ({VOICE_META[v].gender})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Tone (Emosi)</label>
                                <select 
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value as SpeakingTone)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    {Object.values(SpeakingTone).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                         {/* Button 1: Analyze */}
                         <button
                            onClick={handleAnalyzeImage}
                            disabled={isAnalyzing || !selectedImage || isGeneratingAudio}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin w-5 h-5" /> : <ScanEye className="w-5 h-5" />}
                            <span>
                                {isAnalyzing ? 'Analyzing Image...' : '1. Generate Script (Indonesia)'}
                            </span>
                        </button>

                         {/* Button 2: Generate Audio */}
                        {!isPlaying ? (
                            <button
                                onClick={handleGenerateAudio}
                                disabled={isGeneratingAudio || !generatedText || isAnalyzing}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingAudio ? <Loader2 className="animate-spin" /> : <Volume2 className="fill-current" />}
                                <span>2. Generate Speech</span>
                            </button>
                        ) : (
                            <button onClick={stopAudio} className="w-full py-4 bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/30">
                                <Square className="fill-current" /> Stop Audio
                            </button>
                        )}

                        {currentAudioBlob && (
                             <button
                                onClick={downloadAudio}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <Download className="w-4 h-4" /> Download WAV
                            </button>
                        )}
                    </div>

                    {error && <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">{error}</div>}
                </div>

                {/* Right: Result Text (Editable) */}
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-6 flex flex-col h-full min-h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            Generated Script (Editable)
                        </h3>
                         {generatedText && (
                            <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded">
                                {generatedText.length} chars
                            </span>
                        )}
                    </div>

                    {generatedText || isAnalyzing ? (
                        <textarea 
                            value={generatedText}
                            onChange={(e) => setGeneratedText(e.target.value)}
                            placeholder={isAnalyzing ? "Analyzing image & creating content..." : "Your generated script will appear here. You can edit it before generating audio."}
                            disabled={isAnalyzing}
                            className="flex-1 w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-lg font-light leading-relaxed text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none transition-all placeholder-slate-600"
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50 border-2 border-dashed border-slate-800 rounded-lg p-6 text-center">
                            <ImageIcon className="w-16 h-16 mb-4 stroke-1" />
                            <h4 className="text-lg font-medium text-slate-400 mb-2">Ready to Create?</h4>
                            <p className="text-sm max-w-xs">
                                Upload an image, choose a content mode (Story, Hard Sell, Soft Sell), and let AI write the script for you.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    </div>
  );
};

export default ImageToVoice;