"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, ShieldCheck, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  // Unwrap params safely for Next.js consistency
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const invoiceId = resolvedParams.id;

  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- REAL-TIME DATA SYNC ---
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .single();

        if (error) throw error;
        setInvoice(data);
      } catch (err) {
        console.error("Error fetching invoice:", err);
        toast.error("Invoice not found.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  // --- CLIENT SEALS PAYMENT REQUEST ---
  const handleMarkAsPaid = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "verification_pending" })
        .eq("id", invoiceId);

      if (error) throw error;
      
      setInvoice((prev: any) => ({ ...prev, status: "verification_pending" }));
      toast.success("Freelancer notified! Awaiting confirmation.");
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FEF9F2] flex flex-col items-center justify-center text-[#111827]">
        <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
        <p className="text-sm font-medium text-slate-500">Retrieving secure invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#FEF9F2] flex items-center justify-center text-[#111827] font-medium">
        Invoice data could not be verified or found.
      </div>
    );
  }

  const upiString = `upi://pay?pa=${invoice.upi_id}&am=${invoice.total_amount}&cu=INR`;
  const isPaid = invoice.status === "paid" || invoice.status === "verified";
  const isPendingVerification = invoice.status === "verification_pending";

  return (
    <div className="min-h-screen bg-[#FEF9F2] text-[#111827] flex flex-col items-center py-12 px-4 sm:px-8 selection:bg-indigo-100">
      
      {/* Brand Header */}
      <div className="w-full max-w-5xl mb-8 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center p-1.5">
          <CheckCircle className="text-white w-full h-full" />
        </div>
        <span className="text-xl font-bold tracking-tighter text-[#111827]">InstaBill</span>
      </div>

      <div className="max-w-5xl w-full grid lg:grid-cols-5 gap-10 items-start">
        
        {/* LEFT SIDE: The Crafted Invoice Document */}
        <div className="lg:col-span-3 bg-white w-full shadow-2xl shadow-black/5 rounded-sm p-8 sm:p-12 flex flex-col relative border border-stone-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-12 pb-10 border-b border-stone-100">
            <div>
              <h1 className="text-3xl font-light text-slate-300 tracking-wider">INVOICE</h1>
              <p className="text-sm font-mono text-slate-400 mt-2.5 uppercase font-medium">#{invoice.id.split('-')[0]}</p>
            </div>
            <div className="text-right">
              <p className="text-[11.5px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Date</p>
              <p className="font-bold text-[#111827] text-xl tracking-tight">
                {new Date(invoice.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-10 mb-14">
            <div>
              <p className="text-[11.5px] font-bold text-slate-400 mb-2.5 uppercase tracking-wider">From</p>
              <p className="font-bold text-[#111827] text-xl tracking-tight">{invoice.sender_name}</p>
              <p className="text-sm font-mono text-slate-400 mt-1">Verified Merchant</p>
            </div>
            <div className="text-right">
              <p className="text-[11.5px] font-bold text-slate-400 mb-2.5 uppercase tracking-wider">Bill To</p>
              <p className="text-xl font-medium text-slate-800 tracking-tight">{invoice.client_email}</p>
            </div>
          </div>

          {/* Structured Table */}
          <div className="flex-grow">
            <div className="grid grid-cols-5 border-b-2 border-stone-100 pb-3.5 mb-5">
              <p className="col-span-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Description</p>
              <p className="text-right font-bold text-slate-400 text-xs tracking-wider uppercase">Amount</p>
            </div>
            
            <div className="space-y-4 mb-8">
              {invoice.items && invoice.items.map((item: any, index: number) => (
                <div key={index} className="grid grid-cols-5 items-center">
                  <p className="col-span-4 text-slate-700 font-medium leading-relaxed">{item.description || "—"}</p>
                  <p className="text-right text-[#111827] font-semibold text-lg tracking-tight">₹{item.amount || "0"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Structured Total */}
          <div className="border-t border-stone-100 pt-7 flex justify-between items-end mt-12">
            <div>
              <p className="text-[11.5px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">Total Amount Due</p>
              <p className="text-sm text-slate-500 font-mono">Currency: INR</p>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-4xl font-extrabold text-[#111827] tracking-tight">₹{invoice.total_amount}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: The Premium Payment Portal */}
        <div className="lg:col-span-2 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 fill-mode-both">
          
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-stone-200 flex flex-col items-center text-center relative overflow-hidden">
            <div className={`p-3 rounded-2xl mb-4 transition-colors ${isPaid ? "bg-green-50 text-green-600" : isPendingVerification ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"}`}>
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-2xl font-bold text-[#111827] mb-2 tracking-tight">
              {isPaid ? "Payment Complete" : isPendingVerification ? "Verifying Transaction" : "Pay via UPI"}
            </h3>
            <p className="text-slate-500 text-sm mb-8 font-medium px-2">
              {isPaid ? "This transaction has been settled successfully." : isPendingVerification ? "Awaiting manual payout check by freelancer." : "Scan with any UPI app to pay instantly"}
            </p>
            
            {/* Styled QR Code Box with conditional treatment */}
            <div className="bg-stone-50 p-5 rounded-3xl border-2 border-stone-100 shadow-inner mb-8 relative w-full flex items-center justify-center">
              <div className={`bg-white p-3 rounded-2xl shadow-sm transition-all duration-500 ${isPaid || isPendingVerification ? "blur-md opacity-40 grayscale pointer-events-none" : ""}`}>
                <QRCodeSVG 
                  value={upiString} 
                  size={200} 
                  level="H"
                  includeMargin={false}
                  fgColor="#111827"
                />
              </div>

              {/* Status overlay checks */}
              {isPaid && (
                <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
                  <div className="bg-green-600 text-white p-4 rounded-full shadow-xl">
                    <Check size={36} strokeWidth={3} />
                  </div>
                </div>
              )}

              {isPendingVerification && (
                <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
                  <div className="bg-amber-500 text-white p-4 rounded-full shadow-xl">
                    <Loader2 className="animate-spin" size={36} strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-slate-500 font-medium">
              Secure transfer to <span className="font-bold text-[#111827]">{invoice.sender_name}</span>
            </p>
          </div>
          
          {/* Dynamic Action Trigger Banner */}
          {invoice.status === "pending" && (
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={handleMarkAsPaid}
                disabled={isUpdating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-5 rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                {isUpdating ? "Notifying Freelancer..." : "I've Completed the Payment"}
              </button>
              <p className="text-xs text-slate-400 text-center font-medium px-4">
                Clicking this updates the merchant's live dashboard to request confirmation.
              </p>
            </div>
          )}

          {isPendingVerification && (
            <div className="bg-amber-600 p-6 rounded-3xl flex items-center justify-between shadow-lg shadow-amber-200 text-white">
              <div>
                <p className="text-sm font-bold text-amber-200 tracking-wider uppercase mb-1">Verification Status</p>
                <p className="text-lg font-semibold">Pending Approval</p>
              </div>
              <div className="w-10 h-10 rounded-full border-4 border-amber-400 border-t-white animate-spin"></div>
            </div>
          )}

          {isPaid && (
            <div className="bg-green-600 p-6 rounded-3xl flex items-center justify-between shadow-lg shadow-green-200 text-white animate-in fade-in duration-500">
              <div>
                <p className="text-sm font-bold text-green-200 tracking-wider uppercase mb-1">Invoice Status</p>
                <p className="text-lg font-semibold">Succeeded & Closed</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                <Check size={20} strokeWidth={3} />
              </div>
            </div>
          )}
          
        </div>

      </div>
    </div>
  );
}