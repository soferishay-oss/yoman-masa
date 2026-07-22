'use client';
import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛',
  '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫',
  '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳', '😱',
  '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
  '😐', '😑', '😬', '🙄', '😯', '😮', '😲', '🥱', '😴', '🤤',
  '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕',
  '👍', '👎', '👏', '🙌', '🤲', '🤝', '🙏', '✌️', '🤞', '💪',
  '✍️', '👋', '✋', '🖐', '👌', '🤌', '🤏',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✡️', '🕎',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦉',
  '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '🍀', '🍁', '🍂', '🍃',
  '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈',
  '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐',
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱'
];

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div style={{ 
          position: 'absolute', 
          bottom: '100%', 
          left: 0, 
          zIndex: 50, 
          marginBottom: '5px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          padding: '12px',
          width: '280px',
          maxHeight: '220px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          justifyItems: 'center'
        }}>
          {EMOJI_LIST.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onEmojiClick(emoji);
                setShowPicker(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.target.style.background = 'none'}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
