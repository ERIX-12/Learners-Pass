import { motion } from "motion/react";
import { 
  ArrowRight, 
  PlusCircle, 
  Target, 
  Zap, 
  BrainCircuit, 
  TrendingUp,
  Clock,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { day: 'Mon', minutes: 45 },
  { day: 'Tue', minutes: 52 },
  { day: 'Wed', minutes: 38 },
  { day: 'Thu', minutes: 65 },
  { day: 'Fri', minutes: 48 },
  { day: 'Sat', minutes: 120 },
  { day: 'Sun', minutes: 90 },
];

const stats = [
  { label: "Subjects Revised", value: "4", icon: Target, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "Quiz Avg", value: "85%", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
  { label: "Study Time", value: "12.5h", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50" },
  { label: "AI Tips", value: "12", icon: BrainCircuit, color: "text-purple-500", bg: "bg-purple-50" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Dashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 max-w-7xl mx-auto"
    >
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, Alex! 👋</h2>
          <p className="text-slate-500 mt-1">You've revised 3 topics so far today. Keep it up!</p>
        </div>
        <Link to="/notes" className="btn-primary flex items-center gap-2">
          <PlusCircle size={20} />
          New Note
        </Link>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {stats.map((stat) => (
          <motion.div 
            variants={item}
            key={stat.label} 
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Study Progress</h3>
              <p className="text-sm text-slate-500">Weekly revision minutes</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-50 px-3 py-1 rounded-full text-xs">
              <TrendingUp size={14} />
              +12% vs last week
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="minutes" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMin)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Recommended for today</h3>
            <div className="space-y-4">
              {[
                { title: "Organic Chemistry", type: "Incomplete Quiz", color: "blue" },
                { title: "WWII History", type: "Note Summary Ready", color: "purple" },
                { title: "Calculus III", type: "Low Quiz Score", color: "amber" },
              ].map((item, idx) => (
                <div key={idx} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-primary/5 transition-colors cursor-pointer">
                  <div>
                    <h4 className="font-semibold text-slate-800 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{item.type}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-primary" />
                </div>
              ))}
            </div>
            <button className="w-full mt-6 text-sm font-bold text-primary hover:underline flex items-center justify-center gap-1">
              View All Tasks <ArrowRight size={14} />
            </button>
          </div>

          <div className="bg-primary rounded-3xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1">Pass Confidently</h3>
              <p className="text-white/80 text-sm mb-4">Upgrade to Premium for unlimited AI tutoring and extra practice exams.</p>
              <button className="bg-white text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-lg">
                Going Premium
              </button>
            </div>
            <Zap className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
