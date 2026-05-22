"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image"; 
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, ShieldCheck, Check, Loader2, Download, Search, Smartphone } from "lucide-react";
import toast from "react-hot-toast";

export default function PublicInvoicePage({ params }: { params: Promise<{ id: string }> | { id: string }; }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const invoiceId = resolvedParams.id;

  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");

  useEffect(() => {
    let channel: any;

    const fetchInvoice = async () => {
      try {
        const { data, error } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
        if (error) throw error;
        setInvoice(data);

        channel = supabase
          .channel('public-invoice-sync')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'invoices', filter: `id=eq.${invoiceId}` },
            (payload) => {
              setInvoice(payload.new);
            }
          )
          .subscribe();
      } catch (err) {
        toast.error("Invoice not found.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [invoiceId]);

  const handleMarkAsPaid = async () => {
    if (utrNumber.trim().length < 12) {
      toast.error("Please enter a valid 12-digit UPI Reference Number.");
      return;
    }
    setIsUpdating(true);
    try {
      const { error } = await supabase.from("invoices").update({ 
          status: "verification_pending",
          utr_number: utrNumber.trim() 
        }).eq("id", invoiceId);
      if (error) throw error;
      setInvoice((prev: any) => ({ ...prev, status: "verification_pending", utr_number: utrNumber.trim() }));
    } catch (err) {
      toast.error("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = () => window.print();

  if (isLoading) return <div className="min-h-screen bg-[#FEF9F2] flex items-center justify-center text-[#111827]"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  if (!invoice) return <div className="min-h-screen bg-[#FEF9F2] flex items-center justify-center text-[#111827] font-medium">Invoice not found.</div>;

  const upiString = `upi://pay?pa=${invoice.upi_id}&am=${invoice.total_amount}&cu=INR`;
  const isPaid = invoice.status === "paid" || invoice.status === "verified";
  const isPendingVerification = invoice.status === "verification_pending";

  const subtotal = invoice.items?.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0) || 0;
  const actualTaxAmount = Number(invoice.total_amount) - subtotal;
  const hasTax = (invoice.tax_rate && invoice.tax_rate > 0) || actualTaxAmount > 0;
  const displayTaxRate = invoice.tax_rate || (subtotal > 0 ? Math.round((actualTaxAmount / subtotal) * 100) : 0);

  return (
    // Adjusted py-12 to py-6 on mobile for better top spacing
    <div className="min-h-screen bg-[#FEF9F2] text-[#111827] flex flex-col items-center py-6 sm:py-12 px-4 sm:px-8 print:bg-white print:py-0 print:px-0">
      
      {/* BRAND HEADER */}
      <div className="w-full max-w-5xl mb-6 sm:mb-8 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-700 print:hidden">
        <Image src="/logo.png" alt="InstaBill Logo" width={32} height={32} className="w-8 h-8 rounded-lg object-contain" />
        <span className="text-xl font-bold tracking-tighter text-[#111827]">InstaBill</span>
      </div>

      {/* Adjusted gap-10 to gap-6 on mobile */}
      <div className="max-w-5xl w-full grid lg:grid-cols-5 gap-6 lg:gap-10 items-start print:block">
        
        {/* INVOICE DOCUMENT */}
        {/* Adjusted padding from p-8 to p-6 sm:p-12 */}
        <div className="lg:col-span-3 bg-white w-full shadow-2xl shadow-black/5 rounded-2xl sm:rounded-sm p-6 sm:p-12 flex flex-col relative border border-stone-100 animate-in fade-in slide-in-from-bottom-8 duration-700 print:shadow-none print:border-none print:p-0 print:w-full print:max-w-full">
          
          <div className="flex items-center gap-2 mb-8 sm:mb-10 pb-6 border-b border-stone-100">
            <Image src="/logo.png" alt="InstaBill Logo" width={32} height={32} className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-xl font-bold text-slate-800 tracking-tight">InstaBill</span>
          </div>

          <div className="flex justify-between items-start mb-8 sm:mb-12">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-slate-300 tracking-wider">INVOICE</h1>
              <p className="text-xs sm:text-sm font-mono text-slate-400 mt-2 uppercase font-medium">#{invoice.id.split('-')[0]}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-[11.5px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Date</p>
              <p className="font-bold text-[#111827] text-lg sm:text-xl tracking-tight">{new Date(invoice.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          
          {/* Adjusted gap-10 to gap-6 on mobile to prevent squishing */}
          <div className="grid grid-cols-2 gap-6 sm:gap-10 mb-8">
            <div>
              <p className="text-[10px] sm:text-[11.5px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">From</p>
              <p className="font-bold text-[#111827] text-lg sm:text-xl tracking-tight">{invoice.sender_name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-[11.5px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Bill To</p>
              {/* Added break-all for mobile so long emails don't break the layout */}
              <p className="text-base sm:text-xl font-medium text-slate-800 tracking-tight break-all sm:break-normal">{invoice.client_email}</p>
            </div>
          </div>

          {(invoice.billing_address || invoice.shipping_address) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 mb-8 sm:mb-10 bg-stone-50 p-5 sm:p-6 rounded-xl border border-stone-100 print:bg-transparent print:p-0 print:border-none print:mb-8">
              {invoice.billing_address && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Billing Address</p>
                  <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap">{invoice.billing_address}</p>
                </div>
              )}
              {invoice.shipping_address && (
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Shipping Address</p>
                  <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap">{invoice.shipping_address}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex-grow">
            <div className="grid grid-cols-5 border-b-2 border-stone-100 pb-3 mb-4">
              {/* Adjusted columns: 3 for desc, 2 for amount on mobile */}
              <p className="col-span-3 sm:col-span-4 font-bold text-slate-400 text-[10px] sm:text-xs tracking-wider uppercase">Description</p>
              <p className="col-span-2 sm:col-span-1 text-right font-bold text-slate-400 text-[10px] sm:text-xs tracking-wider uppercase">Amount</p>
            </div>
            <div className="space-y-4 mb-8">
              {invoice.items && invoice.items.map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-5 items-start sm:items-center">
                  {/* Smaller text on mobile */}
                  <p className="col-span-3 sm:col-span-4 text-sm sm:text-base text-slate-700 font-medium leading-relaxed pr-2">{item.description}</p>
                  <p className="col-span-2 sm:col-span-1 text-right text-[#111827] font-semibold text-base sm:text-lg tracking-tight pt-0.5 sm:pt-0">₹{item.amount}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t border-stone-100 pt-6 sm:pt-7 mt-6 sm:mt-8">
            {hasTax && (
              <>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs sm:text-sm font-semibold text-slate-500">Subtotal</p>
                  <p className="text-base sm:text-lg font-semibold text-slate-700">₹{subtotal.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex justify-between items-center mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-stone-100">
                  <p className="text-xs sm:text-sm font-semibold text-slate-500">Tax ({displayTaxRate}%)</p>
                  <p className="text-base sm:text-lg font-semibold text-slate-700">₹{actualTaxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-4 sm:gap-0">
              <div>
                <p className="text-[10px] sm:text-[11.5px] font-bold text-slate-400 tracking-wider uppercase mb-1 sm:mb-1.5">Total Amount Due</p>
                {isPaid && <p className="text-xs sm:text-sm font-bold text-green-600 tracking-wider uppercase mt-1 sm:mt-2 border-2 border-green-600 rounded px-2 py-1 inline-block opacity-70 transform -rotate-2">Settled</p>}
                {isPaid && invoice.utr_number && (
                  <div className="mt-3 sm:mt-4 print:mt-8 text-[10px] sm:text-xs text-slate-400 font-mono">Ref: {invoice.utr_number}</div>
                )}
              </div>
              <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                {/* Dynamically shrink extreme font size on mobile */}
                <span className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
                  ₹{Number(invoice.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT PORTAL */}
        <div className="lg:col-span-2 flex flex-col gap-5 sm:gap-6 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 print:hidden">
          
          {!isPaid && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-black/5 border border-stone-200 flex flex-col items-center text-center relative overflow-hidden">
              <div className={`p-3 rounded-2xl mb-4 transition-colors ${isPendingVerification ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"}`}>
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#111827] mb-2 tracking-tight">
                {isPendingVerification ? "Verifying Transaction" : "Pay via UPI"}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mb-6 font-medium px-2">
                {isPendingVerification ? "Awaiting manual payout check by freelancer." : "Scan with any UPI app to pay instantly"}
              </p>
              
              {!isPendingVerification && (
                <div className="w-full sm:hidden mb-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500">
                  <a 
                    href={upiString}
                    className="w-full bg-[#111827] hover:bg-black text-white p-4 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl shadow-black/10 active:scale-[0.98] transition-all"
                  >
                    <Smartphone size={20} />
                    Open UPI App
                  </a>
                  
                  <div className="flex items-center gap-4 px-4">
                    <div className="h-px bg-stone-200 flex-grow"></div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">OR SCAN</span>
                    <div className="h-px bg-stone-200 flex-grow"></div>
                  </div>
                </div>
              )}

              <div className="bg-stone-50 p-4 sm:p-5 rounded-3xl border-2 border-stone-100 shadow-inner mb-4 sm:mb-6 relative w-full flex items-center justify-center">
                <div className={`bg-white p-2 sm:p-3 rounded-2xl shadow-sm transition-all duration-500 ${isPendingVerification ? "blur-md opacity-40 grayscale pointer-events-none" : ""}`}>
                  <QRCodeSVG value={upiString} size={180} level="H" includeMargin={false as any} fgColor="#111827" />
                </div>
                {isPendingVerification && <div className="absolute inset-0 flex items-center justify-center"><div className="bg-amber-500 text-white p-4 rounded-full shadow-xl"><Loader2 className="animate-spin" size={36} strokeWidth={3} /></div></div>}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Secure transfer to <span className="font-bold text-[#111827]">{invoice.sender_name}</span></p>
            </div>
          )}
          
          {invoice.status === "pending" && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-lg shadow-black/5 border border-stone-200 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proof of Payment</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" maxLength={12} value={utrNumber} onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))} placeholder="Enter 12-digit UPI Ref" className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-[#111827] font-medium font-mono text-sm transition-all" />
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2">Find this 12-digit number (UTR) in your bank/UPI app history.</p>
              </div>

              <button onClick={handleMarkAsPaid} disabled={isUpdating || utrNumber.length < 12} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-3.5 sm:p-4 rounded-xl flex items-center justify-center text-sm sm:text-base font-bold shadow-md transition-all active:scale-[0.98]">
                {isUpdating ? "Submitting..." : "Submit Proof"}
              </button>
            </div>
          )}

          {isPendingVerification && (
            <div className="bg-amber-600 p-5 sm:p-6 rounded-3xl flex items-center justify-between shadow-lg shadow-amber-200 text-white">
              <div><p className="text-[10px] sm:text-sm font-bold text-amber-200 tracking-wider uppercase mb-1">Verification Status</p><p className="text-base sm:text-lg font-semibold">Pending Approval</p></div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-amber-400 border-t-white animate-spin"></div>
            </div>
          )}

          {isPaid && (
            <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-green-600 p-5 sm:p-6 rounded-3xl flex items-center justify-between shadow-lg shadow-green-200 text-white">
                <div>
                  <p className="text-[10px] sm:text-sm font-bold text-green-200 tracking-wider uppercase mb-1">Invoice Status</p>
                  <p className="text-base sm:text-lg font-semibold">Succeeded & Closed</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-inner">
                  <Check size={20} strokeWidth={3} />
                </div>
              </div>
              
              <button onClick={handleDownloadPDF} className="w-full bg-white text-[#111827] hover:bg-stone-50 border border-stone-200 p-4 sm:p-5 rounded-2xl flex items-center justify-center gap-3 text-sm sm:text-base font-bold shadow-sm transition-all active:scale-[0.98]">
                <Download size={20} className="text-indigo-600" />
                Download Receipt PDF
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}