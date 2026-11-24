import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, CheckCircle2, Volume2, Globe, Sparkles } from 'lucide-react';

export const VoiceRecorder = ({ onRecordingComplete, onTranscriptReady }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [language, setLanguage] = useState('en-IN');
  const [browserSupport, setBrowserSupport] = useState(true);
  const [audioUrl, setAudioUrl] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupport(false);
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startVoiceInput = async () => {
    setInterimTranscript('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          let currentFinal = '';
          let currentInterim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              currentFinal += piece + ' ';
            } else {
              currentInterim += piece;
            }
          }

          if (currentFinal) {
            setTranscript(prev => {
              const updated = (prev + ' ' + currentFinal).trim();
              if (onTranscriptReady) onTranscriptReady(updated);
              return updated;
            });
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed') {
            alert('Microphone permission was denied. Please allow microphone access in your browser bar.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Failed to start SpeechRecognition:', err);
      }
    }

    // Simultaneously capture audio via MediaRecorder if supported
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        if (onRecordingComplete) onRecordingComplete(blob, url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current.start();
    } catch (e) {
      console.warn('Audio recording stream note:', e);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const resetVoice = () => {
    stopVoiceInput();
    setTranscript('');
    setInterimTranscript('');
    setAudioUrl(null);
    if (onTranscriptReady) onTranscriptReady('');
  };

  const handleManualTranscriptEdit = (e) => {
    const val = e.target.value;
    setTranscript(val);
    if (onTranscriptReady) onTranscriptReady(val);
  };

  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Voice-to-Text Complaint Input (Web Speech API)
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            Real-Time Speech Recognition
          </span>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isListening}
            className="text-[11px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi (हिंदी)</option>
            <option value="en-US">English (US)</option>
          </select>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {!isListening ? (
          <button
            type="button"
            onClick={startVoiceInput}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
          >
            <Mic className="w-4 h-4" />
            <span>Click to Speak (Voice-to-Text)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopVoiceInput}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors animate-pulse shadow-md shadow-red-600/30"
          >
            <Square className="w-4 h-4" />
            <span>Stop Speaking (Done)</span>
          </button>
        )}

        {isListening && (
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Listening... speak clearly into microphone</span>
          </div>
        )}

        {(transcript || audioUrl) && !isListening && (
          <button
            type="button"
            onClick={resetVoice}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Voice</span>
          </button>
        )}
      </div>

      {/* Interim Listening Preview */}
      {isListening && interimTranscript && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 italic">
          Hearing: "{interimTranscript}..."
        </div>
      )}

      {/* Live Recognized Transcript Display & Editor */}
      {transcript && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recognized Speech Transcript (Editable):
            </span>
            <span className="text-slate-400">Captured via Web Speech API</span>
          </div>
          <textarea
            rows={2}
            value={transcript}
            onChange={handleManualTranscriptEdit}
            className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Recognized voice text will appear here..."
          />
        </div>
      )}

      {!browserSupport && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Note: Web Speech API is best supported in modern Google Chrome and Chromium browsers.
        </p>
      )}
    </div>
  );
};
