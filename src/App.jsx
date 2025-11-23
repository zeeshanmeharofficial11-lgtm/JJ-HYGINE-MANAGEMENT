import React, { useState, useEffect } from 'react';
import { Check, X, Camera, Save, AlertCircle, BarChart3, Users, Building, TrendingUp, Award, AlertTriangle, Edit2, ChevronDown, ChevronUp, LogOut, Moon, Sun, Download } from 'lucide-react';
import { db } from './api/supabase';

const BRANCHES = ['DHA-PH6', 'DHA-PH4', 'Wehshi Lab', 'Cloud Kitchen', 'Johar Town', 'Emporium', 'Bahria', 'Head Office'];

const AnimatedBackground = ({ darkMode }) => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
    <style>{`
      @keyframes blob {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(20px, -50px) scale(1.1); }
        50% { transform: translate(-20px, 20px) scale(0.9); }
        75% { transform: translate(50px, 50px) scale(1.05); }
      }
      .animate-blob {
        animation: blob 20s infinite;
      }
      .animation-delay-2000 {
        animation-delay: 2s;
      }
      .animation-delay-4000 {
        animation-delay: 4s;
      }
    `}</style>
  </div>
);

const LoginScreen = ({ onLogin, darkMode, toggleDarkMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setLoading(true);
    try {
      const result = await db.login(username.trim(), password.trim());
      if (result.success) {
        setError('');
        onLogin(result.user);
      } else {
        setError(result.error || 'Invalid credentials');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-orange-900 to-red-900' : 'bg-gradient-to-br from-orange-400 via-red-500 to-yellow-500'}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-0 left-0 w-96 h-96 ${darkMode ? 'bg-orange-600' : 'bg-yellow-400'} rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob`}></div>
        </div>
      </div>
      
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-3 bg-white/20 backdrop-blur-lg rounded-full hover:bg-white/30 transition-all z-50 shadow-lg"
      >
        {darkMode ? <Sun className="text-yellow-300" size={24} /> : <Moon className="text-white" size={24} />}
      </button>

      <div className={`${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-500 relative z-10`}>
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-orange-400 via-red-500 to-yellow-400 rounded-full mb-4">
            <div className="text-6xl">✨</div>
          </div>
          
          <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            JOHNNY & JUGNU
          </h1>
          <p className="text-xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
            HYGIENE SYSTEM
          </p>
          
          <div className="mt-4">
            <p className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              ✨ Be the Spark ✨
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 border-gray-300'} border rounded-xl focus:ring-2 focus:ring-orange-500 transition-all`}
              placeholder="Enter username"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 border-gray-300'} border rounded-xl focus:ring-2 focus:ring-orange-500 transition-all`}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:from-orange-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 shadow-lg"
          >
            {loading ? '🔄 Logging in...' : '🔥 Ignite Login'}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Default: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ onNavigate, user, onLogout, darkMode, toggleDarkMode }) => {
  const [stats, setStats] = useState({ total: 0, byBranch: {}, checklists: [] });
  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Play welcome sound on mount
  useEffect(() => {
    const playWelcomeSound = () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const playNote = (frequency, startTime, duration) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };
        
        const now = audioContext.currentTime;
        playNote(523.25, now, 0.5);
        playNote(659.25, now + 0.1, 0.6);
        playNote(783.99, now + 0.2, 0.7);
        
        setAudioPlaying(true);
        setTimeout(() => setAudioPlaying(false), 1000);
      } catch (err) {
        console.log('Audio not supported:', err);
      }
    };

    const timer = setTimeout(() => {
      playWelcomeSound();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const filters = user.role === 'admin' ? {} : { branch: user.branch };
      const checklists = await db.getChecklists(filters);
      
      console.log('📊 Loaded checklists:', checklists.length);
      
      const byBranch = {};
      BRANCHES.forEach(branch => {
        const branchChecklists = checklists.filter(c => c.branch === branch);
        byBranch[branch] = {
          total: branchChecklists.length,
          avgScore: calculateAvgScore(branchChecklists)
        };
      });

      setStats({ 
        total: checklists.length, 
        byBranch,
        checklists
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgScore = (checklists) => {
    if (checklists.length === 0) return 0;
    const sum = checklists.reduce((acc, c) => acc + parseFloat(c.score || 0), 0);
    return (sum / checklists.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🔄</div>
          <div className="text-2xl font-bold">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <AnimatedBackground darkMode={darkMode} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-start mb-10">
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl relative">
                {audioPlaying && (
                  <div className="absolute inset-0 rounded-2xl animate-ping bg-blue-400 opacity-75"></div>
                )}
                <span className="text-2xl relative z-10">👋</span>
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} relative`}>
                  Welcome back, <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    {user.name ? user.name.split(' ')[0] : user.username}
                  </span>
                  {audioPlaying && (
                    <span className="ml-3 inline-flex gap-1">
                      <span className="animate-bounce" style={{animationDelay: '0ms'}}>🎵</span>
                      <span className="animate-bounce" style={{animationDelay: '100ms'}}>🎶</span>
                      <span className="animate-bounce" style={{animationDelay: '200ms'}}>✨</span>
                    </span>
                  )}
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-800/80' : 'bg-white'} backdrop-blur-xl px-3 py-2 rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⚡</span>
                </div>
                <div>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium uppercase tracking-wide`}>Level</p>
                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.level || 1}</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-800/80' : 'bg-white'} backdrop-blur-xl px-3 py-2 rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⭐</span>
                </div>
                <div>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium uppercase tracking-wide`}>Points</p>
                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.points || 0} XP</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-800/80' : 'bg-white'} backdrop-blur-xl px-3 py-2 rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🔥</span>
                </div>
                <div>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium uppercase tracking-wide`}>Streak</p>
                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.streak || 0} days</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleDarkMode}
              className={`p-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} border rounded-xl hover:shadow-xl transition-all`}
            >
              {darkMode ? <Sun className="text-yellow-400" size={20} /> : <Moon className="text-gray-700" size={20} />}
            </button>
            <button
              onClick={onLogout}
              className={`flex items-center gap-2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border px-5 py-3 rounded-xl font-medium hover:shadow-xl transition-all`}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-2 rounded-2xl p-6 shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Inspections</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('checklist')}
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 transform hover:scale-105"
          >
            <Check size={32} className="mb-2" />
            <p className="text-lg font-bold">➕ New Inspection</p>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <BarChart3 size={32} className="mb-2" />
            <p className="text-lg font-bold">📊 Reports</p>
          </button>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🏢 Branch Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BRANCHES.map(branch => (
              <div key={branch} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-xl hover:shadow-lg transition-all`}>
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{branch}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  {stats.byBranch[branch]?.total || 0} inspections
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {stats.byBranch[branch]?.avgScore || 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChecklistForm = ({ onNavigate, onSubmit, user, darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState({
    basicInfo: {
      branch: user.role === 'admin' ? '' : user.branch,
      date: new Date().toISOString().split('T')[0],
      shift: '',
      employeeName: '',
      employeeId: '',
      employeeType: 'rider',
      managerType: ''
    },
    employeePhoto: null,
    bikePhoto: null
  });

  const handleSubmit = async () => {
    if (!checklist.basicInfo.employeeName || !checklist.basicInfo.employeeId || !checklist.basicInfo.shift || !checklist.basicInfo.branch) {
      alert('⚠️ Please fill all required fields!');
      return;
    }

    setLoading(true);
    try {
      await db.createChecklist(checklist, user.username);
      alert('✅ Checklist saved successfully!');
      onSubmit();
    } catch (error) {
      alert('❌ Failed: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => onNavigate('dashboard')} 
          className="mb-4 text-blue-500 hover:text-blue-700 flex items-center gap-2 font-medium"
        >
          ← Back to Dashboard
        </button>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ✨ New Inspection Checklist
          </h2>

          <div className="space-y-4">
            {user.role === 'admin' && (
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Branch *
                </label>
                <select
                  value={checklist.basicInfo.branch}
                  onChange={(e) => setChecklist({
                    ...checklist,
                    basicInfo: { ...checklist.basicInfo, branch: e.target.value }
                  })}
                  className={`w-full p-3 border-2 rounded-xl ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'} focus:border-blue-500 transition-all`}
                >
                  <option value="">🏢 Select Branch</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Employee Name *
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                value={checklist.basicInfo.employeeName}
                onChange={(e) => setChecklist({
                  ...checklist,
                  basicInfo: { ...checklist.basicInfo, employeeName: e.target.value }
                })}
                className={`w-full p-3 border-2 rounded-xl ${darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'border-gray-300 placeholder-gray-400'} focus:border-blue-500 transition-all`}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Employee ID *
              </label>
              <input
                type="text"
                placeholder="Enter employee ID"
                value={checklist.basicInfo.employeeId}
                onChange={(e) => setChecklist({
                  ...checklist,
                  basicInfo: { ...checklist.basicInfo, employeeId: e.target.value }
                })}
                className={`w-full p-3 border-2 rounded-xl ${darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'border-gray-300 placeholder-gray-400'} focus:border-blue-500 transition-all`}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Shift *
              </label>
              <select
                value={checklist.basicInfo.shift}
                onChange={(e) => setChecklist({
                  ...checklist,
                  basicInfo: { ...checklist.basicInfo, shift: e.target.value }
                })}
                className={`w-full p-3 border-2 rounded-xl ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'} focus:border-blue-500 transition-all`}
              >
                <option value="">⏰ Select Shift</option>
                <option value="A">🌅 Shift A (Morning)</option>
                <option value="B">🌙 Shift B (Evening)</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Manager Type *
              </label>
              <select
                value={checklist.basicInfo.managerType}
                onChange={(e) => setChecklist({
                  ...checklist,
                  basicInfo: { ...checklist.basicInfo, managerType: e.target.value }
                })}
                className={`w-full p-3 border-2 rounded-xl ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'} focus:border-blue-500 transition-all`}
              >
                <option value="">👨‍💼 Select Manager Type</option>
                <option value="DFPL Morning">🌅 DFPL Morning</option>
                <option value="DFPL Night">🌙 DFPL Night</option>
                <option value="BOH Morning">🌅 BOH Morning</option>
                <option value="BOH Night">🌙 BOH Night</option>
                <option value="FOH Morning">🌅 FOH Morning</option>
                <option value="FOH Night">🌙 FOH Night</option>
                <option value="ABL">⭐ ABL</option>
                <option value="BL">💎 BL</option>
                <option value="Auditor">🔍 Auditor</option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? '⏳ Saving...' : '💾 Save Checklist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Reports = ({ onNavigate, user, darkMode }) => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      const filters = user.role === 'admin' ? {} : { branch: user.branch };
      const data = await db.getChecklists(filters);
      setChecklists(data);
    } catch (error) {
      console.error('Failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => onNavigate('dashboard')} 
          className="mb-4 text-blue-500 hover:text-blue-700 flex items-center gap-2 font-medium"
        >
          ← Back to Dashboard
        </button>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📊 Inspection Reports
          </h2>

          {loading ? (
            <p className="text-center py-8">Loading...</p>
          ) : checklists.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 text-lg">No reports yet</p>
              <button
                onClick={() => onNavigate('checklist')}
                className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Create First Inspection
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {checklists.map((item) => (
                <div key={item.id} className={`border-2 rounded-xl p-4 ${darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'} transition-all hover:shadow-lg`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.employee_name}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        🏢 {item.branch} • 👤 {item.employee_type} • 🕐 Shift {item.shift}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                        ID: {item.employee_id} • By: {item.manager_type || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-black ${parseFloat(item.score) >= 90 ? 'text-green-600' : parseFloat(item.score) >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {parseFloat(item.score).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />;
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      {currentView === 'dashboard' && (
        <Dashboard 
          onNavigate={setCurrentView}
          user={currentUser}
          onLogout={handleLogout}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
        />
      )}
      {currentView === 'checklist' && (
        <ChecklistForm 
          onNavigate={setCurrentView}
          onSubmit={() => setCurrentView('dashboard')}
          user={currentUser}
          darkMode={darkMode}
        />
      )}
      {currentView === 'reports' && (
        <Reports 
          onNavigate={setCurrentView}
          user={currentUser}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

export default App;
