import { useContext } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';
import { getHebrewDate, getGregorianDate } from '@/lib/dateUtils';

export function formatAppDateString(date, mode = 'hebrew_dominant') {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const heb = getHebrewDate(d);
  const greg = getGregorianDate(d);

  switch (mode) {
    case 'hebrew_only':
      return heb;
    case 'gregorian_only':
      return greg;
    case 'gregorian_dominant':
      return `${greg} (${heb})`;
    case 'hebrew_dominant':
    default:
      return `${heb} (${greg})`;
  }
}

export default function AppDate({ date, mode, style = {} }) {
  const theme = useContext(ThemeContext);
  const activeMode = mode || theme.defaultDateMode || 'hebrew_dominant';

  if (!date) return null;
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const heb = getHebrewDate(d);
  const greg = getGregorianDate(d);

  const secondaryStyle = { fontSize: '0.85em', opacity: 0.8, fontWeight: 'normal', margin: '0 4px' };

  switch (activeMode) {
    case 'hebrew_only':
      return <span style={style}>{heb}</span>;
    case 'gregorian_only':
      return <span style={style}>{greg}</span>;
    case 'gregorian_dominant':
      return (
        <span style={style} className="app-date" dir="rtl">
          {greg}
          <span style={secondaryStyle}>({heb})</span>
        </span>
      );
    case 'hebrew_dominant':
    default:
      return (
        <span style={style} className="app-date" dir="rtl">
          {heb}
          <span style={secondaryStyle}>({greg})</span>
        </span>
      );
  }
}
