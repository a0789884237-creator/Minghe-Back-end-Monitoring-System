import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TermsAgreementModalProps {
  userId: string;
  onAgreed: () => void;
}

export function TermsAgreementModal({ userId, onAgreed }: TermsAgreementModalProps) {
  const [loading, setLoading] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleAgree = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ agreed_to_terms: true } as any)
        .eq("user_id", userId);

      if (error) throw error;
      
      toast.success("协议签署成功，欢迎使用管理系统");
      onAgreed();
    } catch (error: any) {
      toast.error("签署失败：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isBottom = Math.abs(target.scrollHeight - target.clientHeight - target.scrollTop) < 10;
    if (isBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a]/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#141414] border border-white/10 rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-primary/20 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-white">明禾心灵花园保密协议</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            为了确保系统内学生隐私安全，根据相关法律法规及职业准则，请在进入后台前仔细阅读并签署此保密协议。
          </p>
        </div>

        {/* Content */}
        <div 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 space-y-6 text-muted-foreground leading-relaxed text-sm custom-scrollbar"
        >
          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
            <p className="text-white font-bold mb-4 italic">请仔细阅读以下条款，本管理系统的使用及相关数据处理需在本协议的条款下进行：</p>
            
            <section className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                一、 总则
              </h3>
              <ul className="space-y-3 pl-4 list-decimal">
                <li>系统使用者需具备相应的执业资质或学校/机构授权的管理权限。</li>
                <li>本系统涉及的心理测评时长及内容均受专业指导，具体数据处理应遵循职业道德。</li>
                <li>系统访问权限经由组织分配，未经许可不得将账号借予他人或在公共终端保存登录状态。</li>
                <li>使用者及来访者在咨询管理过程中，均有权根据实际情况提出终止，并由双方协商后续数据存储策略。</li>
                <li>系统记录的紧急联系人信息必须真实有效，以便在危机干预时能第一时间联系到责任人。</li>
                <li>本协议点击“同意并进入”即视为电子签名并生效，具有法律效力。</li>
              </ul>
            </section>

            <section className="space-y-4 mt-8">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                二、 保密原则
              </h3>
              <ol className="space-y-3 pl-4 list-decimal" start={7}>
                <li>管理员/专家有责任向学生/求助者说明数字系统的数据保密原则及限度。</li>
                <li>系统内的有关信息，包括测评报告、AI 分析结果、危机预警日志等，均属于高度敏感的专业信息，必须在加密状态下保存。</li>
                <li>系统产生的服务记录、评估结论等材料，均应通过本系统设定的权限进行管控，相关人员负有终身保密义务。</li>
                <li>上述保密资料，除相关的学生本人及获授权的管理专家外，任何人（包括未获授权的其他教师）不得越权查阅。</li>
                <li>涉及到的多媒体材料（如录音录像等）仅在征得学生书面同意且系统具备存储安全条件下方可采集，学生有权随时要求删除。</li>
              </ol>
            </section>

            <section className="space-y-4 mt-8">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                三、 保密例外
              </h3>
              <ol className="space-y-3 pl-4 list-decimal" start={12}>
                <li>学生明确同意将特定保密信息披露给指定的第三方。</li>
                <li><span className="text-red-400 font-bold">【生命安全原则】</span> 发现学生有自伤、自残或伤害他人的风险时，管理人员有权立即触发预警并通知有关部门或其家属。</li>
                <li>在配合卫生、司法、公安机关等国家部门依法调查时，必须如实提供相关必要数据报告。</li>
                <li><span className="text-white font-bold">职业规范不能对抗法律规定。</span> 若发现学生涉及重大犯罪（如谋杀、虐待等）或属于受侵害对象，必须依法向公安或检察机关报告。</li>
                <li>案例用于学术分享或系统优化训练时，必须进行严格的脱敏处理，隐去姓名、住址、电话等可识别个人信息的字段。</li>
                <li>如发现具有重大危害性的传染性疾病等危及公共生命安全的情况，亦属于保密例外。</li>
              </ol>
            </section>
          </div>

          <p className="text-center text-xs py-4 opacity-50">
            本人已明确知晓以上条款，并自愿遵从本协议执行，承诺在系统使用过程中严格遵守职业道德与保密义务。
          </p>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-[#0d0d0d] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {hasScrolledToBottom ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                已阅读全文
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                请向下滑动阅读全文
              </span>
            )}
          </div>
          <button 
            disabled={loading || !hasScrolledToBottom}
            onClick={handleAgree}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-xl shadow-primary/20"
          >
            {loading ? "确认为您签署..." : "同意并进入后台"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
