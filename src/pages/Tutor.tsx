import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  BookOpen, 
  Lightbulb,
  ChevronRight,
  MessageSquareOff,
  Brain,
  X,
  Mic
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useSearchParams } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi Alex! I'm your AI Study Tutor. Ask me anything about your uploaded notes or just start with a topic you'd like to understand better.",
  }
];

export default function Tutor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [focusSubject, setFocusSubject] = useState<string | null>(null);
  const [focusTopic, setFocusTopic] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Speech Recognition / Voice Dictation States
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  // Initialize browser SpeechRecognition
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognitionAPI();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsRecording(true);
      setSpeechError(null);
    };

    rec.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript;
      if (transcript) {
        setInput(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
      }
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setSpeechError("Microphone permission denied or blocked by iframe constraint. Please open application in a new tab if issues persist.");
      } else if (event.error === "no-speech") {
        // quiet end
      } else {
        setSpeechError(`Voice Error: ${event.error}`);
      }
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    setRecognition(rec);

    return () => {
      if (rec) {
        try {
          rec.abort();
        } catch (e) {}
      }
    };
  }, []);

  const handleToggleVoice = () => {
    if (!isSpeechSupported) {
      setSpeechError("Speech Recognition is not supported by this browser. Try Google Chrome or Safari.");
      setTimeout(() => setSpeechError(null), 6000);
      return;
    }
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        setSpeechError(null);
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // Synchronize focus mode parameters from URL or localStorage
  useEffect(() => {
    const paramSubject = searchParams.get("subject");
    const paramTopic = searchParams.get("topic");

    if (paramSubject) {
      setFocusSubject(paramSubject);
      setFocusTopic(paramTopic || "");
      localStorage.setItem("learners_pass_ai_focus_subject", paramSubject);
      localStorage.setItem("learners_pass_ai_focus_topic", paramTopic || "");
      localStorage.setItem("learners_pass_ai_focus_active", "true");
    } else {
      const isFocusActive = localStorage.getItem("learners_pass_ai_focus_active") === "true";
      if (isFocusActive) {
        const localSubject = localStorage.getItem("learners_pass_ai_focus_subject");
        const localTopic = localStorage.getItem("learners_pass_ai_focus_topic");
        if (localSubject) {
          setFocusSubject(localSubject);
          setFocusTopic(localTopic || "");
        }
      }
    }
  }, [searchParams]);

  // Dynamically tailor the AI Tutor initial messaging
  useEffect(() => {
    if (focusSubject) {
      const topicLabel = focusTopic ? `specifically the topic of "${focusTopic}"` : "this subject";
      setMessages([
        {
          id: "focus-init",
          role: "assistant",
          content: `Hello Alex! 🎯 AI Focus Mode is active. I have loaded and synchronized your study schedule context for **${focusSubject}** (${focusTopic || "General overview"}). Ask me any questions, request a quiz, or ask for a step-by-step breakdown of ${topicLabel}!`,
        }
      ]);
    } else {
      setMessages(initialMessages);
    }
  }, [focusSubject, focusTopic]);

  const handleClearFocus = () => {
    setFocusSubject(null);
    setFocusTopic(null);
    localStorage.removeItem("learners_pass_ai_focus_subject");
    localStorage.removeItem("learners_pass_ai_focus_topic");
    localStorage.setItem("learners_pass_ai_focus_active", "false");
    setSearchParams({});
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `That's a great question about ${input.split(' ').pop()}! Based on your ${focusSubject || "Biology"} notes, this is a key part of ${focusTopic || "cellular respiration"}. Would you like a step-by-step breakdown or a quick summary?`,
        source: focusSubject ? `${focusSubject} Guide (Page 2)` : "Cell Biology Notes (Page 3)"
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getRelatedConcepts = () => {
    if (!focusSubject) {
      return ["ATP Synthesis", "Krebs Cycle", "Electron Transport"];
    }

    const sub = focusSubject.toLowerCase();
    if (sub.includes("math")) {
      return ["Algebraic Proofs", "Calculus Integration", "Geometric Theorems", "Trigonometric Formulations"];
    } else if (sub.includes("biol")) {
      return ["Cellular Respiration", "Mitosis vs Meiosis", "DNA Transcription", "Homeostatic Pathways"];
    } else if (sub.includes("literature") || sub.includes("english")) {
      return ["Shakespearean Meter", "Connotative Imagery", "Modernist Narration", "Thematic Allegory"];
    } else if (sub.includes("chem")) {
      return ["Covalent Bonding", "Polymers Structure", "Le Chatelier's Principle", "Stoichiometry"];
    } else if (sub.includes("phys")) {
      return ["Kinematic Equations", "Special Relativity", "Quantum Superposition", "Electromagnetic Fields"];
    } else {
      return [`${focusSubject} Overview`, `${focusTopic || focusSubject} Basics`, `Key definitions in ${focusSubject}`];
    }
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto px-8 py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <Bot size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">AI Tutor</h2>
            <p className="text-slate-500 text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Online & Ready to help
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setMessages([])} 
            className="bg-white border border-slate-205 border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer text-slate-600"
          >
            Clear Chat
          </button>
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Export Transcript
          </button>
        </div>
      </header>

      {/* Focus Mode Banner Alert */}
      {focusSubject && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/10 flex items-center justify-center shrink-0">
              <Brain size={18} className="animate-pulse" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest">AI Focus Mode Active</p>
              <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                Tutor curriculum aligned exclusively to <span className="font-black text-indigo-900">{focusSubject}</span> {focusTopic ? `(${focusTopic})` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearFocus}
            className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-indigo-200/50 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 cursor-pointer shadow-sm active:scale-95 transition-all text-center shrink-0"
            id="btn-clear-tutor-focus"
          >
            <X size={13} />
            <span>Clear Focus</span>
          </button>
        </motion.div>
      )}

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-slate-900">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <MessageSquareOff size={48} />
                  <p>No messages yet. Send a message to start learning!</p>
               </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    "flex gap-4 max-w-[80%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    msg.role === "assistant" ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {msg.role === "assistant" ? <Sparkles size={20} /> : <User size={20} />}
                  </div>
                  <div className="space-y-2">
                    <div className={cn(
                       "p-4 rounded-2xl relative",
                       msg.role === "assistant" 
                         ? "bg-slate-50 text-slate-800 rounded-tl-none" 
                         : "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20"
                    )}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.source && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <BookOpen size={10} /> {msg.source}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
            {isTyping && (
              <div className="flex gap-4 mr-auto">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 pt-2 bg-slate-50/50 border-t border-slate-100 space-y-3">
            {/* Speech Recognition Feedback Banner */}
            <AnimatePresence>
              {(isRecording || speechError) && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-sm transition-colors",
                    speechError 
                      ? "bg-rose-50 border border-rose-100 text-rose-700" 
                      : "bg-indigo-50 border border-indigo-100 text-indigo-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {speechError ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping shrink-0" />
                    )}
                    <span className="line-clamp-1">
                      {speechError 
                        ? speechError 
                        : "Listening... Speak now, your questions will start dictating."}
                    </span>
                  </div>
                  {speechError && (
                    <button 
                      onClick={() => setSpeechError(null)}
                      className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isRecording ? "Transcribing your voice..." : "Ask your tutor anything..."}
                className={cn(
                  "w-full bg-white border rounded-2xl pl-6 pr-32 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm text-slate-900 transition-all",
                  isRecording 
                    ? "border-indigo-400 ring-2 ring-indigo-500/10 placeholder-indigo-450" 
                    : "border-slate-200"
                )}
                id="tutor-chat-input"
              />
              <div className="absolute right-2 top-2 flex items-center gap-2">
                {/* Voice Dictation (Speech Recognition) Trigger */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={cn(
                    "p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95",
                    isRecording
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/50"
                  )}
                  title={isRecording ? "Stop voice input" : "Dictate with Voice"}
                  id="btn-voice-dictation"
                >
                  <Mic size={20} className={cn(isRecording && "animate-pulse")} />
                </button>

                {/* Send Message Trigger */}
                <button 
                  onClick={handleSend}
                  className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center"
                  id="btn-send-message"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Context */}
        <div className="w-72 space-y-6 hidden xl:block overflow-y-auto shrink-0">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Lightbulb size={20} className="text-amber-500" />
              Related Concepts
            </h3>
            <div className="space-y-2">
              {getRelatedConcepts().map(concept => (
                <button 
                  key={concept} 
                  onClick={() => setInput(`Can you explain more about "${concept}"?`)}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 text-slate-600 text-sm font-medium border border-transparent hover:border-slate-104 hover:border-slate-100 flex items-center justify-between group cursor-pointer transition-colors"
                >
                  <span className="truncate pr-2">{concept}</span>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold mb-1">Weekly Quiz</h4>
              <p className="text-emerald-100 text-xs mb-4">You have 2 pending quizzes based on your recent activity.</p>
              <button className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg">
                Start Now
              </button>
            </div>
            <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
