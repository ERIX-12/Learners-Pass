import { motion } from "motion/react";
import { 
  Users, 
  FileWarning, 
  BarChart3, 
  Settings,
  Search,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { cn } from "@/src/lib/utils";

export default function Admin() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 max-w-7xl mx-auto"
    >
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-slate-900 text-white p-2 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Management Console</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Admin Dashboard</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Total Students", value: "1,284", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Flagged Content", value: "0", icon: FileWarning, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Monthly API Usage", value: "$42.50", icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-black text-slate-900 text-xl">Recent User Activity</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter users..." 
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none w-64 text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Storage</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Last Active</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { name: "Alex Johnson", email: "alex@example.com", status: "Active", storage: "12.4 MB", date: "2 mins ago" },
                { name: "Sarah Smith", email: "sarah@edu.com", status: "Active", storage: "8.1 MB", date: "1 hour ago" },
                { name: "Mike Ross", email: "mike@ross.io", status: "Inactive", storage: "24.0 MB", date: "3 days ago" },
              ].map((user, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      user.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-500 font-medium">{user.storage}</td>
                  <td className="px-8 py-4 text-sm text-slate-500 font-medium">{user.date}</td>
                  <td className="px-8 py-4 text-sm font-bold text-primary cursor-pointer hover:underline">Manage</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] flex gap-6 items-start">
          <div className="bg-white p-4 rounded-2xl shadow-sm text-amber-500 shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 mb-2">System Notice</h4>
            <p className="text-amber-700/80 text-sm leading-relaxed">
              Gemini API token usage is at 65% of the daily limit. Consider optimizing large file processing or upgrading the quota.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex justify-between items-center overflow-hidden relative">
          <div className="relative z-10">
            <h4 className="font-bold text-xl mb-2">Global Settings</h4>
            <p className="text-slate-400 text-sm mb-6 max-w-[200px]">Configure AI behaviors, auth providers, and general app settings.</p>
            <button className="bg-white text-slate-900 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all">
              Launch Config
            </button>
          </div>
          <Settings size={120} className="text-white/5 absolute -right-4 -bottom-4 rotate-12" />
        </div>
      </div>
    </motion.div>
  );
}
