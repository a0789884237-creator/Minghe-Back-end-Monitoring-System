import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useSecurityAlerts } from "@/hooks/admin/useSecurityAlerts";
import { cn } from "@/lib/utils";

export default function AdminSecurity() {
  const { data: alerts, isLoading } = useSecurityAlerts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <RefreshCcw className="w-8 h-8 text-primary/40" />
        </motion.div>
      </div>
    );
  }

  const getRiskLevelStyles = (risk_level: string) => {
    switch (risk_level?.toLowerCase()) {
      case 'critical':
        return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30", icon: AlertCircle, dot: "bg-red-500" };
      case 'high':
        return { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30", icon: AlertTriangle, dot: "bg-orange-500" };
      case 'medium':
        return { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/30", icon: AlertTriangle, dot: "bg-yellow-500" };
      default:
        return { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30", icon: ShieldCheck, dot: "bg-blue-500" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            安全审计中心
          </h3>
          <p className="text-muted-foreground text-sm mt-1">实时拦截非法内容、极端言论与危机干预预警</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="搜用户、搜风险词..." 
                    className="pl-10 pr-4 py-2 rounded-xl bg-card/10 border border-border/40 text-sm focus:outline-none focus:border-red-500/40 w-64"
                />
            </div>
            <button className="p-2.5 rounded-xl border border-border/40 bg-card hover:bg-border/20 transition-colors">
                <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
        <div className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 ring-1 ring-red-500/20 flex items-center gap-2">
           <AlertCircle className="w-4 h-4" />
           紧急预警: {alerts?.filter(a => a.risk_level === 'critical').length || 0}
        </div>
        <div className="px-4 py-2 rounded-xl bg-white/5 text-muted-foreground ring-1 ring-border/20 flex items-center gap-2">
           <RefreshCcw className="w-3.5 h-3.5 animate-spin-slow" />
           实时监测中 · 每15秒自同步
        </div>
      </div>

      {/* Main Alerts Feed */}
      <div className="grid grid-cols-1 gap-4">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert, idx) => {
            const styles = getRiskLevelStyles(alert.risk_level);
            const Icon = styles.icon;
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "p-5 rounded-2xl border bg-card/10 transition-all group relative overflow-hidden",
                  alert.status === 'handled' ? "opacity-50 grayscale select-none" : "hover:bg-card/30",
                  styles.border
                )}
              >
                 <div className="flex items-start justify-between">
                    <div className="flex items-start gap-5">
                       <div className={cn("mt-1 w-10 h-10 rounded-xl flex items-center justify-center", styles.bg, styles.text)}>
                          <Icon className="w-5 h-5" />
                       </div>
                       <div>
                          <div className="flex items-center gap-3">
                             <span className="font-bold text-lg">{alert.display_name}</span>
                             <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest", styles.bg, styles.text)}>
                                {alert.risk_level} · {alert.risk_score}
                             </span>
                          </div>
                          <p className="mt-2 text-sm text-foreground/90 font-medium leading-relaxed max-w-3xl line-clamp-2 italic border-l-2 border-border pl-3">
                             “ {alert.content} ”
                          </p>
                          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground font-bold font-mono">
                             <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(alert.created_at).toLocaleString()}</span>
                             <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> IP: 198.18.xxx.xx</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-2">
                       {alert.status === 'pending' ? (
                          <>
                             <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95">
                                <AlertTriangle className="w-3.5 h-3.5" /> 干预
                             </button>
                             <button className="p-2 rounded-xl bg-card border border-border/40 hover:bg-emerald-500/20 hover:text-emerald-500 transition-all">
                                <CheckCircle2 className="w-4 h-4" />
                             </button>
                          </>
                       ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                             <CheckCircle2 className="w-3.5 h-3.5" /> 已处理
                          </div>
                       )}
                    </div>
                 </div>
                 
                 {/* Danger Pulse for Critical */}
                 {alert.risk_level === 'critical' && (
                    <div className="absolute top-0 right-0 p-2">
                       <span className="relative flex h-3 w-3">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                       </span>
                    </div>
                 )}
              </motion.div>
            );
          })
        ) : (
          <div className="p-20 text-center bg-card/5 rounded-[40px] border border-dashed border-border/40 flex flex-col items-center">
             <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
             </div>
             <h5 className="font-bold text-lg mb-1">环境绝对安全</h5>
             <p className="text-muted-foreground text-sm">目前没有检索到任何高危风险信号，所有对话均在预警线以下。</p>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="p-6 rounded-3xl bg-secondary/30 border border-border/40 text-xs text-muted-foreground leading-relaxed flex items-center items-start gap-4">
         <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
         </div>
         <p>
           安全审计中心采用 **CBM-GPT-Security** 离线模型进行本地内容鉴别，所有数据通过 Supabase 加密同步。
           管理员任何处理标记（如“干预”）都会同步更新至学生对应的心理危机干预档案中。
         </p>
      </div>
    </div>
  );
}
