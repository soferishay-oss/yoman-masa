'use client';
import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Smile } from 'lucide-react';

export default function EmojiPickerButton({ onEmojiClick }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pickerRef]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={pickerRef}>
      <button 
        type="button" 
        onClick={() => setShowPicker(!showPicker)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
      >
        <Smile size={20} />
      </button>
      
      {showPicker && (
        <div style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 50, marginBottom: '5px' }}>
          <EmojiPicker 
            onEmojiClick={(emojiData) => {
              onEmojiClick(emojiData.emoji);
              setShowPicker(false);
            }} 
            autoFocusSearch={false}
            searchDisabled
          />
        </div>
      )}
    </div>
  );
}
