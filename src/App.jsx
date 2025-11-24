import React, { useState, useEffect } from 'react';
import {
  Check, X, Camera, Save, Shield, Plus, AlertCircle, BarChart3, Users, Building, TrendingUp, Award,
  AlertTriangle, Edit2, ChevronDown, ChevronUp, ChevronLeft, LogOut, Lock, Star, Zap, Trophy,
  Target, Flame, Moon, Sun, Download, Mail, Bell, Filter, Calendar, MapPin, Clock,
  CheckCircle, XCircle, FileText, Bike, CreditCard
} from 'lucide-react';
import { supabase } from './supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ===== In-memory database & helpers =====

const BRANCHES = [
  'DHA-PH6',
  'DHA-PH4',
  'Johar Town',
  'Bahria Town',
  'Emporium',
  'Cloud Kitchen'
];

const SHIFTS = ['Morning', 'Evening', 'Night'];

const Database = {
  users: {
    admin: {
      password: 'admin123',
      role: 'admin',
      branch: 'all',
      name: 'System Admin',
      avatar: '👨‍💼',
      points: 0,
      level: 10,
      streak: 0,
    },
    dhaph6: {
      password: 'dhaph6@123',
      role: 'manager',
      branch: 'DHA-PH6',
      name: 'DHA PH6 Manager',
      avatar: '🏪',
      points: 120,
      level: 4,
      streak: 7,
    },
    johartown: {
      password: 'jt@123',
      role: 'manager',
      branch: 'Johar Town',
      name: 'Johar Town Manager',
      avatar: '🏙️',
      points: 90,
      level: 3,
      streak: 3,
    },
  },
  checklists: [],
};

let checklistIdCounter = 1;

Database.saveChecklist = (payload) => {
  const now = new Date();
  const checklist = {
    id: checklistIdCounter++,
    createdAt: now.toISOString(),
    ...payload,
  };
  Database.checklists.push(checklist);
  return checklist;
};

Database.getStats = (branchFilter = null) => {
  const items = branchFilter && branchFilter !== 'all'
    ? Database.checklists.filter(c => c.basicInfo?.branch === branchFilter)
    : Database.checklists;

  const total = items.length;
  if (!total) {
    return {
      totalChecklists: 0,
      avgScore: 0,
      passes: 0,
      fails: 0,
    };
  }

  let sumScore = 0;
  let passes = 0;
  let fails = 0;

  items.forEach(c => {
    const score = c.totalScore ?? 0;
    sumScore += score;
    if (score >= 80) passes += 1;
    else fails += 1;
  });

  return {
    totalChecklists: total,
    avgScore: Math.round((sumScore / total) * 10) / 10,
    passes,
    fails,
  };
};

// ===== Animated background =====

const AnimatedBackground = ({ darkMode }) => {
  return (
    <div
      className={`fixed inset-0 -z-10 overflow-hidden transition-colors duration-500 ${
        darkMode
          ? 'bg-slate-950'
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}
    >
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-40 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 bottom-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_60%)]" />
    </div>
  );
};

// ===== Login Screen =====

const LoginScreen = ({ onLogin, darkMode, toggleDarkMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const key = username.trim().toLowerCase();
    const user = Database.users[key];

    if (!user || user.password !== password) {
      setError('Invalid credentials. Please try again.');
      return;
    }

    onLogin({
      username: key,
      ...user,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <AnimatedBackground darkMode={darkMode} />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: Branding / Summary */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
            <Star className="h-3 w-3 text-yellow-500" />
            Rider Safety & Quality OS
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Johnny & Jugnu
            <span className="block text-lg font-medium text-indigo-500 mt-1">
              Rider Safety • Quality • Training
            </span>
          </h1>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                Today&apos;s Snapshot
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Total Checklists</span>
                  <span className="font-semibold text-slate-800">0</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Network Pass%</span>
                  <span className="font-semibold text-emerald-600">–</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Open Actions</span>
                  <span className="font-semibold text-amber-500">–</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 text-slate-50 p-4 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.45),_transparent_55%)]" />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Gamified Training
                  </span>
                  <Trophy className="h-4 w-4 text-yellow-400" />
                </div>
                <p className="text-sm text-slate-100">
                  Turn daily safety checks into a battle of brains – track
                  scores, streaks and branch leagues.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Flame className="h-3 w-3 text-orange-400" />
                  <span>Streaks, XP and achievements built-in</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/40 via-sky-400/40 to-emerald-400/30 rounded-3xl blur opacity-70" />
          <div className="relative rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-100/60 dark:border-slate-800/80 shadow-xl p-6 sm:p-8 backdrop-blur">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                  <Shield className="h-3 w-3" />
                  Internal Tool • J&J
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-50">
                  Sign in to continue
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Use your rider, manager or admin credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Username
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 px-9 py-2 text-sm text-slate-900 dark:text-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="e.g. admin or dhaph6"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 px-9 py-2 text-sm text-slate-900 dark:text-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition-colors"
              >
                <LogOut className="h-4 w-4 rotate-180" />
                Sign in
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                This is an internal tool. Do not share credentials outside J&J.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
// ===== Dashboard =====

const Dashboard = ({ user, onNavigate, onLogout, stats, darkMode, toggleDarkMode }) => {
  const branchLabel =
    user.branch === 'all' ? 'All Branches' : user.branch || 'Branch';

  return (
    <div className="min-h-screen">
      <AnimatedBackground darkMode={darkMode} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-6">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <span className="text-2xl">{user.avatar}</span>
              <span>{branchLabel} Control Room</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Welcome back, {user.name}. Let&apos;s run sharp, safe shifts today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="hidden sm:flex items-center gap-3 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 px-3 py-1.5 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2 text-xs">
                <Star className="h-3 w-3 text-yellow-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  XP {user.points}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Flame className="h-3 w-3 text-orange-400" />
                <span>Streak {user.streak} days</span>
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Trophy className="h-3 w-3 text-indigo-400" />
                <span>Level {user.level}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              Logout
            </button>
          </div>
        </header>

        {/* Stats row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Checklists today</span>
              <BarChart3 className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {stats.totalChecklists}
              </span>
              <span className="text-[11px] text-slate-400 mb-1">
                submitted
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Average score</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold text-emerald-600">
                {stats.avgScore || 0}%
              </span>
              <span className="text-[11px] text-slate-400 mb-1">
                across riders
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Pass / Fail</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {stats.passes}
                </span>
                <span className="text-slate-400">pass</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <XCircle className="h-4 w-4 text-rose-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {stats.fails}
                </span>
                <span className="text-slate-400">fail</span>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('checklist')}
            className="group rounded-2xl bg-slate-900 text-slate-50 p-4 sm:p-5 shadow-lg border border-slate-800 flex flex-col items-start gap-3 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="text-sm font-semibold">
                Start Rider Checklist
              </span>
            </div>
            <p className="text-xs text-slate-300 text-left">
              Run the full safety, QA and appearance checklist for a rider
              before dispatch.
            </p>
            <div className="mt-auto inline-flex items-center gap-1 text-[11px] text-slate-300">
              <span>~7 min</span>
              <span className="mx-1">•</span>
              <span>Gamified scoring</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('staff-config')}
            className="group rounded-2xl bg-white/90 dark:bg-slate-900/90 p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Staff & Roles
              </span>
            </div>
            <p className="text-xs text-slate-500 text-left">
              Configure riders, roles and training status per branch.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Edit2 className="h-3 w-3" />
              Manage staff config
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="group rounded-2xl bg-white/90 dark:bg-slate-900/90 p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Reports & Exports
              </span>
            </div>
            <p className="text-xs text-slate-500 text-left">
              Review checklist history, failure patterns and export to Excel or PDF.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Download className="h-3 w-3" />
              Download daily pack
            </span>
          </button>
        </section>
      </div>
    </div>
  );
};

// ===== PhotoUpload helper =====

const PhotoUpload = ({ label, photo, onChange }) => {
  return (
    <label className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 px-4 py-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-slate-800 transition-colors">
      {photo ? (
        <img
          src={photo}
          alt={label}
          className="mb-3 h-28 w-28 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
        />
      ) : (
        <div className="mb-3 relative">
          <div className="h-16 w-16 rounded-2xl bg-slate-900 text-slate-50 flex items-center justify-center shadow-md">
            <Camera className="h-7 w-7" />
          </div>
          <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs border-2 border-slate-950">
            <Plus className="h-3 w-3" />
          </div>
        </div>
      )}
      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
        {label}
      </p>
      <p className="text-[11px] text-slate-400 mt-1">
        Tap to upload photo
      </p>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </label>
  );
};
// ===== Checklist Form =====

const CHECKLIST_SECTIONS = [
  {
    id: 'appearance',
    title: 'Rider Appearance',
    subtitle: 'Uniform, hygiene and brand standards',
    icon: <Users className="h-4 w-4 text-indigo-500" />,
    items: [
      'J&J uniform clean and complete',
      'Helmet worn properly with strap',
      'Closed shoes in good condition',
      'Rider ID card visible',
    ],
  },
  {
    id: 'bike',
    title: 'Bike Safety',
    subtitle: 'Tyres, brakes, indicators and documents',
    icon: <Bike className="h-4 w-4 text-emerald-500" />,
    items: [
      'Tyres inflated, no visible damage',
      'Front and rear brakes responsive',
      'Indicators and headlight functional',
      'Registration, license and documents checked',
    ],
  },
  {
    id: 'food',
    title: 'Food Safety & Handover',
    subtitle: 'Packaging, seals and bags',
    icon: <CreditCard className="h-4 w-4 text-amber-500" />,
    items: [
      'Order packed as per SOP',
      'Seals intact, bags clean',
      'No spillage or oil on bags',
      'Thermal bag clean and odour free',
    ],
  },
];

const ChecklistForm = ({ onNavigate, onSubmit, user, darkMode }) => {
  const initialBranch =
    user.role === 'admin' ? '' : user.branch || BRANCHES[0];

  const [basicInfo, setBasicInfo] = useState({
    branch: initialBranch,
    date: new Date().toISOString().split('T')[0],
    shift: '',
    employeeName: '',
    employeeId: '',
    employeeType: 'rider',
  });

  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState('');
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [bikePhoto, setBikePhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleBasicChange = (field, value) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleScoreChange = (sectionId, itemIndex, value) => {
    setScores(prev => {
      const sectionScores = prev[sectionId] || {};
      return {
        ...prev,
        [sectionId]: {
          ...sectionScores,
          [itemIndex]: value,
        },
      };
    });
  };

  const handlePhotoChange = (type) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'employee') {
      setEmployeePhoto(url);
    } else {
      setBikePhoto(url);
    }
  };

  const computeTotalScore = () => {
    let total = 0;
    let count = 0;
    CHECKLIST_SECTIONS.forEach(section => {
      section.items.forEach((_, idx) => {
        const value = scores[section.id]?.[idx];
        if (value !== undefined && value !== null && value !== '') {
          total += Number(value);
          count += 1;
        }
      });
    });
    if (!count) return 0;
    return Math.round((total / (count * 10)) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const totalScore = computeTotalScore();
      const payload = {
        basicInfo,
        scores,
        notes,
        employeePhoto,
        bikePhoto,
        totalScore,
      };

      // Save locally
      const saved = Database.saveChecklist(payload);

      // Optionally also push to Supabase if table exists
      try {
        await supabase.from('rider_checklists').insert({
          branch: basicInfo.branch,
          date: basicInfo.date,
          shift: basicInfo.shift,
          employee_name: basicInfo.employeeName,
          employee_id: basicInfo.employeeId,
          employee_type: basicInfo.employeeType,
          total_score: totalScore,
          notes,
        });
      } catch (err) {
        // Fail silently if Supabase not ready
        console.warn('Supabase insert skipped/failed', err?.message);
      }

      // Call parent
      if (onSubmit) {
        onSubmit(saved);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('There was an error saving the checklist.');
    } finally {
      setSaving(false);
    }
  };

  const totalScore = computeTotalScore();
  const pass = totalScore >= 80;

  return (
    <div className="min-h-screen">
      <AnimatedBackground darkMode={darkMode} />
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ChevronLeft className="h-3 w-3" />
              Back to dashboard
            </button>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50">
              Rider Safety & Quality Checklist
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Fill this before dispatch for each rider to track safety, QA and training.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${
                pass
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {pass ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <span>{pass ? 'Pass' : 'Needs Attention'}</span>
              <span className="mx-1">•</span>
              <span>{totalScore}%</span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-3 w-3" />
              Close
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5 pb-8"
        >
          {/* Basic info */}
          <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Basic information
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Branch, rider details and shift.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                <span>{basicInfo.date}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Branch
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  value={basicInfo.branch}
                  onChange={(e) => handleBasicChange('branch', e.target.value)}
                  disabled={user.role !== 'admin'}
                >
                  <option value="">Select branch</option>
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Shift
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  value={basicInfo.shift}
                  onChange={(e) => handleBasicChange('shift', e.target.value)}
                >
                  <option value="">Select shift</option>
                  {SHIFTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Employee type
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  value={basicInfo.employeeType}
                  onChange={(e) => handleBasicChange('employeeType', e.target.value)}
                >
                  <option value="rider">Rider</option>
                  <option value="manager">Manager</option>
                  <option value="assembly">Assembly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Rider name
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  value={basicInfo.employeeName}
                  onChange={(e) => handleBasicChange('employeeName', e.target.value)}
                  placeholder="e.g. Ali Ahmed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Rider ID
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  value={basicInfo.employeeId}
                  onChange={(e) => handleBasicChange('employeeId', e.target.value)}
                  placeholder="Employee code"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or issues"
                />
              </div>
            </div>
          </section>

          {/* Photos */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PhotoUpload
              label="Rider photo (front)"
              photo={employeePhoto}
              onChange={handlePhotoChange('employee')}
            />
            <PhotoUpload
              label="Bike photo (side)"
              photo={bikePhoto}
              onChange={handlePhotoChange('bike')}
            />
          </section>

          {/* Checklist sections */}
          <section className="space-y-3">
            {CHECKLIST_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 shadow-sm p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {section.icon}
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {section.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {section.items.map((label, idx) => {
                    const value = scores[section.id]?.[idx] ?? '';
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-3 py-2"
                      >
                        <span className="text-xs text-slate-700 dark:text-slate-200">
                          {label}
                        </span>
                        <select
                          className="w-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] text-slate-900 dark:text-slate-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                          value={value}
                          onChange={(e) =>
                            handleScoreChange(section.id, idx, e.target.value)
                          }
                        >
                          <option value="">Score</option>
                          <option value="10">10</option>
                          <option value="8">8</option>
                          <option value="5">5</option>
                          <option value="0">0</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Overall score:</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  pass
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {totalScore}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <svg
                    className="h-3 w-3 animate-spin text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                ) : (
                  <Save className="h-3 w-3" />
                )}
                <span>{saving ? 'Saving...' : 'Save checklist'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>Checklist saved successfully.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
// ===== Root App =====

const App = () => {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('login'); // 'login' | 'dashboard' | 'checklist' | 'staff-config' | 'reports'
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState(Database.getStats());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setScreen('dashboard');
    setStats(Database.getStats(loggedInUser.branch));
  };

  const handleLogout = () => {
    setUser(null);
    setScreen('login');
  };

  const handleNavigate = (next) => {
    setScreen(next);
    if (user) {
      setStats(Database.getStats(user.branch));
    }
  };

  const handleChecklistSubmit = () => {
    if (user) {
      setStats(Database.getStats(user.branch));
    }
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  if (screen === 'login' || !user) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  if (screen === 'checklist') {
    return (
      <ChecklistForm
        onNavigate={handleNavigate}
        onSubmit={handleChecklistSubmit}
        user={user}
        darkMode={darkMode}
      />
    );
  }

  if (screen === 'staff-config') {
    return (
      <StaffConfig
        onNavigate={handleNavigate}
        user={user}
        darkMode={darkMode}
      />
    );
  }

  if (screen === 'reports') {
    return (
      <Reports
        onNavigate={handleNavigate}
        user={user}
        darkMode={darkMode}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      stats={stats}
      darkMode={darkMode}
      toggleDarkMode={toggleDarkMode}
    />
  );
};

export default App;
