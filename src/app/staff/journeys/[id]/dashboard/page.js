'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, LayoutDashboard, Search, Mic, Download, BarChart2, Brain, List } from 'lucide-react';
import AppDate from '@/components/AppDate';
import { useToast } from '@/components/ToastProvider';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';

export default function AdminJourneyDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  
  const [journey, setJourney] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('answers'); // 'answers', 'analytics', 'ai'
  
  const [filterStation, setFilterStation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [aiInsights, setAiInsights] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [jRes, rRes] = await Promise.all([
        fetch(`/api/staff/journeys/${params.id}`),
        fetch(`/api/staff/journeys/${params.id}/responses`)
      ]);
      
      if (jRes.ok && rRes.ok) {
        setJourney(await jRes.json());
        setResponses(await rRes.json());
      } else {
        router.push('/staff/journeys');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAiInsights = async () => {
    if (aiInsights) return; // Already generated
    setIsGeneratingAi(true);
    try {
      const res = await fetch(`/api/staff/journeys/${params.id}/insights`);
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data.insights);
      } else {
        toast.show('שגיאה בהפקת התובנות', 'error');
      }
    } catch (e) {
      toast.show('שגיאת רשת', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const exportToExcel = () => {
    if (responses.length === 0) {
      toast.show('אין נתונים לייצוא', 'error');
      return;
    }

    const exportData = responses.map(r => {
      const row = {
        'תאריך הגשה': new Date(r.createdAt).toLocaleString('he-IL'),
        'שם התלמיד': r.user.fullName,
        'כיתה': r.user.class?.name || 'ללא כיתה',
        'תחנה': r.station.title,
      };

      // Add all answers as columns
      Object.entries(r.answers || {}).map(([key, val]) => {
        const q = (r.station.questions || []).find(q => q.id === key);
        const colName = q ? q.label : key;
        row[colName] = val;
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "תשובות למסע");
    XLSX.writeFile(workbook, `journey_${journey.title}_export.xlsx`);
  };

  // Prepare chart data (Mood average per station)
  const calculateMoodData = () => {
    if (!journey) return [];
    const moodKeys = ['mood', 'summary_mood', 'מצב רוח'];
    
    return journey.stations.map(station => {
      const stationResponses = responses.filter(r => r.stationId === station.id);
      let moodSum = 0;
      let moodCount = 0;
      
      stationResponses.forEach(r => {
        const moodKey = Object.keys(r.answers || {}).find(k => moodKeys.includes(k));
        if (moodKey && r.answers[moodKey]) {
          const val = r.answers[moodKey];
          let rating = 3;
          if (val.includes('מצוין') || val.includes('מצויין')) rating = 5;
          else if (val.includes('על הפנים') || val.includes('רע')) rating = 1;
          else if (val.includes('טוב') || val.includes('סביר')) rating = 3;
          else if (val === '5') rating = 5;
          else if (val === '4') rating = 4;
          else if (val === '2') rating = 2;
          else if (val === '1') rating = 1;
          
          moodSum += rating;
          moodCount++;
        }
      });
      
      return {
        name: station.title,
        averageMood: moodCount > 0 ? Number((moodSum / moodCount).toFixed(1)) : 0,
        count: moodCount
      };
    }).filter(d => d.count > 0);
  };

  const moodChartData = calculateMoodData();

  if (isLoading) return <div style={{ padding: '20px' }}>טוען...</div>;
  if (!journey) return null;

  const filteredResponses = responses.filter(r => {
    if (filterStation !== 'all' && r.station.id !== filterStation) return false;
    if (searchQuery && !r.user.fullName.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', cursor: 'pointer', marginBottom: '15px' }} onClick={() => router.push(`/staff/journeys/${journey.id}`)}>
          <ArrowRight size={16} /> חזרה לעריכת מסע
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LayoutDashboard color="#3b82f6" /> דשבורד: {journey.title}
            </h1>
            <p style={{ margin: 0, color: '#475569' }}>צפה בכל התשובות, נתח מגמות והורד דוחות</p>
          </div>
          <button 
            onClick={exportToExcel}
            style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <Download size={18} /> ייצא לאקסל
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('answers')}
          style={{ padding: '10px 20px', background: activeTab === 'answers' ? '#eff6ff' : 'transparent', color: activeTab === 'answers' ? '#3b82f6' : '#64748b', border: 'none', borderBottom: activeTab === 'answers' ? '2px solid #3b82f6' : '2px solid transparent', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <List size={18} /> טבלת תשובות
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          style={{ padding: '10px 20px', background: activeTab === 'analytics' ? '#eff6ff' : 'transparent', color: activeTab === 'analytics' ? '#3b82f6' : '#64748b', border: 'none', borderBottom: activeTab === 'analytics' ? '2px solid #3b82f6' : '2px solid transparent', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <BarChart2 size={18} /> גרפים וניתוחים
        </button>
        <button 
          onClick={() => { setActiveTab('ai'); generateAiInsights(); }}
          style={{ padding: '10px 20px', background: activeTab === 'ai' ? '#fdf4ff' : 'transparent', color: activeTab === 'ai' ? '#d946ef' : '#64748b', border: 'none', borderBottom: activeTab === 'ai' ? '2px solid #d946ef' : '2px solid transparent', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Brain size={18} /> סיכום AI
        </button>
      </div>

      {/* Tab Content: Answers */}
      {activeTab === 'answers' && (
        <>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>סינון לפי תחנה</label>
              <select 
                value={filterStation}
                onChange={e => setFilterStation(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="all">כל התחנות</option>
                {journey.stations.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>חיפוש תלמיד</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', right: '10px', top: '10px', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="שם התלמיד..."
                  style={{ width: '100%', padding: '10px 35px 10px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            {filteredResponses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b' }}>לא נמצאו תשובות התואמות לחיפוש.</p>
              </div>
            ) : (
              filteredResponses.map(r => (
                <div key={r.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{r.user.fullName}</h3>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {r.user.class?.name || 'ללא כיתה'} | תחנה: {r.station.title}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      <AppDate date={r.createdAt} />
                    </div>
                  </div>

                  {/* Render answers */}
                  <div style={{ marginBottom: '15px' }}>
                    {Object.entries(r.answers || {}).map(([key, val]) => {
                      const question = (r.station.questions || []).find(q => q.id === key);
                      const label = question ? question.label : (key === 'q1' ? 'תשובה' : key);
                      return (
                        <div key={key} style={{ marginBottom: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>{label}</div>
                          <div style={{ whiteSpace: 'pre-wrap', color: '#1e293b' }}>{val || 'לא השיב'}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Render Media */}
                  {r.mediaUrls && r.mediaUrls.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                      {r.mediaUrls.map((url, i) => {
                        const isAudio = url.match(/\.(webm|mp4|mp3|wav|ogg)$/i) || url.startsWith('blob:');
                        if (isAudio) {
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f8fafc', padding: '8px 12px', borderRadius: '20px', fontSize: '13px', color: '#475569' }}>
                              <Mic size={16} color="#3b82f6" />
                              <audio src={url} controls style={{ height: '30px', width: '200px' }} />
                            </div>
                          );
                        } else {
                          return (
                            <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                              <img src={url} alt="Attachment" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                            </a>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Tab Content: Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>גרף מצב הרוח במסע</h2>
          {moodChartData.length > 0 ? (
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodChartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickMargin={10}
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    ticks={[1, 2, 3, 4, 5]} 
                    tick={{ fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="averageMood" name="ממוצע מצב רוח" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              אין מספיק נתונים על מצב רוח כדי להציג גרף. יש לוודא שהוגדרו שאלות עם המזהה "mood".
            </div>
          )}
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '20px', textAlign: 'center' }}>
            הגרף מציג את הממוצע של מצב הרוח בכל תחנה, ומאפשר לראות אם חל שיפור או ירידה במורל התלמידים מתחילת המסע ועד סופו.
          </p>
        </div>
      )}

      {/* Tab Content: AI Summary */}
      {activeTab === 'ai' && (
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
            <div style={{ background: '#fdf4ff', padding: '12px', borderRadius: '50%' }}>
              <Brain size={28} color="#d946ef" />
            </div>
            <div>
              <h2 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>סיכום מסע באמצעות בינה מלאכותית</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                מערכת ה-AI קוראת את כל התשובות (באופן אנונימי) ומפיקה תובנות ודגשים אופרטיביים לצוות.
              </p>
            </div>
          </div>

          {isGeneratingAi ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ display: 'inline-block', animation: 'spin 2s linear infinite' }}>
                <Brain size={40} color="#cbd5e1" />
              </div>
              <p style={{ marginTop: '15px', color: '#475569', fontWeight: 'bold' }}>המערכת קוראת, מנתחת ומפיקה תובנות...</p>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>זה עשוי לקחת חצי דקה, אנא המתן.</p>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : aiInsights ? (
            <div style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px' }}>
              <ReactMarkdown>{aiInsights}</ReactMarkdown>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <button 
                onClick={generateAiInsights}
                style={{ background: '#d946ef', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '25px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(217, 70, 239, 0.3)' }}
              >
                הפק דוח תובנות עכשיו
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
