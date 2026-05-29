"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck,
  Check,
  Loader2,
  Download,
  Search,
  Smartphone,
  Copy,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const invoiceId = resolvedParams.id;

  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [hasCopiedUpi, setHasCopiedUpi] = useState(false);

  useEffect(() => {
    let channel: any;

    const fetchInvoice = async () => {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .single();
        if (error) throw error;
        setInvoice(data);

        channel = supabase
          .channel("public-invoice-sync")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "invoices",
              filter: `id=eq.${invoiceId}`,
            },
            (payload) => {
              setInvoice(payload.new);
            },
          )
          .subscribe();
      } catch (err) {
        toast.error("Invoice not found.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [invoiceId]);

  const handleMarkAsPaid = async () => {
    if (utrNumber.trim().length < 12) {
      toast.error("Please enter a valid 12-digit UPI Reference Number.");
      return;
    }
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          status: "verification_pending",
          utr_number: utrNumber.trim(),
        })
        .eq("id", invoiceId);
      if (error) throw error;
      setInvoice((prev: any) => ({
        ...prev,
        status: "verification_pending",
        utr_number: utrNumber.trim(),
      }));
    } catch (err) {
      toast.error("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = () => window.print();

  const handleCopyUpi = () => {
    if (!invoice?.upi_id) return;
    navigator.clipboard.writeText(invoice.upi_id);
    setHasCopiedUpi(true);
    toast.success("UPI ID Copied!");
    setTimeout(() => setHasCopiedUpi(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3f6f6] flex flex-col items-center justify-center text-[#1d1d1f]">
        <Loader2 className="animate-spin text-[#0071e3] mb-4" size={40} />
      </div>
    );
  }

  if (!invoice)
    return (
      <div className="min-h-screen bg-[#f3f6f6] flex items-center justify-center text-[#1d1d1f] font-medium font-sans">
        Invoice not found.
      </div>
    );

  const upiString = `upi://pay?pa=${invoice.upi_id}&am=${invoice.total_amount}&cu=INR`;
  const isPaid = invoice.status === "paid" || invoice.status === "verified";
  const isPendingVerification = invoice.status === "verification_pending";

  const subtotal =
    invoice.items?.reduce(
      (sum: number, item: any) => sum + (Number(item.amount) || 0),
      0,
    ) || 0;
  const actualTaxAmount = Number(invoice.total_amount) - subtotal;
  const hasTax = (invoice.tax_rate && invoice.tax_rate > 0) || actualTaxAmount > 0;
  const displayTaxRate = invoice.tax_rate || (subtotal > 0 ? Math.round((actualTaxAmount / subtotal) * 100) : 0);

  return (
    <div className="min-h-screen bg-[#f3f6f6] text-[#1d1d1f] font-sans flex flex-col items-center py-6 sm:py-12 px-4 sm:px-8 print:bg-white print:py-0 print:px-0">
      
      {/* BRAND HEADER */}
      <div className="w-full max-w-5xl mb-6 flex items-center gap-2 print:hidden">
        <Image src="/logo.png" alt="InstaBill Logo" width={32} height={32} className="w-8 h-8 rounded-[8px]" />
        <span className="text-xl font-semibold tracking-[-0.02em]">InstaBill</span>
      </div>

      <div className="max-w-5xl w-full flex flex-col md:flex-row gap-[10px] print:block">
        
        {/* LEFT COLUMN: INVOICE DOCUMENT */}
        <div className="flex-1 bg-white rounded-[28px] p-8 md:p-12 print:p-0 print:w-full">
          <div className="flex justify-between items-start border-b border-[#f3f6f6] pb-8 mb-8">
            <div>
              <h1 className="text-[24px] font-medium text-[#6b6c6c] tracking-tight">Invoice</h1>
              <p className="text-[14px] text-[#1d1d1f] font-medium mt-1">#{invoice.id.split("-")[0]}</p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-medium text-[#6b6c6c] mb-1">Date</p>
              <p className="font-semibold text-[17px] tracking-tight">{new Date(invoice.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between mb-12 gap-6">
            <div>
              <p className="text-[14px] font-medium text-[#6b6c6c] mb-1">From</p>
              <p className="font-semibold text-[17px] tracking-tight">{invoice.sender_name}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[14px] font-medium text-[#6b6c6c] mb-1">Bill To</p>
              <p className="font-semibold text-[17px] tracking-tight truncate">{invoice.client_email}</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="grid grid-cols-4 border-b border-[#f3f6f6] pb-2 mb-4">
              <p className="col-span-3 font-medium text-[#6b6c6c] text-[14px]">Description</p>
              <p className="text-right font-medium text-[#6b6c6c] text-[14px]">Amount</p>
            </div>
            <div className="space-y-4">
              {invoice.items && invoice.items.map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-4 items-center">
                  <p className="col-span-3 text-[14px] text-[#1d1d1f] pr-2">{item.description}</p>
                  <p className="text-right font-semibold text-[17px] tracking-tight">₹{item.amount}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#f3f6f6] pt-6">
            {hasTax && (
              <>
                <div className="flex justify-between items-center mb-2 text-[14px]">
                  <p className="font-medium text-[#6b6c6c]">Subtotal</p>
                  <p className="font-semibold text-[#1d1d1f]">₹{subtotal.toLocaleString("en-IN")}</p>
                </div>
                <div className="flex justify-between items-center mb-4 text-[14px]">
                  <p className="font-medium text-[#6b6c6c]">Tax ({displayTaxRate}%)</p>
                  <p className="font-semibold text-[#1d1d1f]">₹{actualTaxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-4">
              <div>
                <p className="text-[14px] font-medium text-[#6b6c6c]">Total Amount Due</p>
                {isPaid && invoice.utr_number && (
                  <p className="text-[12px] text-[#6b6c6c] mt-1">Ref: {invoice.utr_number}</p>
                )}
              </div>
              <span className="text-[34px] sm:text-[44px] font-semibold text-[#1d1d1f] tracking-[-0.02em]">
                ₹{Number(invoice.total_amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIONS (Hidden when printed) */}
        <div className="w-full md:w-[360px] flex flex-col gap-[10px] print:hidden">
          
          {!isPaid && (
            <div className="bg-white p-6 rounded-[28px] flex flex-col items-center text-center relative overflow-hidden">
              <h3 className="text-[20px] font-semibold text-[#1d1d1f] mb-2 tracking-tight">
                {isPendingVerification ? "Verifying Payment" : "Pay via UPI"}
              </h3>
              
              {!isPendingVerification && (
                <div className="w-full sm:hidden mb-6 mt-2">
                  <a href={upiString} className="w-full bg-[#1d1d1f] text-white p-3.5 rounded-[28px] flex items-center justify-center gap-2 font-medium text-[17px]">
                    <Smartphone size={18} /> Open UPI App
                  </a>
                </div>
              )}

              <div className="bg-[#f3f6f6] p-4 rounded-[12px] mb-4 w-full aspect-square flex items-center justify-center relative">
                <div className={`bg-white p-3 rounded-[12px] ${isPendingVerification ? "blur-md opacity-40" : ""}`}>
                  <QRCodeSVG value={upiString} size={200} level="H" includeMargin={false as any} fgColor="#1d1d1f" />
                </div>
                {isPendingVerification && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#1d1d1f]" size={36} />
                  </div>
                )}
              </div>

              {!isPendingVerification && (
                <button onClick={handleCopyUpi} className="text-[#0071e3] text-[14px] font-medium flex items-center gap-2 hover:underline">
                  {hasCopiedUpi ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  {hasCopiedUpi ? "Copied!" : "Copy UPI ID"}
                </button>
              )}
            </div>
          )}

          {invoice.status === "pending" && (
            <div className="bg-white p-6 rounded-[28px]">
              <p className="text-[14px] font-medium text-[#6b6c6c] mb-3">Proof of Payment</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#cccfcf]" size={16} />
                <input
                  type="text"
                  maxLength={12}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="12-digit UPI Ref"
                  className="w-full pl-9 pr-4 py-3 bg-[#f3f6f6] border border-transparent rounded-[12px] focus:border-[#0071e3] outline-none text-[#1d1d1f] text-[14px]"
                />
              </div>
              <button
                onClick={handleMarkAsPaid}
                disabled={isUpdating || utrNumber.length < 12}
                className="w-full bg-[#0071e3] disabled:bg-[#cccfcf] text-white p-3.5 rounded-[28px] text-[17px] font-medium tracking-tight"
              >
                {isUpdating ? "Submitting..." : "Submit"}
              </button>
            </div>
          )}

          {isPaid && (
            <div className="flex flex-col gap-[10px]">
              <div className="bg-white p-6 rounded-[28px] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center">
                  <Check size={20} />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#6b6c6c]">Invoice Status</p>
                  <p className="text-[17px] font-semibold text-[#1d1d1f]">Paid & Closed</p>
                </div>
              </div>

              <button onClick={handleDownloadPDF} className="w-full bg-[#f3f6f6] text-[#1d1d1f] hover:bg-[#e8e8ed] p-3.5 rounded-[28px] flex items-center justify-center gap-2 text-[17px] font-medium transition-all">
                <Download size={18} /> Print / Save PDF
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}