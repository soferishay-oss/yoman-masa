import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Save, Trash2, Edit2, AlertCircle, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

const MultiSelectDropdown = ({ options, value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = options.filter(o => value.includes(o.id));
  
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '200px' }}>
      <div 
        onClick={() => !disabled && setOpen(!open)}
        style={{ 
          padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', 
          backgroundColor: disabled ? '#f1f5f9' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '38px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
          {selectedOptions.length === 0 ? <span style={{color: '#94a3b8', fontSize: '13px'}}>בחר מחנכים...</span> : 
            selectedOptions.map(o => (
              <span key={o.id} style={{ background: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                {o.fullName}
              </span>
            ))
          }
        </div>
        <ChevronDown size={16} color="#94a3b8" />
      </div>
      {open && !disabled && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', 
          border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', zIndex: 50,
          maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }}>
          {options.length === 0 ? <div style={{padding: '8px', color: '#94a3b8', fontSize: '13px'}}>אין אנשי צוות</div> : null}
          {options.map(o => (
            <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px', margin: 0 }}>
              <input 
                type="checkbox" 
                checked={value.includes(o.id)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...value, o.id]);
                  else onChange(value.filter(id => id !== o.id));
                }}
                style={{ cursor: 'pointer' }}
              />
              {o.fullName}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function YearTransitionWizard({ onComplete }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [currentYearName, setCurrentYearName] = useState('');
  
  const [newYearName, setNewYearName] = useState('');
  
  const toast = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [groupsRes, staffRes, yearsRes] = await Promise.all([
          fetch('/api/admin/groups?type=class'),
          fetch('/api/admin/users?role=non_student'),
          fetch('/api/admin/academic-years')
        ]);
        if (groupsRes.ok && staffRes.ok && yearsRes.ok) {
          const groupsData = await groupsRes.json();
          const staffData = await staffRes.json();
          const yearsData = await yearsRes.json();
          
          setStaff(staffData);
          
          let currentYr = '';
          const currentObj = yearsData.find(y => y.isCurrent);
          if (currentObj) currentYr = currentObj.name;
          setCurrentYearName(currentYr);

          // Suggest next year
          if (currentYr === 'תשפ״ה' || currentYr === 'תשפה') setNewYearName('תשפ״ו');
          else if (currentYr === 'תשפ״ו' || currentYr === 'תשפו') setNewYearName('תשפ״ז');
          else if (currentYr === 'תשפ״ז' || currentYr === 'תשפז') setNewYearName('תשפ״ח');
          else setNewYearName('תשפ״_');
          
          // Pre-fill suggestions
          const mappedClasses = groupsData.map(c => {
            let suggestedName = c.name;
            // Basic Hebrew letter bump (e.g. "י" -> "יא", "ז" -> "ח")
            // This is a naive bump, the admin can edit it.
            const bumpMap = {
              'א': 'ב', 'ב': 'ג', 'ג': 'ד', 'ד': 'ה', 'ה': 'ו', 'ו': 'ז',
              'ז': 'ח', 'ח': 'ט', 'ט': 'י', 'י': 'יא', 'יא': 'יב', 'יב': 'יג',
              'יג': 'יד', 'יד': 'בוגרים'
            };
            const match = c.name.match(/^([א-ת]+)(.*)/);
            if (match && bumpMap[match[1]]) {
              suggestedName = bumpMap[match[1]] + match[2];
            }

            return {
              id: c.id,
              originalName: c.name,
              newName: suggestedName,
              managers: c.managers.map(m => m.id),
              archive: suggestedName.includes('בוגרים')
            };
          });
          
          setClasses(mappedClasses);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך לבצע מעבר שנה? פעולה זו תיצור גיבוי של שמות הכיתות והמחנכים הקודמים, ותשנה את שנת הלימודים הפעילה.')) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/admin/academic-years/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newYearName,
          startDate: new Date(new Date().getFullYear(), 8, 1).toISOString(), // Sept 1st
          endDate: new Date(new Date().getFullYear() + 1, 5, 30).toISOString(), // June 30th
          classesUpdate: classes
        })
      });

      if (res.ok) {
        if (toast?.show) toast.show('מעבר השנה בוצע בהצלחה!', 'success');
        onComplete();
      } else {
        const errorData = await res.json();
        if (toast?.show) toast.show(errorData.error || 'שגיאה במעבר שנה', 'error');
      }
    } catch (err) {
      if (toast?.show) toast.show('שגיאה בתקשורת', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>טוען נתונים...</div>;

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
        <AlertCircle size={28} color="#3b82f6" />
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>אשף מעבר שנת לימודים</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>כאן תוכל לקדם את כל הכיתות שנה אחת קדימה, לעדכן שמות ומחנכים, ולשמור על ההיסטוריה.</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: '0 0 10px 0', color: '#64748b' }}>שנת הלימודים הנוכחית: <strong>{currentYearName || 'לא מוגדרת'}</strong></p>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>שם השנה החדשה:</label>
        <input 
          type="text" 
          value={newYearName} 
          onChange={e => setNewYearName(e.target.value)} 
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '200px' }}
        />
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px' }}>שם נוכחי</th>
              <th style={{ padding: '12px' }}>שם חדש לשנה הבאה</th>
              <th style={{ padding: '12px' }}>מחנכים לשנה הבאה</th>
              <th style={{ padding: '12px', textAlign: 'center' }} title="כיתה שמסיימת תועבר לארכיון ולא תופיע ברשימת הכיתות הפעילות">ארכיון (סיום)</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c, index) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', color: '#64748b' }}>{c.originalName}</td>
                <td style={{ padding: '12px' }}>
                  <input 
                    type="text" 
                    value={c.newName} 
                    onChange={e => {
                      const newClasses = [...classes];
                      newClasses[index].newName = e.target.value;
                      setClasses(newClasses);
                    }}
                    disabled={c.archive}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '150px', backgroundColor: c.archive ? '#f1f5f9' : '#fff' }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <MultiSelectDropdown 
                    options={staff}
                    value={c.managers}
                    disabled={c.archive}
                    onChange={(newManagers) => {
                      const newClasses = [...classes];
                      newClasses[index].managers = newManagers;
                      setClasses(newClasses);
                    }}
                  />
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={c.archive}
                    onChange={e => {
                      const newClasses = [...classes];
                      newClasses[index].archive = e.target.checked;
                      setClasses(newClasses);
                    }}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button onClick={onComplete} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
          ביטול
        </button>
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {saving ? 'מבצע מעבר...' : 'בצע מעבר שנה!'} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
