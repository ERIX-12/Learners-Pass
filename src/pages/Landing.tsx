import { motion } from "motion/react";
import { 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  BrainCircuit, 
  Trophy, 
  Zap,
  Github,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
            <GraduationCap size={24} />
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-900">Learners Pass</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-slate-500 font-medium hover:text-primary">Features</a>
          <a href="#how-it-works" className="text-slate-500 font-medium hover:text-primary">How it Works</a>
          <Link to="/auth" className="text-slate-900 font-bold">Login</Link>
          <Link to="/auth" className="btn-primary">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 py-20 lg:py-32 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-bold mb-6">
            <Star size={16} fill="currentColor" />
            <span>The #1 AI Study Assistant</span>
          </div>
          <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[0.9] mb-8">
            Revise <span className="text-primary italic">Smart.</span><br />
            Pass <span className="gradient-text">Confidently.</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-lg leading-relaxed">
            Upload your notes in any format. Our AI extracts key concepts, generates flashcards, and quizzes you daily to ensure you never forget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/auth" className="btn-primary text-lg flex items-center justify-center gap-2 group px-8 py-4">
              Get Started for Free
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="btn-secondary text-lg px-8 py-4">
              Watch Demo
            </button>
          </div>
          
          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200" />
              ))}
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Join <span className="text-slate-900 font-bold">10,000+</span> students studying smarter.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <div className="relative z-10 bg-slate-900 rounded-[3rem] p-8 aspect-[4/5] shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                AI System Active
              </div>
            </div>
            
            <div className="flex-1 space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <BookOpen className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Note Analysis</h4>
                    <p className="text-white/40 text-[10px]">Processing content...</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-white/10 rounded-full w-full" />
                  <div className="h-2 bg-white/10 rounded-full w-[80%]" />
                  <div className="h-2 bg-primary/40 rounded-full w-[60%] animate-pulse" />
                </div>
              </div>

              <div className="bg-primary p-6 rounded-3xl shadow-xl shadow-primary/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <BrainCircuit className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Study Flashcards</h4>
                    <p className="text-white/60 text-[10px]">12 cards generated</p>
                  </div>
                </div>
                <div className="bg-white/10 p-4 rounded-xl">
                  <p className="text-white text-xs font-medium italic">"What is the power house of the cell?"</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl">
                  <Trophy className="text-amber-500 mb-2" size={24} />
                  <div className="text-amber-500 text-xs font-black uppercase tracking-wider">Level 12</div>
                </div>
                <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl">
                  <Zap className="text-emerald-500 mb-2" size={24} />
                  <div className="text-emerald-500 text-xs font-black uppercase tracking-wider">85% Score</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background Accents */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/30 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/20 rounded-full blur-[100px]" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Everything you need to succeed.</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
              Ditch the highlighter. Our machine learning engine does the heavy lifting so you can focus on mastering the material.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "Multi-Format Support", desc: "Upload PDFs, DOCX, PPT, or even scanned photos of your handwritten notes." },
              { icon: BrainCircuit, title: "AI-Powered Analysis", desc: "Instantly extract key concepts, formulas, and definitions from your materials." },
              { icon: Zap, title: "Smart Flashcards", desc: "Automatically generate active recall materials tailored to your specific notes." },
              { icon: Trophy, title: "Daily Assessments", desc: "Get personalized daily quizzes based on what you studied that day." },
              { icon: GraduationCap, title: "AI Tutor Chat", desc: "Stuck on a concept? Talk to our AI tutor that understands your specific notes." },
              { icon: Star, title: "Performance Tracking", desc: "See your progress, identify weak areas, and get smart recommendations." },
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 bg-slate-50 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
