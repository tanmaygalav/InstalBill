"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import toast from "react-hot-toast";
import { motion, AnimatePresence, Variants, Transition } from "framer-motion";
import { 
  Building, 
  User, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Send, 
  FileText, 
  Plus 
} from "lucide-react";

export default function InvoiceBuilder() {
  const router = useRouter();

  // --- HYDRATION FIX ---
  // These hooks MUST be inside the function component!
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [invoiceData, setInvoiceData] = useState({
    senderName: "",
    clientEmail: "",
    upiId: "",
  });

  const [items, setItems] = useState([{ id: 1, description: "", amount: "" }]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceData({ ...invoiceData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (id: number, field: string, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", amount: "" }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // --- DATABASE INSERTION ENGINE ---
  const generateLink = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([
          {
            sender_name: invoiceData.senderName || "Unknown",
            client_email: invoiceData.clientEmail || "Unknown",
            upi_id: invoiceData.upiId || "Unknown",
            total_amount: totalAmount,
            items: items,
          }
        ])
        .select();

      if (error) throw error;

      const publicUrl = `${window.location.origin}/invoice/${data[0].id}`;
      await navigator.clipboard.writeText(publicUrl);

      toast.success("Payment link copied to clipboard!");
      
      router.push(`/invoice/${data[0].id}`);

    } catch (error) {
      console.error("Error saving to database:", error);
      toast.error("Failed to generate link.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- PDF GENERATION ENGINE ---
  const generatePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([595.28, 841.89]); 
    const { width, height } = page.getSize();
    let y = height - 80;

    page.drawText("INVOICE", { x: 50, y, size: 28, font: boldFont, color: rgb(0.7, 0.7, 0.7) });
    page.drawText(invoiceData.senderName || "Your Business", { x: width - 200, y, size: 14, font: boldFont });
    y -= 20;
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y, size: 10, font });
    page.drawText(invoiceData.upiId || "UPI ID Pending", { x: width - 200, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) });

    y -= 60;
    page.drawText("BILL TO", { x: 50, y, size: 10, font: boldFont, color: rgb(0.5, 0.5, 0.5) });
    y -= 15;
    page.drawText(invoiceData.clientEmail || "Client Email", { x: 50, y, size: 12, font });

    y -= 50;
    page.drawText("DESCRIPTION", { x: 50, y, size: 10, font: boldFont });
    page.drawText("AMOUNT", { x: width - 100, y, size: 10, font: boldFont });
    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
    y -= 25;

    items.forEach(item => {
      page.drawText(item.description || "Item description...", { x: 50, y, size: 12, font });
      page.drawText(`INR ${item.amount || "0"}`, { x: width - 100, y, size: 12, font });
      y -= 20; 
    });

    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
    y -= 25;
    page.drawText("Total Due", { x: width - 200, y, size: 12, font: boldFont });
    page.drawText(`INR ${totalAmount}`, { x: width - 100, y, size: 14, font: boldFont, color: rgb(0.14, 0.38, 0.88) });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Invoice_${invoiceData.senderName.replace(/\s+/g, '_') || 'Draft'}.pdf`;
    link.click();
  };

  // Framer Motion micro-interaction configurations
  const buttonVariants: Variants = {
    hover: { scale: 1.015, transition: { type: "spring", stiffness: 400, damping: 20 } },
    tap: { scale: 0.985, transition: { type: "spring", stiffness: 400, damping: 20 } },
  };

  const itemTransition: Transition = { type: "spring", stiffness: 500, damping: 30, opacity: { duration: 0.2 } };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-2 gap-8 min-h-screen items-start">
      
      {/* LEFT COLUMN: The Sophisticated Input Form */}
      <div className="space-y-8">
        
        {/* CRAFTED LOGO & HEADER SECTION */}
        <div className="flex items-center gap-2 mb-2 p-2">
          <motion.div
            initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-9 h-9 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center p-2.5"
          >
            <CheckCircle className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tighter text-[#111827]">
            InstaBill
          </h1>
        </div>

        {/* INPUT CARD 1: Basic Details */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-lg shadow-black/5 border border-stone-200"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2.5">
              <Building className="text-indigo-600" size={20} />
              Your Details
            </h2>
            <p className="text-slate-500 text-sm mt-1">Fill in your business or individual information</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name / Business</label>
              <input 
                name="senderName"
                onChange={handleChange}
                placeholder="e.g. GlossGen Studios"
                className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none text-[#111827] placeholder-slate-400 transition-all font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex justify-between items-center">
                Your UPI ID for Payment
              </label>
              <input 
                name="upiId"
                onChange={handleChange}
                placeholder="e.g. brand@paytm"
                className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none text-[#111827] placeholder-slate-400 transition-all font-medium"
              />
              <div className="mt-2.5 bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3.5 items-start">
                <HelpCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={18}/>
                <p className="text-[11.5px] text-blue-700 leading-relaxed font-medium">
                  <strong className="text-blue-900 font-semibold">Keep your identity private.</strong> PhonePe, GPay, and Paytm allow you to set up a free <strong className="font-semibold text-blue-800">merchant profile</strong> with only your PAN card. Using that special Merchant VPA will hide your legal banking name and phone number from clients scanning the QR.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* INPUT CARD 2: Line Items & Client */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl shadow-lg shadow-black/5 border border-stone-200"
        >
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2.5">
                <User className="text-indigo-600" size={20} />
                Client Details
              </h2>
              <p className="text-slate-500 text-sm mt-1">Who is this invoice for?</p>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Email</label>
            <input 
              name="clientEmail"
              onChange={handleChange}
              placeholder="client@company.com"
              className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none text-[#111827] placeholder-slate-400 transition-all font-medium"
            />
          </div>

          <div className="pt-6 border-t border-stone-100 mt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider text-xs">Services / Tasks</label>
              <motion.button 
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={addItem} 
                className="text-sm text-indigo-600 font-medium flex items-center gap-1.5 hover:text-indigo-700 transition-colors bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm shadow-indigo-100/30"
              >
                <Plus size={16} /> Add Task
              </motion.button>
            </div>
            
            <div className="space-y-3.5">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, x: -15 }}
                    transition={itemTransition}
                    className="flex gap-3.5 items-start"
                  >
                    <div className="flex-grow">
                      <input 
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Service description..."
                        className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none text-[#111827] placeholder-slate-400 transition-all font-medium"
                      />
                    </div>
                    <div className="w-36 flex items-center gap-3">
                      <span className="text-slate-400 font-medium">₹</span>
                      <input 
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                        placeholder="Amount"
                        className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none text-[#111827] placeholder-slate-400 transition-all font-medium text-right"
                      />
                    </div>
                    <motion.button 
                      variants={buttonVariants}
                      whileHover={items.length > 1 ? "hover" : ""}
                      whileTap={items.length > 1 ? "tap" : ""}
                      onClick={() => removeItem(item.id)}
                      className={`p-3.5 rounded-xl flex items-center justify-center transition-colors border shadow-inner ${
                        items.length === 1 
                          ? 'border-stone-100 text-stone-300 cursor-not-allowed bg-stone-50' 
                          : 'border-red-100 text-red-500 hover:bg-red-50/50 hover:border-red-200 cursor-pointer'
                      }`}
                      disabled={items.length === 1}
                    >
                      <XCircle size={18} />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* INPUT CARD 3: Final Call to Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-lg shadow-black/5 border border-stone-200 flex gap-4"
        >
          <motion.button 
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={generateLink}
            disabled={isGenerating}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-semibold py-4 px-5 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-200"
          >
            <Send size={19} /> {isGenerating ? "Connecting to Supabase..." : "Generate Payment Link"}
          </motion.button>
          <motion.button 
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={generatePDF}
            className="bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-700 font-medium py-4 px-5 rounded-xl flex items-center justify-center transition-all group" 
            title="Download PDF"
          >
            <FileText size={18} className="group-hover:text-indigo-600 transition-colors" />
          </motion.button>
        </motion.div>

      </div>

      {/* RIGHT COLUMN: The CRAFTED, Structured Invoice Preview */}
      <div className="flex items-start justify-center pt-16 sticky top-8">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.15 }}
          className="bg-white w-full max-w-lg min-h-[1.414 aspect-ratio] shadow-2xl shadow-black/10 rounded-sm p-10 flex flex-col relative z-10 before:absolute before:inset-0 before:ring-1 before:ring-black/5 border border-stone-100"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-14 pb-12 border-b border-stone-100">
            <div>
              <h1 className="text-3xl font-light text-slate-300 tracking-wider">INVOICE</h1>
              <p className="text-sm font-mono text-slate-500 mt-2.5 uppercase font-medium">
                #{isMounted ? new Date().getTime().toString().slice(-8) : "--------"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11.5px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Date</p>
              <p className="font-bold text-[#111827] text-xl tracking-tight">
                {isMounted ? new Date().toLocaleDateString() : "--/--/----"}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-10 mb-16">
            <div>
              <p className="text-[11.5px] font-bold text-slate-400 mb-2.5 uppercase tracking-wider">From</p>
              <p className="font-bold text-[#111827] text-xl tracking-tight">{invoiceData.senderName || "Your Business"}</p>
              <p className="text-sm font-mono text-slate-500 mt-1">{invoiceData.upiId || "UPI ID Pending"}</p>
            </div>
            <div className="text-right">
              <p className="text-[11.5px] font-bold text-slate-400 mb-2.5 uppercase tracking-wider">Bill To</p>
              <p className="text-xl font-medium text-slate-800 tracking-tight">{invoiceData.clientEmail || "client@company.com"}</p>
            </div>
          </div>

          {/* Structured Table */}
          <div className="flex-grow">
            <div className="grid grid-cols-5 border-b-2 border-stone-100 pb-3.5 mb-5">
              <p className="col-span-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Description</p>
              <p className="text-right font-bold text-slate-400 text-xs tracking-wider uppercase">Amount</p>
            </div>
            
            <div className="space-y-4 mb-8">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-5 items-center">
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
                <span className="text-4xl font-extrabold text-[#111827] tracking-tight">₹{totalAmount}</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full mt-2">UPI PAYMENT INTENT</span>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}