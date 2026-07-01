/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Shield, Users, BarChart3, AlertTriangle, CheckCircle2,
  TrendingUp, ChevronRight, Download, RefreshCw, Filter,
  X, ArrowLeft, Star, BookOpen, Target, Award, ChevronLeft,
  Lock, Eye, PieChart, Table2, Zap, Upload, Bell, Sun, Moon,
  CheckSquare, Settings, Play, Menu, MoreVertical, LogOut, Check,
  Maximize2, Plus, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  Legend, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, LineChart, Line, ReferenceLine,
} from 'recharts';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';

// ─── Survey Questions ─────────────────────────────────────────────────────────
const SURVEY_QUESTIONS = [
  { id: 1, text: "I feel safe reporting safety concerns without fear of negative consequences.", category: "Psychological Safety" },
  { id: 2, text: "My workplace has clear procedures for handling safety incidents.", category: "Procedures" },
  { id: 3, text: "I have received adequate safety training for my role.", category: "Training" },
  { id: 4, text: "My manager takes safety concerns seriously and acts on them.", category: "Leadership" },
  { id: 5, text: "I am aware of the emergency procedures in my workplace.", category: "Emergency Preparedness" },
  { id: 6, text: "Safety equipment and tools provided are sufficient and well-maintained.", category: "Equipment" },
  { id: 7, text: "I feel comfortable speaking up when I observe unsafe behavior.", category: "Psychological Safety" },
  { id: 8, text: "Our team regularly reviews and improves safety practices.", category: "Continuous Improvement" },
  { id: 9, text: "I understand my responsibilities when it comes to workplace safety.", category: "Awareness" },
  { id: 10, text: "Overall, I feel safe and supported in my work environment.", category: "Overall" },
];

const ANSWER_OPTIONS = [
  { label: "Strongly Disagree", value: 1, emoji: "😟" },
  { label: "Disagree", value: 3, emoji: "🙁" },
  { label: "Neutral", value: 5, emoji: "😐" },
  { label: "Agree", value: 7, emoji: "🙂" },
  { label: "Strongly Agree", value: 10, emoji: "😊" },
];

const DEVELOPMENT_TIPS: Record<string, string[]> = {
  "Psychological Safety": [
    "Join or initiate open safety discussion sessions with your team.",
    "Practice raising small concerns first to build confidence.",
    "Connect with a trusted colleague or mentor to share observations.",
  ],
  "Procedures": [
    "Review the company safety handbook or procedures manual.",
    "Ask your manager for a walkthrough of key safety protocols.",
    "Attend the next safety procedures refresher session.",
  ],
  "Training": [
    "Request role-specific safety training from HR or your manager.",
    "Complete available online safety modules on the learning portal.",
    "Shadow a colleague who demonstrates strong safety practices.",
  ],
  "Leadership": [
    "Schedule a one-on-one with your manager to discuss safety priorities.",
    "Document specific concerns and present them constructively.",
    "Engage with your safety representative or committee.",
  ],
  "Emergency Preparedness": [
    "Review the emergency evacuation plan for your area.",
    "Locate all emergency exits, fire extinguishers, and first-aid kits.",
    "Participate in the next emergency drill or simulation.",
  ],
  "Equipment": [
    "Report any damaged or insufficient equipment to maintenance.",
    "Complete a workplace equipment safety checklist.",
    "Attend an equipment safety briefing if available.",
  ],
  "Continuous Improvement": [
    "Volunteer to join the safety committee or review team.",
    "Submit a suggestion for a safety improvement initiative.",
    "Track near-misses and share findings with your team.",
  ],
  "Awareness": [
    "Read through your role's safety responsibilities document.",
    "Complete a self-assessment of your safety knowledge gaps.",
    "Ask HR for a copy of your safety responsibilities checklist.",
  ],
  "Overall": [
    "Start a personal safety improvement plan with monthly goals.",
    "Reflect on what makes you feel unsafe and share it anonymously.",
    "Seek out a safety mentor within the organization.",
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────
type AppMode = 'landing' | 'employee' | 'admin';
type SurveyStep = 'info' | 'questions' | 'result';

interface EmployeeInfo { name: string; department: string; gender: string; }
interface EmployeeResult {
  name: string; department: string; gender: string;
  score: number; answers: { questionId: number; value: number }[];
  weakCategories: string[];
}
interface AdminEmployeeData { score: number; department: string; gender: string; }

// ─── Utilities ────────────────────────────────────────────────────────────────
function cn(...c: (string | undefined | false | null)[]) { return c.filter(Boolean).join(' '); }
function getRiskLabel(s: number) { return s >= 8 ? 'Safe' : s >= 5 ? 'Moderate' : 'High Risk'; }
function getRiskColor(s: number) { return s >= 8 ? '#1ABB9C' : s >= 5 ? '#f59f00' : '#d63939'; }

const RISK_COLORS = { Safe: '#1ABB9C', Moderate: '#f59f00', 'High Risk': '#d63939' };
const DEPT_COLORS = ['#4263eb', '#ae3ec9', '#d6336c', '#17a2b8', '#f76707', '#74b816'];

const SAMPLE_DATA: AdminEmployeeData[] = [
  { score: 9, department: 'Engineering', gender: 'Male' },
  { score: 8, department: 'Engineering', gender: 'Female' },
  { score: 4, department: 'Sales', gender: 'Male' },
  { score: 7, department: 'Sales', gender: 'Female' },
  { score: 3, department: 'Marketing', gender: 'Non-binary' },
  { score: 10, department: 'HR', gender: 'Female' },
  { score: 6, department: 'Engineering', gender: 'Male' },
  { score: 2, department: 'Sales', gender: 'Female' },
  { score: 8, department: 'Marketing', gender: 'Male' },
  { score: 5, department: 'HR', gender: 'Male' },
  { score: 9, department: 'Engineering', gender: 'Female' },
  { score: 1, department: 'Sales', gender: 'Male' },
  { score: 7, department: 'Marketing', gender: 'Female' },
  { score: 8, department: 'Engineering', gender: 'Non-binary' },
  { score: 4, department: 'HR', gender: 'Female' },
  { score: 6, department: 'Sales', gender: 'Non-binary' },
  { score: 9, department: 'Marketing', gender: 'Male' },
  { score: 5, department: 'Engineering', gender: 'Female' },
  { score: 3, department: 'HR', gender: 'Male' },
  { score: 8, department: 'Sales', gender: 'Female' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE (Sleek professional entrance portal)
// ═══════════════════════════════════════════════════════════════════════════════
function LandingPage({ onSelect, theme, onToggleTheme }: { onSelect: (m: AppMode) => void; theme: string; onToggleTheme: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--body-bg)] flex flex-col items-center justify-center p-8 relative overflow-hidden transition-colors duration-200">
      
      {/* Subtle details for realistic production feel (no loud overlays) */}
      <div className="absolute inset-0 pointer-events-none border-[12px] border-[var(--border-color)] opacity-40" />

      {/* Floating Header Actions */}
      <div className="absolute top-8 right-8 flex items-center gap-3">
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-all shadow-sm"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center max-w-2xl relative z-10">
        <div className="flex justify-center mb-5">
          <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5 shadow-sm">
            <Shield size={36} className="text-[#1ABB9C]" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--text)] mb-1.5 tracking-tight">SafetyGuard</h1>
        <p className="text-[#1ABB9C] text-xs mb-1.5 font-bold uppercase tracking-widest">Organizational Safety Posture</p>
        <p className="text-[var(--text-secondary)] text-xs mb-10 leading-relaxed max-w-sm mx-auto">
          Evaluate, monitor, and configure safety compliance metrics and cultural parameters with enterprise confidence.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mx-auto">
          {[
            {
              mode: 'employee' as AppMode,
              icon: Users,
              title: "Employee Survey",
              desc: "Provide anonymous responses regarding psychological safety, tools, and training compliance.",
              cta: "Launch Assessment",
            },
            {
              mode: 'admin' as AppMode,
              icon: BarChart3,
              title: "Admin Dashboard",
              desc: "Access aggregated demographics, export CSV datasets, and manage mitigation protocols.",
              cta: "Enter Console",
            },
          ].map(({ mode, icon: I, title, desc, cta }) => (
            <motion.button key={mode} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(mode)}
              className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-6 text-left hover:bg-[var(--bg-surface-secondary)] transition-all group shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-md bg-[var(--body-bg)] flex items-center justify-center mb-4 text-[var(--text-secondary)] group-hover:bg-[#1ABB9C]/10 group-hover:text-[#1ABB9C] transition-all border border-[var(--border-color)]">
                  <I size={18} />
                </div>
                <h2 className="text-[var(--text)] font-bold text-base mb-1">{title}</h2>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{desc}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-5 text-[10px] font-bold uppercase tracking-wider text-[#1ABB9C] transition-all group-hover:underline">
                {cta} <ChevronRight size={12} />
              </div>
            </motion.button>
          ))}
        </div>

        <p className="text-[var(--text-muted)] text-[10px] mt-12 flex items-center justify-center gap-1.5 font-medium">
          <Lock size={11} className="text-emerald-500" /> Responses are confidential — individual survey records are never shared.
        </p>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE SURVEY (Confidential Survey themed with clean variables)
// ═══════════════════════════════════════════════════════════════════════════════
function EmployeeSurvey({ onBack, theme, onToggleTheme }: { onBack: () => void; theme: string; onToggleTheme: () => void }) {
  const [step, setStep] = useState<SurveyStep>('info');
  const [info, setInfo] = useState<EmployeeInfo>({ name: '', department: '', gender: '' });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<EmployeeResult | null>(null);

  const answered = Object.keys(answers).length;
  const progress = (answered / SURVEY_QUESTIONS.length) * 100;
  const allAnswered = answered === SURVEY_QUESTIONS.length;
  const infoValid = info.name.trim() && info.department.trim() && info.gender;

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setTimeout(() => { if (currentQ < SURVEY_QUESTIONS.length - 1) setCurrentQ(q => q + 1); }, 320);
  };

  const computeResult = () => {
    const vals = SURVEY_QUESTIONS.map(q => answers[q.id] ?? 0);
    const score = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
    const weakCategories = SURVEY_QUESTIONS
      .filter(q => (answers[q.id] ?? 0) < 5)
      .map(q => q.category)
      .filter((c, i, arr) => arr.indexOf(c) === i);
    setResult({ name: info.name, department: info.department, gender: info.gender, score, answers: SURVEY_QUESTIONS.map(q => ({ questionId: q.id, value: answers[q.id] ?? 0 })), weakCategories });
    setStep('result');
  };

  return (
    <div className="min-h-screen bg-[var(--body-bg)] text-[var(--text)] flex flex-col transition-colors duration-200">
      {/* Topbar */}
      <header className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors text-xs font-semibold uppercase tracking-wider">
          <ArrowLeft size={13} /> Exit Portal
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-[#1a2332] p-1.5 rounded border border-white/5">
            <Shield size={13} className="text-[#1ABB9C]" />
          </div>
          <span className="font-bold text-[var(--text)] text-xs uppercase tracking-wider">Survey Intake</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-all bg-[var(--bg-surface-secondary)]"
          >
            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
          </button>
          <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">
            <Lock size={9} /> Private
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 py-10">
        <AnimatePresence mode="wait">

          {/* Info step */}
          {step === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-sm">
              <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)] shadow-sm p-6">
                <h2 className="text-lg font-bold text-[var(--text)] mb-1">User Assessment Registry</h2>
                <p className="text-[var(--text-secondary)] text-xs mb-5">Provide minimal demographic records to establish regional baseline guidelines.</p>
                <div className="space-y-3.5">
                  {[
                    { label: 'Your Name', key: 'name' as const, placeholder: 'e.g. Alex Johnson' },
                    { label: 'Department', key: 'department' as const, placeholder: 'e.g. Engineering, Sales, HR...' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">{label}</label>
                      <input value={info[key]} onChange={e => setInfo(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full border border-[var(--border-color)] rounded px-3 py-1.5 text-xs text-[var(--text)] bg-[var(--bg-surface-secondary)] focus:outline-none focus:border-[#1ABB9C] transition-all" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Gender Group</label>
                    <select value={info.gender} onChange={e => setInfo(p => ({ ...p, gender: e.target.value }))}
                      className="w-full border border-[var(--border-color)] rounded px-3 py-1.5 text-xs text-[var(--text)] bg-[var(--bg-surface-secondary)] focus:outline-none focus:border-[#1ABB9C] transition-all">
                      <option value="">Select...</option>
                      <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <button disabled={!infoValid} onClick={() => setStep('questions')}
                  className={cn('w-full mt-5 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all border shadow-sm',
                    infoValid ? 'bg-[#1ABB9C] text-white border-[#1ABB9C] hover:bg-[#169f85]' : 'bg-[var(--bg-surface-secondary)] text-[var(--text-disabled)] cursor-not-allowed border-[var(--border-color)]')}>
                  Proceed to Survey <ChevronRight size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Questions step */}
          {step === 'questions' && (
            <motion.div key="questions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-lg">
              <div className="mb-4">
                <div className="flex justify-between text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  <span>Question {currentQ + 1} of {SURVEY_QUESTIONS.length}</span>
                  <span>{answered} answered</span>
                </div>
                <div className="h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${progress}%` }}
                    className="h-full bg-[#1ABB9C]" transition={{ duration: 0.4 }} />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentQ} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }} className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)] shadow-sm p-6 mb-4">
                  <div className="inline-flex items-center gap-1 bg-[#1ABB9C]/10 text-[#1ABB9C] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-3">
                    <Target size={10} /> {SURVEY_QUESTIONS[currentQ].category}
                  </div>
                  <h3 className="text-base font-bold text-[var(--text)] mb-5 leading-snug">{SURVEY_QUESTIONS[currentQ].text}</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {ANSWER_OPTIONS.map(opt => {
                      const selected = answers[SURVEY_QUESTIONS[currentQ].id] === opt.value;
                      return (
                        <motion.button key={opt.value} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswer(SURVEY_QUESTIONS[currentQ].id, opt.value)}
                          className={cn('py-3 rounded border text-[9px] font-bold transition-all flex flex-col items-center gap-1',
                            selected ? 'border-[#1ABB9C] bg-[#1ABB9C]/5 text-[#1ABB9C]' : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[#1ABB9C]')}>
                          <span className="text-lg">{opt.emoji}</span>
                          {opt.label.split(' ').map((w, i) => <span key={i} className="block leading-none">{w}</span>)}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between items-center mb-5">
                <button disabled={currentQ === 0} onClick={() => setCurrentQ(q => q - 1)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider">
                  <ChevronLeft size={13} /> Prev
                </button>
                {currentQ < SURVEY_QUESTIONS.length - 1 ? (
                  <button onClick={() => setCurrentQ(q => q + 1)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-[var(--bg-surface)] text-[var(--text)] px-3.5 py-1.5 border border-[var(--border-color)] rounded hover:bg-[var(--bg-surface-secondary)] transition-all uppercase tracking-wider">
                    Next <ChevronRight size={13} />
                  </button>
                ) : (
                  <button disabled={!allAnswered} onClick={computeResult}
                    className={cn('flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded transition-all border uppercase tracking-wider',
                      allAnswered ? 'bg-[#1ABB9C] text-white border-[#1ABB9C] hover:bg-[#169f85]' : 'bg-[var(--bg-surface-secondary)] text-[var(--text-disabled)] border-[var(--border-color)] cursor-not-allowed')}>
                    Submit <Award size={13} />
                  </button>
                )}
              </div>

              {/* Dot Index Navigation */}
              <div className="flex gap-1 flex-wrap justify-center">
                {SURVEY_QUESTIONS.map((q, i) => (
                  <button key={q.id} onClick={() => setCurrentQ(i)}
                    className={cn('w-5 h-5 rounded text-[8px] font-bold transition-all border',
                      i === currentQ ? 'bg-[#1ABB9C] text-white border-[#1ABB9C]' :
                        answers[q.id] ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-surface-secondary)]')}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Result step */}
          {step === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg space-y-4">
              {/* Score hero card */}
              <div className={cn('rounded-lg p-6 text-center border shadow-sm',
                result.score >= 8 ? 'bg-[var(--bg-surface)] border-l-4 border-l-[#1ABB9C] border-[var(--border-color)]' :
                  result.score >= 5 ? 'bg-[var(--bg-surface)] border-l-4 border-l-[#f59f00] border-[var(--border-color)]' :
                    'bg-[var(--bg-surface)] border-l-4 border-l-[#d63939] border-[var(--border-color)]')}>
                <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Your Confirmed Score</p>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="text-7xl font-black mb-1 leading-none" style={{ color: getRiskColor(result.score) }}>
                  {result.score}
                </motion.div>
                <p className="text-[10px] text-[var(--text-secondary)] mb-3">out of 10.0</p>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider"
                  style={{ backgroundColor: `${getRiskColor(result.score)}15`, borderColor: `${getRiskColor(result.score)}20`, color: getRiskColor(result.score) }}>
                  {result.score >= 8 ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                  {getRiskLabel(result.score)}
                </span>
                <p className="text-[var(--text-secondary)] text-xs mt-3.5 max-w-xs mx-auto leading-relaxed">
                  {result.score >= 8
                    ? `Great job, ${result.name.split(' ')[0]}! You exhibit excellent safety awareness in your operational workplace.`
                    : result.score >= 5
                      ? `Hi ${result.name.split(' ')[0]}, your score is moderate. Read the review options below to raise awareness.`
                      : `Hi ${result.name.split(' ')[0]}, your score indicates potential gaps. Review the action list below for growth opportunities.`}
                </p>
              </div>

              {/* Breakdown */}
              <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)] shadow-sm p-5">
                <h3 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1">
                  <BarChart3 size={11} /> Rating Summary
                </h3>
                <div className="space-y-3">
                  {SURVEY_QUESTIONS.map(q => {
                    const val = result.answers.find(a => a.questionId === q.id)?.value ?? 0;
                    return (
                      <div key={q.id}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[var(--text-secondary)] font-medium truncate pr-4">{q.text}</span>
                          <span className="font-bold shrink-0" style={{ color: getRiskColor(val) }}>{val}/10</span>
                        </div>
                        <div className="h-1 bg-[var(--body-bg)] rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(val / 10) * 100}%` }}
                            transition={{ duration: 0.6, delay: q.id * 0.03 }}
                            style={{ backgroundColor: getRiskColor(val) }} className="h-full rounded-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Development plan */}
              {result.weakCategories.length > 0 ? (
                <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)] shadow-sm p-5">
                  <h3 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <BookOpen size={11} /> Development Plan
                  </h3>
                  <p className="text-[8px] text-[var(--text-muted)] mb-3">Focused steps to strengthen safety culture in your daily role.</p>
                  <div className="space-y-3">
                    {result.weakCategories.slice(0, 2).map(cat => (
                      <div key={cat} className="border border-[var(--border-color)] rounded p-3 bg-[var(--bg-surface-secondary)]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#f59f00]" />
                          <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{cat}</span>
                        </div>
                        <ul className="space-y-1">
                          {(DEVELOPMENT_TIPS[cat] ?? DEVELOPMENT_TIPS['Overall']).map((tip, i) => (
                            <li key={i} className="flex items-start gap-1 text-[11px] text-[var(--text-secondary)]">
                              <Star size={10} className="text-[#f59f00] mt-0.5 shrink-0" /> {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#1ABB9C]/10 border border-[#1ABB9C]/20 rounded-lg p-5 text-center">
                  <CheckCircle2 size={24} className="text-[#1ABB9C] mx-auto mb-1.5" />
                  <h3 className="font-bold text-[#1ABB9C] text-xs mb-0.5 uppercase tracking-wider">Safety Champion Status!</h3>
                  <p className="text-[var(--text-secondary)] text-[11px]">You scored high across all safety assessment categories. Keep up the good work!</p>
                </div>
              )}

              <button onClick={onBack}
                className="w-full py-2 rounded text-xs font-bold bg-[#1a2332] text-white hover:bg-[#253247] transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider border border-white/5">
                <ArrowLeft size={12} /> Back to Portal
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD (V4 Gentelella layout & widgets & dark theme integration)
// ═══════════════════════════════════════════════════════════════════════════════
function AdminDashboard({ onBack, theme, onToggleTheme }: { onBack: () => void; theme: string; onToggleTheme: () => void }) {
  // Initialize rawData to SAMPLE_DATA so it loads with content on mount by default
  const [rawData, setRawData] = useState<AdminEmployeeData[] | null>(SAMPLE_DATA);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'table'>('overview');
  const [filters, setFilters] = useState({ department: '', gender: '', riskLevel: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<{ id: number; text: string; time: string; read: boolean }[]>([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // UI states for settings drawer and mitigation manager modal
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isMitigationModalOpen, setIsMitigationModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mitigation checklist state
  const [todos, setTodos] = useState([
    { id: 1, text: "Schedule 1-on-1 safety micro-training for Sales department", priority: "high", checked: false, date: "Jun 15" },
    { id: 2, text: "Review emergency evacuation maps in building B", priority: "medium", checked: true, date: "Jun 12" },
    { id: 3, text: "Distribute safety glove guidelines to Engineering", priority: "high", checked: false, date: "Jun 18" },
    { id: 4, text: "Conduct simulated phishing/reporting test", priority: "medium", checked: false, date: "Jun 20" },
    { id: 5, text: "Update safety reporting guidelines link in Wiki", priority: "low", checked: false, date: "Jun 25" },
  ]);

  // Quick settings toggles
  const [settingsToggles, setSettingsToggles] = useState({
    emailAlerts: true,
    riskThresholdNotify: true,
    autoBackup: false,
    systemWideMaintenance: false,
  });

  // System logs / activity feed list
  const [systemLogs, setSystemLogs] = useState<{ id: number; text: string; time: string; category: string }[]>([
    { id: 1, text: "Safety Posture Monitor initialized.", time: "10 mins ago", category: "system" },
    { id: 2, text: "Loaded baseline sample profiles database.", time: "10 mins ago", category: "data" },
  ]);

  const toggleTodo = (id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
    setSystemLogs(prev => [
      { id: Date.now(), text: `Task state modified: "${todos.find(t => t.id === id)?.text}"`, time: "Just now", category: "action" },
      ...prev
    ]);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      priority: newTaskPriority,
      checked: false,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
    setTodos(prev => [...prev, newTask]);
    setNewTaskText('');
    setSystemLogs(prev => [
      { id: Date.now(), text: `New task scheduled: "${newTask.text}"`, time: "Just now", category: "action" },
      ...prev
    ]);
  };

  const handleDeleteTask = (id: number) => {
    const taskToDelete = todos.find(t => t.id === id);
    setTodos(prev => prev.filter(t => t.id !== id));
    setSystemLogs(prev => [
      { id: Date.now(), text: `Removed task: "${taskToDelete?.text}"`, time: "Just now", category: "action" },
      ...prev
    ]);
  };

  const handleToggleSetting = (key: keyof typeof settingsToggles) => {
    setSettingsToggles(prev => ({ ...prev, [key]: !prev[key] }));
    setSystemLogs(prev => [
      { id: Date.now(), text: `Setting option "${key}" modified.`, time: "Just now", category: "settings" },
      ...prev
    ]);
  };

  const data = useMemo(() => {
    if (!rawData) return null;
    return rawData.filter(d => {
      if (filters.department && d.department !== filters.department) return false;
      if (filters.gender && d.gender !== filters.gender) return false;
      if (filters.riskLevel && getRiskLabel(d.score) !== filters.riskLevel) return false;
      if (searchTerm && !d.department.toLowerCase().includes(searchTerm.toLowerCase()) && !d.gender.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [rawData, filters, searchTerm]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const scores = data.map(d => d.score);
    const total = data.length;
    const meanScore = scores.reduce((a, b) => a + b, 0) / total;
    const safe_n = data.filter(d => d.score >= 8).length;
    const mod_n = data.filter(d => d.score >= 5 && d.score < 8).length;
    const high_n = data.filter(d => d.score < 5).length;
    const highRiskPercent = (high_n / total) * 100;
    const sorted = [...scores].sort((a, b) => a - b);
    const qLen = Math.max(1, Math.floor(0.25 * total));
    const quartileAvg = sorted.slice(0, qLen).reduce((a, b) => a + b, 0) / qLen;
    const isVulnerable = highRiskPercent > 10 || quartileAvg < 4;

    const depts = Array.from(new Set(data.map(d => d.department)));
    const deptAnalysis = depts.map(dept => {
      const dRows = data.filter(d => d.department === dept);
      return { department: dept, score: Number((dRows.reduce((a, b) => a + b.score, 0) / dRows.length).toFixed(1)), count: dRows.length };
    }).sort((a, b) => a.score - b.score);

    const genders = Array.from(new Set(data.map(d => d.gender)));
    const genderAnalysis = genders.map(gender => {
      const gRows = data.filter(d => d.gender === gender);
      return {
        gender,
        'High Risk': gRows.filter(d => d.score < 5).length,
        Moderate: gRows.filter(d => d.score >= 5 && d.score < 8).length,
        Safe: gRows.filter(d => d.score >= 8).length,
        avg: Number((gRows.reduce((a, b) => a + b.score, 0) / gRows.length).toFixed(1)),
      };
    });

    const freq: Record<number, number> = {};
    for (let i = 0; i <= 10; i++) freq[i] = 0;
    scores.forEach(s => { freq[Math.min(10, Math.max(0, Math.round(s)))]++; });
    const scoreFrequency = Object.entries(freq).map(([score, count]) => ({ score: Number(score), count }));
    const radarData = depts.slice(0, 6).map(dept => {
      const avg = data.filter(d => d.department === dept).reduce((a, b) => a + b.score, 0) / data.filter(d => d.department === dept).length;
      return { subject: dept, score: Number(avg.toFixed(1)), fullMark: 10 };
    });

    return {
      total, meanScore, highRiskPercent, quartileAvg, isVulnerable,
      status: isVulnerable ? 'VULNERABLE' : 'ACCEPTABLE' as const,
      riskDistribution: [
        { name: 'Safe', value: safe_n, color: RISK_COLORS.Safe, pct: Math.round((safe_n / total) * 100) },
        { name: 'Moderate', value: mod_n, color: RISK_COLORS.Moderate, pct: Math.round((mod_n / total) * 100) },
        { name: 'High Risk', value: high_n, color: RISK_COLORS['High Risk'], pct: Math.round((high_n / total) * 100) },
      ],
      deptAnalysis, genderAnalysis, scoreFrequency, radarData,
      topRiskDept: deptAnalysis[0]?.department ?? '—',
      safestDept: deptAnalysis[deptAnalysis.length - 1]?.department ?? '—',
    };
  }, [data]);

  // Sync notification alerts based on current statistics
  useEffect(() => {
    if (stats) {
      const list = [];
      if (stats.isVulnerable) {
        list.push({ id: 1, text: `⚠️ Health Status: VULNERABLE. Risk segment at ${stats.highRiskPercent.toFixed(1)}%.`, time: "1 min ago", read: false });
        if (stats.highRiskPercent > 12) {
          list.push({ id: 2, text: `🛑 Warning: Score density low in ${stats.topRiskDept} department.`, time: "Just now", read: false });
        }
      } else {
        list.push({ id: 3, text: "✓ Safety posture remains in acceptable compliance boundaries.", time: "1 min ago", read: false });
      }
      setNotifications(list);
    }
  }, [stats]);

  const filterOptions = useMemo(() => ({
    departments: rawData ? Array.from(new Set(rawData.map(d => d.department))).sort() : [],
    genders: rawData ? Array.from(new Set(rawData.map(d => d.gender))).sort() : [],
  }), [rawData]);

  const activeFilterCount = [filters.department, filters.gender, filters.riskLevel].filter(Boolean).length;

  const handleFileUpload = useCallback((file: File) => {
    Papa.parse(file, {
      header: true, dynamicTyping: true, skipEmptyLines: true,
      complete: (results) => {
        const cleaned = (results.data as any[]).map(row => {
          const n: any = {};
          Object.keys(row).forEach(k => { n[k.trim().toLowerCase()] = row[k]; });
          return n;
        }).filter(row => row.score !== undefined && row.department && row.gender);
        if (cleaned.length > 0) {
          setRawData(cleaned);
          setFilters({ department: '', gender: '', riskLevel: '' });
          setSystemLogs(prev => [
            { id: Date.now(), text: `Uploaded dataset: "${file.name}" with ${cleaned.length} records.`, time: "Just now", category: "data" },
            ...prev
          ]);
        }
        else alert("Invalid CSV. Columns required: 'score', 'department', 'gender'.");
      },
    });
  }, []);

  const exportCSV = () => {
    if (!data) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([Papa.unparse(data.map(d => ({ ...d, risk_category: getRiskLabel(d.score) })))], { type: 'text/csv' }));
    a.download = 'safety_analysis.csv'; a.click();
    setSystemLogs(prev => [
      { id: Date.now(), text: "Exported current filtered records data to CSV.", time: "Just now", category: "data" },
      ...prev
    ]);
  };

  // Recharts styling helpers based on active theme
  const chartConfig = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      gridStroke: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e6e7eb',
      tickFill: isDark ? '#8a93a3' : '#626d7d',
      tooltipBg: isDark ? '#1a2332' : '#ffffff',
      tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e6e7eb',
      tooltipText: isDark ? '#e6ebf2' : '#1e2633',
    };
  }, [theme]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="shadow-sm rounded border px-3 py-2 text-[10px]"
        style={{
          backgroundColor: chartConfig.tooltipBg,
          borderColor: chartConfig.tooltipBorder,
          color: chartConfig.tooltipText
        }}
      >
        <p className="font-bold mb-1 opacity-90">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="font-semibold flex items-center gap-1.5" style={{ color: p.color || p.fill }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            {p.name}: <span className="tabular-nums font-mono font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  const ChartCard = ({ title, children, icon: Icon, className }: any) => (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
      className={cn('bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-sm p-4.5 flex flex-col', className)}>
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5 mb-3.5">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={12} className="text-[#1ABB9C]" />}
          <h4 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{title}</h4>
        </div>
        <button className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"><MoreVertical size={12} /></button>
      </div>
      <div className="flex-1 min-h-[210px]">{children}</div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[var(--body-bg)] text-[var(--text)] flex transition-colors duration-200">
      
      {/* ─── SIDEBAR (Gentelella Dark Sidebar Style) ─────────────────────────────────── */}
      <aside className="w-60 bg-[#1a2332] text-[#7b8fa3] flex flex-col sticky top-0 h-screen shrink-0 border-r border-[#1a2332] z-30 shadow-md">
        
        {/* Sidebar Brand Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#1ABB9C]/10 p-1.5 rounded border border-[#1ABB9C]/20">
              <Shield size={16} className="text-[#1ABB9C]" />
            </div>
            <div>
              <p className="font-extrabold text-white text-xs tracking-wider uppercase">SafetyGuard</p>
              <p className="text-[8px] text-[#1ABB9C] font-extrabold uppercase tracking-widest leading-none">Console</p>
            </div>
          </div>
          <button onClick={onBack} className="text-[#7b8fa3] hover:text-white transition-colors" title="Exit console">
            <LogOut size={13} />
          </button>
        </div>

        {/* Sidebar User Header Section */}
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#1a2332] border border-white/10 flex items-center justify-center text-white font-extrabold text-xs">
            SO
          </div>
          <div className="truncate">
            <span className="text-[9px] uppercase tracking-wider text-[#56687a] font-bold block">Operator,</span>
            <span className="text-xs font-bold text-white block truncate">Safety Officer</span>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1ABB9C]" />
              <span className="text-[8px] uppercase tracking-widest text-[#1ABB9C] font-extrabold">Live</span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* General Views */}
          <div>
            <p className="text-[8px] font-bold text-[#4c5b6b] uppercase tracking-widest px-2 mb-1.5">General</p>
            <nav className="space-y-0.5">
              {[
                { id: 'overview', label: 'Console Overview', icon: PieChart },
                { id: 'breakdown', label: 'Demographics', icon: BarChart3 },
                { id: 'table', label: 'Database Records', icon: Table2 },
              ].map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-all",
                      isActive
                        ? "bg-white/5 border-l-2 border-l-[#1ABB9C] text-white"
                        : "hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon size={12} className={isActive ? "text-[#1ABB9C]" : ""} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Configuration Actions */}
          <div>
            <p className="text-[8px] font-bold text-[#4c5b6b] uppercase tracking-widest px-2 mb-1.5">Data Input</p>
            <div className="px-1 space-y-2">
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border border-dashed rounded p-3 text-center cursor-pointer transition-all",
                  isDragging ? "border-[#1ABB9C] bg-[#1ABB9C]/5" : "border-white/10 hover:border-[#1ABB9C]/30 hover:bg-white/5"
                )}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                <Upload className="text-[#1ABB9C] mx-auto mb-1 opacity-60" size={13} />
                <p className="text-[10px] font-bold text-white">Import CSV Records</p>
                <p className="text-[7px] text-[#56687a] mt-0.5">Required: score, department, gender</p>
              </div>
            </div>
          </div>

          {/* Filtering Sub-panel */}
          {rawData && (
            <div>
              <p className="text-[8px] font-bold text-[#4c5b6b] uppercase tracking-widest px-2 mb-1.5">
                Active Filters {activeFilterCount > 0 && <span className="bg-[#1ABB9C] text-white text-[8px] font-bold rounded-full px-1.5 ml-1 py-0.5">{activeFilterCount}</span>}
              </p>
              <div className="space-y-2 px-1">
                {[
                  { label: 'Department', key: 'department' as const, opts: filterOptions.departments },
                  { label: 'Gender Group', key: 'gender' as const, opts: filterOptions.genders },
                  { label: 'Risk Category', key: 'riskLevel' as const, opts: ['Safe', 'Moderate', 'High Risk'] },
                ].map(({ label, key, opts }) => (
                  <div key={key}>
                    <label className="text-[7px] font-bold text-[#56687a] uppercase tracking-wider block mb-0.5">{label}</label>
                    <select
                      value={filters[key]}
                      onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full text-[10px] border border-white/10 rounded px-2 py-1 bg-[#141d2b] text-white focus:outline-none focus:border-[#1ABB9C]"
                    >
                      <option value="">All Categories</option>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => setFilters({ department: '', gender: '', riskLevel: '' })}
                    className="text-[9px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors mt-1.5"
                  >
                    <X size={9} /> Reset all filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer Shortcuts (Settings Drawer triggers settings, theme toggle, logout) */}
        <div className="p-2.5 bg-[#141d2b] border-t border-white/5 grid grid-cols-3 gap-1 text-center shrink-0">
          <button
            onClick={() => setIsSettingsDrawerOpen(true)}
            className="py-1 rounded hover:bg-white/5 hover:text-white transition-all text-[#7b8fa3]"
            title="Open Quick Settings Drawer"
          >
            <Settings size={13} className="mx-auto" />
          </button>
          <button
            onClick={onToggleTheme}
            className="py-1 rounded hover:bg-white/5 hover:text-white transition-all"
            title="Toggle color theme"
          >
            {theme === 'dark' ? <Sun size={13} className="mx-auto text-yellow-400" /> : <Moon size={13} className="mx-auto" />}
          </button>
          <button
            onClick={onBack}
            className="py-1 rounded hover:bg-white/5 hover:text-white transition-all text-red-400/80 hover:text-red-300"
            title="Exit Admin Console"
          >
            <LogOut size={13} className="mx-auto" />
          </button>
        </div>
      </aside>

      {/* ─── MAIN APP AREA ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ─── TOP BAR ──────────────────────────────────────────────────────────── */}
        <header className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors duration-200">
          
          {/* Breadcrumb section */}
          <div className="flex items-center gap-2">
            <button className="text-[var(--text-secondary)] hover:text-[var(--text)] lg:hidden"><Menu size={15} /></button>
            <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              <span>SafetyGuard</span>
              <span>/</span>
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-[#1ABB9C]">{activeTab}</span>
            </div>
          </div>

          {/* Topbar Right items */}
          <div className="flex items-center gap-3.5">
            
            {/* Alerts & Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationMenu(!showNotificationMenu);
                  setShowUserMenu(false);
                }}
                className="p-1.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-surface-secondary)] transition-all relative"
              >
                <Bell size={13} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Bell dropdown */}
              <AnimatePresence>
                {showNotificationMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-2 w-64 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-md z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-surface-secondary)] flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Alert Warnings</span>
                      <span className="text-[8px] bg-red-500 text-white font-bold rounded px-1.5 py-0.5">{notifications.length}</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-3 py-5 text-center text-xs text-[var(--text-muted)]">No warnings found</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="px-3 py-2 border-b border-[var(--border-color)] hover:bg-[var(--bg-surface-secondary)] transition-colors flex items-start gap-2 text-[11px]">
                            <AlertTriangle size={12} className="text-[#d63939] shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-[var(--text)] leading-tight">{n.text}</p>
                              <span className="text-[8px] text-[var(--text-muted)]">{n.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick settings gear in Topbar as well */}
            <button
              onClick={() => setIsSettingsDrawerOpen(true)}
              className="p-1.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-surface-secondary)] transition-all"
              title="Open Settings Drawer"
            >
              <Settings size={13} />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotificationMenu(false);
                }}
                className="flex items-center gap-2 px-2 py-1 rounded border border-[var(--border-color)] hover:bg-[var(--bg-surface-secondary)] transition-all"
              >
                <div className="w-5 h-5 rounded bg-gradient-to-tr from-[#1ABB9C] to-blue-500 flex items-center justify-center text-white font-bold text-[9px]">
                  SO
                </div>
                <span className="text-[11px] font-bold hidden sm:inline text-[var(--text-secondary)]">Safety Officer</span>
              </button>

              {/* User menu dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-2 w-44 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-md z-50 overflow-hidden text-xs"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-surface-secondary)]">
                      <p className="font-bold text-[var(--text)] leading-tight">Admin Console</p>
                      <p className="text-[8px] text-[var(--text-muted)] truncate">officer@safetyguard.org</p>
                    </div>
                    <div className="p-1">
                      <button onClick={() => alert("Profile Settings")} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[var(--bg-surface-secondary)] font-semibold transition-all">Account Profile</button>
                      <button onClick={() => setIsSettingsDrawerOpen(true)} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[var(--bg-surface-secondary)] font-semibold transition-all">Quick Settings</button>
                      <div className="h-px bg-[var(--border-color)] my-1" />
                      <button onClick={onBack} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-red-500/10 text-red-500 font-bold transition-all flex items-center gap-1">
                        <LogOut size={11} /> Exit Console
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ─── MAIN CONTENT VIEW ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 transition-colors duration-200">
          <AnimatePresence mode="wait">
            {!rawData ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-12 h-12 bg-[#1a2332] rounded-lg flex items-center justify-center shadow mb-4 border border-white/5">
                  <BarChart3 size={24} className="text-[#1ABB9C]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text)] mb-1">Safety Posture Intelligence</h2>
                <p className="text-[var(--text-secondary)] text-xs leading-normal mb-5">
                  Import your organization records. Upload a CSV file structured with score, department, and gender records to populate the system database.
                </p>
                <div className="flex gap-2.5 justify-center mb-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded text-xs font-bold text-white bg-[#1ABB9C] hover:bg-[#169f85] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload size={13} /> Select CSV File
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* ─── Dashboard Header with Small Status Badge (Realistic SaaS style) ──── */}
                <div className=" flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg font-extrabold tracking-tight text-[var(--text)] uppercase flex items-center gap-2">
                      Safety Posture Dashboard
                      <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0',
                        stats.isVulnerable ?? false
                          ? 'bg-red-500/10 border-red-500/20 text-[#d63939]'
                          : 'bg-[#1ABB9C]/10 border-[#1ABB9C]/20 text-[#1ABB9C]')}>
                        {stats && stats.isVulnerable? '⚠ Vulnerable' : '✓ Good'}
                      </span>
                    </h2>
                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Analyzing {data?.length ?? 0} of {rawData.length} Employee Profiles
                      {activeFilterCount > 0 && ` · ${activeFilterCount} Active Filters`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] transition-all shadow-sm">
                      <Download size={12} /> Export CSV
                    </button>
                    <button onClick={() => { setRawData(null); setFilters({ department: '', gender: '', riskLevel: '' }); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-[#d63939]/10 text-[#d63939] hover:bg-[#d63939]/15 transition-all shadow-sm">
                      <RefreshCw size={12} /> Clear Database
                    </button>
                  </div>
                </div>

                {!stats ? (
                  <div className="text-center py-20 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded">
                    <Filter size={24} className="mx-auto mb-3 opacity-30 text-[var(--text-muted)]" />
                    <p className="font-semibold text-xs text-[var(--text-secondary)]">No records matching active filters.</p>
                    <button onClick={() => setFilters({ department: '', gender: '', riskLevel: '' })} className="mt-1 text-xs text-[#1ABB9C] font-bold underline">Reset Filters</button>
                  </div>
                ) : (
                  <>
                    {/* ─── KPI Cards Row (Solid cards, no glow) ─────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          title: 'Total Sampled',
                          value: stats.total,
                          icon: Users,
                          themeColor: '#4263eb',
                          sub: 'Profiles in database',
                          spark: [40, 50, 45, 60, 50, 70, 65, 80, 75, 90]
                        },
                        {
                          title: 'Mean Score',
                          value: stats.meanScore.toFixed(2),
                          icon: TrendingUp,
                          themeColor: '#1ABB9C',
                          sub: 'Average perception rating',
                          spark: [70, 72, 75, 74, 78, 80, 81, 82, 80, 82]
                        },
                        {
                          title: 'High Risk Percent',
                          value: `${stats.highRiskPercent.toFixed(1)}%`,
                          icon: AlertTriangle,
                          themeColor: stats.highRiskPercent > 10 ? '#d63939' : '#1ABB9C',
                          sub: 'Count scored ≤ 4.0',
                          spark: [15, 14, 12, 11, 13, 10, 9, 11, 10, 8]
                        },
                        {
                          title: 'Bottom 25% Avg',
                          value: stats.quartileAvg.toFixed(2),
                          icon: BarChart3,
                          themeColor: stats.quartileAvg < 4 ? '#d63939' : '#ae3ec9',
                          sub: 'Lowest quartile safety rating',
                          spark: [32, 33, 31, 34, 32, 36, 35, 38, 37, 39]
                        },
                      ].map((card, idx) => (
                        <div
                          key={card.title}
                          className="bg-[var(--bg-surface)] rounded border border-[var(--border-color)] p-4 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-[var(--text-disabled)] transition-all"
                          style={{ borderLeft: `3px solid ${card.themeColor}` }}
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">{card.title}</span>
                            <span className="text-xl font-extrabold text-[var(--text)] block tabular-nums leading-none">{card.value}</span>
                            <span className="text-[9px] text-[var(--text-muted)] block">{card.sub}</span>
                          </div>
                          <div className="flex flex-col items-end justify-between h-full">
                            <div className="w-7 h-7 rounded bg-[var(--body-bg)] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border-color)]">
                              <card.icon size={13} style={{ color: card.themeColor }} />
                            </div>
                            
                            {/* Simple Sparkline */}
                            <div className="flex gap-0.5 items-end h-5 mt-2">
                              {card.spark.map((h, i) => (
                                <div
                                  key={i}
                                  className="w-[2px] rounded-t-sm transition-all"
                                  style={{
                                    height: `${h}%`,
                                    backgroundColor: card.themeColor,
                                    opacity: 0.3 + (i * 0.06)
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ─── MAIN GRID: col-8-4 Layout (Subtle borders, realistic) ────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left Column: Tabbed Charts & Tables (Col-span-8) */}
                      <div className="lg:col-span-8 space-y-6">
                        
                        {/* Tab Switch Controls */}
                        <div className="flex bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-1 shadow-sm w-fit">
                          {[
                            { id: 'overview', label: 'Overview Metrics', icon: Eye },
                            { id: 'breakdown', label: 'Demographics', icon: BarChart3 },
                            { id: 'table', label: 'Database Records', icon: Table2 },
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setActiveTab(t.id as any)}
                              className={cn(
                                "flex items-center gap-1 py-1 px-3 rounded text-[10px] font-bold transition-all uppercase tracking-wider",
                                activeTab === t.id
                                  ? "bg-[#1a2332] text-white"
                                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text)]"
                              )}
                            >
                              <t.icon size={11} />
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Active Tab View Window */}
                        <div className="min-h-[420px]">
                          <AnimatePresence mode="wait">
                            
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                              <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  
                                  {/* Risk Segment Donut Chart */}
                                  <ChartCard title="Overall Risk Distribution" icon={PieChart}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <RePieChart>
                                        <Pie
                                          data={stats.riskDistribution}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius="50%"
                                          outerRadius="75%"
                                          paddingAngle={2}
                                          dataKey="value"
                                        >
                                          {stats.riskDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                          ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                          verticalAlign="bottom"
                                          align="center"
                                          iconType="circle"
                                          wrapperStyle={{ fontSize: 9, paddingTop: 5 }}
                                        />
                                      </RePieChart>
                                    </ResponsiveContainer>
                                  </ChartCard>

                                  {/* Score Distribution Area Chart */}
                                  <ChartCard title="Score Frequency Profile" icon={TrendingUp}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={stats.scoreFrequency} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <defs>
                                          <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1ABB9C" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#1ABB9C" stopOpacity={0.0} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartConfig.gridStroke} />
                                        <XAxis dataKey="score" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: chartConfig.tickFill }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: chartConfig.tickFill }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="count" name="Count" stroke="#1ABB9C" strokeWidth={2} fill="url(#sg2)" dot={{ fill: '#1ABB9C', r: 2.5, strokeWidth: 0 }} />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </ChartCard>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {[
                                    { label: 'Highest Risk Dept', value: stats.topRiskDept, icon: AlertTriangle, c: 'text-[#d63939] bg-red-500/5 border-red-500/10' },
                                    { label: 'Safest Department', value: stats.safestDept, icon: CheckCircle2, c: 'text-[#1ABB9C] bg-[#1ABB9C]/5 border-[#1ABB9C]/10' },
                                    { label: 'Observed Range', value: `${Math.min(...(data?.map(d => d.score) ?? [0]))} – ${Math.max(...(data?.map(d => d.score) ?? [0]))}`, icon: TrendingUp, c: 'text-[#4263eb] bg-blue-500/5 border-blue-500/10' },
                                  ].map(({ label, value, icon: I, c }) => (
                                    <div key={label} className={cn('rounded border p-3 flex items-center gap-3', c)}>
                                      <I size={15} className="shrink-0" />
                                      <div>
                                        <p className="text-[8px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{label}</p>
                                        <p className="text-xs font-black tracking-wide truncate">{value}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}

                            {/* DEMOGRAPHICS TAB */}
                            {activeTab === 'breakdown' && (
                              <motion.div key="br" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  
                                  {/* Risk distribution by gender */}
                                  <ChartCard title="Risk Segmentation by Gender" icon={Users}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={stats.genderAnalysis} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartConfig.gridStroke} />
                                        <XAxis dataKey="gender" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: chartConfig.tickFill, fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: chartConfig.tickFill }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 9, paddingBottom: 5 }} />
                                        <Bar dataKey="Safe" stackId="a" fill={RISK_COLORS.Safe} barSize={25} />
                                        <Bar dataKey="Moderate" stackId="a" fill={RISK_COLORS.Moderate} />
                                        <Bar dataKey="High Risk" stackId="a" fill={RISK_COLORS['High Risk']} radius={[2, 2, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </ChartCard>

                                  {/* Avg Score by Gender */}
                                  <ChartCard title="Average Rating by Gender" icon={TrendingUp}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={stats.genderAnalysis} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartConfig.gridStroke} />
                                        <XAxis dataKey="gender" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: chartConfig.tickFill, fontWeight: 600 }} />
                                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: chartConfig.tickFill }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <ReferenceLine y={5} stroke="#f59f00" strokeDasharray="3 3" />
                                        <ReferenceLine y={8} stroke="#1ABB9C" strokeDasharray="3 3" />
                                        <Line type="monotone" dataKey="avg" name="Avg Score" stroke="#1ABB9C" strokeWidth={2} dot={{ fill: '#1ABB9C', r: 3, strokeWidth: 0 }} />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </ChartCard>
                                </div>

                                {/* Employee count by Department */}
                                <ChartCard title="Sample Count by Department" icon={BarChart3}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.deptAnalysis} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartConfig.gridStroke} />
                                      <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: chartConfig.tickFill, fontWeight: 600 }} />
                                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: chartConfig.tickFill }} />
                                      <Tooltip content={<CustomTooltip />} />
                                      <Bar dataKey="count" name="Employees" radius={[3, 3, 0, 0]} barSize={30}>
                                        {stats.deptAnalysis.map((entry, i) => (
                                          <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </ChartCard>
                              </motion.div>
                            )}

                            {/* RAW DATABASE TABLE */}
                            {activeTab === 'table' && (
                              <motion.div key="tb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <div className="bg-[var(--bg-surface)] rounded border border-[var(--border-color)] shadow-sm overflow-hidden">
                                  
                                  {/* Table Header Section */}
                                  <div className="px-5 py-3 border-b border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <h4 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Demographic Records Database</h4>
                                    
                                    {/* Table Search Input */}
                                    <div className="relative">
                                      <input
                                        type="text"
                                        placeholder="Search records..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="text-xs border border-[var(--border-color)] rounded pl-3 pr-8 py-1 bg-[var(--bg-surface-secondary)] text-[var(--text)] focus:outline-none focus:border-[#1ABB9C] w-44 transition-all"
                                      />
                                      {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2 text-[var(--text-muted)] hover:text-[var(--text)]">
                                          <X size={10} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Records Data Table */}
                                  <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                                    <table className="w-full text-xs">
                                      <thead className="sticky top-0 bg-[var(--bg-surface-secondary)] border-b border-[var(--border-color)] text-[var(--text-muted)] z-10">
                                        <tr>
                                          {['#', 'Safety Rating', 'Department', 'Gender Group', 'Risk Category'].map(h => (
                                            <th key={h} className="text-left px-5 py-2.5 text-[8px] font-bold uppercase tracking-wider">{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {data?.map((row, i) => (
                                          <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-surface-secondary)]/50 transition-colors odd:bg-[var(--bg-surface-secondary)]/10">
                                            <td className="px-5 py-2 text-[var(--text-muted)] font-mono text-[9px]">{i + 1}</td>
                                            <td className="px-5 py-2">
                                              <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded"
                                                style={{ backgroundColor: `${getRiskColor(row.score)}15`, color: getRiskColor(row.score) }}>
                                                {row.score.toFixed(1)}
                                              </span>
                                            </td>
                                            <td className="px-5 py-2 text-[var(--text)] font-semibold">{row.department}</td>
                                            <td className="px-5 py-2 text-[var(--text-secondary)]">{row.gender}</td>
                                            <td className="px-5 py-2">
                                              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                style={{ backgroundColor: `${getRiskColor(row.score)}10`, color: getRiskColor(row.score) }}>
                                                {getRiskLabel(row.score)}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                        {(!data || data.length === 0) && (
                                          <tr>
                                            <td colSpan={5} className="text-center py-6 text-[var(--text-muted)]">No profiles found matching search.</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Right Column: Dynamic Widgets Side Panel (Col-span-4) */}
                      <div className="lg:col-span-4 space-y-6">
                        
                        {/* ─── MITIGATION ACTION CHECKLIST PREVIEW WIDGET ──────────────── */}
                        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-sm p-4.5 flex flex-col">
                          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5 mb-3.5">
                            <div className="flex items-center gap-1.5">
                              <CheckSquare size={12} className="text-[#1ABB9C]" />
                              <h4 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Mitigation Checklist</h4>
                            </div>
                            
                            {/* Maximize Button to open full screen modal */}
                            <button
                              onClick={() => setIsMitigationModalOpen(true)}
                              className="text-[var(--text-secondary)] hover:text-[#1ABB9C] transition-colors p-1 hover:bg-[var(--bg-surface-secondary)] rounded"
                              title="Open Fullscreen Manager"
                            >
                              <Maximize2 size={12} />
                            </button>
                          </div>

                          <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                            {todos.slice(0, 4).map(todo => (
                              <div
                                key={todo.id}
                                onClick={() => toggleTodo(todo.id)}
                                className={cn(
                                  "p-2 rounded border flex items-start gap-2 cursor-pointer hover:bg-[var(--bg-surface-secondary)] transition-all",
                                  todo.checked
                                    ? "bg-[var(--bg-surface-secondary)] border-[var(--border-color)] opacity-60"
                                    : "bg-[var(--bg-surface)] border-[var(--border-color)]"
                                )}
                              >
                                <div className={cn(
                                  "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                  todo.checked ? "bg-[#1ABB9C] border-[#1ABB9C] text-white" : "border-[var(--border-color)] bg-[var(--bg-surface)]"
                                )}>
                                  {todo.checked && <Check size={9} strokeWidth={3} />}
                                </div>
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <p className={cn("text-[11px] leading-snug truncate", todo.checked ? "line-through text-[var(--text-muted)]" : "font-semibold text-[var(--text)]")}>
                                    {todo.text}
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] text-[var(--text-muted)]">{todo.date}</span>
                                    <span className={cn(
                                      "text-[6px] font-black uppercase tracking-wider px-1 rounded-sm",
                                      todo.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                                        todo.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'
                                    )}>
                                      {todo.priority}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <button
                            onClick={() => setIsMitigationModalOpen(true)}
                            className="w-full mt-3 py-1 bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text)] font-semibold rounded text-[10px] transition-all"
                          >
                            Manage Tasks ({todos.length}) →
                          </button>
                        </div>

                        {/* ─── RECENT SYSTEM ACTIONS LOGS WIDGET ─────────────────────── */}
                        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-sm p-4.5 flex flex-col">
                          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5 mb-3.5">
                            <div className="flex items-center gap-1.5">
                              <Play size={12} className="text-[#1ABB9C]" />
                              <h4 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">System Events Feed</h4>
                            </div>
                            <button onClick={() => setSystemLogs([{ id: 1, text: "Logs reset.", time: "Just now", category: "system" }])} className="text-[8px] font-bold text-[var(--text-muted)] hover:text-red-500 transition-colors">Clear</button>
                          </div>

                          <div className="space-y-3 max-h-48 overflow-y-auto pr-0.5">
                            {systemLogs.map(log => (
                              <div key={log.id} className="text-[11px] flex gap-2 items-start">
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0 mt-1.5",
                                  log.category === 'data' ? 'bg-blue-500' :
                                    log.category === 'settings' ? 'bg-purple-500' :
                                      log.category === 'action' ? 'bg-[#1ABB9C]' : 'bg-gray-400'
                                )} />
                                <div className="space-y-0.5">
                                  <p className="text-[11px] text-[var(--text)] font-semibold leading-snug">{log.text}</p>
                                  <span className="text-[8px] text-[var(--text-muted)] block">{log.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ─── MITIGATION ACTIONS MANAGER (FULL SCREEN MODAL VIEW) ──────────────────── */}
      <AnimatePresence>
        {isMitigationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMitigationModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            />
            
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="relative bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-4xl h-[75vh] flex flex-col z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface-secondary)]">
                <div className="flex items-center gap-2">
                  <CheckSquare size={15} className="text-[#1ABB9C]" />
                  <h3 className="font-extrabold text-xs text-[var(--text)] uppercase tracking-wider">Mitigation Actions Manager</h3>
                  <span className="text-[9px] font-bold bg-[#1ABB9C]/10 text-[#1ABB9C] px-2 py-0.5 rounded ml-2">
                    {todos.filter(t => !t.checked).length} Items Left
                  </span>
                </div>
                <button
                  onClick={() => setIsMitigationModalOpen(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text)] p-1 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body (Form left, List right) */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-5 p-5">
                
                {/* Form column (Left) */}
                <div className="md:col-span-4 border-r border-[var(--border-color)] pr-5 flex flex-col justify-start">
                  <h4 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3.5">Schedule Mitigation</h4>
                  
                  <form onSubmit={handleAddTask} className="space-y-3.5">
                    <div>
                      <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Action Description</label>
                      <textarea
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        placeholder="e.g. Schedule safety procedures seminar..."
                        rows={3}
                        className="w-full text-xs border border-[var(--border-color)] rounded p-2 bg-[var(--bg-surface-secondary)] text-[var(--text)] focus:outline-none focus:border-[#1ABB9C] resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Priority Weight</label>
                      <select
                        value={newTaskPriority}
                        onChange={e => setNewTaskPriority(e.target.value)}
                        className="w-full text-xs border border-[var(--border-color)] rounded p-1.5 bg-[var(--bg-surface-secondary)] text-[var(--text)] focus:outline-none focus:border-[#1ABB9C]"
                      >
                        <option value="high">🔥 High Priority</option>
                        <option value="medium">⚡ Medium Priority</option>
                        <option value="low">☘ Low Priority</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-[#1ABB9C] text-white font-bold rounded text-xs hover:bg-[#169f85] transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus size={12} /> Add Task
                    </button>
                  </form>
                </div>

                {/* Checklist column (Right) */}
                <div className="md:col-span-8 flex flex-col overflow-hidden">
                  <h4 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2.5">Mitigation Checklist</h4>
                  
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5">
                    {todos.map(todo => (
                      <div
                        key={todo.id}
                        className={cn(
                          "p-2.5 rounded border flex items-center justify-between gap-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-secondary)]/30 transition-all",
                          todo.checked ? "border-[var(--border-color)] opacity-60 bg-[var(--bg-surface-secondary)]/20" : "border-[var(--border-color)]"
                        )}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0" onClick={() => toggleTodo(todo.id)}>
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors",
                            todo.checked ? "bg-[#1ABB9C] border-[#1ABB9C] text-white" : "border-[var(--border-color)] bg-[var(--bg-surface)]"
                          )}>
                            {todo.checked && <Check size={11} strokeWidth={3} />}
                          </div>
                          <div>
                            <p className={cn("text-xs leading-snug", todo.checked ? "line-through text-[var(--text-muted)]" : "font-semibold text-[var(--text)]")}>
                              {todo.text}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-[var(--text-muted)]">{todo.date}</span>
                              <span className={cn(
                                "text-[6px] font-black uppercase tracking-wider px-1 rounded-sm",
                                todo.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                                  todo.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'
                              )}>
                                {todo.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(todo.id)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded transition-colors hover:bg-red-500/10"
                          title="Delete task"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {todos.length === 0 && (
                      <div className="text-center py-12 text-xs text-[var(--text-muted)]">No tasks scheduled. Add new tasks in the mitigation planner panel.</div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── QUICK CONFIGURATION SETTINGS (SLIDE-OVER RIGHT SIDE DRAWER VIEW) ────────── */}
      <AnimatePresence>
        {isSettingsDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsDrawerOpen(false)}
              className="fixed inset-0 bg-black/35 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-80 h-full bg-[var(--bg-surface)] border-l border-[var(--border-color)] p-6 shadow-xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4.5 mb-6">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                  <Settings size={13} className="text-[#1ABB9C]" />
                  Quick settings drawer
                </div>
                <button
                  onClick={() => setIsSettingsDrawerOpen(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text)] p-1 rounded-md"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Toggle switch selectors */}
              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                {[
                  { key: 'emailAlerts' as const, label: 'Email Alerts on Vulnerability', desc: 'Notify HR if score triggers High Risk status' },
                  { key: 'riskThresholdNotify' as const, label: 'Push Notifications Alert', desc: 'Real-time alert dispatch to mobile panel' },
                  { key: 'autoBackup' as const, label: 'Automated Database Backup', desc: 'Sync local storage records with server instance' },
                  { key: 'systemWideMaintenance' as const, label: 'Maintenance Mode Active', desc: 'Temporarily place survey intake in read-only' }
                ].map(item => (
                  <div key={item.key} className="flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--text)] block">{item.label}</span>
                      <span className="text-[10px] text-[var(--text-muted)] block leading-snug">{item.desc}</span>
                    </div>
                    <button
                      onClick={() => handleToggleSetting(item.key)}
                      className={cn(
                        "w-8.5 h-4.5 rounded-full p-0.5 transition-colors relative shrink-0",
                        settingsToggles[item.key] ? "bg-[#1ABB9C]" : "bg-[var(--border-color)]"
                      )}
                    >
                      <div className={cn(
                        "w-3.5 h-3.5 rounded-full bg-white transition-all shadow-sm",
                        settingsToggles[item.key] ? "translate-x-4" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--border-color)] pt-4 mt-auto">
                <button
                  onClick={() => setIsSettingsDrawerOpen(false)}
                  className="w-full py-2 bg-[#1a2332] text-white font-bold rounded text-xs hover:bg-[#253247] transition-all uppercase tracking-wider"
                >
                  Close drawer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT (Handles theme initialization and mounting screens)
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [mode, setMode] = useState<AppMode>('landing');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <AnimatePresence mode="wait">
      {mode === 'landing' && (
        <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen">
          <LandingPage onSelect={setMode} theme={theme} onToggleTheme={toggleTheme} />
        </motion.div>
      )}
      {mode === 'employee' && (
        <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen">
          <EmployeeSurvey onBack={() => setMode('landing')} theme={theme} onToggleTheme={toggleTheme} />
        </motion.div>
      )}
      {mode === 'admin' && (
        <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen">
          <AdminDashboard onBack={() => setMode('landing')} theme={theme} onToggleTheme={toggleTheme} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
