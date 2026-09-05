import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/geminiService';
import { blobToBase64 } from '../utils/audio';
import { Mic, Square, Loader2, FileText, Upload, Download, Copy, Check } from 'lucide-react';

const SpeechToText: React.FC = () => {
  const [transcription, setTranscription] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleTranscription(blob, 'audio/webm');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError("Please upload a valid audio file.");
      return;
    }

    await handleTranscription(file, file.type);
  };

  const handleTranscription = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const base64Audio = await blobToBase64(blob);
      const result = await transcribeAudio(base64Audio, mimeType);
      setTranscription(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to transcribe audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTranscription = () => {
    if (!transcription) return;
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-600 rounded-lg shadow-lg shadow-purple-600/20">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Magic Audio Transcription</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Controls Area */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Record Audio</h3>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="w-full py-8 bg-slate-700 hover:bg-slate-600 border-2 border-dashed border-slate-500 rounded-xl transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="p-4 bg-purple-600 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-purple-900/50">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-slate-300 font-medium">Click to Record</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-full py-8 bg-red-900/20 hover:bg-red-900/30 border-2 border-red-500 rounded-xl transition-all flex flex-col items-center justify-center gap-3 animate-pulse"
                >
                  <div className="p-4 bg-red-500 rounded-full shadow-lg shadow-red-900/50">
                    <Square className="w-8 h-8 text-white fill-current" />
                  </div>
                  <span className="text-red-300 font-medium">Recording... (Click to Stop)</span>
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-slate-400">Or upload file</span>
              </div>
            </div>

            <label className="block w-full cursor-pointer">
              <input 
                type="file" 
                accept="audio/*" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isProcessing || isRecording}
              />
              <div className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-600 transition-colors flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Upload Audio File</span>
              </div>
            </label>
          </div>

          {/* Result Area */}
          <div className="md:col-span-2 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Transcription Result
              </label>
              {isProcessing && (
                <span className="flex items-center gap-2 text-indigo-400 text-sm animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing audio with Gemini...
                </span>
              )}
            </div>
            
            <div className="relative flex-grow min-h-[300px] bg-slate-800/50 border border-slate-600 rounded-xl p-4 flex flex-col">
              {transcription ? (
                <>
                    <div className="prose prose-invert max-w-none text-slate-200 whitespace-pre-wrap flex-1">
                    {transcription}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button
                            onClick={downloadTranscription}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Download className="w-4 h-4" /> Download Text
                        </button>
                    </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 opacity-50">
                  <FileText className="w-12 h-12 mb-2" />
                  <p>Transcribed text will appear here</p>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-x-4 bottom-4 p-3 bg-red-900/80 border border-red-800 backdrop-blur rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechToText;