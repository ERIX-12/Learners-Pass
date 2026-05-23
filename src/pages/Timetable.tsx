import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Check, 
  BookOpen, 
  Award, 
  Coffee, 
  Hourglass, 
  CalendarClock,
  GraduationCap,
  TrendingUp,
  Brain,
  AlertCircle,
  CalendarRange,
  XCircle,
  ArrowRight,
  X
} from "lucide-react";
import { generateTimetable, TimetableSubject, TimetableConfig } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface Session {
  time: string;
  duration: number;
  subject: string;
  topic: string;
  type: "study" | "revision" | "quiz" | "break";
  description: string;
}

interface DayPlan {
  day: string;
  date: string;
  sessions: Session[];
}

interface TimetableResponse {
  timetable: DayPlan[];
  studyTips: string[];
}

const COMPLETED_PARTICLES = [
  { x: 30, y: 0, color: "bg-emerald-400", size: 6 },
  { x: 22, y: 22, color: "bg-indigo-400", size: 5 },
  { x: 0, y: 32, color: "bg-teal-400", size: 7 },
  { x: -22, y: 22, color: "bg-sky-400", size: 5 },
  { x: -30, y: 0, color: "bg-pink-400", size: 6 },
  { x: -22, y: -22, color: "bg-purple-400", size: 4 },
  { x: 0, y: -32, color: "bg-amber-400", size: 7 },
  { x: 22, y: -22, color: "bg-emerald-500", size: 5 },
];

interface ParticleBurstProps {
  onComplete: () => void;
}

function ParticleBurst({ onComplete }: ParticleBurstProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
      {COMPLETED_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${p.color}`}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.3 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [1, 0.8, 0],
            scale: [0.3, 1, 0],
          }}
          transition={{
            duration: 0.65,
            ease: "easeOut",
          }}
          style={{
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}

export default function Timetable() {
  const navigate = useNavigate();
  
  const [activeBursts, setActiveBursts] = useState<Record<string, boolean>>({});
  
  const [aiFocusMode, setAiFocusMode] = useState<boolean>(() => {
    return localStorage.getItem("learners_pass_ai_focus_active") === "true";
  });

  const handleToggleAiFocusMode = () => {
    const nextVal = !aiFocusMode;
    setAiFocusMode(nextVal);
    localStorage.setItem("learners_pass_ai_focus_active", String(nextVal));
    if (!nextVal) {
      localStorage.removeItem("learners_pass_ai_focus_subject");
      localStorage.removeItem("learners_pass_ai_focus_topic");
    }
  };

  const handleFocusAndLaunchTutor = (session: Session) => {
    localStorage.setItem("learners_pass_ai_focus_subject", session.subject);
    localStorage.setItem("learners_pass_ai_focus_topic", session.topic);
    localStorage.setItem("learners_pass_ai_focus_active", "true");
    navigate(`/tutor?subject=${encodeURIComponent(session.subject)}&topic=${encodeURIComponent(session.topic)}`);
  };

  // Input states
  const [subjects, setSubjects] = useState<TimetableSubject[]>([
    { name: "Mathematics", difficulty: "hard", examDate: "2026-06-15", targetScore: 85, targetReviews: 6 },
    { name: "Biology", difficulty: "medium", examDate: "2026-06-20", targetScore: 90, targetReviews: 4 },
    { name: "English Literature", difficulty: "easy", examDate: "2026-06-10", targetScore: 75, targetReviews: 3 }
  ]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDifficulty, setNewSubjectDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [newSubjectDate, setNewSubjectDate] = useState("");
  const [newSubjectTargetScore, setNewSubjectTargetScore] = useState<number | "">("");
  const [newSubjectTargetReviews, setNewSubjectTargetReviews] = useState<number | "">("");

  const [availableHours, setAvailableHours] = useState(4);
  const [studySlotPreference, setStudySlotPreference] = useState<"morning" | "afternoon" | "evening" | "any">("any");
  const [includeQuizzes, setIncludeQuizzes] = useState(true);
  const [breakFrequency, setBreakFrequency] = useState<"pomodoro" | "short_breaks" | "none">("short_breaks");

  // Loading & results state
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [timetableResult, setTimetableResult] = useState<TimetableResponse | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // Progress/Gamification State
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean>>({});
  const [missedSessions, setMissedSessions] = useState<Record<string, boolean>>({});
  const [rescheduledKeys, setRescheduledKeys] = useState<Record<string, boolean>>({});
  const [gainedPoints, setGainedPoints] = useState(0);

  // Manual Session Creation State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSubject, setManualSubject] = useState("");
  const [manualTopic, setManualTopic] = useState("");
  const [manualType, setManualType] = useState<"study" | "revision" | "quiz" | "break">("study");
  const [manualTime, setManualTime] = useState("10:00");
  const [manualDuration, setManualDuration] = useState<number>(45);
  const [manualDescription, setManualDescription] = useState("");
  const [manualTargetDay, setManualTargetDay] = useState("");

  // Loading reassuring messages
  const loadingSteps = [
    "Analyzing exam deadlines...",
    "Estimating subject weighting based on difficulty...",
    "Constructing cognitive recovery pauses...",
    "Injecting smart quizzes & active-recall blocks...",
    "Polishing your custom study roadmap..."
  ];

  // Load from localStorage on mount
  useEffect(() => {
    const savedTimetable = localStorage.getItem("learners_pass_timetable");
    const savedCompleted = localStorage.getItem("learners_pass_completed_sessions");
    const savedMissed = localStorage.getItem("learners_pass_missed_sessions");
    const savedRescheduled = localStorage.getItem("learners_pass_rescheduled_keys");
    const savedPoints = localStorage.getItem("learners_pass_gained_points");
    
    if (savedTimetable) {
      try {
        setTimetableResult(JSON.parse(savedTimetable));
      } catch (e) {
        console.error("Error reading saved timetable", e);
      }
    }
    if (savedCompleted) {
      try {
        setCompletedSessions(JSON.parse(savedCompleted));
      } catch (e) {}
    }
    if (savedMissed) {
      try {
        setMissedSessions(JSON.parse(savedMissed));
      } catch (e) {}
    }
    if (savedRescheduled) {
      try {
        setRescheduledKeys(JSON.parse(savedRescheduled));
      } catch (e) {}
    }
    if (savedPoints) {
      setGainedPoints(Number(savedPoints));
    }
  }, []);

  // Interval logic for fake progression of reassuring loader
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      const stepDuration = 2500;
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, stepDuration);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handle adding subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    
    // Fallback date if empty (3 weeks in the future)
    let finalDate = newSubjectDate;
    if (!finalDate) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 21);
      finalDate = fallback.toISOString().split("T")[0];
    }

    setSubjects([
      ...subjects,
      {
        name: newSubjectName.trim(),
        difficulty: newSubjectDifficulty,
        examDate: finalDate,
        targetScore: newSubjectTargetScore !== "" ? newSubjectTargetScore : undefined,
        targetReviews: newSubjectTargetReviews !== "" ? newSubjectTargetReviews : undefined
      }
    ]);
    setNewSubjectName("");
    setNewSubjectDifficulty("medium");
    setNewSubjectDate("");
    setNewSubjectTargetScore("");
    setNewSubjectTargetReviews("");
  };

  // Remove subject
  const handleRemoveSubject = (idx: number) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  // Handle generation
  const handleGenerate = async () => {
    if (subjects.length === 0) {
      alert("Please add at least one subject to generate your timetable!");
      return;
    }

    setIsGenerating(true);
    setLoadingStep(0);

    try {
      const config: TimetableConfig = {
        subjects,
        availableHours,
        studySlotPreference,
        includeQuizzes,
        breakFrequency
      };

      const result = await generateTimetable(config);
      
      setTimetableResult(result);
      localStorage.setItem("learners_pass_timetable", JSON.stringify(result));
      
      // Reset completed checks on a fresh generation
      setCompletedSessions({});
      setMissedSessions({});
      setRescheduledKeys({});
      localStorage.setItem("learners_pass_completed_sessions", JSON.stringify({}));
      localStorage.setItem("learners_pass_missed_sessions", JSON.stringify({}));
      localStorage.setItem("learners_pass_rescheduled_keys", JSON.stringify({}));
      
      setSelectedDayIndex(0);
    } catch (err) {
      console.error("Error generating timetable:", err);
      alert("Failed to curate your timetable. Check your input settings and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Checkbox state tracking with dynamic gamified response
  const handleToggleSession = (dayName: string, sessionIndex: number, type: string) => {
    const key = `${dayName}_${sessionIndex}`;
    const newCompletedVal = !completedSessions[key];
    const newCompleted = { ...completedSessions, [key]: newCompletedVal };
    setCompletedSessions(newCompleted);
    localStorage.setItem("learners_pass_completed_sessions", JSON.stringify(newCompleted));

    // If completed is toggled on, it cannot be missed
    if (newCompletedVal) {
      setActiveBursts(prev => ({ ...prev, [key]: true }));
      const newMissed = { ...missedSessions, [key]: false };
      setMissedSessions(newMissed);
      localStorage.setItem("learners_pass_missed_sessions", JSON.stringify(newMissed));
    }

    // Gamification points boost
    let pointDiff = 0;
    if (newCompletedVal) {
      // Add points
      pointDiff = type === "quiz" ? 25 : type === "study" || type === "revision" ? 15 : 5;
    } else {
      // Deduct points
      pointDiff = type === "quiz" ? -25 : type === "study" || type === "revision" ? -15 : -5;
    }
    
    const newPoints = Math.max(0, gainedPoints + pointDiff);
    setGainedPoints(newPoints);
    localStorage.setItem("learners_pass_gained_points", String(newPoints));
  };

  // Toggle missed status
  const handleToggleMissed = (dayName: string, sessionIndex: number) => {
    const key = `${dayName}_${sessionIndex}`;
    const newMissedVal = !missedSessions[key];
    const newMissed = { ...missedSessions, [key]: newMissedVal };
    setMissedSessions(newMissed);
    localStorage.setItem("learners_pass_missed_sessions", JSON.stringify(newMissed));

    // If marked as missed, it cannot be completed
    if (newMissedVal) {
      const newCompleted = { ...completedSessions, [key]: false };
      setCompletedSessions(newCompleted);
      localStorage.setItem("learners_pass_completed_sessions", JSON.stringify(newCompleted));
    }
  };

  // Reschedule missed session to next day
  const handleRescheduleSession = (dayName: string, sIdx: number) => {
    if (!timetableResult) return;
    const dayIdx = timetableResult.timetable.findIndex(d => d.day === dayName);
    if (dayIdx === -1) return;
    const nextDayIdx = (dayIdx + 1) % timetableResult.timetable.length;
    const nextDayName = timetableResult.timetable[nextDayIdx].day;

    const currentDayPlan = timetableResult.timetable[dayIdx];
    const sessionToMove = currentDayPlan.sessions[sIdx];

    const rescheduledSession: Session = {
      ...sessionToMove,
      time: sessionToMove.time.includes("(Rescheduled)") ? sessionToMove.time : `${sessionToMove.time} (Rescheduled)`,
      description: sessionToMove.description.includes("Rescheduled from") 
        ? sessionToMove.description 
        : `${sessionToMove.description} (Rescheduled from ${dayName})`
    };

    // Update timetableResult state by injecting rescheduled session to the next day
    const updatedTimetable = [...timetableResult.timetable];
    updatedTimetable[nextDayIdx] = {
      ...updatedTimetable[nextDayIdx],
      sessions: [...updatedTimetable[nextDayIdx].sessions, rescheduledSession]
    };

    const newTimetableResult = {
      ...timetableResult,
      timetable: updatedTimetable
    };

    setTimetableResult(newTimetableResult);
    localStorage.setItem("learners_pass_timetable", JSON.stringify(newTimetableResult));

    // Mark key as rescheduled
    const sessionKey = `${dayName}_${sIdx}`;
    const nextRescheduledKeys = { ...rescheduledKeys, [sessionKey]: true };
    setRescheduledKeys(nextRescheduledKeys);
    localStorage.setItem("learners_pass_rescheduled_keys", JSON.stringify(nextRescheduledKeys));
  };

  // Collect unresolved missed sessions of interest
  const getUnresolvedMissedSessions = () => {
    if (!timetableResult) return [];
    const unresolved: { day: string; dayIndex: number; sessionIndex: number; session: Session }[] = [];
    timetableResult.timetable.forEach((dayPlan, dIdx) => {
      dayPlan.sessions.forEach((session, sIdx) => {
        const key = `${dayPlan.day}_${sIdx}`;
        if (missedSessions[key] && !rescheduledKeys[key]) {
          unresolved.push({
            day: dayPlan.day,
            dayIndex: dIdx,
            sessionIndex: sIdx,
            session
          });
        }
      });
    });
    return unresolved;
  };

  // Reset planner
  const handleResetPlanner = () => {
    if (window.confirm("Are you sure you want to rebuild your timetable? This will reset your active tracker.")) {
      setTimetableResult(null);
      setCompletedSessions({});
      setMissedSessions({});
      setRescheduledKeys({});
      setGainedPoints(0);
      localStorage.removeItem("learners_pass_timetable");
      localStorage.removeItem("learners_pass_completed_sessions");
      localStorage.removeItem("learners_pass_missed_sessions");
      localStorage.removeItem("learners_pass_rescheduled_keys");
      localStorage.removeItem("learners_pass_gained_points");
    }
  };

  const handleAddManualSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timetableResult) return;
    if (!manualSubject.trim() && manualType !== "break") {
      alert("Subject name is required!");
      return;
    }

    const newSession: Session = {
      time: manualTime || "12:00",
      duration: Number(manualDuration) || 45,
      subject: manualType === "break" ? "Self-care Recovery" : manualSubject.trim(),
      topic: manualType === "break" ? "Rest Period" : manualTopic.trim(),
      type: manualType,
      description: manualDescription.trim() || `${manualType === 'break' ? 'Self-care' : 'Custom study'} block`
    };

    const targetDayName = manualTargetDay || timetableResult.timetable[selectedDayIndex].day;

    const updatedTimetable = timetableResult.timetable.map(dayPlan => {
      if (dayPlan.day !== targetDayName) return dayPlan;
      return {
        ...dayPlan,
        sessions: [...dayPlan.sessions, newSession]
      };
    });

    const newTimetableResult = {
      ...timetableResult,
      timetable: updatedTimetable
    };

    setTimetableResult(newTimetableResult);
    localStorage.setItem("learners_pass_timetable", JSON.stringify(newTimetableResult));
    setIsManualModalOpen(false);

    // Reset Form state
    setManualSubject("");
    setManualTopic("");
    setManualType("study");
    setManualTime("10:00");
    setManualDuration(45);
    setManualDescription("");
  };

  const handleDeleteSession = (dayName: string, sessionIndex: number) => {
    if (!timetableResult) return;
    if (!window.confirm("Are you sure you want to remove this session?")) return;

    const dayIdx = timetableResult.timetable.findIndex(d => d.day === dayName);
    if (dayIdx === -1) return;

    const updatedTimetable = timetableResult.timetable.map(dayPlan => {
      if (dayPlan.day !== dayName) return dayPlan;
      return {
        ...dayPlan,
        sessions: dayPlan.sessions.filter((_, idx) => idx !== sessionIndex)
      };
    });

    const newTimetableResult = {
      ...timetableResult,
      timetable: updatedTimetable
    };

    setTimetableResult(newTimetableResult);
    localStorage.setItem("learners_pass_timetable", JSON.stringify(newTimetableResult));

    // Shift check state to align with new indexes on that day
    const updatedCompleted = { ...completedSessions };
    const updatedMissed = { ...missedSessions };
    const updatedRescheduled = { ...rescheduledKeys };

    const maxSessions = timetableResult.timetable[dayIdx].sessions.length;
    for (let i = sessionIndex; i < maxSessions; i++) {
      const currentKey = `${dayName}_${i}`;
      const nextKey = `${dayName}_${i + 1}`;

      if (i === maxSessions - 1) {
        delete updatedCompleted[currentKey];
        delete updatedMissed[currentKey];
        delete updatedRescheduled[currentKey];
      } else {
        if (completedSessions[nextKey] !== undefined) {
          updatedCompleted[currentKey] = completedSessions[nextKey];
        } else {
          delete updatedCompleted[currentKey];
        }

        if (missedSessions[nextKey] !== undefined) {
          updatedMissed[currentKey] = missedSessions[nextKey];
        } else {
          delete updatedMissed[currentKey];
        }

        if (rescheduledKeys[nextKey] !== undefined) {
          updatedRescheduled[currentKey] = rescheduledKeys[nextKey];
        } else {
          delete updatedRescheduled[currentKey];
        }
      }
    }

    setCompletedSessions(updatedCompleted);
    setMissedSessions(updatedMissed);
    setRescheduledKeys(updatedRescheduled);
    localStorage.setItem("learners_pass_completed_sessions", JSON.stringify(updatedCompleted));
    localStorage.setItem("learners_pass_missed_sessions", JSON.stringify(updatedMissed));
    localStorage.setItem("learners_pass_rescheduled_keys", JSON.stringify(updatedRescheduled));
  };

  // Calculate current completion percentage for current day or entire week
  const getWeeklyStats = () => {
    if (!timetableResult) return { total: 0, completed: 0, percentage: 0 };
    let total = 0;
    let completed = 0;
    
    timetableResult.timetable.forEach((d) => {
      d.sessions.forEach((s, idx) => {
        total++;
        if (completedSessions[`${d.day}_${idx}`]) {
          completed++;
        }
      });
    });

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const stats = getWeeklyStats();

  const getChartData = () => {
    if (!timetableResult) return [];

    const subjectData: Record<string, { planned: number; completed: number }> = {};

    // Initialise with configured/visible subjects
    subjects.forEach((subj) => {
      subjectData[subj.name] = { planned: 0, completed: 0 };
    });

    // Sum up sessions scheduled in the timetable
    timetableResult.timetable.forEach((dayPlan) => {
      dayPlan.sessions.forEach((session, idx) => {
        if (session.type === "break") return;
        
        const subjName = session.subject;
        if (!subjectData[subjName]) {
          subjectData[subjName] = { planned: 0, completed: 0 };
        }

        const durationHours = session.duration / 60;
        subjectData[subjName].planned += durationHours;

        const sessionKey = `${dayPlan.day}_${idx}`;
        if (completedSessions[sessionKey]) {
          subjectData[subjName].completed += durationHours;
        }
      });
    });

    // Formulate clean Recharts consumable structure
    return Object.keys(subjectData)
      .map((name) => {
        const item = subjectData[name];
        return {
          name,
          Completed: Number(item.completed.toFixed(1)),
          Goal: Number(item.planned.toFixed(1)),
        };
      })
      .filter((item) => item.Goal > 0 || item.Completed > 0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 max-w-7xl mx-auto min-h-screen"
    >
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="text-primary" size={28} />
              AI Study Timetable
            </h2>
            <p className="text-slate-500 mt-1">
              Construct high-recall schedules tuned perfectly to your exam timelines.
            </p>
          </div>
          {timetableResult && (
            <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">XP Rank Gained</span>
                <span className="text-lg font-black text-primary font-mono">{gainedPoints} XP</span>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Award size={22} />
              </div>
            </div>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          // AI Loading screen
          <motion.div 
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-lg"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-primary animate-pulse" size={32} />
              </div>
            </div>

            <motion.h3 
              key={loadingStep}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="text-xl font-bold text-slate-805"
            >
              {loadingSteps[loadingStep]}
            </motion.h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md">
              Gemini AI is balancing intervals, scheduling active reviews, and designing active-recall spacing.
            </p>
          </motion.div>
        ) : !timetableResult ? (
          // Setup Phase / Form Wizard
          <motion.div 
            key="setup-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left panels: Configure subjects & exams */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BookOpen size={100} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <BookOpen size={20} className="text-primary" />
                  Your Study Content & Exam Deadlines
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  Add target course subjects, how difficult you find them, and set when they are being examined.
                </p>

                {/* Submitting form */}
                <form onSubmit={handleAddSubject} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 bg-slate-50 p-4 rounded-2xl mb-6 items-end">
                  <div className="xl:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">Subject Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. chemistry, French" 
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Exam Date</label>
                    <input 
                      type="date"
                      value={newSubjectDate}
                      onChange={(e) => setNewSubjectDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Difficulty</label>
                    <select 
                      value={newSubjectDifficulty}
                      onChange={(e) => setNewSubjectDifficulty(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-bold text-slate-600"
                    >
                      <option value="easy">Easy (Low focus)</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard (High focus)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Target Score (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      placeholder="e.g. 90" 
                      value={newSubjectTargetScore}
                      onChange={(e) => setNewSubjectTargetScore(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Target Revisions</label>
                    <input 
                      type="number" 
                      min="1"
                      max="50"
                      placeholder="e.g. 5" 
                      value={newSubjectTargetReviews}
                      onChange={(e) => setNewSubjectTargetReviews(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                  <div className="xl:col-span-6 flex justify-end">
                    <button 
                      type="submit" 
                      className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto mt-2"
                    >
                      <Plus size={16} />
                      Add Subject & Set Goals
                    </button>
                  </div>
                </form>

                {/* Current Subject list */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-500">Subject Overview ({subjects.length})</h4>
                  {subjects.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                      <p className="text-slate-400 text-sm">No subjects added yet. Add a subject above to get started.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {subjects.map((subj, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-800 text-sm block leading-tight">{subj.name}</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                                subj.difficulty === "hard" ? "bg-red-50 text-red-600" :
                                subj.difficulty === "medium" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                              }`}>
                                {subj.difficulty}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                <Calendar size={11} /> Exam: {subj.examDate}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {subj.targetScore !== undefined && subj.targetScore !== null && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                                  🎯 Goal: {subj.targetScore}%
                                </span>
                              )}
                              {subj.targetReviews !== undefined && subj.targetReviews !== null && (
                                <span className="text-[10px] bg-sky-55 bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded">
                                  🔁 Target Revs: {subj.targetReviews}x
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveSubject(idx)} 
                            className="p-1.5 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-slate-100 shadow-sm"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Preferences & Hours bento panels */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-primary" />
                  Study Session Calibration
                </h3>

                <div className="space-y-6">
                  {/* Hours per Day Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-600">Available Study Time</span>
                      <span className="text-sm font-black text-primary font-mono">{availableHours} hrs/day</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={availableHours} 
                      onChange={(e) => setAvailableHours(Number(e.target.value))}
                      className="w-full accent-primary bg-slate-100 h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                      <span>Light (1h)</span>
                      <span>Regular (4h)</span>
                      <span>Intense (10h)</span>
                    </div>
                  </div>

                  {/* Preferred Study Slot */}
                  <div>
                    <span className="text-sm font-bold text-slate-600 block mb-2">Preferred Study Blocks</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "morning", label: "🌅 Morning" },
                        { id: "afternoon", label: "☀️ Afternoon" },
                        { id: "evening", label: "🌙 Evening" },
                        { id: "any", label: "✨ Any/Flexible" }
                      ].map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setStudySlotPreference(slot.id as any)}
                          className={`py-2.5 px-3 rounded-xl text-center text-xs font-bold border transition-all ${
                            studySlotPreference === slot.id
                              ? "bg-primary/5 text-primary border-primary"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Include Quizzes toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold text-slate-700 block">Assessment Quizzes</span>
                      <span className="text-xs text-slate-400 font-medium">Auto-include quiz buffers</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeQuizzes(!includeQuizzes)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                        includeQuizzes ? "bg-primary" : "bg-slate-300"
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        includeQuizzes ? "translate-x-6" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Rest Frequency Strategy */}
                  <div>
                    <span className="text-sm font-bold text-slate-700 block mb-2">Break Frequency Strategy</span>
                    <div className="space-y-2">
                      {[
                        { id: "pomodoro", label: "🍅 Pomodoro (25m Study + 5m Break)", desc: "Best for intensive mental effort." },
                        { id: "short_breaks", label: "⏱️ Classic (50m Study + 10m Break)", desc: "Excellent to enter long deep work flows." },
                        { id: "none", label: "⚡ Bulk Study (No predetermined breaks)", desc: "Not recommended, self-managed breaks." }
                      ].map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => setBreakFrequency(item.id as any)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                            breakFrequency === item.id 
                              ? "bg-primary/5 border-primary" 
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-700 block">{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Trigger */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={subjects.length === 0}
                className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-3xl font-black text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles size={18} />
                Generate My AI Timetable
              </button>
            </div>
          </motion.div>
        ) : (
          // Active Schedule / Calendar Output screen
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Timeline plan for the selected day */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filter tabs day by day */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-2 justify-between items-center">
                <div className="flex flex-wrap gap-1.5">
                  {timetableResult.timetable.map((plan, idx) => (
                    <button
                      key={plan.day}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`py-2 px-3.5 rounded-xl text-center text-xs font-bold transition-all ${
                        selectedDayIndex === idx
                          ? "bg-primary text-white shadow-md shadow-primary/15"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block leading-tight">{plan.day}</span>
                      <span className={`text-[9px] block ${selectedDayIndex === idx ? "text-white/80" : "text-slate-400"}`}>
                        {plan.date}
                      </span>
                    </button>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={handleResetPlanner}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors p-2"
                >
                  <RotateCcw size={14} />
                  Reset Plan
                </button>
              </div>

              {/* Dynamic day timeline agenda */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
                      <CalendarClock size={20} className="text-primary" />
                      {timetableResult.timetable[selectedDayIndex].day} Schedule
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Date slot: {timetableResult.timetable[selectedDayIndex].date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setManualSubject("");
                        setManualTopic("");
                        setManualType("study");
                        setManualTime("10:00");
                        setManualDuration(45);
                        setManualDescription("");
                        setManualTargetDay(timetableResult.timetable[selectedDayIndex].day);
                        setIsManualModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-extrabold transition-all shadow-sm active:scale-95 cursor-pointer"
                      id="btn-add-manual-session"
                    >
                      <Plus size={14} />
                      <span>Add Session</span>
                    </button>
                    <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500">
                      Day Progress: {timetableResult.timetable[selectedDayIndex].sessions.filter((_, i) => completedSessions[`${timetableResult.timetable[selectedDayIndex].day}_${i}`]).length} / {timetableResult.timetable[selectedDayIndex].sessions.length}
                    </div>
                  </div>
                </div>

                {/* AI Focus Mode Toggler Bar */}
                <div className="mb-6 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl text-indigo-600 shadow-sm flex items-center justify-center shrink-0">
                      <Brain size={18} className={aiFocusMode ? "animate-pulse" : ""} />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block">AI Focus Mode</span>
                      <span className="text-[10.5px] font-medium text-slate-500 block leading-normal">
                        When active, click any study session below to immediately filter & align your AI Tutor chatbot.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAiFocusMode}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm transition-all duration-200 cursor-pointer border active:scale-95 shrink-0 ${
                      aiFocusMode
                        ? "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 font-extrabold"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                    id="toggle-ai-focus-mode"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${aiFocusMode ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`} />
                    <span>{aiFocusMode ? "ACTIVE" : "ON"}</span>
                  </button>
                </div>

                <div className="space-y-6 relative border-l-2 border-slate-100 ml-4 pl-6 py-2">
                  {timetableResult.timetable[selectedDayIndex].sessions.map((session, sIdx) => {
                    const sessionKey = `${timetableResult.timetable[selectedDayIndex].day}_${sIdx}`;
                    const isChecked = !!completedSessions[sessionKey];
                    const isMissed = !!missedSessions[sessionKey];
                    const isRescheduled = !!rescheduledKeys[sessionKey];
                    
                    // Style config depending on session type
                    let colorTheme = {
                      dot: "bg-violet-500 border-violet-200",
                      badge: "bg-violet-50 text-violet-600 border-violet-200/50",
                      card: "border-slate-100 hover:border-violet-100 focus-within:border-violet-200"
                    };

                    if (session.type === "quiz") {
                      colorTheme = {
                        dot: "bg-emerald-500 border-emerald-200",
                        badge: "bg-emerald-50 text-emerald-600 border-emerald-200/50",
                        card: "border-slate-100 hover:border-emerald-100 focus-within:border-emerald-200"
                      };
                    } else if (session.type === "break") {
                      colorTheme = {
                        dot: "bg-amber-400 border-amber-200",
                        badge: "bg-amber-50 text-amber-600 border-amber-200/50",
                        card: "border-slate-100 hover:border-amber-100 focus-within:border-amber-205"
                      };
                    } else if (session.type === "revision") {
                      colorTheme = {
                        dot: "bg-sky-500 border-sky-200",
                        badge: "bg-sky-50 text-sky-600 border-sky-200/50",
                        card: "border-slate-100 hover:border-sky-100 focus-within:border-sky-200"
                      };
                    }

                    let cardClass = colorTheme.card;
                    if (isChecked) {
                      cardClass = "opacity-60 bg-slate-50 border-slate-100";
                    } else if (isMissed) {
                      cardClass = "border-rose-250 bg-rose-50/10 shadow-sm hover:border-rose-300";
                    } else if (aiFocusMode && session.type !== "break") {
                      cardClass = "border-indigo-100 bg-indigo-50/5 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/10 cursor-pointer shadow-indigo-500/5 hover:scale-[1.005]";
                    }

                    return (
                      <div key={sIdx} className="relative group">
                        {/* Timeline bubble connector */}
                        <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${colorTheme.dot} z-10 transition-transform duration-300 group-hover:scale-125`} />

                        <div 
                          onClick={() => {
                            if (aiFocusMode && session.type !== "break") {
                              handleFocusAndLaunchTutor(session);
                            }
                          }}
                          className={`p-5 bg-white rounded-2xl border shadow-sm transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardClass}`}
                        >
                          <div className="space-y-2 flex-1">
                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Time period */}
                              <span className="text-xs font-black text-slate-800 flex items-center gap-1 block">
                                <Clock size={13} className="text-slate-400" />
                                {session.time}
                              </span>
                              
                              {/* Duration badge */}
                              <span className="text-[10px] font-bold text-slate-400 block px-1.5 py-0.5 bg-slate-100 rounded">
                                {session.duration} mins
                              </span>

                              {/* Action type badge */}
                              <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${colorTheme.badge}`}>
                                {session.type === "quiz" ? "Assessment Quiz" : 
                                 session.type === "break" ? "Self-care Recovery" : 
                                 session.type === "revision" ? "Revision Spacing" : "Study Session"}
                              </span>

                              {/* Missed badge */}
                              {isMissed && (
                                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border bg-rose-50 text-rose-600 border-rose-200/50 animate-pulse flex items-center gap-1">
                                  <AlertCircle size={10} />
                                  Missed
                                </span>
                              )}
                              
                              {isRescheduled && (
                                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border bg-amber-50 text-amber-600 border-amber-200/50 flex items-center gap-1">
                                  🔄 Rescheduled
                                </span>
                              )}
                            </div>

                            {/* Session text */}
                            <div>
                              <h4 className={`text-base font-bold text-slate-800 ${isChecked ? "line-through text-slate-400" : ""}`}>
                                {session.subject} {session.type !== "break" ? `— ${session.topic}` : ""}
                              </h4>
                              <p className={`text-xs text-slate-500 font-medium ${isChecked ? "text-slate-400" : ""}`}>
                                {session.description}
                              </p>

                              {/* AI Focus mode helper action banner */}
                              {aiFocusMode && session.type !== "break" && !isChecked && (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFocusAndLaunchTutor(session);
                                  }}
                                  className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100 rounded-xl text-[11px] font-extrabold transition-all shadow-sm active:scale-95 cursor-pointer"
                                  id={`focus-trigger-${sessionKey}`}
                                >
                                  <Sparkles size={11} className="animate-pulse text-indigo-650 text-indigo-600" />
                                  <span>Sync AI Tutor to {session.subject}</span>
                                  <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                                </div>
                              )}

                              {/* Missed footer actions & details */}
                              {isMissed && (
                                <div className="mt-3 pt-2.5 border-t border-dashed border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-1 text-[11px] text-rose-500 font-semibold">
                                    <AlertCircle size={13} />
                                    <span>Not completed on schedule</span>
                                  </div>
                                  {!isRescheduled ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRescheduleSession(timetableResult.timetable[selectedDayIndex].day, sIdx);
                                      }}
                                      className="flex items-center gap-1 px-3 py-1 bg-primary text-white hover:bg-primary-dark rounded-lg text-[10px] font-extrabold transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
                                    >
                                      <CalendarRange size={11} />
                                      <span>Reschedule to Next Day</span>
                                    </button>
                                  ) : (
                                    <span className="text-[11px] font-bold text-amber-605 text-amber-600 flex items-center gap-1">
                                      🔄 Transferred to {timetableResult.timetable[(selectedDayIndex + 1) % timetableResult.timetable.length].day}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Completing & Missed check mark controllers */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Complete toggle */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSession(timetableResult.timetable[selectedDayIndex].day, sIdx, session.type);
                              }}
                              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isChecked 
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600 scale-105 shadow-md shadow-emerald-500/15" 
                                  : "bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border border-slate-200"
                              }`}
                              title={isChecked ? "Mark as Incomplete" : "Mark as Completed"}
                              id={`btn-complete-${sessionKey}`}
                            >
                              {activeBursts[sessionKey] && (
                                <ParticleBurst onComplete={() => setActiveBursts(prev => ({ ...prev, [sessionKey]: false }))} />
                              )}
                              {isChecked ? (
                                <motion.svg
                                  className="w-[18px] h-[18px] text-white"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <motion.path
                                    d="M5 13l4 4L19 7"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                  />
                                </motion.svg>
                              ) : (
                                <CheckCircle2 size={18} />
                              )}
                            </button>

                            {/* Missed toggle */}
                            {!isChecked && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleMissed(timetableResult.timetable[selectedDayIndex].day, sIdx);
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                  isMissed
                                    ? "bg-rose-500 text-white hover:bg-rose-600 scale-105 shadow-md shadow-rose-500/15"
                                    : "bg-slate-55 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-650 hover:text-rose-600 border border-slate-200"
                                }`}
                                title={isMissed ? "Remove Missed Status" : "Mark as Missed"}
                                id={`btn-missed-${sessionKey}`}
                              >
                                <XCircle size={18} />
                              </button>
                            )}

                            {/* Delete/Remove session */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(timetableResult.timetable[selectedDayIndex].day, sIdx);
                              }}
                              className="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer bg-slate-50 hover:bg-rose-55 hover:bg-rose-50 text-slate-400 hover:text-rose-650 hover:text-rose-600 border border-slate-200"
                              title="Delete Session"
                              id={`btn-delete-${sessionKey}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right column: Weekly Tracker summaries & AI customized tips */}
            <div className="space-y-6">
              {/* Profile / Weekly stats tracker card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  Weekly Progress Tracker
                </h3>

                <div className="space-y-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-800 font-mono">{stats.completed}/{stats.total}</span>
                      <span className="text-xs text-slate-400 block font-medium">Total weekly sessions done</span>
                    </div>
                    <span className="text-sm font-black text-primary font-mono">{stats.percentage}%</span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-primary h-full rounded-full"
                    />
                  </div>

                  {stats.percentage === 100 ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                      <div className="bg-emerald-500 text-white p-2 rounded-xl">
                        <Award size={18} />
                      </div>
                      <span className="text-xs text-emerald-800 font-bold leading-snug">
                        Stunning work! Complete revision completed this week. You earned high rank.
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 leading-normal font-medium">
                      Check off sessions as you study. Consistent study habits double the chances of securing visual mastery grade!
                    </p>
                  )}

                  {/* Subject Hour analytics bar chart */}
                  <div className="pt-5 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Completed vs Goal Hours</span>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">HOURS</span>
                    </div>
                    
                    {getChartData().length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-2xl">No study hours planned in this period.</p>
                    ) : (
                      <div className="w-full h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getChartData()}
                            margin={{ top: 5, right: 5, left: -22, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis 
                              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                              axisLine={false}
                              tickLine={false}
                              unit="h"
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1e293b', 
                                border: 'none', 
                                borderRadius: '12px',
                                color: '#fff',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '11px',
                                padding: '8px 12px'
                              }}
                              itemStyle={{ color: '#fff', padding: '2px 0' }}
                              labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Bar dataKey="Completed" fill="#4f46e5" radius={[3, 3, 0, 0]} barSize={12} name="Completed" />
                            <Bar dataKey="Goal" fill="#e2e8f0" radius={[3, 3, 0, 0]} barSize={12} name="Planned Goal" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Missed Sessions Rescheduling Section */}
              {(() => {
                const unresolved = getUnresolvedMissedSessions();
                return (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <AlertCircle size={18} className="text-rose-500" />
                        <span>Missed Study Sessions</span>
                      </h3>
                      {unresolved.length > 0 && (
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200/55 rounded-full">
                          {unresolved.length} pending
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Schedules change. Directly reschedule any sessions that were missed or not completed to the next active day.
                    </p>

                    {unresolved.length === 0 ? (
                      <div className="p-4 bg-emerald-50/40 border border-dashed border-emerald-100 rounded-2xl text-center space-y-1">
                        <span className="text-xs font-bold text-emerald-800 block">No missed sessions! 🎉</span>
                        <span className="text-[10px] text-slate-400 block font-medium">You are 100% on track with your study routine.</span>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {unresolved.map((item, idx) => (
                          <div 
                            key={`${item.day}__${item.sessionIndex}`} 
                            className="p-3 bg-rose-50/10 border border-rose-100/70 rounded-2xl hover:border-rose-200 transition-all space-y-2 flex flex-col justify-between"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase font-mono">
                                  {item.session.type}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  Scheduled: {item.day} ({item.session.time})
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                                {item.session.subject} {item.session.type !== "break" ? `— ${item.session.topic}` : ""}
                              </h4>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRescheduleSession(item.day, item.sessionIndex)}
                              className="w-full flex items-center justify-center gap-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                              id={`btn-sidebar-resched-${item.day}-${item.sessionIndex}`}
                            >
                              <CalendarRange size={12} />
                              <span>Reschedule to Next Day</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Study Tips Card */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg shadow-slate-900/10">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Brain size={140} />
                </div>
                
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2 relative z-10">
                  <Brain className="text-primary-light text-primary" size={20} />
                  AI Study Insights
                </h3>

                <div className="space-y-4 relative z-10">
                  {timetableResult.studyTips && timetableResult.studyTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-primary/25 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-mono text-primary font-black">{idx + 1}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 leading-normal">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Manually Add Session Modal */}
      <AnimatePresence>
        {isManualModalOpen && timetableResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" id="manual-session-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden relative"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="text-indigo-600" size={20} />
                    Manually Add Session
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Inject custom study blocks or recovery breaks into your roadmap.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                  id="btn-close-manual-modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleAddManualSession} className="p-6 space-y-4">
                {/* Target Day */}
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                    Target Day
                  </label>
                  <select
                    value={manualTargetDay}
                    onChange={(e) => setManualTargetDay(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    id="select-manual-day"
                  >
                    {timetableResult.timetable.map((dayPlan) => (
                      <option key={dayPlan.day} value={dayPlan.day}>
                        {dayPlan.day} ({dayPlan.date})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Session Type */}
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                    Session block type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "study", label: "📚 Study" },
                      { id: "revision", label: "⏱️ Revision" },
                      { id: "quiz", label: "✍️ Quiz" },
                      { id: "break", label: "☕ Break" }
                    ].map((typeOption) => (
                      <button
                        key={typeOption.id}
                        type="button"
                        onClick={() => {
                          setManualType(typeOption.id as any);
                          if (typeOption.id === "break") {
                            setManualSubject("Self-care Recovery");
                            setManualTopic("Rest Period");
                          } else if (manualSubject === "Self-care Recovery" || manualSubject === "") {
                            // Reset if they switch back from break
                            setManualSubject("");
                            setManualTopic("");
                          }
                        }}
                        className={`py-2 px-1 rounded-xl text-center text-xs font-extrabold border transition-all cursor-pointer ${
                          manualType === typeOption.id
                            ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                        id={`btn-type-${typeOption.id}`}
                      >
                        {typeOption.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject & Topic (hidden/pre-filled if break) */}
                {manualType !== "break" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                        Subject Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mathematics"
                        value={manualSubject}
                        onChange={(e) => setManualSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        id="input-manual-subject"
                      />
                      {/* Configured subjects quick badges helper */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {subjects.map((subj) => (
                          <button
                            key={subj.name}
                            type="button"
                            onClick={() => setManualSubject(subj.name)}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer"
                          >
                            {subj.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                        Focus / Topic
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Calculus Practice"
                        value={manualTopic}
                        onChange={(e) => setManualTopic(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        id="input-manual-topic"
                      />
                    </div>
                  </div>
                )}

                {/* Time & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                      id="input-manual-time"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="480"
                      value={manualDuration}
                      onChange={(e) => setManualDuration(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      id="input-manual-duration"
                    />
                  </div>
                </div>

                {/* Optional Description */}
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                    Description / Goals
                  </label>
                  <textarea
                    placeholder={manualType === "break" ? "Self-healing recovery time" : "e.g. Tackle selected past exam papers on the topic."}
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    id="input-manual-description"
                  />
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer border border-slate-200/50"
                    id="btn-cancel-manual"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/10 active:scale-95 cursor-pointer"
                    id="btn-submit-manual-session"
                  >
                    Add to Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
