'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Image as ImageIcon, CheckCircle2, Map } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import AudioRecorder from '@/components/AudioRecorder';

export default function StationSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  
  const [station, setStation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [answers, setAnswers] = useState({});
  const [mediaUrls, setMediaUrls] = useState([]);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStation();
  }, [params.stationId]);

  const fetchStation = async () => {
    try {
      const res = await fetch('/api/student/journeys');
      if (res.ok) {
        const journeys = await res.json();
        // Find the station in the journeys
        let foundStation = null;
        for (const j of journeys) {
          const s = j.stations.find(st => st.id === params.stationId);
          if (s) {
            foundStation = { ...s, journeyTitle: j.title };
            break;
          }
        }
        
        if (foundStation) {
          setStation(foundStation);
          // Pre-fill answers if we already have a response...
          // Wait, the API doesn't return the answers to the student right now, only the `createdAt` to show it's completed.
          // Let's assume they can resubmit and it overrides. 
        } else {
          router.push('/journeys');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioComplete = (audioData) => {
    setMediaUrls(prev => [...prev, audioData.url]);
  };

  const removeMedia = (index) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/student/journeys/station/${params.stationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, mediaUrls })
      });
      if (res.ok) {
        toast.show('התשובה נשמרה בהצלחה!');
        router.push('/journeys');
      } else {
        toast.show('שגיאה בשמירה', 'error');
      }
    } catch (e) {
      toast.show('שגיאת תקשורת', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div style={{ padding: '20px' }}>טוען...</div>;
  if (!station) return null;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', cursor: 'pointer', marginBottom: '15px' }} onClick={() => router.push('/journeys')}>
          <ArrowRight size={16} /> חזרה למסעות שלי
        </div>
        
        <h1 style={{ margin: '0 0 5px 0', color: 'var(--primary-color)' }}>{station.title}</h1>
        <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Map size={14} /> {station.journeyTitle}
        </div>
      </header>

      {station.description && (
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', color: '#334155', border: '1px solid #e2e8f0' }}>
          {station.description}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
        {(station.questions || []).map((q, idx) => (
          <div key={q.id || idx} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#1e293b' }}>
              {q.label}
            </label>
            
            {q.type === 'textarea' ? (
              <textarea 
                value={answers[q.id] || ''}
                onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder="כתוב כאן את תשובתך..."
                style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit' }}
              />
            ) : q.type === 'text' ? (
              <input 
                type="text"
                value={answers[q.id] || ''}
                onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
              />
            ) : (
              <input 
                type="text"
                value={answers[q.id] || ''}
                onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>צרף תמונה או הקלטה</h3>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <ImageIcon size={18} /> הוסף תמונה
          </button>

          <AudioRecorder onRecordingComplete={handleAudioComplete} />
        </div>

        {mediaUrls.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
            {mediaUrls.map((url, i) => {
              const isAudio = url.startsWith('data:audio') || url.startsWith('blob:');
              return (
                <div key={i} style={{ position: 'relative', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: isAudio ? '10px' : '0', overflow: 'hidden' }}>
                  <button 
                    onClick={() => removeMedia(i)}
                    style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                  >
                    x
                  </button>
                  {isAudio ? (
                    <audio src={url} controls style={{ height: '30px', width: '150px' }} />
                  ) : (
                    <img src={url} alt="Attachment" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button 
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{ width: '100%', background: 'var(--primary-color)', color: 'white', padding: '15px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: isSubmitting ? 0.7 : 1 }}
      >
        <CheckCircle2 /> {isSubmitting ? 'שומר...' : 'שמור יומן מסע'}
      </button>
    </div>
  );
}
