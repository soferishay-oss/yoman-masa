import React, { useState, useEffect } from 'react';
import { ChevronRight, Save, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function YearTransitionWizard({ onComplete }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  
  const [newYearName, setNewYearName] = useState('תשפ״ז');
  
  const toast = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [groupsRes, staffRes] = await Promise.all([
          fetch('/api/admin/groups?type=class'),
          fetch('/api/admin/users?role=non_student')
        ]);
        if (groupsRes.ok && staffRes.ok) {
          const groupsData = await groupsRes.json();
          const staffData = await staffRes.json();
          
          setStaff(staffData);
          
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
                  <select 
                    multiple
                    size={2}
                    value={c.managers}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      const newClasses = [...classes];
                      newClasses[index].managers = selected;
                      setClasses(newClasses);
                    }}
                    disabled={c.archive}
                    style={{ padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '200px', backgroundColor: c.archive ? '#f1f5f9' : '#fff' }}
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
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
