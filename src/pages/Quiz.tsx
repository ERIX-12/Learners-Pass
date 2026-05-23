import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ChevronRight,
  Timer,
  Award,
  BookOpen
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Question {
  id: string;
  question: string;
  type: "mcq" | "true_false" | "fill_blank";
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

const mockQuestions: Question[] = [
  {
    id: "1",
    question: "Which of the following is considered the 'powerhouse' of the cell?",
    type: "mcq",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"],
    correctAnswer: "Mitochondria",
    explanation: "Mitochondria are responsible for generating ATP through cellular respiration."
  },
  {
    id: "2",
    question: "The process of mitosis results in two genetically identical daughter cells.",
    type: "true_false",
    correctAnswer: "true",
    explanation: "Mitosis is specifically designed for growth and repair, producing exact clones."
  }
];

export default function Quiz() {
  const [step, setStep] = useState<"start" | "quiz" | "result">("start");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);

  const currentQuestion = mockQuestions[currentIdx];

  const handleAnswer = (ans: string) => {
    setUserAnswers({ ...userAnswers, [currentQuestion.id]: ans });
    if (ans === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }

    if (currentIdx < mockQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setStep("result");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 max-w-4xl mx-auto h-full flex flex-col"
    >
      <AnimatePresence mode="wait">
        {step === "start" && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
              <Zap size={48} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Daily Knowledge Ritual</h2>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                Test your understanding of the notes you revised today. 5 questions, 2 minutes, instant results.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {[
                { icon: BookOpen, label: "2 Topics", sub: "Biology, Math" },
                { icon: Timer, label: "2 Mins", sub: "Est. Time" },
                { icon: Award, label: "+50 Pts", sub: "Potential Score" },
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <item.icon className="mx-auto text-primary mb-3" />
                  <div className="font-bold text-slate-800">{item.label}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.sub}</div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setStep("quiz")}
              className="btn-primary px-12 py-5 text-lg flex items-center gap-3 !rounded-[2rem]"
            >
              Start Assessing
              <ArrowRight />
            </button>
          </motion.div>
        )}

        {step === "quiz" && (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex gap-1.5 flex-1 max-w-xs">
                {mockQuestions.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1.5 rounded-full flex-1 transition-all duration-300",
                      i < currentIdx ? "bg-primary" : i === currentIdx ? "bg-primary/30" : "bg-slate-100"
                    )} 
                  />
                ))}
              </div>
              <div className="text-slate-400 font-black text-sm ml-6">
                {currentIdx + 1} / {mockQuestions.length}
              </div>
            </div>

            <div className="flex-1 space-y-12">
              <div className="space-y-4">
                <span className="text-primary font-black uppercase tracking-widest text-[10px] bg-primary/5 px-2 py-1 rounded">
                  {currentQuestion.type === "mcq" ? "Multiple Choice" : "True or False"}
                </span>
                <h3 className="text-3xl font-bold text-slate-900 leading-tight">
                  {currentQuestion.question}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.type === "mcq" ? (
                  currentQuestion.options?.map((opt, i) => (
                    <button 
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className="group flex items-center justify-between p-6 bg-white border border-slate-200 rounded-3xl hover:border-primary hover:bg-primary/5 transition-all text-left active:scale-[0.99]"
                    >
                      <span className="font-bold text-slate-700 group-hover:text-primary">{opt}</span>
                      <div className="w-8 h-8 rounded-full border-2 border-slate-100 group-hover:border-primary flex items-center justify-center">
                        <ChevronRight className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" size={18} />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="flex gap-6">
                    {["true", "false"].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        className="flex-1 p-10 bg-white border border-slate-200 rounded-[2.5rem] hover:border-primary hover:bg-primary/5 transition-all text-center active:scale-[0.99]"
                      >
                        <span className="text-2xl font-black text-slate-700 capitalize">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center space-y-10"
          >
            <div className="relative">
              <div className="w-48 h-48 bg-primary rounded-full flex flex-col items-center justify-center text-white shadow-2xl shadow-primary/30 relative z-10">
                <h4 className="text-5xl font-black">{Math.round((score / mockQuestions.length) * 100)}%</h4>
                <p className="text-white/60 font-bold text-xs uppercase tracking-widest mt-1">Final Score</p>
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -m-4 border-2 border-dashed border-primary/20 rounded-full"
              />
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold text-slate-900">Excellent Work, Alex!</h3>
              <p className="text-slate-500 mt-2">You've mastered 85% of today's topics.</p>
              <div className="mt-8 flex gap-3 justify-center">
                <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> +25 Streak Pts
                </div>
                <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-xs font-bold flex items-center gap-1">
                  <Zap size={14} /> Level Up!
                </div>
              </div>
            </div>

            <div className="w-full bg-white rounded-3xl border border-slate-100 p-8">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BrainCircuit size={20} className="text-primary" />
                Performance Insights
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 italic">Weak Area:</span>
                  <span className="font-bold text-slate-900 bg-red-50 text-red-600 px-3 py-1 rounded-lg">Cell Cycle Phases</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 italic">Strong Area:</span>
                  <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg">Mitochondria Function</span>
                </div>
              </div>
              <button className="btn-primary w-full mt-8 py-4 rounded-2xl">
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
