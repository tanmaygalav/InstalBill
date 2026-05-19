import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, ShieldCheck } from "lucide-react";

export default async function PublicInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const resolvedParams = await params;
  const invoiceId = resolvedParams.id;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) {
    notFound();
  }

  // UPI String without the `pn` parameter to prevent merchant name mismatch errors
  const upiString = `upi://pay?pa=${invoice.upi_id}&am=${invoice.total_amount}&cu=INR`;

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
              {invoice.items.map((item: any, index: number) => (
                <div key={index} className="grid grid-cols-5 items-center">
                  <p className="col-span-4 text-slate-700 font-medium leading-relaxed">{item.description}</p>
                  <p className="text-right text-[#111827] font-semibold text-lg tracking-tight">₹{item.amount}</p>
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
          
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-stone-200 flex flex-col items-center text-center">
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl mb-4">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-2xl font-bold text-[#111827] mb-2 tracking-tight">Pay via UPI</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">Scan with any UPI app to pay instantly</p>
            
            {/* Styled QR Code Box */}
            <div className="bg-stone-50 p-5 rounded-3xl border-2 border-stone-100 shadow-inner mb-8">
              <div className="bg-white p-3 rounded-2xl shadow-sm">
                <QRCodeSVG 
                  value={upiString} 
                  size={200} 
                  level="H"
                  includeMargin={false}
                  fgColor="#111827" // Using charcoal instead of harsh black
                />
              </div>
            </div>
            
            <p className="text-sm text-slate-500 font-medium">
              Secure transfer to <span className="font-bold text-[#111827]">{invoice.sender_name}</span>
            </p>
            {/* Note: UPI ID string is purposefully hidden here for privacy! */}
          </div>
          
          <div className="bg-indigo-600 p-6 rounded-3xl flex items-center justify-between shadow-lg shadow-indigo-200 text-white">
            <div>
              <p className="text-sm font-bold text-indigo-200 tracking-wider uppercase mb-1">Payment Status</p>
              <p className="text-lg font-semibold">Awaiting Scan</p>
            </div>
            <div className="w-10 h-10 rounded-full border-4 border-indigo-400 border-t-white animate-spin"></div>
          </div>
          
        </div>

      </div>
    </div>
  );
}