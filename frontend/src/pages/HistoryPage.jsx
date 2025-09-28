import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import MoodBadge from '../components/MoodBadge';
import { useUser } from '../context/UserContext';
import { format } from 'date-fns';
import MoodHistoryChart from '../components/MoodHistoryChart';
import { fetchMoodHistory, getPlanCalendarHistory } from '../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const HistoryPage = () => {
  const { user, updateUserPreferences } = useUser();

  const handleLanguageChange = (language) => {
    updateUserPreferences({ language });
  };

  const titleText = {
    english: "Mood History",
    hindi: "मूड इतिहास",
    gujarati: "મૂડ ઇતિહાસ"
  };

  const subtitleText = {
    english: "Track your emotional journey",
    hindi: "अपनी भावनात्मक यात्रा को ट्रैक करें",
    gujarati: "તમારી ભાવનાત્મક યાત્રાને ટ્રૅક કરો"
  };

  const noHistoryText = {
    english: "No mood history yet. Share how you're feeling on the home page.",
    hindi: "अभी तक कोई मूड इतिहास नहीं। होम पेज पर साझा करें कि आप कैसा महसूस कर रहे हैं।",
    gujarati: "હજી સુધી કોઈ મૂડ ઇતિહાસ નથી. હોમ પેજ પર શેર કરો કે તમે કેવું અનુભવી રહ્યા છો."
  };
  
  const signInHint = {
    english: 'Sign in to unlock your mood history chart.',
    hindi: 'अपने मूड इतिहास चार्ट को देखने के लिए साइन इन करें।',
    gujarati: 'તમારો મૂડ ઇતિહાસ ચાર્ટ જોવા માટે સાઇન ઇન કરો.'
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const [serverHistory, setServerHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [planAnalytics, setPlanAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchMoodHistory(30);
        if (mounted) {
          if (res?.moods && Array.isArray(res.moods)) {
            setServerHistory(res.moods);
          } else {
            setServerHistory([]);
          }
        }
      } catch (_) {
        if (mounted) setServerHistory([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Load plan analytics (last month) for completion & utilization trends
  useEffect(()=>{
    let active = true;
    (async()=>{
      setAnalyticsLoading(true);
      try {
        const now = new Date();
        const res = await getPlanCalendarHistory(now.getMonth()+1, now.getFullYear());
        if (!active) return;
        // Transform into chart data sorted by date
        const chartData = Object.entries(res.days||{}).sort((a,b)=>a[0].localeCompare(b[0])).map(([d, st]) => ({
          date: d.slice(5),
          taskRate: Math.round(st.completion_rate||0),
          minutesRate: Math.round(st.minutes_completion_rate||0)
        }));
        setPlanAnalytics({ summary: res.summary, chartData });
      } catch (_) {
        if (active) setPlanAnalytics(null);
      } finally {
        if (active) setAnalyticsLoading(false);
      }
    })();
    return ()=>{ active=false; };
  },[]);

  const hasLocal = user.moodHistory && user.moodHistory.length > 0;
  const hasServer = serverHistory && serverHistory.length > 0;
  const sourceData = hasServer ? serverHistory : (user.moodHistory || []);
  const totalPages = Math.max(1, Math.ceil(sourceData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sourceData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1"></div>
          <LanguageSelector 
            currentLanguage={user.language} 
            onLanguageChange={handleLanguageChange} 
          />
        </div>

        {/* Header */}
        <Header 
          title={titleText[user.language] || titleText.english} 
          subtitle={subtitleText[user.language] || subtitleText.english} 
        />

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Chart Section */}
          {hasServer && (
            <div className="lg:col-span-5">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {user.language === 'english' ? 'Last 30 Days' : 
                     user.language === 'hindi' ? 'पिछले 30 दिन' : 'છેલ્લા 30 દિવસ'}
                  </h3>
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                </div>
                <MoodHistoryChart data={serverHistory} />
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>Productivity Trend</span>
                    <span className="text-[10px] text-gray-400">(Completion vs Minutes)</span>
                  </h4>
                  {analyticsLoading ? (
                    <div className="text-xs text-gray-500">Loading analytics...</div>
                  ) : planAnalytics?.chartData?.length ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={planAnalytics.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                          <YAxis domain={[0,100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                          <Tooltip wrapperStyle={{ fontSize: 11 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="taskRate" name="Tasks %" stroke="#6366f1" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="minutesRate" name="Minutes %" stroke="#f43f5e" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No task data this month.</div>
                  )}
                  {planAnalytics?.summary && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                      <div className="p-2 rounded bg-white/60 border">
                        <div className="font-semibold text-gray-700">Tasks</div>
                        <div>{planAnalytics.summary.completed}/{planAnalytics.summary.total_tasks}</div>
                      </div>
                      <div className="p-2 rounded bg-white/60 border">
                        <div className="font-semibold text-gray-700">Minutes</div>
                        <div>{planAnalytics.summary.completed_minutes}/{planAnalytics.summary.total_planned_minutes}</div>
                      </div>
                      <div className="p-2 rounded bg-white/60 border col-span-2">
                        <div className="font-semibold text-gray-700">Utilization</div>
                        <div>{Math.round(planAnalytics.summary.overall_minutes_completion_rate||0)}% minutes • {Math.round(planAnalytics.summary.overall_completion_rate||0)}% tasks</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History List Section */}
          <div className={hasServer ? "lg:col-span-7" : "lg:col-span-12"}>
            {!hasLocal && !hasServer && !loading ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-12 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100/50"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌸</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No History Yet</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                  {noHistoryText[user.language] || noHistoryText.english}
                </p>
                {!localStorage.getItem('token') && (
                  <p className="text-gray-400 text-xs">
                    {signInHint[user.language] || signInHint.english}
                  </p>
                )}
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* History Grid */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {paginated.map((entry, index) => (
                      <motion.div
                        key={`${entry.id || index}-${entry.timestamp || entry.created_at}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden hover:shadow-md hover:scale-[1.01] transition-all duration-300"
                      >
                        {/* Main Content */}
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <MoodBadge mood={entry.mood || entry.mood_type} />
                            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                              {formatDate(entry.timestamp || entry.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
                            {entry.text}
                          </p>
                        </div>

                        {/* Response Section */}
                        {entry.response && (
                          <div className="border-t border-gray-100/50 bg-gradient-to-br from-gray-50/50 to-white/50 p-4">
                            <div className="flex items-center mb-2">
                              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-2"></div>
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                {entry.response.type === 'quote' ? 
                                  (user.language === 'english' ? 'Inspiration' : 
                                   user.language === 'hindi' ? 'प्रेरणा' : 'પ્રેરણા') : 
                                  (user.language === 'english' ? 'Action Plan' : 
                                   user.language === 'hindi' ? 'कार्य योजना' : 'કાર્ય યોજના')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {entry.response.content}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-8">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(p => Math.max(1, p-1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm disabled:opacity-40 hover:bg-white hover:shadow-sm transition-all duration-200"
                    >
                      {user.language==='hindi'?'पिछला':user.language==='gujarati'?'પાછળ':'Previous'}
                    </motion.button>
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <motion.button
                          key={pageNum}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-xl text-sm font-medium transition-all duration-200 ${
                            pageNum === currentPage 
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm' 
                              : 'bg-white/70 text-gray-600 hover:bg-white hover:shadow-sm'
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(p => Math.min(totalPages, p+1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm disabled:opacity-40 hover:bg-white hover:shadow-sm transition-all duration-200"
                    >
                      {user.language==='hindi'?'अगला':user.language==='gujarati'?'આગળ':'Next'}
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;