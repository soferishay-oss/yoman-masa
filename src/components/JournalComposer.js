'use client';
import { useState, useEffect, useContext } from 'react';
import { PenLine, Image as ImageIcon, Mic, Send, Sparkles } from 'lucide-react';
import { ThemeContext } from '@/components/ThemeProvider';
import { useToast } from '@/components/ToastProvider';
import EmojiPickerButton from '@/components/EmojiPickerButton';
import AudioRecorder from '@/components/AudioRecorder';
import { queueSyncAction } from '@/lib/sync/localStore';
import { useRouter } from 'next/navigation';

export default function JournalComposer({ initialData, onPostCreated, onCancelEdit }) {
  const theme = useContext(ThemeContext);
  const aiLevel = theme.themeConfig?.aiCorrectionLevel || 'phrasing';
  const toast = useToast();
  const router = useRouter();

  const [newEntryContent, setNewEntryContent] = useState(initialData?.bodyText || '');
  const [mediaUrls, setMediaUrls] = useState(initialData?.mediaUrls || []);
  const [isRecording, setIsRecording] = useState(false);
  const [isFixingPhrasing, setIsFixingPhrasing] = useState(false);
  const [fixedDraft, setFixedDraft] = useState('');
  const [originalDraft, setOriginalDraft] = useState(initialData?.aiTranscription || '');
  const [showFixedDraftOptions, setShowFixedDraftOptions] = useState(false);

  // When initialData changes (e.g. navigation with ?edit=id)
  useEffect(() => {
    if (initialData) {
      setNewEntryContent(initialData.bodyText || '');
      setMediaUrls(initialData.mediaUrls || []);
      setOriginalDraft(initialData.aiTranscription || '');
    } else {
      setNewEntryContent('');
      setMediaUrls([]);
      setOriginalDraft('');
    }
  }, [initialData]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!newEntryContent && mediaUrls.length === 0) return;

    try {
      const cleanMediaUrls = mediaUrls.map(m => ({ type: m.type, url: m.url }));
      
      let res;
      if (initialData?.id) {
        // Edit mode
        res = await fetch(`/api/journal/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newEntryContent,
            mediaUrls: cleanMediaUrls,
            aiTranscription: originalDraft || null
          })
        });
      } else {
        // Create mode
        res = await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newEntryContent,
            isDraft: false,
            mediaUrls: cleanMediaUrls,
            aiTranscription: originalDraft || null
          })
        });
      }

      if (res.ok) {
        const savedPost = await res.json();
        
        if (!initialData?.id) {
          queueSyncAction('CREATE_JOURNAL_ENTRY', {
            bodyText: newEntryContent,
            visibility: 'private'
          });
        }

        setNewEntryContent('');
        setMediaUrls([]);
        setFixedDraft('');
        setOriginalDraft('');
        setShowFixedDraftOptions(false);
        
        toast.show(initialData?.id ? 'הרשומה עודכנה בהצלחה' : 'הרשומה נשמרה בהצלחה', 'success');
        
        if (onPostCreated) onPostCreated(savedPost);

        if (initialData?.id) {
          router.replace('/home'); // clear the ?edit query param
        }
      } else {
        const errorData = await res.json();
        toast.show(errorData.error || 'שגיאה בשמירה. ייתכן שהקובץ גדול מדי.', 'error');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.show('שגיאה בשמירה. ייתכן שהקובץ גדול מדי.', 'error');
    }
  };

  const handleAudioComplete = async (media) => {
    setIsRecording(true);
    try {
      const formData = new FormData();
      formData.append('audio', media.file, `recording.webm`);
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.basicText?.includes('שגיאה: חסר מפתח')) {
          toast.show(data.basicText, 'error');
          return;
        }
        
        setNewEntryContent(prev => prev ? prev + ' ' + (data.basicText || '') : (data.basicText || ''));
        setOriginalDraft(data.basicText || '');
        toast.show('ההקלטה תומללה', 'success');
      }
    } catch (err) {
      console.error(err);
      toast.show('שגיאה בתמלול ההקלטה', 'error');
    } finally {
      setIsRecording(false);
    }
  };

  const handleFixPhrasing = async () => {
    if (!newEntryContent) return;
    setIsFixingPhrasing(true);
    try {
      const res = await fetch('/api/ai/fix-phrasing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newEntryContent })
      });
      if (res.ok) {
        const data = await res.json();
        setOriginalDraft(newEntryContent);
        setFixedDraft(data.fixedText);
        setShowFixedDraftOptions(true);
      } else {
        toast.show('שגיאה בתיקון', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.show('שגיאה בתיקון', 'error');
    } finally {
      setIsFixingPhrasing(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.show('הקובץ גדול מדי. ניתן להעלות עד 4MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setMediaUrls([...mediaUrls, { type: 'image', url: reader.result }]);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '20px', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '20px'
    }}>
      {initialData?.id && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '16px' }}>עריכת רשומה</h3>
          <button onClick={() => { if(onCancelEdit) onCancelEdit(); router.replace('/home'); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>ביטול עריכה</button>
        </div>
      )}
      
      <div style={{ position: 'relative' }}>
        <textarea 
          style={{
            width: '100%', border: 'none', resize: 'none', outline: 'none', 
            fontSize: '16px', background: 'transparent'
          }}
          placeholder="מה איתך???"
          value={newEntryContent}
          onChange={(e) => setNewEntryContent(e.target.value)}
          rows={5}
        />
        <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
          <EmojiPickerButton onEmojiClick={(emoji) => setNewEntryContent(prev => prev + emoji)} />
        </div>
      </div>
      
      <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right', marginTop: '10px', marginBottom: '15px' }}>
        * לא ניתן למחוק {initialData?.id ? 'או לערוך ' : ''}רשומה לאחר חצי שעה מפרסומה
      </div>

      {showFixedDraftOptions && (
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>בחר את הניסוח המועדף:</h4>
          <div 
            style={{ padding: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer' }}
            onClick={() => { setNewEntryContent(originalDraft); setShowFixedDraftOptions(false); }}
          >
            <strong>המקורי שלי:</strong> {originalDraft}
          </div>
          <div 
            style={{ padding: '10px', background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer' }}
            onClick={() => { setNewEntryContent(fixedDraft); setShowFixedDraftOptions(false); }}
          >
            <strong>תוקן ע"י AI:</strong> {fixedDraft}
          </div>
        </div>
      )}

      {mediaUrls.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
          {mediaUrls.map((media, idx) => (
            media.type === 'image' && (
              <div key={idx} style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                <img src={media.url} alt="Uploaded" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                <button 
                  type="button" 
                  onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                  style={{
                    position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white',
                    border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'
                  }}
                >
                  X
                </button>
              </div>
            )
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSave} 
            disabled={!newEntryContent && mediaUrls.length === 0} 
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '50%', border: 'none',
              background: '#eff6ff', color: '#3b82f6', cursor: (!newEntryContent && mediaUrls.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (!newEntryContent && mediaUrls.length === 0) ? 0.5 : 1
            }} 
            title="שלח"
          >
            <Send size={20} />
          </button>
          
          {newEntryContent && !showFixedDraftOptions && aiLevel !== 'disabled' && (
            <button 
              onClick={handleFixPhrasing} 
              disabled={isFixingPhrasing} 
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '0 15px',
                borderRadius: '20px', border: 'none', background: '#fdf4ff', color: '#d946ef',
                cursor: isFixingPhrasing ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '13px'
              }}
            >
              <Sparkles size={16} /> 
              {aiLevel === 'spelling_only' ? 'תקן שגיאות כתיב' : (aiLevel === 'spelling_punctuation' ? 'תקן שגיאות ופיסוק' : 'תקן שגיאות וניסוח')}
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <AudioRecorder 
            onRecordingComplete={handleAudioComplete} 
            customButton={
              <button 
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                  background: '#fee2e2', color: '#ef4444', cursor: isRecording ? 'wait' : 'pointer'
                }} 
                title="הקלט קול" 
                disabled={isRecording}
              >
                <Mic size={20} />
              </button>
            }
          />
          <label 
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '50%', border: 'none',
              background: '#f1f5f9', color: '#64748b', cursor: 'pointer'
            }} 
            title="הוסף תמונה"
          >
            <ImageIcon size={20} />
            <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleImageUpload} />
          </label>
        </div>
      </div>
    </div>
  );
}
