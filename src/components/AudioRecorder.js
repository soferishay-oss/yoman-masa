'use client';
import { useState, useRef } from 'react';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';

export default function AudioRecorder({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        
        onRecordingComplete({ url: audioUrl, file, type: 'audio' });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      // Use Toast later
      alert('שגיאה בגישה למיקרופון. אנא ודא שהרשאת מיקרופון ניתנה לדפדפן.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {!isRecording ? (
        <button 
          type="button" 
          onClick={startRecording}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444' }}
        >
          <Mic size={18} /> התחל הקלטה
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fee2e2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }}></div>
          <span style={{ color: '#b91c1c', fontWeight: 'bold', minWidth: '40px' }}>{formatTime(recordingTime)}</span>
          <button 
            type="button" 
            onClick={stopRecording}
            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Square size={14} /> עצור
          </button>
        </div>
      )}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
