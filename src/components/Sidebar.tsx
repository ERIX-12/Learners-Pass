import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  LogOut, 
  GraduationCap,
  Trophy,
  Settings,
  Calendar
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: BookOpen, label: "My Notes", href: "/notes" },
  { icon: FileText, label: "Quizzes", href: "/quiz" },
  { icon: MessageSquare, label: "AI Tutor", href: "/tutor" },
  { icon: Calendar, label: "AI Timetable", href: "/timetable" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <GraduationCap size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 leading-tight">Learners Pass</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Revise Smart</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/10" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              )}
            >
              <item.icon size={20} className={cn("transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Trophy size={16} className="text-amber-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">Daily Streak: 5 days</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-[70%]" />
          </div>
        </div>

        <button 
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/auth";
          }}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
