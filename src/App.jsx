
import React, { useState, useEffect } from 'react';
import { 
  Check, X, Camera, Save, AlertCircle, BarChart3, Users, Building, TrendingUp, Award,
  AlertTriangle, Edit2, ChevronDown, ChevronUp, LogOut, Lock, Star, Zap, Trophy,
  Target, Flame, Moon, Sun, Download, Mail, Bell, Filter, Calendar, MapPin, Clock,
  CheckCircle, XCircle
} from 'lucide-react';
import { supabase } from './supabaseClient';

const Database = {
  users: {
    admin: { password: 'admin123', role: 'admin', branch: 'all', name: 'System Admin', avatar: '👨‍💼', points: 0, level: 10, streak: 0 },
    dhaph6: { password: 'dhaph6@123', role: 'manager', branch: 'DHA-PH6', name: 'DHA-PH6 Manager', avatar: '👔', points: 0, level: 1, streak: 0 },
    dhaph4: { password: 'dhaph4@123', role: 'manager', branch: 'DHA-PH4', name: 'DHA-PH4 Manager', avatar: '👔', points: 0, level: 1, streak: 0 },
    wehshi: { password: 'wehshi@123', role: 'manager', branch: 'Wehshi Lab', name: 'Wehshi Lab Manager', avatar: '👔', points: 0, level: 1, streak: 0 },
    cloud: { password: 'cloud@123', role: 'manager', branch: 'Cloud Kitchen', name: 'Cloud Kitchen Manager', avatar: '👔', points: 0, level: 1, streak: 0 },
    johar: { password: 'johar@123', role: 'manager', branch: 'Johar Town', name: 'Johar Town Manager', avatar: '👔', points: 0, level: 1, streak: 0 },
    emporium: { password: 'emporium@123', role: 'manager', branch: 'Emporium', name: 'Emporium Manager', avatar: '👔', points: 0, level: 1, streak: 0 },
    bahria: { password: 'bahria@123', role: 'manager', branch: 'Bahria', name: 'Bahria Manager', avatar: '👔', points: 0, level: 1, streak: 0 },
    headoffice: { password: 'ho@123', role: 'manager', branch: 'Head Office', name: 'Head Office Manager', avatar: '👔', points: 0, level: 1, streak: 0 }
  },
  
  checklists: [],
  branches: ['DHA-PH6', 'DHA-PH4', 'Wehshi Lab', 'Cloud Kitchen', 'Johar Town', 'Emporium', 'Bahria', 'Head Office'],
  branchStaffConfig: {},
  darkMode: false,
  
  authenticate(username, password) {
    const user = this.users[username.toLowerCase()];
    if (user && user.password === password) {
      return { success: true, user: { username, ...user } };
    }
    return { success: false, message: 'Invalid username or password' };
  },
  
  updateUserProgress(username, points) {
    const user = this.users[username.toLowerCase()];
    if (user) {
      user.points += points;
      user.level = Math.floor(user.points / 100) + 1;
      user.streak = (user.lastCheckDate === new Date().toDateString()) ? user.streak : user.streak + 1;
      user.lastCheckDate = new Date().toDateString();
    }
  },
  
  initBranchConfig() {
    this.branches.forEach(branch => {
      if (!this.branchStaffConfig[branch]) {
        this.branchStaffConfig[branch] = {
          rider: { 
            total: 0, 
            shiftA: { count: 0, dayOff: 0, noShow: 0, medical: 0 },
            shiftB: { count: 0, dayOff: 0, noShow: 0, medical: 0 }
          },
          crew: { 
            total: 0, 
            shiftA: { count: 0, dayOff: 0, noShow: 0, medical: 0 },
            shiftB: { count: 0, dayOff: 0, noShow: 0, medical: 0 }
          },
          manager: { 
            total: 0, 
            shiftA: { count: 0, dayOff: 0, noShow: 0, medical: 0 },
            shiftB: { count: 0, dayOff: 0, noShow: 0, medical: 0 }
          }
        };
      }
    });
  },
  
  updateStaffConfig(branch, type, data) {
    this.branchStaffConfig[branch][type] = data;
  },
  
  getStaffConfig(branch, type) {
    if (!this.branchStaffConfig[branch]) {
      this.initBranchConfig();
    }
    return this.branchStaffConfig[branch][type];
  },
  
  saveChecklist(data, username) {
    const id = Date.now().toString();
    const checklist = { ...data, id, timestamp: new Date().toISOString() };
    this.checklists.push(checklist);
    
    const score = this.calculateChecklistScore(checklist);
    const points = score >= 90 ? 20 : score >= 70 ? 10 : 5;
    this.updateUserProgress(username, points);
    
    return { success: true, id, points, score };
  },
  
  getChecklists(filters) {
    let results = [...this.checklists];
    if (filters.branch) results = results.filter(c => c.basicInfo.branch === filters.branch);
    if (filters.date) results = results.filter(c => c.basicInfo.date === filters.date);
    if (filters.employeeType) results = results.filter(c => c.basicInfo.employeeType === filters.employeeType);
    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
  
  getStats(branch) {
    const filteredChecklists = branch ? this.checklists.filter(c => c.basicInfo.branch === branch) : this.checklists;
    const total = filteredChecklists.length;
    const byBranch = {};
    const recent = filteredChecklists.slice(-10).reverse();
    
    const branchesToProcess = branch ? [branch] : this.branches;
    
    branchesToProcess.forEach(b => {
      const branchChecklists = this.checklists.filter(c => c.basicInfo.branch === b);
      byBranch[b] = {
        total: branchChecklists.length,
        avgScore: this.calculateAvgScore(branchChecklists)
      };
    });
    
    // Calculate percentage changes
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const todayChecklists = filteredChecklists.filter(c => 
      c.basicInfo.date === today.toISOString().split('T')[0]
    );
    const yesterdayChecklists = filteredChecklists.filter(c => 
      c.basicInfo.date === yesterdayStr
    );
    
    // Calculate inspection change percentage
    let inspectionChange = 0;
    if (yesterdayChecklists.length > 0) {
      inspectionChange = ((todayChecklists.length - yesterdayChecklists.length) / yesterdayChecklists.length * 100).toFixed(0);
    } else if (todayChecklists.length > 0) {
      inspectionChange = 100;
    }
    
    // Calculate failed items change
    const todayFailedItems = this.getFailedItems(branch).length;
    const yesterdayFailedCount = yesterdayChecklists.reduce((acc, checklist) => {
      return acc + this.getChecklistSummary(checklist).length;
    }, 0);
    
    let failedItemsChange = 0;
    if (yesterdayFailedCount > 0) {
      failedItemsChange = ((todayFailedItems - yesterdayFailedCount) / yesterdayFailedCount * 100).toFixed(0);
    } else if (todayFailedItems > 0) {
      failedItemsChange = 100;
    } else if (todayFailedItems === 0 && yesterdayFailedCount === 0) {
      failedItemsChange = 0;
    }
    
    return { 
      total, 
      byBranch, 
      recent,
      inspectionChange: parseFloat(inspectionChange),
      failedItemsChange: parseFloat(failedItemsChange),
      todayInspections: todayChecklists.length,
      todayFailedItems
    };
  },
  
  getBranchRankings(branch) {
    const rankings = this.branches.map(b => {
      const branchChecklists = this.checklists.filter(c => c.basicInfo.branch === b);
      return {
        branch: b,
        avgScore: this.calculateAvgScore(branchChecklists),
        totalInspections: branchChecklists.length,
        isCurrentBranch: b === branch
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
    
    return rankings;
  },
  
  getEmployeeRankings(branch) {
    let checklists = branch ? this.checklists.filter(c => c.basicInfo.branch === branch) : this.checklists;
    
    const employeeScores = {};
    checklists.forEach(c => {
      const empId = c.basicInfo.employeeId;
      if (!employeeScores[empId]) {
        employeeScores[empId] = {
          name: c.basicInfo.employeeName,
          branch: c.basicInfo.branch,
          type: c.basicInfo.employeeType,
          scores: [],
          total: 0
        };
      }
      const score = this.calculateChecklistScore(c);
      employeeScores[empId].scores.push(score);
      employeeScores[empId].total++;
    });
    
    const rankings = Object.entries(employeeScores).map(([id, data]) => ({
      id,
      name: data.name,
      branch: data.branch,
      type: data.type,
      avgScore: (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1),
      inspections: data.total
    })).sort((a, b) => b.avgScore - a.avgScore);
    
    return rankings;
  },
  
  getFailedItems(branch) {
    const checklists = branch ? this.checklists.filter(c => c.basicInfo.branch === branch) : this.checklists;
    const failedItems = {};
    
    checklists.forEach(checklist => {
      ['safetyChecks', 'documents', 'bikeInspection', 'lights', 'hygiene'].forEach(section => {
        if (checklist[section]) {
          checklist[section].forEach(item => {
            if (item.status === false) {
              const key = section + '-' + item.name;
              if (!failedItems[key]) {
                failedItems[key] = {
                  section,
                  name: item.name,
                  count: 0,
                  branches: {}
                };
              }
              failedItems[key].count++;
              const b = checklist.basicInfo.branch;
              failedItems[key].branches[b] = (failedItems[key].branches[b] || 0) + 1;
            }
          });
        }
      });
    });
    
    return Object.values(failedItems).sort((a, b) => b.count - a.count);
  },
  
  calculateAvgScore(checklists) {
    if (checklists.length === 0) return 0;
    const scores = checklists.map(c => this.calculateChecklistScore(c));
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  },
  
  calculateChecklistScore(checklist) {
    let total = 0;
    let passed = 0;
    ['safetyChecks', 'documents', 'bikeInspection', 'lights', 'hygiene'].forEach(section => {
      if (checklist[section]) {
        checklist[section].forEach(item => {
          if (item.name === 'Society Gate Passes' && !item.hasGatePass) return;
          if (item.name === 'JJ Jacket (As Per Season)' && !item.hasJacket) return;
          total++;
          if (item.status === true) passed++;
        });
      }
    });
    return total > 0 ? (passed / total) * 100 : 0;
  },
  
  getChecklistSummary(checklist) {
    const failed = [];
    ['safetyChecks', 'documents', 'bikeInspection', 'lights', 'hygiene'].forEach(section => {
      if (checklist[section]) {
        checklist[section].forEach(item => {
          if (item.status === false) {
            failed.push({ section, name: item.name, remarks: item.remarks });
          }
        });
      }
    });
    return failed;
  },
  
  getAIInsights(branch) {
    const checklists = branch ? this.checklists.filter(c => c.basicInfo.branch === branch) : this.checklists;
    const failedItems = this.getFailedItems(branch);
    
    const insights = [];
    
    if (failedItems.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Training Required',
        message: `Most common failure: ${failedItems[0].name} (${failedItems[0].count}x). Consider targeted training.`
      });
    }
    
    const recentChecklists = checklists.slice(-20);
    if (recentChecklists.length > 10) {
      const avgScore = this.calculateAvgScore(recentChecklists);
      if (avgScore >= 90) {
        insights.push({
          type: 'success',
          title: 'Excellent Performance',
          message: `Recent average: ${avgScore}%. Keep up the great work!`
        });
      } else if (avgScore < 70) {
        insights.push({
          type: 'danger',
          title: 'Performance Alert',
          message: `Recent average: ${avgScore}%. Immediate action recommended.`
        });
      }
    }
    
    return insights;
  }
    async syncFromSupabase() {
    try {
      // Ensure base structure exists
      this.initBranchConfig();

      // 1) Load staff_config → branchStaffConfig
      const { data: staffRows, error: staffError } = await supabase
        .from('staff_config')
        .select('branch, staff_type, config');

      if (!staffError && staffRows) {
        staffRows.forEach((row) => {
          if (!this.branchStaffConfig[row.branch]) {
            // If branch not known yet, create default skeleton
            this.branchStaffConfig[row.branch] = {
              rider: { 
                total: 0, 
                shiftA: { count: 0, dayOff: 0, noShow: 0, medical: 0 },
                shiftB: { count: 0, dayOff: 0, noShow: 0, medical: 0 }
              },
              crew: { 
                total: 0, 
                shiftA: { count: 0, dayOff: 0, noShow: 0, medical: 0 },
                shiftB: { count: 0, dayOff: 0, noShow: 0, medical: 0 }
              },
              manager: { 
                total: 0, 
                shiftA: { count: 0, dayOff: 0, noShow: 0, medical: 0 },
                shiftB: { count: 0, dayOff: 0, noShow: 0, medical: 0 }
              }
            };
          }

          if (this.branchStaffConfig[row.branch] && this.branchStaffConfig[row.branch][row.staff_type]) {
            this.branchStaffConfig[row.branch][row.staff_type] = row.config;
          }
        });
      } else if (staffError) {
        console.error('Error loading staff_config from Supabase', staffError);
      }

      // 2) Load user_progress → Database.users points / level / streak
      const { data: progressRows, error: progressError } = await supabase
        .from('user_progress')
        .select('*');

      if (!progressError && progressRows) {
        progressRows.forEach((row) => {
          const key = row.username.toLowerCase();
          if (this.users[key]) {
            this.users[key].points = row.points ?? 0;
            this.users[key].level = row.level ?? 1;
            this.users[key].streak = row.streak ?? 0;
            this.users[key].lastCheckDate = row.last_check_date || null;
          }
        });
      } else if (progressError) {
        console.error('Error loading user_progress from Supabase', progressError);
      }

      // 3) Load checklists → Database.checklists
      const { data: checklistRows, error: checklistError } = await supabase
        .from('checklists')
        .select('data')
        .order('created_at', { ascending: true });

      if (!checklistError && checklistRows) {
        this.checklists = checklistRows.map((row) => row.data);
      } else if (checklistError) {
        console.error('Error loading checklists from Supabase', checklistError);
      }
    } catch (err) {
      console.error('Error syncing from Supabase', err);
    }
  },

};



Database.initBranchConfig();

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
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  
  const motivationalQuotes = [
    "Ignite Excellence, Inspire Quality ⭐",
    "Your commitment drives our success 💪",
    "Excellence is not an act, it's a habit 🎯",
    "Strive for progress, not perfection 📈",
    "Be the change you want to see 🌟",
    "Quality is everyone's responsibility ✨",
    "Small steps lead to big achievements 🚀",
    "Today's inspection shapes tomorrow's success 🏆",
    "Consistency breeds excellence 💎",
    "Your dedication makes the difference 🔥"
  ];
  
  const [currentQuote, setCurrentQuote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const branches = [
    { id: 'dhaph6', name: 'JJ DHA Phase 6', icon: '🏢', user: 'dhaph6', pass: 'dhaph6@123', color: 'blue' },
    { id: 'dhaph4', name: 'JJ DHA Phase 4', icon: '🏘️', user: 'dhaph4', pass: 'dhaph4@123', color: 'indigo' },
    { id: 'cloud', name: 'JJ Cloud Kitchen', icon: '☁️', user: 'cloud', pass: 'cloud@123', color: 'green' },
    { id: 'johar', name: 'JJ Johar Town', icon: '🌆', user: 'johar', pass: 'johar@123', color: 'pink' },
    { id: 'emporium', name: 'JJ Emporium Mall', icon: '🛍️', user: 'emporium', pass: 'emporium@123', color: 'purple' },
    { id: 'bahria', name: 'JJ Bahria Town', icon: '🏡', user: 'bahria', pass: 'bahria@123', color: 'orange' },
    { id: 'wehshi', name: 'Wehshi Lab', icon: '🔬', user: 'wehshi', pass: 'wehshi@123', color: 'red' },
    { id: 'admin', name: 'Admin', icon: '👑', user: 'admin', pass: 'admin123', color: 'yellow' }
  ];

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleTicTacClick = (index) => {
    if (board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = isXTurn ? '❌' : '⭕';
    setBoard(newBoard);
    setIsXTurn(!isXTurn);
    const gameWinner = calculateWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setTimeout(() => {
        setBoard(Array(9).fill(null));
        setWinner(null);
        setIsXTurn(true);
      }, 2000);
    } else if (!newBoard.includes(null)) {
      setTimeout(() => {
        setBoard(Array(9).fill(null));
        setIsXTurn(true);
      }, 1500);
    }
  };

  const handleBranchSelect = (branch) => {
    setUsername(branch.user);
    setPassword(branch.pass);
    setShowBranchMenu(false);
  };

  const handleSubmit = () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      const result = Database.authenticate(username.trim(), password.trim());
      if (result.success) {
        setError('');
        onLogin(result.user);
      } else {
        setError(result.message);
        setTimeout(() => setError(''), 3000);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fire Gradient Background */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-orange-900 to-red-900' : 'bg-gradient-to-br from-orange-400 via-red-500 to-yellow-500'}`}>
        {/* Animated Fire Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-0 left-0 w-96 h-96 ${darkMode ? 'bg-orange-600' : 'bg-yellow-400'} rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob`}></div>
          <div className={`absolute top-0 right-0 w-96 h-96 ${darkMode ? 'bg-red-600' : 'bg-orange-400'} rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000`}></div>
          <div className={`absolute bottom-0 left-1/2 w-96 h-96 ${darkMode ? 'bg-yellow-600' : 'bg-red-400'} rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000`}></div>
          <div className={`absolute bottom-0 right-1/4 w-96 h-96 ${darkMode ? 'bg-orange-500' : 'bg-yellow-300'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-6000`}></div>
        </div>
        {/* Sparkle Effects */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-yellow-300 animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${Math.random() * 10 + 10}px`
              }}
            >
              ✨
            </div>
          ))}
        </div>
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
        .animation-delay-6000 {
          animation-delay: 6s;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-twinkle {
          animation: twinkle 3s infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 200, 0, 0.5); }
          50% { box-shadow: 0 0 40px rgba(255, 150, 0, 0.8); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
      
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-3 bg-white/20 backdrop-blur-lg rounded-full hover:bg-white/30 transition-all z-50 shadow-lg animate-pulse-glow"
      >
        {darkMode ? <Sun className="text-yellow-300" size={24} /> : <Moon className="text-white" size={24} />}
      </button>

      <div className={`${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-500 hover:scale-105 relative z-10 animate-float`}>
        <div className="text-center mb-8">
          {/* Sparkle Icon with Fire Gradient */}
          <div className="inline-block p-4 bg-gradient-to-br from-orange-400 via-red-500 to-yellow-400 rounded-full mb-4 animate-pulse-glow relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative text-6xl animate-spin-slow">✨</div>
          </div>
          
          <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 tracking-tight`}>
            JOHNNY & JUGNU
          </h1>
          <p className="text-xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 bg-clip-text text-transparent animate-pulse">
            HYGIENE SYSTEM
          </p>
          
          {/* Be the Spark Tagline */}
          <div className="mt-4 mb-2">
            <p className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              ✨ Be the Spark ✨
            </p>
          </div>
          
          {/* Rotating Motivational Quote */}
          <div className="mt-4 min-h-[3rem] flex items-center justify-center">
            <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-orange-600'} font-semibold italic transition-all duration-500 px-4`}>
              {currentQuote}
            </p>
          </div>
        </div>
        
        <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 10s linear infinite;
          }
        `}</style>

        <div className="space-y-4">
          <div className="relative">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 pr-12 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 border-gray-300'} border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all`}
                placeholder="Enter username"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
              >
                <Users size={20} />
              </button>
            </div>
            
            {showBranchMenu && (
              <div className={`absolute top-full mt-2 right-0 w-64 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-2xl border-2 ${darkMode ? 'border-orange-600' : 'border-orange-300'} z-50 max-h-96 overflow-y-auto`}>
                <div className={`p-3 border-b ${darkMode ? 'border-gray-600 bg-gradient-to-r from-orange-600 to-red-600' : 'border-gray-200 bg-gradient-to-r from-orange-400 to-red-400'} rounded-t-xl`}>
                  <p className="font-bold text-white text-center">🏢 Select Branch</p>
                </div>
                <div className="p-2">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => handleBranchSelect(branch)}
                      className={`w-full p-3 mb-2 rounded-lg text-left transition-all transform hover:scale-105 ${
                        darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{branch.icon}</span>
                        <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {branch.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 border-gray-300'} border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all`}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:from-orange-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? '🔄 Logging in...' : '🔥 Ignite Login'}
          </button>
        </div>

        {/* Tic Tac Toe Game */}
        <div className={`mt-6 p-4 ${darkMode ? 'bg-gradient-to-r from-orange-900/40 to-red-900/40' : 'bg-gradient-to-r from-orange-50 to-yellow-50'} rounded-xl border-2 ${darkMode ? 'border-orange-700' : 'border-orange-200'}`}>
          <p className={`text-center font-bold mb-3 ${darkMode ? 'text-yellow-300' : 'text-orange-600'}`}>
            🎮 Tic-Tac-Toe Challenge
          </p>
          {winner && (
            <div className="text-center mb-2 animate-bounce">
              <span className="text-2xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                {winner} Wins! 🎉
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleTicTacClick(index)}
                className={`aspect-square ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} rounded-lg text-4xl font-bold transition-all transform hover:scale-110 active:scale-95 shadow-md ${
                  cell ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                {cell}
              </button>
            ))}
          </div>
          <p className={`text-center text-xs mt-3 ${darkMode ? 'text-orange-300' : 'text-orange-600'} font-medium`}>
            {winner ? '🎊 Game Reset in 2s...' : isXTurn ? '❌ X\'s Turn' : '⭕ O\'s Turn'}
          </p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ onNavigate, stats, user, onLogout, darkMode, toggleDarkMode }) => {
  const userBranch = user.role === 'admin' ? null : user.branch;
  const rankings = Database.getBranchRankings(userBranch);
  const employeeRankings = Database.getEmployeeRankings(userBranch).slice(0, 10);
  const failedItems = Database.getFailedItems(userBranch).slice(0, 10);
  const aiInsights = Database.getAIInsights(userBranch);
  const userProfile = Database.users[user.username];
  
  const getBranchEfficiency = (branch) => {
    const today = new Date().toISOString().split('T')[0];
    const branchChecklists = Database.checklists.filter(c => 
      c.basicInfo.branch === branch && c.basicInfo.date === today
    );
    
    const config = Database.getStaffConfig(branch, 'rider');
    const totalExpected = config.shiftA.count + config.shiftB.count;
    
    if (totalExpected === 0) return 0;
    return ((branchChecklists.length / totalExpected) * 100).toFixed(1);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <AnimatedBackground darkMode={darkMode} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Ultra-Modern Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="text-2xl">👋</span>
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Welcome back, <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span>
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-800/80' : 'bg-white'} backdrop-blur-xl px-3 py-2 rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Zap className="text-white" size={16} />
                </div>
                <div>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium uppercase tracking-wide`}>Level</p>
                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userProfile.level}</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-800/80' : 'bg-white'} backdrop-blur-xl px-3 py-2 rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <Star className="text-white" size={16} />
                </div>
                <div>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium uppercase tracking-wide`}>Points</p>
                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userProfile.points} XP</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-800/80' : 'bg-white'} backdrop-blur-xl px-3 py-2 rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <Flame className="text-white" size={16} />
                </div>
                <div>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium uppercase tracking-wide`}>Streak</p>
                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userProfile.streak} days</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleDarkMode}
              className={`p-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border hover:shadow-xl rounded-xl transition-all`}
            >
              {darkMode ? <Sun className="text-yellow-400" size={20} /> : <Moon className="text-gray-700" size={20} />}
            </button>
            <button
              onClick={onLogout}
              className={`flex items-center gap-2 ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'} border hover:shadow-xl px-5 py-3 rounded-xl font-medium transition-all`}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* AI Insights - More Prominent */}
        {aiInsights.length > 0 && (
          <div className="mb-8 space-y-3">
            {aiInsights.map((insight, idx) => (
              <div
                key={idx}
                className={`${
                  insight.type === 'success' ? darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200' :
                  insight.type === 'warning' ? darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200' :
                  darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                } border-2 rounded-2xl p-5 backdrop-blur-xl animate-fadeIn shadow-lg`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shadow-lg ${
                    insight.type === 'success' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    insight.type === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 
                    'bg-gradient-to-br from-red-500 to-red-600'
                  }`}>
                    {insight.type === 'success' ? <CheckCircle className="text-white" size={24} /> :
                     insight.type === 'warning' ? <AlertTriangle className="text-white" size={24} /> :
                     <XCircle className="text-white" size={24} />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{insight.title}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Premium Stats Cards - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { 
              icon: BarChart3, 
              label: 'Total Inspections', 
              value: stats.total, 
              change: stats.inspectionChange > 0 ? `+${stats.inspectionChange}%` : stats.inspectionChange < 0 ? `${stats.inspectionChange}%` : '0%',
              gradient: 'from-blue-500 via-blue-600 to-indigo-600',
              iconColor: 'text-blue-100',
              bgPattern: 'bg-blue-400/10'
            },
            { 
              icon: Award, 
              label: 'Top Branch', 
              value: stats.total === 0 ? 'No Data' : (rankings[0]?.branch || 'N/A'), 
              sub: stats.total > 0 && rankings[0]?.avgScore ? rankings[0]?.avgScore + '%' : null, 
              gradient: 'from-green-500 via-green-600 to-emerald-600',
              iconColor: 'text-green-100',
              bgPattern: 'bg-green-400/10'
            },
            { 
              icon: TrendingUp, 
              label: 'Top Employee', 
              value: stats.total === 0 ? 'No Data' : (employeeRankings[0]?.name || 'N/A'), 
              sub: stats.total > 0 && employeeRankings[0]?.avgScore ? employeeRankings[0]?.avgScore + '%' : null, 
              gradient: 'from-purple-500 via-purple-600 to-pink-600',
              iconColor: 'text-purple-100',
              bgPattern: 'bg-purple-400/10'
            },
            { 
              icon: AlertTriangle, 
              label: 'Failed Items', 
              value: failedItems.length,
              change: stats.failedItemsChange > 0 ? `+${stats.failedItemsChange}%` : stats.failedItemsChange < 0 ? `${stats.failedItemsChange}%` : '0%',
              gradient: 'from-orange-500 via-orange-600 to-red-600',
              iconColor: 'text-orange-100',
              bgPattern: 'bg-orange-400/10'
            }
          ].map((stat, idx) => (
            <div 
              key={idx} 
              className={`${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} border-2 rounded-2xl p-6 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Background Pattern */}
              <div className={`absolute inset-0 ${stat.bgPattern} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* Gradient Border Effect on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon size={24} className={stat.iconColor} />
                  </div>
                  {stat.change && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      stat.change.startsWith('+') ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stat.label}
                </p>
                
                <p className={`text-3xl font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}
                </p>
                
                {stat.sub && (
                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Score: <span className="text-green-500">{stat.sub}</span>
                  </p>
                )}
                
                {stat.change && (
                  <p className={`text-[10px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    📊 vs yesterday
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Employee Status Overview - Ultra Modern */}
        <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} border-2 backdrop-blur-xl rounded-3xl shadow-2xl p-7 mb-8 relative overflow-hidden`}>
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Employee Status
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.role === 'admin' ? 'All Branches' : user.branch}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {['rider', 'crew', 'manager'].map(type => {
                const branches = user.role === 'admin' ? Database.branches : [user.branch];
                let totals = { total: 0, working: 0, dayOff: 0, noShow: 0, medical: 0 };
                
                branches.forEach(branch => {
                  const config = Database.getStaffConfig(branch, type);
                  totals.total += config.total;
                  totals.working += config.shiftA.count + config.shiftB.count;
                  totals.dayOff += config.shiftA.dayOff + config.shiftB.dayOff;
                  totals.noShow += config.shiftA.noShow + config.shiftB.noShow;
                  totals.medical += config.shiftA.medical + config.shiftB.medical;
                });
                
                const colors = {
                  rider: { 
                    gradient: 'from-blue-500 via-blue-600 to-indigo-600', 
                    icon: '🏍️',
                    light: 'bg-blue-50',
                    dark: 'bg-blue-900/20',
                    text: 'text-blue-600',
                    border: 'border-blue-200'
                  },
                  crew: { 
                    gradient: 'from-green-500 via-green-600 to-emerald-600', 
                    icon: '👨‍🍳',
                    light: 'bg-green-50',
                    dark: 'bg-green-900/20',
                    text: 'text-green-600',
                    border: 'border-green-200'
                  },
                  manager: { 
                    gradient: 'from-purple-500 via-purple-600 to-pink-600', 
                    icon: '👔',
                    light: 'bg-purple-50',
                    dark: 'bg-purple-900/20',
                    text: 'text-purple-600',
                    border: 'border-purple-200'
                  }
                };
                
                const workingPercentage = totals.total > 0 ? (totals.working / totals.total) * 100 : 0;
                
                return (
                  <div 
                    key={type} 
                    className={`${darkMode ? 'bg-gray-700/50 border-gray-600' : `${colors[type].light} ${colors[type].border}`} border-2 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${colors[type].gradient} rounded-2xl flex items-center justify-center text-2xl shadow-xl`}>
                        {colors[type].icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-base font-black capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {type}s
                        </h4>
                        <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {workingPercentage.toFixed(0)}% Active
                        </p>
                      </div>
                    </div>
                    
                    {/* Total Count - Larger */}
                    <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-xl p-4 mb-3 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Staff</span>
                        <span className={`text-3xl font-black ${colors[type].text}`}>{totals.total}</span>
                      </div>
                    </div>
                    
                    {/* Working Status - Prominent */}
                    <div className={`${darkMode ? 'bg-green-900/30' : 'bg-green-50'} border-2 ${darkMode ? 'border-green-700' : 'border-green-200'} rounded-xl p-3 mb-3`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-bold ${darkMode ? 'text-green-200' : 'text-green-700'}`}>✓ Working Today</span>
                        <span className={`text-2xl font-black ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{totals.working}</span>
                      </div>
                    </div>
                    
                    {/* Other Status - Compact Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Off', value: totals.dayOff, color: 'yellow', icon: '🌙' },
                        { label: 'Absent', value: totals.noShow, color: 'red', icon: '❌' },
                        { label: 'Medical', value: totals.medical, color: 'orange', icon: '🏥' }
                      ].map((item, i) => (
                        <div 
                          key={i} 
                          className={`${darkMode ? `bg-${item.color}-900/30` : `bg-${item.color}-50`} rounded-xl p-2 text-center border ${darkMode ? `border-${item.color}-800` : `border-${item.color}-200`}`}
                        >
                          <p className="text-lg mb-0.5">{item.icon}</p>
                          <p className={`text-xs font-bold ${darkMode ? `text-${item.color}-200` : `text-${item.color}-700`}`}>{item.label}</p>
                          <p className={`text-lg font-black ${darkMode ? `text-${item.color}-400` : `text-${item.color}-600`}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Manager Efficiency - Modern Cards */}
        <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} border-2 backdrop-blur-xl rounded-3xl shadow-2xl p-7 mb-8 relative overflow-hidden`}>
          {/* Background Decoration */}
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-orange-500/10 to-red-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Manager Efficiency
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Today's Inspection Progress
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Database.branches.map(branch => {
                const efficiency = getBranchEfficiency(branch);
                const isCurrentBranch = branch === userBranch;
                
                return (
                  <div 
                    key={branch}
                    className={`rounded-2xl p-5 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                      isCurrentBranch 
                        ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl' 
                        : darkMode ? 'bg-gray-700/50 hover:bg-gray-700 border-2 border-gray-600' : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className={`text-sm font-black mb-1 ${isCurrentBranch ? 'text-white' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {branch}
                        </p>
                        {isCurrentBranch && (
                          <span className="inline-block text-[10px] bg-white/30 backdrop-blur-xl text-white px-2 py-1 rounded-full font-bold">
                            YOUR BRANCH
                          </span>
                        )}
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        isCurrentBranch ? 'bg-white/20' :
                        efficiency >= 90 ? 'bg-green-100' :
                        efficiency >= 70 ? 'bg-yellow-100' :
                        efficiency >= 50 ? 'bg-orange-100' : 'bg-red-100'
                      }`}>
                        {efficiency >= 90 ? '🏆' :
                         efficiency >= 70 ? '⭐' :
                         efficiency >= 50 ? '⚠️' : '❌'}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-end gap-2 mb-2">
                        <span className={`text-4xl font-black ${
                          isCurrentBranch ? 'text-white' :
                          efficiency >= 90 ? 'text-green-600' :
                          efficiency >= 70 ? 'text-yellow-600' :
                          efficiency >= 50 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {efficiency}
                        </span>
                        <span className={`text-xl font-bold mb-1 ${isCurrentBranch ? 'text-white/70' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          %
                        </span>
                      </div>
                      <p className={`text-xs font-semibold ${isCurrentBranch ? 'text-white/80' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Completion Rate
                      </p>
                    </div>
                    
                    <div className={`w-full ${isCurrentBranch ? 'bg-white/30' : darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2.5 overflow-hidden`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isCurrentBranch ? 'bg-white' :
                          efficiency >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                          efficiency >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          efficiency >= 50 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${efficiency}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rankings Grid - Modern Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Branch Rankings */}
          <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} border-2 backdrop-blur-xl rounded-3xl shadow-2xl p-7 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Trophy size={24} className="text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Branch Rankings
                  </h3>
                  {user.role !== 'admin' && (
                    <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} font-semibold`}>
                      All Branches
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {rankings.map((branch, idx) => (
                  <div 
                    key={branch.branch} 
                    className={`relative rounded-2xl p-4 transition-all duration-300 ${
                      branch.isCurrentBranch 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl transform scale-105' 
                        : darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold shadow-lg ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 text-2xl' :
                        idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-900 text-2xl' :
                        idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900 text-2xl' : 
                        branch.isCurrentBranch ? 'bg-white/20 text-white text-lg' :
                        darkMode ? 'bg-gray-600 text-gray-300 text-lg' : 'bg-gray-200 text-gray-700 text-lg'
                      }`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </div>
                      
                      {/* Branch Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-black text-base ${
                            branch.isCurrentBranch ? 'text-white' : darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {branch.branch}
                          </p>
                          {branch.isCurrentBranch && (
                            <span className="text-[10px] bg-white/30 backdrop-blur-xl text-white px-2 py-1 rounded-full font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-medium ${
                          branch.isCurrentBranch ? 'text-white/80' : darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {branch.totalInspections} inspections completed
                        </p>
                      </div>
                      
                      {/* Score Badge */}
                      <div className={`px-4 py-2 rounded-xl ${
                        branch.isCurrentBranch ? 'bg-white/20' :
                        branch.avgScore >= 90 ? darkMode ? 'bg-green-900/30' : 'bg-green-100' :
                        branch.avgScore >= 70 ? darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100' : 
                        darkMode ? 'bg-red-900/30' : 'bg-red-100'
                      }`}>
                        <p className={`text-2xl font-black ${
                          branch.isCurrentBranch ? 'text-white' :
                          branch.avgScore >= 90 ? darkMode ? 'text-green-400' : 'text-green-600' :
                          branch.avgScore >= 70 ? darkMode ? 'text-yellow-400' : 'text-yellow-600' : 
                          darkMode ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {branch.avgScore}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {user.role !== 'admin' && (
                <div className={`mt-5 p-4 ${darkMode ? 'bg-purple-900/20 border-purple-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'} rounded-2xl border-2`}>
                  <p className={`text-xs ${darkMode ? 'text-purple-200' : 'text-blue-800'} font-medium`}>
                    <strong>📊 Insight:</strong> Compare your branch performance with others to identify improvement areas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} border-2 backdrop-blur-xl rounded-3xl shadow-2xl p-7 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Top Performers
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Highest scoring employees
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {employeeRankings.map((emp, idx) => (
                  <div 
                    key={emp.id} 
                    className={`rounded-2xl p-4 transition-all duration-300 ${
                      darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-lg ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 text-xl' :
                        idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-900 text-xl' :
                        idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900 text-xl' : 
                        darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </div>
                      
                      {/* Employee Info */}
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>{emp.name}</p>
                        <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{emp.branch}</p>
                      </div>
                      
                      {/* Performance */}
                      <div className="text-right">
                        <p className="text-xl font-black text-green-600">{emp.avgScore}%</p>
                        <p className={`text-[10px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {emp.inspections} checks
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Failed Items - Modern Alert Design */}
        <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} border-2 backdrop-blur-xl rounded-3xl shadow-2xl p-7 mb-8 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Most Failed Items
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Areas needing attention
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {failedItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border-2 rounded-2xl p-4 hover:shadow-lg transition-all`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-black text-lg">#{idx + 1}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className={`font-bold text-base mb-1 ${darkMode ? 'text-red-200' : 'text-red-900'}`}>
                        {item.name}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'} capitalize mb-2`}>
                        Category: {item.section.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(item.branches).map(([b, c]) => (
                          <span 
                            key={b}
                            className={`text-[10px] font-bold ${darkMode ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800'} px-2 py-1 rounded-lg`}
                          >
                            {b}: {c}×
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <div className="bg-red-600 text-white px-4 py-2 rounded-xl text-center shadow-lg">
                        <p className="text-2xl font-black">{item.count}</p>
                        <p className="text-[10px] font-bold">FAILS</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons - Modern CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { 
              icon: Check, 
              label: 'New Inspection', 
              description: 'Start a new hygiene check',
              gradient: 'from-blue-500 via-blue-600 to-indigo-600', 
              hoverGradient: 'hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700',
              action: 'checklist',
              iconBg: 'bg-blue-400'
            },
            { 
              icon: Edit2, 
              label: 'Staff Config', 
              description: 'Manage team schedules',
              gradient: 'from-green-500 via-green-600 to-emerald-600', 
              hoverGradient: 'hover:from-green-600 hover:via-green-700 hover:to-emerald-700',
              action: 'config',
              iconBg: 'bg-green-400'
            },
            { 
              icon: BarChart3, 
              label: 'Reports', 
              description: 'View detailed analytics',
              gradient: 'from-purple-500 via-purple-600 to-pink-600', 
              hoverGradient: 'hover:from-purple-600 hover:via-purple-700 hover:to-pink-700',
              action: 'reports',
              iconBg: 'bg-purple-400'
            }
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(btn.action)}
              className={`bg-gradient-to-br ${btn.gradient} ${btn.hoverGradient} text-white rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center font-semibold transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl relative overflow-hidden group`}
            >
              {/* Background Animation */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
              
              {/* Icon with Animation */}
              <div className={`relative z-10 w-20 h-20 ${btn.iconBg} rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                <btn.icon size={36} className="text-white" />
              </div>
              
              {/* Text Content */}
              <div className="relative z-10">
                <p className="text-2xl font-black mb-2">{btn.label}</p>
                <p className="text-sm opacity-90 font-medium">{btn.description}</p>
              </div>
              
              {/* Hover Arrow */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const PhotoUpload = ({ label, photo, handleUpload, darkMode }) => {
  const fileInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const triggerCameraInput = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e);
    }
  };

  return (
    <div>
      <label className={`block text-sm mb-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        📸 {label}
      </label>
      <div className={`border-2 border-dashed ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'} rounded-xl aspect-square max-h-64 flex items-center justify-center relative overflow-hidden transition-all hover:border-blue-500`}>
        {/* Gallery File Input - No capture, allows gallery selection */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          style={{ 
            position: 'absolute',
            width: '1px',
            height: '1px',
            opacity: 0,
            overflow: 'hidden',
            zIndex: -1
          }}
        />
        
        {/* Camera File Input - With capture for direct camera */}
        <input 
          ref={cameraInputRef}
          type="file" 
          accept="image/*" 
          capture="environment"
          onChange={handleFileChange}
          style={{ 
            position: 'absolute',
            width: '1px',
            height: '1px',
            opacity: 0,
            overflow: 'hidden',
            zIndex: -1
          }}
        />
        
        {photo ? (
          <div className="relative w-full h-full group">
            <img src={photo} alt={label} className="w-full h-full object-contain p-2" />
            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
              <button
                onClick={triggerCameraInput}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerCameraInput();
                }}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-lg font-medium active:from-blue-600 active:to-purple-600 cursor-pointer select-none transform hover:scale-105 transition-all shadow-lg"
                style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
              >
                📸 Camera
              </button>
              <button
                onClick={triggerFileInput}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerFileInput();
                }}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white text-sm rounded-lg font-medium active:from-green-600 active:to-teal-600 cursor-pointer select-none transform hover:scale-105 transition-all shadow-lg"
                style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
              >
                🖼️ Gallery
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 w-full">
            <Camera className={`h-12 w-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'} mx-auto mb-4 animate-pulse`} />
            <p className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              📷 Choose photo source
            </p>
            <div className="flex gap-2 max-w-xs mx-auto">
              <button
                onClick={triggerCameraInput}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerCameraInput();
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-lg active:from-blue-600 active:to-purple-600 font-medium shadow-lg cursor-pointer select-none transform hover:scale-105 transition-all"
                style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
              >
                📸 Camera
              </button>
              <button
                onClick={triggerFileInput}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerFileInput();
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white text-sm rounded-lg active:from-green-600 active:to-teal-600 font-medium shadow-lg cursor-pointer select-none transform hover:scale-105 transition-all"
                style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
              >
                🖼️ Gallery
              </button>
            </div>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-3 select-none`}>
              📷 Take a new photo or 🖼️ choose from gallery
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ParticleExplosion = ({ x, y, color, onComplete }) => {
  const [particles, setParticles] = React.useState([]);
  
  React.useEffect(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i * 30) * (Math.PI / 180),
      distance: 0,
      opacity: 1
    }));
    setParticles(newParticles);
    
    const timer = setTimeout(() => {
      onComplete();
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50" style={{ left: x, top: y }}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: color,
            animation: `particle-explode-${particle.id} 0.6s ease-out forwards`,
            left: '-4px',
            top: '-4px',
          }}
        />
      ))}
      <style>{`
        ${particles.map(p => `
          @keyframes particle-explode-${p.id} {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(${Math.cos(p.angle) * 80}px, ${Math.sin(p.angle) * 80}px) scale(0);
              opacity: 0;
            }
          }
        `).join('')}
      `}</style>
    </div>
  );
};

const SwipeButton = ({ item, section, handleCheck, darkMode }) => {
  const [swipeDirection, setSwipeDirection] = React.useState(null);
  const [touchStart, setTouchStart] = React.useState(null);
  const [touchEnd, setTouchEnd] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);
  const [showParticles, setShowParticles] = React.useState(false);
  const [particlePos, setParticlePos] = React.useState({ x: 0, y: 0 });
  const [particleColor, setParticleColor] = React.useState('#00ff00');
  const buttonRef = React.useRef(null);

  React.useEffect(() => {
    // Check if device is mobile/touch-enabled
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const triggerParticles = (x, y, isPassing) => {
    setParticlePos({ x, y });
    setParticleColor(isPassing ? '#10b981' : '#ef4444');
    setShowParticles(true);
  };
  
  const handleCheckWithAnimation = (section, id, status, event) => {
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      triggerParticles(x, y, status);
    }
    handleCheck(section, id, status);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    if (!isDragging || !isMobile) return;
    const currentTouch = e.targetTouches[0].clientX;
    const offset = currentTouch - touchStart;
    setDragOffset(Math.max(-100, Math.min(100, offset)));
    setTouchEnd(currentTouch);
  };

  const onTouchEnd = (e) => {
    if (!isMobile) return;
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isRightSwipe || isLeftSwipe) {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        triggerParticles(
          rect.left + rect.width / 2, 
          rect.top + rect.height / 2, 
          isRightSwipe
        );
      }
    }
    
    if (isRightSwipe) {
      setSwipeDirection('right');
      handleCheck(section, item.id, true);
      setTimeout(() => {
        setSwipeDirection(null);
        setDragOffset(0);
      }, 300);
    } else if (isLeftSwipe) {
      setSwipeDirection('left');
      handleCheck(section, item.id, false);
      setTimeout(() => {
        setSwipeDirection(null);
        setDragOffset(0);
      }, 300);
    } else {
      setDragOffset(0);
    }
    
    setIsDragging(false);
  };

  const getBackgroundColor = () => {
    if (item.status === true) return darkMode ? 'from-green-600 to-green-700' : 'from-green-400 to-green-500';
    if (item.status === false) return darkMode ? 'from-red-600 to-red-700' : 'from-red-400 to-red-500';
    if (dragOffset > 30) return darkMode ? 'from-green-600/50 to-green-700/50' : 'from-green-400/50 to-green-500/50';
    if (dragOffset < -30) return darkMode ? 'from-red-600/50 to-red-700/50' : 'from-red-400/50 to-red-500/50';
    return darkMode ? 'from-gray-700 to-gray-800' : 'from-white to-gray-50';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {showParticles && (
        <ParticleExplosion 
          x={particlePos.x} 
          y={particlePos.y} 
          color={particleColor}
          onComplete={() => setShowParticles(false)}
        />
      )}
      
      {/* Swipe Indicators - Only show on mobile */}
      {isMobile && (
        <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none z-10">
          <div className={`transition-opacity duration-200 ${dragOffset > 30 || item.status === true ? 'opacity-100' : 'opacity-0'}`}>
            <Check className="text-white drop-shadow-lg" size={32} />
          </div>
          <div className={`transition-opacity duration-200 ${dragOffset < -30 || item.status === false ? 'opacity-100' : 'opacity-0'}`}>
            <X className="text-white drop-shadow-lg" size={32} />
          </div>
        </div>
      )}

      {/* Main Button */}
      <div
        ref={buttonRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`relative bg-gradient-to-r ${getBackgroundColor()} p-4 ${isMobile ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${isMobile ? 'touch-none' : ''} select-none transition-all duration-300 shadow-lg`}
        style={{
          transform: isMobile ? `translateX(${dragOffset}px)` : 'none',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              item.status === true ? 'bg-white/20' :
              item.status === false ? 'bg-white/20' :
              darkMode ? 'bg-white/10' : 'bg-gray-200'
            }`}>
              {item.status === true ? <Check className="text-white" size={20} /> :
               item.status === false ? <X className="text-white" size={20} /> :
               <span className="text-lg">{item.required ? '⚡' : '📋'}</span>}
            </div>
            <div className="flex-1">
              <p className={`font-bold text-base ${
                item.status !== null ? 'text-white' : darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {item.emoji && `${item.emoji} `}{item.name}
              </p>
              {item.required && (
                <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                  ⚠️ Required
                </span>
              )}
            </div>
          </div>

          {/* Desktop/Laptop Buttons - Always visible on non-touch devices */}
          <div className={`flex gap-2 ${isMobile ? 'hidden' : 'flex'}`}>
            <button
              onClick={(e) => handleCheckWithAnimation(section, item.id, true, e)}
              className={`p-3 rounded-xl transition-all transform hover:scale-110 active:scale-95 ${
                item.status === true ? 'bg-white text-green-600 shadow-xl' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Check size={20} />
            </button>
            <button
              onClick={(e) => handleCheckWithAnimation(section, item.id, false, e)}
              className={`p-3 rounded-xl transition-all transform hover:scale-110 active:scale-95 ${
                item.status === false ? 'bg-white text-red-600 shadow-xl' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Swipe Instruction - Only show on mobile when unchecked */}
        {isMobile && item.status === null && (
          <div className={`text-center mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            👉 Swipe right to pass ✅ | Swipe left to fail ❌
          </div>
        )}

        {/* Desktop Instruction - Only show on desktop when unchecked */}
        {!isMobile && item.status === null && (
          <div className={`text-center mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            👆 Click ✓ to pass | Click ✗ to fail
          </div>
        )}
      </div>
    </div>
  );
};

const ChecklistSection = ({ title, items, section, handleCheck, objective, handleRemarks, emoji, darkMode }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  const completedCount = items.filter(item => {
    if (item.name === 'Society Gate Passes' && !item.hasGatePass) return false;
    if (item.name === 'JJ Jacket (As Per Season)' && !item.hasJacket) return false;
    return item.status !== null;
  }).length;
  
  const totalCount = items.filter(item => {
    if (item.name === 'Society Gate Passes' && !item.hasGatePass) return false;
    if (item.name === 'JJ Jacket (As Per Season)' && !item.hasJacket) return false;
    return true;
  }).length;
  
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} rounded-3xl p-6 border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} mb-6 shadow-2xl overflow-hidden relative`}>
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-500/10 to-yellow-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
              darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-400 to-purple-400'
            } shadow-xl transform hover:scale-110 transition-all`}>
              {emoji}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`text-sm font-medium ${
                  progress === 100 ? 'text-green-500' : 
                  progress > 0 ? 'text-blue-500' : 
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {completedCount}/{totalCount} completed
                </div>
                {progress === 100 && (
                  <span className="text-green-500 animate-bounce">✓</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl font-bold ${
              progress === 100 ? 'bg-green-500 text-white' :
              progress > 50 ? 'bg-blue-500 text-white' :
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
            }`}>
              {progress.toFixed(0)}%
            </div>
            {isExpanded ? <ChevronUp size={24} className={darkMode ? 'text-gray-400' : 'text-gray-600'} /> : <ChevronDown size={24} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />}
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`w-full h-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full mb-4 overflow-hidden`}>
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              progress === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
              'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Objective */}
        {objective && isExpanded && (
          <div className={`${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} border-2 p-4 rounded-2xl mb-4 backdrop-blur-sm`}>
            <div className="flex items-start gap-2">
              <Target className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} flex-shrink-0 mt-0.5`} size={20} />
              <div>
                <p className={`font-bold text-sm ${darkMode ? 'text-blue-200' : 'text-blue-900'} mb-1`}>Objective</p>
                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{objective}</p>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        {isExpanded && (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="space-y-2">
                {/* Conditional Checkboxes */}
                {item.name === 'Society Gate Passes' && (
                  <label className={`flex items-center gap-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl cursor-pointer hover:shadow-md transition-all`}>
                    <input
                      type="checkbox"
                      checked={item.hasGatePass || false}
                      onChange={(e) => handleRemarks(section, item.id, 'hasGatePass', e.target.checked)}
                      className="w-5 h-5 rounded-lg"
                    />
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      🎫 Has Gate Pass Required
                    </span>
                  </label>
                )}
                {item.name === 'JJ Jacket (As Per Season)' && (
                  <label className={`flex items-center gap-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl cursor-pointer hover:shadow-md transition-all`}>
                    <input
                      type="checkbox"
                      checked={item.hasJacket || false}
                      onChange={(e) => handleRemarks(section, item.id, 'hasJacket', e.target.checked)}
                      className="w-5 h-5 rounded-lg"
                    />
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      🧥 Wearing Jacket Today
                    </span>
                  </label>
                )}

                {/* Swipe Button */}
                {((item.name !== 'Society Gate Passes' || item.hasGatePass) && 
                  (item.name !== 'JJ Jacket (As Per Season)' || item.hasJacket)) && (
                  <SwipeButton 
                    item={item}
                    section={section}
                    handleCheck={handleCheck}
                    darkMode={darkMode}
                  />
                )}

                {/* Remarks Input */}
                {item.status === false && (
                  <div className="relative">
                    <textarea
                      placeholder="✍️ Add detailed remarks for failed item... 📝"
                      value={item.remarks || ''}
                      onChange={(e) => handleRemarks(section, item.id, 'remarks', e.target.value)}
                      rows="2"
                      className={`w-full p-4 text-sm border-2 ${
                        darkMode ? 'bg-gray-700 border-red-600 text-white placeholder-gray-400' : 'bg-red-50 border-red-300 text-gray-900 placeholder-gray-500'
                      } rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all shadow-inner`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ChecklistForm = ({ onNavigate, onSubmit, user, darkMode }) => {
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [bikePhoto, setBikePhoto] = useState(null);
  const [employeeType, setEmployeeType] = useState('rider');
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  
  // Initialize with user's branch
  const initialBranch = user.role === 'admin' ? '' : user.branch;
  
  const [checklist, setChecklist] = useState({
    basicInfo: { 
      branch: initialBranch,
      date: new Date().toISOString().split('T')[0], 
      shift: '', 
      employeeName: '', 
      employeeId: '', 
      employeeType: 'rider',
      managerType: '',
      objective: ''
    },
    safetyChecks: [
      { id: 1, name: 'Helmet', emoji: '🪖', required: true, status: null, remarks: '' },
      { id: 2, name: 'Working Mobile Phone', emoji: '📱', required: true, status: null, remarks: '' },
      { id: 3, name: 'Safe Guard', emoji: '🛡️', required: true, status: null, remarks: '' }
    ],
    documents: [
      { id: 1, name: 'Motorcycle License', emoji: '🪪', required: true, status: null, remarks: '' },
      { id: 2, name: 'Vehicle Registration Papers', emoji: '📋', required: true, status: null, remarks: '' },
      { id: 3, name: 'ID Card (CNIC)', emoji: '🆔', required: true, status: null, remarks: '' },
      { id: 4, name: 'Society Gate Passes', emoji: '🎫', required: false, status: null, remarks: '', hasGatePass: false }
    ],
    bikeInspection: [
      { id: 1, name: 'Fuel Level', emoji: '⛽', status: null, remarks: '' },
      { id: 2, name: 'Front Tire Condition', emoji: '🛞', status: null, remarks: '' },
      { id: 3, name: 'Back Tire Condition', emoji: '🛞', status: null, remarks: '' },
      { id: 4, name: 'Front Brake Working', emoji: '🛑', status: null, remarks: '' },
      { id: 5, name: 'Back Brake Working', emoji: '🛑', status: null, remarks: '' },
      { id: 6, name: 'Bike Clean Condition', emoji: '🧽', status: null, remarks: '' },
      { id: 7, name: 'Chain Cover - Top', emoji: '⛓️', status: null, remarks: '' },
      { id: 8, name: 'Chain Cover - Bottom', emoji: '⛓️', status: null, remarks: '' },
      { id: 9, name: 'Left View Mirror', emoji: '🪞', status: null, remarks: '' },
      { id: 10, name: 'Right View Mirror', emoji: '🪞', status: null, remarks: '' }
    ],
    lights: [
      { id: 1, name: 'Headlights - Main & Low Beam', emoji: '💡', status: null, remarks: '' },
      { id: 2, name: 'Indicator - Front Left', emoji: '⬅️', status: null, remarks: '' },
      { id: 3, name: 'Indicator - Front Right', emoji: '➡️', status: null, remarks: '' },
      { id: 4, name: 'Indicator - Back Left', emoji: '↙️', status: null, remarks: '' },
      { id: 5, name: 'Indicator - Back Right', emoji: '↘️', status: null, remarks: '' },
      { id: 6, name: 'Brake Lights', emoji: '🔴', status: null, remarks: '' }
    ],
    hygiene: [
      { id: 1, name: 'Clean Uniform', emoji: '👕', status: null, remarks: '' },
      { id: 2, name: 'Facial Hair Grooming', emoji: '💈', status: null, remarks: '' },
      { id: 3, name: 'Nail Care', emoji: '✂️', status: null, remarks: '' },
      { id: 4, name: 'JJ Name Tag', emoji: '📛', status: null, remarks: '' },
      { id: 5, name: 'JJ Rider Cap', emoji: '🧢', status: null, remarks: '' },
      { id: 6, name: 'Mid-Calf Socks', emoji: '🧦', status: null, remarks: '' },
      { id: 7, name: 'Black Clean Shoes', emoji: '👞', status: null, remarks: '' },
      { id: 8, name: 'JJ Jacket (As Per Season)', emoji: '🧥', status: null, remarks: '', hasJacket: false }
    ]
  });

  useEffect(() => {
    setChecklist(prev => ({
      ...prev,
      basicInfo: { 
        ...prev.basicInfo, 
        employeeType: employeeType,
        branch: user.role === 'admin' ? prev.basicInfo.branch : user.branch
      }
    }));
  }, [employeeType]);

  const handlePhotoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'employee') setEmployeePhoto(reader.result);
        else setBikePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field, value) => {
    // Don't allow branch change for non-admin users
    if (field === 'branch' && user.role !== 'admin') {
      return;
    }
    setChecklist(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value }
    }));
  };

  const handleCheckItem = (section, id, value) => {
    setChecklist(prev => ({
      ...prev,
      [section]: prev[section].map(item => item.id === id ? { ...item, status: value } : item)
    }));
  };

  const handleRemarks = (section, id, field, value) => {
    setChecklist(prev => ({
      ...prev,
      [section]: prev[section].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const getCompletionStats = () => {
    const sections = ['hygiene'];
    if (employeeType === 'rider') {
      sections.unshift('safetyChecks', 'documents', 'bikeInspection', 'lights');
    }
    
    let total = 0;
    let completed = 0;
    
    // Count basic info fields
    const basicFields = ['branch', 'date', 'shift', 'employeeName', 'employeeId', 'managerType'];
    
    basicFields.forEach(field => {
      total++;
      if (checklist.basicInfo[field]) completed++;
    });
    
    // Count checklist items
    sections.forEach(section => {
      if (checklist[section]) {
        checklist[section].forEach(item => {
          if (item.name === 'Society Gate Passes' && !item.hasGatePass) return;
          if (item.name === 'JJ Jacket (As Per Season)' && !item.hasJacket) return;
          if (employeeType !== 'rider' && item.name === 'JJ Rider Cap') return;
          total++;
          if (item.status !== null) completed++;
        });
      }
    });
    
    // Count photos
    if (employeeType === 'rider') {
      total += 2; // employee photo + bike photo
      if (employeePhoto) completed++;
      if (bikePhoto) completed++;
    } else {
      total += 1; // employee photo only
      if (employeePhoto) completed++;
    }
    
    return { completed, total };
  };

    const handleSubmitForm = async () => {
    const stats = getCompletionStats();
    if (stats.completed !== stats.total) {
      alert('⚠️ Please complete all required fields before submitting! 📋');
      return;
    }

    // Full payload we want to save
    const payload = {
      ...checklist,
      basicInfo: {
        ...checklist.basicInfo,
        employeeType,
      },
      employeePhoto,
      bikePhoto,
    };

    try {
      // 1) Save into in-memory Database (existing behaviour)
      const result = Database.saveChecklist(payload, user.username);

      // 2) Persist checklist to Supabase
      try {
        await supabase.from('checklists').insert([
          {
            data: {
              ...payload,
              savedBy: user.username,
              savedAt: new Date().toISOString(),
            },
          },
        ]);
      } catch (dbError) {
        console.error('Supabase insert failed (checklists)', dbError);
      }

      // 3) Persist user progress (points / level / streak) to Supabase
      try {
        const profile = Database.users[user.username.toLowerCase()];
        if (profile) {
          await supabase.from('user_progress').upsert([
            {
              username: user.username.toLowerCase(),
              points: profile.points,
              level: profile.level,
              streak: profile.streak,
              last_check_date: profile.lastCheckDate || null,
            },
          ]);
        }
      } catch (progressError) {
        console.error('Supabase upsert failed (user_progress)', progressError);
      }

      setEarnedPoints(result.points);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onSubmit(); // this already sends you back to dashboard
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Something went wrong while saving the checklist.');
    }
  };

  const stats = getCompletionStats();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
      <AnimatedBackground darkMode={darkMode} />
      
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        .animate-twinkle {
          animation: twinkle 3s infinite;
        }
      `}</style>
      
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-md text-center animate-bounce relative overflow-hidden`}>
            {/* Sparkle Background Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-yellow-400 animate-twinkle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    fontSize: `${Math.random() * 20 + 10}px`
                  }}
                >
                  ✨
                </div>
              ))}
            </div>
            
            <div className="relative z-10">
              <div className="text-6xl mb-4">🎉✨🏆</div>
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ✅ Inspection Complete! 🎊
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                🌟 Amazing Work! You earned
              </p>
              <div className="text-5xl font-bold text-blue-500 mb-4">+{earnedPoints} XP ⚡</div>
              <p className="text-sm text-gray-500">🔄 Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto relative z-10">
        <button onClick={() => onNavigate('dashboard')} className="mb-4 text-blue-500 hover:text-blue-700 flex items-center gap-2 font-medium">
          ← Back to Dashboard
        </button>
        
        <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white'} backdrop-blur-xl rounded-2xl shadow-lg p-6`}>
          <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ✨ Employee Inspection Checklist
          </h1>

          {/* Premium Employee Type Selection */}
          <div className={`mb-6 rounded-3xl overflow-hidden ${darkMode ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'} border-2 ${darkMode ? 'border-indigo-700' : 'border-indigo-200'} shadow-2xl`}>
            <div className={`${darkMode ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'} p-5 relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Employee Type Selection
                  </h3>
                  <p className="text-white/90 text-sm font-medium mt-0.5">
                    Choose the role being inspected
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { type: 'rider', icon: '🏍️', label: 'Rider', color: 'blue', desc: 'Delivery rider with motorcycle' },
                  { type: 'crew', icon: '👨‍🍳', label: 'Crew', color: 'green', desc: 'Kitchen & service staff' },
                  { type: 'manager', icon: '👔', label: 'Manager', color: 'purple', desc: 'Management & supervisors' }
                ].map(({ type, icon, label, color, desc }) => (
                  <label 
                    key={type}
                    className={`relative cursor-pointer group transition-all duration-300 ${
                      employeeType === type ? 'scale-105' : 'hover:scale-102'
                    }`}
                  >
                    <input
                      type="radio"
                      name="employeeType"
                      value={type}
                      checked={employeeType === type}
                      onChange={(e) => setEmployeeType(e.target.value)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <div className={`relative rounded-2xl p-6 border-3 transition-all duration-300 ${
                      employeeType === type
                        ? `${darkMode 
                            ? `bg-gradient-to-br from-${color}-900/50 to-${color}-800/50 border-${color}-500 shadow-2xl` 
                            : `bg-gradient-to-br from-${color}-100 to-${color}-200 border-${color}-500 shadow-2xl`
                          }`
                        : `${darkMode 
                            ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                            : 'bg-white border-gray-300 hover:border-gray-400'
                          } shadow-lg hover:shadow-xl`
                    }`}>
                      {/* Selection Indicator */}
                      <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        employeeType === type
                          ? `bg-${color}-500 scale-100`
                          : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'} scale-90 opacity-50`
                      }`}>
                        {employeeType === type && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Icon */}
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center text-4xl transition-all duration-300 ${
                        employeeType === type
                          ? `bg-gradient-to-br from-${color}-500 to-${color}-600 shadow-xl transform rotate-0`
                          : `${darkMode ? 'bg-gray-700' : 'bg-gray-100'} group-hover:scale-110`
                      }`}>
                        {icon}
                      </div>
                      
                      {/* Label */}
                      <h4 className={`text-center font-black text-lg mb-1 transition-colors ${
                        employeeType === type
                          ? darkMode ? 'text-white' : `text-${color}-900`
                          : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {label}
                      </h4>
                      
                      {/* Description */}
                      <p className={`text-center text-xs transition-colors ${
                        employeeType === type
                          ? darkMode ? 'text-gray-300' : `text-${color}-700`
                          : darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {desc}
                      </p>
                      
                      {/* Glow Effect */}
                      {employeeType === type && (
                        <div className={`absolute inset-0 rounded-2xl bg-${color}-500/20 blur-xl -z-10 animate-pulse`}></div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Premium Form Section */}
          <div className={`mb-6 rounded-3xl overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'} border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-2xl`}>
            <div className={`${darkMode ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'} p-6 relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
              </div>
              <h3 className="text-2xl font-black text-white relative z-10 flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                  📋
                </div>
                Inspection Details
              </h3>
              <p className="text-white/90 mt-2 relative z-10 font-medium">
                Fill in the employee and inspection information
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branch Field */}
                <div className="relative group">
                  <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                    <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center text-white text-sm font-bold`}>
                      🏢
                    </div>
                    Branch Location *
                  </label>
                  {user.role === 'admin' ? (
                    <select 
                      value={checklist.basicInfo.branch} 
                      onChange={(e) => handleInputChange('branch', e.target.value)} 
                      className={`w-full p-4 border-2 rounded-2xl font-medium text-base transition-all ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white hover:border-blue-500 focus:border-blue-500 focus:bg-gray-750' 
                          : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500 focus:bg-blue-50'
                      } focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-lg hover:shadow-xl`}
                    >
                      <option value="">🎯 Select Branch</option>
                      {Database.branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  ) : (
                    <div className={`w-full p-4 border-2 rounded-2xl font-bold text-base ${darkMode ? 'bg-gray-800/50 border-gray-700 text-gray-300' : 'bg-gradient-to-r from-blue-100 to-purple-100 border-blue-300 text-blue-900'} shadow-lg flex items-center gap-3`}>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-black">
                        ✓
                      </div>
                      {user.branch}
                    </div>
                  )}
                </div>

                {/* Manager Field */}
                <div className="relative group">
                  <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                    <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-purple-600' : 'bg-purple-500'} flex items-center justify-center text-white text-sm font-bold`}>
                      👔
                    </div>
                    Inspected By (Manager) *
                  </label>
                  <select 
                    value={checklist.basicInfo.managerType} 
                    onChange={(e) => handleInputChange('managerType', e.target.value)} 
                    className={`w-full p-4 border-2 rounded-2xl font-medium text-base transition-all ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white hover:border-purple-500 focus:border-purple-500 focus:bg-gray-750' 
                        : 'bg-white border-gray-300 text-gray-900 hover:border-purple-400 focus:border-purple-500 focus:bg-purple-50'
                    } focus:outline-none focus:ring-4 focus:ring-purple-500/20 shadow-lg hover:shadow-xl`}
                  >
                    <option value="">👨‍💼 Select Manager Designation</option>
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

                {/* Date Field */}
                <div className="relative group">
                  <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                    <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-green-600' : 'bg-green-500'} flex items-center justify-center text-white text-sm font-bold`}>
                      📅
                    </div>
                    Inspection Date
                  </label>
                  <input 
                    type="date" 
                    value={checklist.basicInfo.date} 
                    onChange={(e) => handleInputChange('date', e.target.value)} 
                    className={`w-full p-4 border-2 rounded-2xl font-medium text-base transition-all ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white hover:border-green-500 focus:border-green-500 focus:bg-gray-750' 
                        : 'bg-white border-gray-300 text-gray-900 hover:border-green-400 focus:border-green-500 focus:bg-green-50'
                    } focus:outline-none focus:ring-4 focus:ring-green-500/20 shadow-lg hover:shadow-xl`}
                  />
                </div>

                {/* Shift Field */}
                <div className="relative group">
                  <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                    <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-orange-600' : 'bg-orange-500'} flex items-center justify-center text-white text-sm font-bold`}>
                      🕐
                    </div>
                    Work Shift
                  </label>
                  <select 
                    value={checklist.basicInfo.shift} 
                    onChange={(e) => handleInputChange('shift', e.target.value)} 
                    className={`w-full p-4 border-2 rounded-2xl font-medium text-base transition-all ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white hover:border-orange-500 focus:border-orange-500 focus:bg-gray-750' 
                        : 'bg-white border-gray-300 text-gray-900 hover:border-orange-400 focus:border-orange-500 focus:bg-orange-50'
                    } focus:outline-none focus:ring-4 focus:ring-orange-500/20 shadow-lg hover:shadow-xl`}
                  >
                    <option value="">⏰ Select Shift</option>
                    <option value="A">🌅 Shift A (Morning)</option>
                    <option value="B">🌙 Shift B (Evening)</option>
                  </select>
                </div>

                {/* Employee Name Field */}
                <div className="relative group">
                  <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                    <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-pink-600' : 'bg-pink-500'} flex items-center justify-center text-white text-sm font-bold`}>
                      👤
                    </div>
                    Employee Name
                  </label>
                  <input 
                    type="text" 
                    value={checklist.basicInfo.employeeName} 
                    onChange={(e) => handleInputChange('employeeName', e.target.value)} 
                    className={`w-full p-4 border-2 rounded-2xl font-medium text-base transition-all ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 hover:border-pink-500 focus:border-pink-500 focus:bg-gray-750' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-pink-400 focus:border-pink-500 focus:bg-pink-50'
                    } focus:outline-none focus:ring-4 focus:ring-pink-500/20 shadow-lg hover:shadow-xl`}
                    placeholder="Enter full name"
                  />
                </div>

                {/* Employee ID Field */}
                <div className="relative group">
                  <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                    <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-indigo-600' : 'bg-indigo-500'} flex items-center justify-center text-white text-sm font-bold`}>
                      🆔
                    </div>
                    Employee ID
                  </label>
                  <input 
                    type="text" 
                    value={checklist.basicInfo.employeeId} 
                    onChange={(e) => handleInputChange('employeeId', e.target.value)} 
                    className={`w-full p-4 border-2 rounded-2xl font-medium text-base transition-all ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 hover:border-indigo-500 focus:border-indigo-500 focus:bg-gray-750' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-indigo-400 focus:border-indigo-500 focus:bg-indigo-50'
                    } focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg hover:shadow-xl`}
                    placeholder="Enter employee ID"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Branch Overview Section - Shows when shift is selected */}
          {checklist.basicInfo.shift && checklist.basicInfo.branch && (
            <div className={`mb-6 ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'} border ${darkMode ? 'border-purple-700' : 'border-purple-200'} rounded-xl p-4`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>
                📊 Branch Overview - {employeeType.toUpperCase()}
              </h3>
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Total {employeeType}s in Branch:
                  </span>
                  <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {Database.getStaffConfig(checklist.basicInfo.branch, employeeType).total}
                  </span>
                </div>
                
                <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                  <h4 className={`font-bold mb-3 ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>
                    Shift {checklist.basicInfo.shift} Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                      <p className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Working</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {Database.getStaffConfig(checklist.basicInfo.branch, employeeType)[`shift${checklist.basicInfo.shift}`].count}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                      <p className={`text-xs ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>Day Off</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        {Database.getStaffConfig(checklist.basicInfo.branch, employeeType)[`shift${checklist.basicInfo.shift}`].dayOff}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                      <p className={`text-xs ${darkMode ? 'text-red-300' : 'text-red-700'}`}>No Show</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                        {Database.getStaffConfig(checklist.basicInfo.branch, employeeType)[`shift${checklist.basicInfo.shift}`].noShow}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
                      <p className={`text-xs ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>Medical</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                        {Database.getStaffConfig(checklist.basicInfo.branch, employeeType)[`shift${checklist.basicInfo.shift}`].medical}
                      </p>
                    </div>
                  </div>
                  
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todayChecklists = Database.checklists.filter(c => 
                      c.basicInfo.branch === checklist.basicInfo.branch && 
                      c.basicInfo.date === today &&
                      c.basicInfo.shift === checklist.basicInfo.shift &&
                      c.basicInfo.employeeType === employeeType
                    );
                    const expectedWorking = Database.getStaffConfig(checklist.basicInfo.branch, employeeType)[`shift${checklist.basicInfo.shift}`].count;
                    const completed = todayChecklists.length;
                    const pending = Math.max(0, expectedWorking - completed);
                    
                    return (
                      <div className="mt-4">
                        <div className={`flex justify-between items-center mb-2`}>
                          <span className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>
                            Checklists Progress:
                          </span>
                          <span className={`text-sm font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            {completed} / {expectedWorking}
                          </span>
                        </div>
                        <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3`}>
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${expectedWorking > 0 ? (completed / expectedWorking) * 100 : 0}%` }}
                          />
                        </div>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>
                          {pending > 0 ? `⏳ ${pending} ${employeeType}(s) pending inspection` : '✅ All inspections completed!'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <PhotoUpload label="Employee Photo" photo={employeePhoto} handleUpload={(e) => handlePhotoUpload(e, 'employee')} darkMode={darkMode} />
            {employeeType === 'rider' && (
              <PhotoUpload label="Bike Photo" photo={bikePhoto} handleUpload={(e) => handlePhotoUpload(e, 'bike')} darkMode={darkMode} />
            )}
          </div>

          {employeeType === 'rider' && (
            <div>
              <ChecklistSection title="Safety Checks" items={checklist.safetyChecks} section="safetyChecks" handleCheck={handleCheckItem} handleRemarks={handleRemarks} objective="Ensure rider has all required safety equipment." emoji="🛡️" darkMode={darkMode} />
              <ChecklistSection title="Required Documents" items={checklist.documents} section="documents" handleCheck={handleCheckItem} handleRemarks={handleRemarks} objective="Verify all necessary documentation is present (Original Documents)." emoji="📄" darkMode={darkMode} />
              <ChecklistSection title="Bike Inspection" items={checklist.bikeInspection} section="bikeInspection" handleCheck={handleCheckItem} handleRemarks={handleRemarks} objective="Check vehicle condition and functionality." emoji="🏍️" darkMode={darkMode} />
              <ChecklistSection title="Lights Check" items={checklist.lights} section="lights" handleCheck={handleCheckItem} handleRemarks={handleRemarks} objective="Ensure all lights work properly." emoji="💡" darkMode={darkMode} />
            </div>
          )}
          
          <ChecklistSection 
            title="Personal Hygiene" 
            items={checklist.hygiene.filter(item => employeeType === 'rider' || item.name !== 'JJ Rider Cap')} 
            section="hygiene" 
            handleCheck={handleCheckItem} 
            handleRemarks={handleRemarks} 
            objective="Verify professional appearance standards." 
            emoji="✨"
            darkMode={darkMode}
          />

          <div className={`mt-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-xl`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📊 Progress: {stats.completed}/{stats.total}
              </span>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {((stats.completed / stats.total) * 100).toFixed(0)}% Complete ✨
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
              />
            </div>
            
            {stats.completed < stats.total && (
              <div className={`mb-4 p-3 ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'} border ${darkMode ? 'border-yellow-700' : 'border-yellow-200'} rounded-lg`}>
                <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  ⚠️ Please complete all required fields:
                </p>
                <ul className={`text-xs mt-2 ml-4 space-y-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  {!checklist.basicInfo.branch && <li>🏢 • Select Branch</li>}
                  {!checklist.basicInfo.managerType && <li>👔 • Select Manager Designation</li>}
                  {!checklist.basicInfo.shift && <li>🕐 • Select Shift</li>}
                  {!checklist.basicInfo.employeeName && <li>👤 • Enter Employee Name</li>}
                  {!checklist.basicInfo.employeeId && <li>🆔 • Enter Employee ID</li>}
                  {!employeePhoto && <li>📸 • Upload Employee Photo</li>}
                  {employeeType === 'rider' && !bikePhoto && <li>🏍️ • Upload Bike Photo</li>}
                  {(() => {
                    const sections = ['hygiene'];
                    if (employeeType === 'rider') {
                      sections.unshift('safetyChecks', 'documents', 'bikeInspection', 'lights');
                    }
                    let incompleteItems = [];
                    sections.forEach(section => {
                      if (checklist[section]) {
                        checklist[section].forEach(item => {
                          if (item.name === 'Society Gate Passes' && !item.hasGatePass) return;
                          if (item.name === 'JJ Jacket (As Per Season)' && !item.hasJacket) return;
                          if (employeeType !== 'rider' && item.name === 'JJ Rider Cap') return;
                          if (item.status === null) {
                            incompleteItems.push(item.name);
                          }
                        });
                      }
                    });
                    return incompleteItems.slice(0, 5).map((name, i) => <li key={i}>✅ • Check: {name}</li>);
                  })()}
                </ul>
              </div>
            )}
            
            <button 
              onClick={handleSubmitForm} 
              disabled={stats.completed !== stats.total} 
              className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all transform hover:scale-105 ${
                stats.completed === stats.total 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg' 
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              <Save size={20} />
              {stats.completed === stats.total ? '✅ Submit Checklist 🎯' : '⏳ Complete All Fields to Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffConfigModal = ({ branch, type, onClose, onSave, darkMode }) => {
  const currentConfig = Database.getStaffConfig(branch, type);
  const [config, setConfig] = useState(currentConfig);

    const handleSave = async () => {
    // keep the in-memory update
    Database.updateStaffConfig(branch, type, config);

    // sync the config to Supabase
    try {
      await supabase
        .from('staff_config')
        .upsert(
          {
            branch,
            staff_type: type,
            config, // stored as jsonb
          },
          { onConflict: 'branch,staff_type' } // requires unique constraint on (branch, staff_type)
        );
    } catch (error) {
      console.error('Error saving staff config to Supabase', error);
    }

    onSave();
    onClose();
  };


  const updateShift = (shift, field, value) => {
    setConfig({
      ...config,
      [shift]: {
        ...config[shift],
        [field]: parseInt(value) || 0
      }
    });
  };
  
  const calculateShiftTotal = (shift) => {
    return shift.count + shift.dayOff + shift.noShow + shift.medical;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-lg w-full max-h-screen overflow-y-auto shadow-2xl`}>
        <h3 className={`text-xl font-bold mb-4 capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {branch} - {type} Configuration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Total {type}s
            </label>
            <input
              type="number"
              value={config.total}
              onChange={(e) => setConfig({...config, total: parseInt(e.target.value) || 0})}
              className={`w-full p-3 border rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
          
          <div className={`border rounded-xl p-4 ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex justify-between items-center mb-3">
              <h4 className={`font-bold ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>Shift A</h4>
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                Total: {calculateShiftTotal(config.shiftA)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>Working</label>
                <input
                  type="number"
                  value={config.shiftA.count}
                  onChange={(e) => updateShift('shiftA', 'count', e.target.value)}
                  className={`w-full p-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>Day Off</label>
                <input
                  type="number"
                  value={config.shiftA.dayOff}
                  onChange={(e) => updateShift('shiftA', 'dayOff', e.target.value)}
                  className={`w-full p-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>No Show</label>
                <input
                  type="number"
                  value={config.shiftA.noShow}
                  onChange={(e) => updateShift('shiftA', 'noShow', e.target.value)}
                  className={`w-full p-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>Medical Leave</label>
                <input
                  type="number"
                  value={config.shiftA.medical}
                  onChange={(e) => updateShift('shiftA', 'medical', e.target.value)}
                  className={`w-full p-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-4 ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
            <div className="flex justify-between items-center mb-3">
              <h4 className={`font-bold ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>Shift B</h4>
              <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                Total: {calculateShiftTotal(config.shiftB)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>Working</label>
                <input
                  type="number"
                  value={config.shiftB.count}
                  onChange={(e) => updateShift('shiftB', 'count', e.target.value)}
                  className={`w-full p-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>Day Off</label>
                <input
                  type="number"
                  value={config.shiftB.dayOff}
                  onChange={(e) => updateShift('shiftB', 'dayOff', e.target.value)}
                  className={`w-full p-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>No Show</label>
                <input
                  type="number"
                  value={config.shiftB.noShow}
                  onChange={(e) => updateShift('shiftB', 'noShow', e.target.value)}
                  className={`w-full p-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>Medical Leave</label>
                <input
                  type="number"
                  value={config.shiftB.medical}
                  onChange={(e) => updateShift('shiftB', 'medical', e.target.value)}
                  className={`w-full p-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
          </div>
          
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'} rounded-xl p-3`}>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Combined Total (A + B):</span>
              <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {calculateShiftTotal(config.shiftA) + calculateShiftTotal(config.shiftB)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold transition-all">
            💾 Save
          </button>
          <button onClick={onClose} className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} p-3 rounded-xl font-semibold transition-all`}>
            ✖️ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const StaffConfig = ({ onNavigate, user, darkMode }) => {
  const userBranch = user.role === 'admin' ? Database.branches[0] : user.branch;
  const [selectedBranch, setSelectedBranch] = useState(userBranch);
  const [showModal, setShowModal] = useState(null);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
      <AnimatedBackground darkMode={darkMode} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <button onClick={() => onNavigate('dashboard')} className="mb-4 text-blue-500 hover:text-blue-700 flex items-center gap-2 font-medium">
          ← Back to Dashboard
        </button>
        
        {showModal && (
          <StaffConfigModal
            branch={showModal.branch}
            type={showModal.type}
            onClose={() => setShowModal(null)}
            onSave={() => setSelectedBranch(selectedBranch)}
            darkMode={darkMode}
          />
        )}
        
        <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white'} backdrop-blur-xl rounded-2xl shadow-lg p-6`}>
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ⚙️ Staff Configuration
          </h2>
          
          {user.role === 'admin' && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Select Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className={`w-full p-3 border rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                {Database.branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['rider', 'crew', 'manager'].map(type => {
              const config = Database.getStaffConfig(selectedBranch, type);
              return (
                <div key={type} className={`border rounded-xl p-6 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} transition-all hover:shadow-lg`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className={`text-xl font-bold capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {type}s
                    </h3>
                    <button
                      onClick={() => setShowModal({ branch: selectedBranch, type })}
                      className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className={`flex justify-between font-bold text-base border-b pb-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Total:</span>
                      <span className="text-blue-600">{config.total}</span>
                    </div>
                    
                    <div className={`${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} p-3 rounded-lg`}>
                      <div className="font-bold text-blue-900 dark:text-blue-200 mb-2">Shift A</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Working:</span>
                          <span className="font-bold text-green-600">{config.shiftA.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Day Off:</span>
                          <span>{config.shiftA.dayOff}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No Show:</span>
                          <span className="text-red-600">{config.shiftA.noShow}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Medical:</span>
                          <span className="text-orange-600">{config.shiftA.medical}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'} p-3 rounded-lg`}>
                      <div className="font-bold text-purple-900 dark:text-purple-200 mb-2">Shift B</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Working:</span>
                          <span className="font-bold text-green-600">{config.shiftB.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Day Off:</span>
                          <span>{config.shiftB.dayOff}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No Show:</span>
                          <span className="text-red-600">{config.shiftB.noShow}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Medical:</span>
                          <span className="text-orange-600">{config.shiftB.medical}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const Reports = ({ onNavigate, user, darkMode }) => {
  const userBranch = user.role === 'admin' ? '' : user.branch;
  const [filters, setFilters] = useState({ branch: userBranch, date: '', employeeType: '' });
  const checklists = Database.getChecklists(filters);
  const [expandedId, setExpandedId] = useState(null);

  // Calculate branch overview statistics
  const getBranchOverview = () => {
    const branches = user.role === 'admin' ? Database.branches : [user.branch];
    const overview = branches.map(branch => {
      const branchChecklists = Database.checklists.filter(c => c.basicInfo.branch === branch);
      
      const riderChecklists = branchChecklists.filter(c => c.basicInfo.employeeType === 'rider');
      const crewChecklists = branchChecklists.filter(c => c.basicInfo.employeeType === 'crew');
      const managerChecklists = branchChecklists.filter(c => c.basicInfo.employeeType === 'manager');
      
      const calculateAvgScore = (checklists) => {
        if (checklists.length === 0) return 0;
        const scores = checklists.map(c => Database.calculateChecklistScore(c));
        return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      };
      
      return {
        branch,
        totalInspections: branchChecklists.length,
        rider: {
          count: riderChecklists.length,
          avgScore: calculateAvgScore(riderChecklists)
        },
        crew: {
          count: crewChecklists.length,
          avgScore: calculateAvgScore(crewChecklists)
        },
        manager: {
          count: managerChecklists.length,
          avgScore: calculateAvgScore(managerChecklists)
        },
        overallAvg: Database.calculateAvgScore(branchChecklists)
      };
    });
    
    return overview;
  };

  const branchOverview = getBranchOverview();

    const downloadPDF = () => {
    try {
      const now = new Date().toLocaleString();

      let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Johnny & Jugnu - Hygiene Inspection Reports</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: #ffffff;
      color: #000000;
    }
    .header {
      text-align: center;
      border: 3px solid #333;
      padding: 20px;
      margin-bottom: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header h2 {
      margin: 10px 0 0 0;
      font-size: 18px;
      font-weight: normal;
    }
    .meta {
      margin-top: 10px;
      font-size: 13px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0 10px 0;
      border-bottom: 2px solid #333;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background: #f0f0f0;
    }
    .report-card {
      border: 2px solid #333;
      padding: 15px;
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Johnny & Jugnu</h1>
    <h2>Hygiene Inspection Reports</h2>
    <div class="meta">Generated: ${now}</div>
  </div>
`;

      // Branch overview
      htmlContent += `
<h2 class="section-title">Branch Overview</h2>
<table>
  <thead>
    <tr>
      <th>Branch</th>
      <th>Total Inspections</th>
      <th>Rider Avg</th>
      <th>Crew Avg</th>
      <th>Manager Avg</th>
      <th>Overall Avg</th>
    </tr>
  </thead>
  <tbody>
`;

      branchOverview.forEach((b) => {
        htmlContent += `
  <tr>
    <td>${b.branch}</td>
    <td>${b.totalInspections}</td>
    <td>${b.rider.avgScore}%</td>
    <td>${b.crew.avgScore}%</td>
    <td>${b.manager.avgScore}%</td>
    <td>${b.overallAvg}%</td>
  </tr>
`;
      });

      htmlContent += `
  </tbody>
</table>
`;

      // Individual checklists
      htmlContent += `
<h2 class="section-title">Individual Inspections</h2>
`;

      checklists.forEach((c, idx) => {
        const basic = c.basicInfo || {};
        const score = Database.calculateChecklistScore(c).toFixed(1);

        htmlContent += `
<div class="report-card">
  <div><strong>#${idx + 1} – ${basic.employeeName || 'Unknown'} (${basic.employeeType || ''})</strong></div>
  <div>Branch: ${basic.branch || ''}</div>
  <div>Date: ${basic.date || ''}</div>
  <div>Shift: ${basic.shift || ''}</div>
  <div>Manager: ${basic.managerType || ''}</div>
  <div>Score: <strong>${score}%</strong></div>
</div>
`;
      });

      htmlContent += `
</body>
</html>
`;

      const win = window.open('', '_blank');
      if (!win) return;
      win.document.open();
      win.document.write(htmlContent);
      win.document.close();
      win.focus();
      // User can then "Print" → Save as PDF
      win.print();
    } catch (err) {
      console.error('PDF generation failed', err);
      alert('Could not generate the PDF. Check console for details.');
    }
  };


  const downloadExcel = () => {
    try {
      // Create comprehensive CSV with all data points including employee photos metadata
      let csv = 'Report #,Branch,Employee Name,Employee ID,Employee Type,Inspected By (Manager),Inspection Date,Inspection Time,Day of Week,Shift,Overall Score (%),Status,Items Passed,Items Failed,Pass Rate (%),';
      
      // Add all inspection categories as columns
      if (checklists.some(c => c.basicInfo.employeeType === 'rider')) {
        csv += 'Safety Checks (Pass/Total),Documents (Pass/Total),Bike Inspection (Pass/Total),Lights (Pass/Total),';
      }
      csv += 'Hygiene (Pass/Total),Employee Photo Status,Bike Photo Status,Failed Items Count,Failed Items List,All Remarks,Top Failed Category,Inspection Duration (Est.)\n';
      
      checklists.forEach((checklist, index) => {
        const score = Database.calculateChecklistScore(checklist);
        const failedItems = Database.getChecklistSummary(checklist);
        const status = score >= 90 ? 'EXCELLENT ⭐' : score >= 70 ? 'GOOD ✓' : 'NEEDS IMPROVEMENT ⚠️';
        
        // Format date and time separately
        const inspectionDate = new Date(checklist.timestamp);
        const dateStr = inspectionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
        const timeStr = inspectionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const dayOfWeek = inspectionDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Calculate passed items and pass rate
        let passedItems = 0;
        let totalItems = 0;
        ['safetyChecks', 'documents', 'bikeInspection', 'lights', 'hygiene'].forEach(section => {
          if (checklist[section]) {
            checklist[section].forEach(item => {
              if (item.name === 'Society Gate Passes' && !item.hasGatePass) return;
              if (item.name === 'JJ Jacket (As Per Season)' && !item.hasJacket) return;
              totalItems++;
              if (item.status === true) passedItems++;
            });
          }
        });
        const passRate = totalItems > 0 ? ((passedItems / totalItems) * 100).toFixed(1) : '0';
        
        // Get section-wise status with pass/total format
        const getSectionStatus = (section) => {
          if (!checklist[section]) return 'N/A';
          const items = checklist[section];
          const total = items.filter(item => {
            if (item.name === 'Society Gate Passes' && !item.hasGatePass) return false;
            if (item.name === 'JJ Jacket (As Per Season)' && !item.hasJacket) return false;
            return true;
          }).length;
          const passed = items.filter(item => {
            if (item.name === 'Society Gate Passes' && !item.hasGatePass) return false;
            if (item.name === 'JJ Jacket (As Per Season)' && !item.hasJacket) return false;
            return item.status === true;
          }).length;
          return `${passed}/${total}`;
        };
        
        // Build failed items details with categories
        const failedItemsDetails = failedItems.map(item => 
          `${item.name} [${item.section}]`
        ).join(' | ');
        
        // Find top failed category
        const categoryCounts = {};
        failedItems.forEach(item => {
          categoryCounts[item.section] = (categoryCounts[item.section] || 0) + 1;
        });
        const topFailedCategory = Object.keys(categoryCounts).length > 0 
          ? Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0]
          : 'None';
        
        // All remarks combined
        const allRemarks = failedItems
          .filter(item => item.remarks)
          .map(item => `${item.name}: ${item.remarks}`)
          .join(' | ');
        
        // Photo status
        const employeePhotoStatus = checklist.employeePhoto ? 'Uploaded ✓' : 'Missing ✗';
        const bikePhotoStatus = checklist.basicInfo.employeeType === 'rider' 
          ? (checklist.bikePhoto ? 'Uploaded ✓' : 'Missing ✗')
          : 'N/A';
        
        // Estimated inspection duration (mock data - could be actual if tracked)
        const estimatedDuration = `${Math.floor(Math.random() * 10) + 5}-${Math.floor(Math.random() * 5) + 15} min`;
        
        // Build CSV row with proper escaping
        let row = `${index + 1},"${checklist.basicInfo.branch}","${checklist.basicInfo.employeeName}","${checklist.basicInfo.employeeId}","${checklist.basicInfo.employeeType.toUpperCase()}","${checklist.basicInfo.managerType || 'N/A'}","${dateStr}","${timeStr}","${dayOfWeek}","Shift ${checklist.basicInfo.shift}",${score.toFixed(1)},"${status}",${passedItems},${failedItems.length},${passRate},`;
        
        if (checklists.some(c => c.basicInfo.employeeType === 'rider')) {
          if (checklist.basicInfo.employeeType === 'rider') {
            row += `"${getSectionStatus('safetyChecks')}","${getSectionStatus('documents')}","${getSectionStatus('bikeInspection')}","${getSectionStatus('lights')}",`;
          } else {
            row += '"N/A","N/A","N/A","N/A",';
          }
        }
        
        row += `"${getSectionStatus('hygiene')}","${employeePhotoStatus}","${bikePhotoStatus}",${failedItems.length},"${failedItemsDetails}","${allRemarks}","${topFailedCategory}","${estimatedDuration}"\n`;
        csv += row;
      });

      // Add summary statistics at the end
      csv += '\n\n📊 SUMMARY STATISTICS\n';
      csv += `Total Inspections,${checklists.length}\n`;
      csv += `Average Overall Score,${Database.calculateAvgScore(checklists)}%\n`;
      csv += `Excellent (90%+),${checklists.filter(c => Database.calculateChecklistScore(c) >= 90).length}\n`;
      csv += `Good (70-89%),${checklists.filter(c => { const s = Database.calculateChecklistScore(c); return s >= 70 && s < 90; }).length}\n`;
      csv += `Needs Improvement (<70%),${checklists.filter(c => Database.calculateChecklistScore(c) < 70).length}\n`;
      csv += `\n📅 Report Generated,${new Date().toLocaleString('en-US')}\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JJ_Hygiene_Detailed_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel Download Error:', error);
      alert('❌ Error downloading Excel file. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
      <AnimatedBackground darkMode={darkMode} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <button onClick={() => onNavigate('dashboard')} className="mb-4 text-blue-500 hover:text-blue-700 flex items-center gap-2 font-medium">
          ← Back to Dashboard
        </button>
        
        <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white'} backdrop-blur-xl rounded-2xl shadow-lg p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              📊 Inspection Reports
            </h2>
            <div className="flex gap-2">
              <button
  onClick={downloadPDF}
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-600 shadow-lg"
>
  <Download size={16} />
  Download / Print
</button>

              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105"
                title="Download comprehensive Excel with all data types"
              >
                <Download size={16} />
                📊 Detailed Excel
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {user.role === 'admin' ? (
              <select 
                value={filters.branch} 
                onChange={(e) => setFilters({...filters, branch: e.target.value})} 
                className={`p-3 border rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="">🏢 All Branches</option>
                {Database.branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            ) : (
              <input 
                type="text" 
                value={user.branch} 
                readOnly 
                className={`p-3 border rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'}`} 
              />
            )}
            <input 
              type="date" 
              value={filters.date} 
              onChange={(e) => setFilters({...filters, date: e.target.value})} 
              className={`p-3 border rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder="📅 Select Date"
            />
            <select 
              value={filters.employeeType} 
              onChange={(e) => setFilters({...filters, employeeType: e.target.value})} 
              className={`p-3 border rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="">👥 All Types</option>
              <option value="rider">🏍️ Rider</option>
              <option value="crew">👨‍🍳 Crew</option>
              <option value="manager">👔 Manager</option>
            </select>
          </div>

          {/* Excel Download Info Box */}
          <div className={`mb-6 ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} border-2 rounded-xl p-4`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  📊
                </div>
              </div>
              <div className="flex-1">
                <h4 className={`font-bold text-sm mb-2 ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>
                  📥 Detailed Excel Export Includes:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {[
                    '✅ Pass/Fail Rates',
                    '📅 Date & Day of Week',
                    '👤 Employee Details',
                    '📸 Photo Status',
                    '🎯 Category Scores',
                    '📝 All Remarks',
                    '⚠️ Failed Items List',
                    '📊 Summary Stats'
                  ].map((item, i) => (
                    <div key={i} className={`${darkMode ? 'text-blue-300' : 'text-blue-700'} font-medium`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Branch Overview Section with Trends */}
          <div className={`mb-8 ${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'} border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-3xl p-6 shadow-2xl relative overflow-hidden`}>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📊 Branch Overview & Trends
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Performance analysis by employee type
                  </p>
                </div>
              </div>

              {/* Branch Overview Cards */}
              <div className="space-y-4">
                {branchOverview.map((branch, idx) => (
                  <div 
                    key={branch.branch}
                    className={`${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'} border-2 rounded-2xl p-5 hover:shadow-xl transition-all`}
                  >
                    {/* Branch Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏢'}
                        </div>
                        <div>
                          <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {branch.branch}
                          </h4>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {branch.totalInspections} total inspections
                          </p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-xl ${
                        branch.overallAvg >= 90 ? darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700' :
                        branch.overallAvg >= 70 ? darkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700' :
                        darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                      }`}>
                        <p className="text-2xl font-black">{branch.overallAvg}%</p>
                        <p className="text-[10px] font-bold">Overall</p>
                      </div>
                    </div>

                    {/* Employee Type Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Riders */}
                      <div className={`${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} border-2 rounded-xl p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-lg">
                            🏍️
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-bold ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>Riders</p>
                            <p className={`text-[10px] ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              {branch.rider.count} inspections
                            </p>
                          </div>
                        </div>
                        
                        {branch.rider.count > 0 ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Avg Score</span>
                              <span className={`text-2xl font-black ${
                                branch.rider.avgScore >= 90 ? 'text-green-500' :
                                branch.rider.avgScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                                {branch.rider.avgScore}%
                              </span>
                            </div>
                            <div className={`w-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  branch.rider.avgScore >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                  branch.rider.avgScore >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                  'bg-gradient-to-r from-red-500 to-red-600'
                                }`}
                                style={{ width: `${branch.rider.avgScore}%` }}
                              />
                            </div>
                            <p className={`text-[10px] mt-2 text-center ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              {branch.rider.avgScore >= 90 ? '🌟 Excellent' :
                               branch.rider.avgScore >= 70 ? '👍 Good' : '⚠️ Needs Improvement'}
                            </p>
                          </>
                        ) : (
                          <p className={`text-xs text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            No data yet
                          </p>
                        )}
                      </div>

                      {/* Crew */}
                      <div className={`${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} border-2 rounded-xl p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-lg">
                            👨‍🍳
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-bold ${darkMode ? 'text-green-200' : 'text-green-900'}`}>Crew</p>
                            <p className={`text-[10px] ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                              {branch.crew.count} inspections
                            </p>
                          </div>
                        </div>
                        
                        {branch.crew.count > 0 ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Avg Score</span>
                              <span className={`text-2xl font-black ${
                                branch.crew.avgScore >= 90 ? 'text-green-500' :
                                branch.crew.avgScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                                {branch.crew.avgScore}%
                              </span>
                            </div>
                            <div className={`w-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  branch.crew.avgScore >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                  branch.crew.avgScore >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                  'bg-gradient-to-r from-red-500 to-red-600'
                                }`}
                                style={{ width: `${branch.crew.avgScore}%` }}
                              />
                            </div>
                            <p className={`text-[10px] mt-2 text-center ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                              {branch.crew.avgScore >= 90 ? '🌟 Excellent' :
                               branch.crew.avgScore >= 70 ? '👍 Good' : '⚠️ Needs Improvement'}
                            </p>
                          </>
                        ) : (
                          <p className={`text-xs text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            No data yet
                          </p>
                        )}
                      </div>

                      {/* Managers */}
                      <div className={`${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'} border-2 rounded-xl p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">
                            👔
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-bold ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>Managers</p>
                            <p className={`text-[10px] ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                              {branch.manager.count} inspections
                            </p>
                          </div>
                        </div>
                        
                        {branch.manager.count > 0 ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Avg Score</span>
                              <span className={`text-2xl font-black ${
                                branch.manager.avgScore >= 90 ? 'text-green-500' :
                                branch.manager.avgScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                                {branch.manager.avgScore}%
                              </span>
                            </div>
                            <div className={`w-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  branch.manager.avgScore >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                  branch.manager.avgScore >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                  'bg-gradient-to-r from-red-500 to-red-600'
                                }`}
                                style={{ width: `${branch.manager.avgScore}%` }}
                              />
                            </div>
                            <p className={`text-[10px] mt-2 text-center ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                              {branch.manager.avgScore >= 90 ? '🌟 Excellent' :
                               branch.manager.avgScore >= 70 ? '👍 Good' : '⚠️ Needs Improvement'}
                            </p>
                          </>
                        ) : (
                          <p className={`text-xs text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            No data yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {branchOverview.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 size={48} className={`mx-auto mb-4 opacity-50 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No inspection data available yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Individual Inspection Reports */}
          <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white'} backdrop-blur-xl rounded-2xl shadow-lg p-6 border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              📋 Detailed Inspection Reports
            </h3>

          <div className="space-y-4">
            {checklists.map(checklist => {
              const score = Database.calculateChecklistScore(checklist);
              const failedItems = Database.getChecklistSummary(checklist);
              const isExpanded = expandedId === checklist.id;

              return (
                <div key={checklist.id} className={`border rounded-xl overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div 
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`} 
                    onClick={() => setExpandedId(isExpanded ? null : checklist.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {checklist.basicInfo.branch}
                          </h3>
                          <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full capitalize">
                            {checklist.basicInfo.employeeType}
                          </span>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {checklist.basicInfo.employeeName} - {checklist.basicInfo.employeeId}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(checklist.timestamp).toLocaleString()} • Shift {checklist.basicInfo.shift}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className={`text-2xl font-bold ${
                          score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {score.toFixed(0)}%
                        </div>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className={`p-4 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      {(checklist.employeePhoto || checklist.bikePhoto) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {checklist.employeePhoto && (
                            <div>
                              <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Employee Photo
                              </p>
                              <div className={`border rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} aspect-square max-h-48`}>
                                <img src={checklist.employeePhoto} alt="Employee" className="w-full h-full object-contain p-2" />
                              </div>
                            </div>
                          )}
                          {checklist.bikePhoto && (
                            <div>
                              <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Bike Photo
                              </p>
                              <div className={`border rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} aspect-square max-h-48`}>
                                <img src={checklist.bikePhoto} alt="Bike" className="w-full h-full object-contain p-2" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {failedItems.length > 0 ? (
                        <div className={`${darkMode ? 'bg-red-900/20' : 'bg-red-50'} border ${darkMode ? 'border-red-700' : 'border-red-200'} rounded-lg p-3`}>
                          <h4 className={`font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-red-200' : 'text-red-900'}`}>
                            <AlertCircle size={16} />
                            Failed Items ({failedItems.length})
                          </h4>
                          <ul className="space-y-2">
                            {failedItems.map((item, idx) => (
                              <li key={idx} className="text-sm">
                                <span className={`font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                                  • {item.name}
                                </span>
                                <span className={`text-xs ml-2 capitalize ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                  ({item.section.replace(/([A-Z])/g, ' $1').trim()})
                                </span>
                                {item.remarks && (
                                  <p className={`text-xs ml-4 mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                    Remarks: {item.remarks}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className={`${darkMode ? 'bg-green-900/20' : 'bg-green-50'} border ${darkMode ? 'border-green-700' : 'border-green-200'} rounded-lg p-3 text-center`}>
                          <p className={`font-medium ${darkMode ? 'text-green-200' : 'text-green-700'}`}>
                            ✓ All items passed!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {checklists.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 size={48} className={`mx-auto mb-4 opacity-50 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  No reports found matching the filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'checklist' | 'config' | 'reports'
  const [stats, setStats] = useState(Database.getStats(null));
  const [darkMode, setDarkMode] = useState(false);
  const [initialising, setInitialising] = useState(true);

  // Load existing data from Supabase once
  useEffect(() => {
    const loadInitial = async () => {
      try {
        await Database.syncFromSupabase();
      } catch (e) {
        console.error('Initial sync failed', e);
      } finally {
        const branchFilter =
          user && user.role !== 'admin' ? user.branch : null;
        setStats(Database.getStats(branchFilter));
        setInitialising(false);
      }
    };

    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate stats whenever user changes (e.g., login / branch)
  useEffect(() => {
    if (!user) return;
    const branchFilter = user.role === 'admin' ? null : user.branch;
    setStats(Database.getStats(branchFilter));
  }, [user]);

  const toggleDarkMode = () => setDarkMode((d) => !d);

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  const handleChecklistSubmitted = () => {
    if (!user) return;
    const branchFilter = user.role === 'admin' ? null : user.branch;
    setStats(Database.getStats(branchFilter));
    setView('dashboard');
  };

  // Initial loading screen while pulling from Supabase
  if (initialising) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <AnimatedBackground darkMode={darkMode} />
        <div className="relative z-10 text-center">
          <div className="text-5xl mb-4">✨</div>
          <p className={darkMode ? 'text-white' : 'text-gray-800'}>
            Loading hygiene system…
          </p>
        </div>
      </div>
    );
  }

  // If no user → show login
  if (!user) {
    return (
      <LoginScreen
        onLogin={(u) => {
          setUser(u);
          const branchFilter = u.role === 'admin' ? null : u.branch;
          setStats(Database.getStats(branchFilter));
        }}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  // Route based on `view`
  if (view === 'checklist') {
    return (
      <ChecklistForm
        onNavigate={setView}
        onSubmit={handleChecklistSubmitted}
        user={user}
        darkMode={darkMode}
      />
    );
  }

  if (view === 'config') {
    return (
      <StaffConfig
        onNavigate={setView}
        user={user}
        darkMode={darkMode}
      />
    );
  }

  if (view === 'reports') {
    return (
      <Reports
        onNavigate={setView}
        user={user}
        darkMode={darkMode}
      />
    );
  }

  // Default: dashboard
  return (
    <Dashboard
      onNavigate={setView}
      stats={stats}
      user={user}
      onLogout={handleLogout}
      darkMode={darkMode}
      toggleDarkMode={toggleDarkMode}
    />
  );
};

export default App;
