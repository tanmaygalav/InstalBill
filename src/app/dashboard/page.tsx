"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  Receipt, 
  Plus, 
  ArrowUpRight,
  Sparkles,
  Search,
  MoreHorizontal,
  Loader2,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // --- REAL DATA FETCHING, AUTH & LIVE SYNC ---
  useEffect(() => {
    let channel: any;

    const fetchInvoices = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          window.location.href = "/login";
          return;
        }

        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setInvoices(data);

        // LIVE SYNC LISTENER
        channel = supabase
          .channel('dashboard-sync')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'invoices', filter: `user_id=eq.${user.id}` },
            (payload) => {
              setInvoices((prev) => prev.map((inv) => (inv.id === payload.new.id ? payload.new : inv)));
            }
          )
          .subscribe();

      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // --- MANUAL FREELANCER VERIFICATION ENGINE ---
  const handleVerifyStatus = async (invoiceId: string, confirmPaid: boolean) => {
    const finalStatus = confirmPaid ? 'verified' : 'pending';
    
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: finalStatus })
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(prevInvoices => 
        prevInvoices.map(inv => 
          inv.id === invoiceId ? { ...inv, status: finalStatus } : inv
        )
      );

      setOpenMenuId(null);

      if (confirmPaid) {
        toast.success("Invoice settled and marked as verified!");
      } else {
        toast.error("Claim rejected. Invoice reset to unpaid pending status.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update transaction status.");
    }
  };

  // --- COPY LINK HELPER ---
  const handleCopyLink = (invoiceId: string) => {
    const url = `${window.location.origin}/invoice/${invoiceId}`;
    navigator.clipboard.writeText(url);
    toast.success("Payment link copied to clipboard!");
    setOpenMenuId(null);
  };

  // --- DYNAMIC FINANCIAL METRICS ---
  const totalCollected = invoices
    .filter(inv => inv.status === 'paid' || inv.status === 'verified')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'verification_pending')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const pendingCount = invoices.filter(inv => inv.status === 'pending' || inv.status === 'verification_pending').length;
  const totalInvoices = invoices.length;

  // --- FRAMER MOTION CONFIG ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const buttonVariants: Variants = {
    hover: { scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 20 } },
    tap: { scale: 0.98, transition: { type: "spring", stiffness: 400, damping: 20 } },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FEF9F2] flex flex-col items-center justify-center text-[#111827]">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="font-medium text-slate-500">Syncing secure billing data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-[#FEF9F2] text-[#111827]">
      
      {/* TOP NAVIGATION BAR */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <CheckCircle className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111827]">InstaBill</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Mode
            </div>
          </div>
        </div>
      </nav>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 md:px-8 pt-10"
      >
        {/* HEADER AREA */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-wider">Overview</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#111827]">
              Welcome back
            </h1>
          </div>
          
          <Link href="/">
            <motion.button 
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 w-full md:w-auto justify-center"
            >
              <Plus size={18} /> Create New Link
            </motion.button>
          </Link>
        </motion.div>

        {/* FINANCIAL DATA SUMMARY CARDS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-lg shadow-black/5 border border-stone-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp size={100} className="text-indigo-600" />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <TrendingUp size={20} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Total Collected</p>
            <h2 className="text-4xl font-extrabold text-[#111827] tracking-tight relative z-10">
              ₹{totalCollected.toLocaleString('en-IN')}
            </h2>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-lg shadow-black/5 border border-stone-200">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <Clock size={20} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Awaiting Payment</p>
            <h2 className="text-4xl font-extrabold text-[#111827] tracking-tight">
              ₹{pendingAmount.toLocaleString('en-IN')}
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Across {pendingCount} pending invoice(s)</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-lg shadow-black/5 border border-stone-200">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-stone-100 text-stone-600 rounded-xl border border-stone-200">
                <Receipt size={20} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Invoices Generated</p>
            <h2 className="text-4xl font-extrabold text-[#111827] tracking-tight">{totalInvoices}</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Lifetime total</p>
          </motion.div>
        </div>

        {/* BOTTOM CONTENT GRID */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main List: REAL INVOICES ACTIVITY ROW */}
          {/* FIXED: Removed overflow-hidden here */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl shadow-lg shadow-black/5 border border-stone-200 h-fit">
            
            {/* FIXED: Added rounded-t-3xl here */}
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 rounded-t-3xl">
              <h3 className="text-lg font-bold text-[#111827]">Recent Activity</h3>
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-white rounded-lg border border-stone-200 shadow-sm"><Search size={16} /></button>
              </div>
            </div>
            
            <div className="divide-y divide-stone-100">
              {invoices.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-slate-500 font-medium mb-4">No tracking elements configured yet.</p>
                  <Link href="/">
                    <button className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold py-2 px-4 rounded-lg transition-colors border border-indigo-100">
                      Create Your First Invoice
                    </button>
                  </Link>
                </div>
              ) : (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'paid' || inv.status === 'verified';
                  const isVerificationPending = inv.status === 'verification_pending';
                  
                  return (
                    <motion.div 
                      key={inv.id}
                      whileHover={{ backgroundColor: "rgba(245, 245, 244, 0.5)" }}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between transition-colors group gap-4 sm:gap-0"
                    >
                      <div className="flex items-start sm:items-center gap-4 w-full">
                        <div className={`p-3 rounded-2xl flex-shrink-0 mt-1 sm:mt-0 ${isPaid ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {isPaid ? <ArrowUpRight size={20} /> : <Clock size={20} />}
                        </div>
                        <div className="flex-grow">
                          <p className="font-bold text-[#111827] group-hover:text-indigo-600 transition-colors truncate max-w-[200px] md:max-w-[300px]">
                            {inv.client_email}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-400 font-medium">#{inv.id.split('-')[0]}</span>
                            <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                            <span className="text-xs text-slate-500 font-medium">{new Date(inv.created_at).toLocaleDateString()}</span>
                          </div>

                          {/* DYNAMIC ACTION VERIFICATION BLOCK FOR TRANSACTIONS */}
                          {isVerificationPending && (
                             <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100 w-full max-w-xl animate-in fade-in zoom-in-95 duration-200">
                               <div className="flex items-center gap-2 flex-shrink-0">
                                 <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                 <p className="text-[11.5px] font-bold text-amber-900 leading-none">
                                   Client declared payment complete.
                                 </p>
                               </div>
                               <div className="flex gap-2 sm:ml-auto">
                                 <button 
                                   onClick={() => handleVerifyStatus(inv.id, true)}
                                   className="text-[11px] uppercase tracking-wider bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm active:scale-[0.97]"
                                 >
                                   Approve
                                 </button>
                                 <button 
                                   onClick={() => handleVerifyStatus(inv.id, false)}
                                   className="text-[11px] uppercase tracking-wider bg-white hover:bg-red-50 hover:text-red-600 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-stone-200 transition-colors shadow-sm active:scale-[0.97]"
                                 >
                                   Reject
                                 </button>
                               </div>
                             </div>
                          )}
                        </div>
                      </div>
                      
                      {/* RIGHT SIDE: Metrics, Menu, & Manual Override */}
                      <div className="text-left sm:text-right flex flex-col sm:items-end w-full sm:w-auto pl-14 sm:pl-0 mt-3 sm:mt-0">
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full">
                          <div>
                            <p className="font-bold text-[#111827] text-lg tracking-tight">₹{Number(inv.total_amount).toLocaleString('en-IN')}</p>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-1 ${
                              isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {inv.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          {/* THREE DOTS DROPDOWN MENU */}
                          <div className="relative">
                            <button 
                              onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}
                              className="text-stone-300 hover:text-stone-600 hover:bg-stone-100 p-1 rounded-md transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal size={20} />
                            </button>

                            {/* Dropdown Card */}
                            {openMenuId === inv.id && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right text-left">
                                <button 
                                  onClick={() => handleCopyLink(inv.id)}
                                  className="w-full px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
                                >
                                  <Copy size={16} className="text-slate-400" /> Copy Public Link
                                </button>
                                {/* Fallback manual override hidden in the menu */}
                                {inv.status === 'pending' && (
                                  <button 
                                    onClick={() => handleVerifyStatus(inv.id, true)}
                                    className="w-full px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                                  >
                                    <Check size={16} className="text-indigo-400" /> Force Mark Paid
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
            
            {invoices.length > 0 && (
              /* FIXED: Added rounded-b-3xl here */
              <div className="p-4 bg-stone-50 border-t border-stone-100 text-center rounded-b-3xl">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End of recent activity</p>
              </div>
            )}
          </motion.div>

          {/* RIGHT SIDEBAR: UPSELL PANELS */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-[#111827] rounded-3xl p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
              
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Sparkles className="text-indigo-300" size={20} />
                <span className="text-sm font-bold tracking-wider uppercase text-indigo-200">InstaBill Pro</span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 relative z-10 leading-tight">Remove branding & track analytics.</h3>
              <p className="text-indigo-200 text-sm leading-relaxed mb-6 relative z-10">
                Upgrade to Pro for custom logos, tax summaries, and client history.
              </p>
              
              <button className="w-full bg-white text-indigo-900 hover:bg-stone-50 font-bold py-3 px-4 rounded-xl transition-colors relative z-10 shadow-lg flex justify-between items-center">
                Upgrade Now 
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md">₹199/mo</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-black/5 border border-stone-200">
              <h4 className="text-sm font-bold text-[#111827] mb-4">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-50 font-medium text-slate-600 text-sm transition-colors border border-transparent hover:border-stone-200 flex justify-between items-center group">
                  Update Payout UPI
                  <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-50 font-medium text-slate-600 text-sm transition-colors border border-transparent hover:border-stone-200 flex justify-between items-center group">
                  Download Tax Report
                  <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}