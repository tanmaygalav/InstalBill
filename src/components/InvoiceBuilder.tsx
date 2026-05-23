"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Loader2,
  MapPin,
  Percent,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function InvoiceBuilder() {
  const router = useRouter();

  // --- HYDRATION SAFETY STATE ---
  const [isMounted, setIsMounted] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);

  // NEW: State to hold the link and stop the redirect
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Core State
  const [senderName, setSenderName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState([{ description: "", amount: "" }]);

  // Setting tracking
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Advanced E-commerce & Tax State
  const [showAddresses, setShowAddresses] = useState(false);
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [showTax, setShowTax] = useState(false);
  const [taxRate, setTaxRate] = useState<number | string>(18);

  // Mount the component safely to prevent Hydration Mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch Defaults
  useEffect(() => {
    const fetchDefaults = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data, error } = await supabase
            .from("user_settings")
            .select("default_sender_name, default_upi_id")
            .eq("user_id", user.id)
            .single();

          if (data) {
            if (data.default_sender_name)
              setSenderName(data.default_sender_name);
            if (data.default_upi_id) setUpiId(data.default_upi_id);
          }
        }
      } catch (error) {
        console.error("No defaults found.");
      } finally {
        setIsLoadingDefaults(false);
      }
    };
    fetchDefaults();
  }, []);

  const handleAddItem = () =>
    setItems([...items, { description: "", amount: "" }]);
  const handleRemoveItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // NEW: Reset function to quickly bill the next client
  const handleReset = () => {
    setGeneratedLink(null);
    setClientEmail("");
    setItems([{ description: "", amount: "" }]);
    // Note: We deliberately KEEP the senderName, upiId, and tax settings so they don't have to retype them!
  };

  // Math Calculations
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );
  const calculatedTax = showTax ? (subtotal * (Number(taxRate) || 0)) / 100 : 0;
  const totalAmount = subtotal + calculatedTax;

  // Validation
  const isFormValid =
    senderName.trim() !== "" &&
    upiId.trim() !== "" &&
    clientEmail.trim() !== "" &&
    totalAmount > 0;

  const handleGenerate = async () => {
    if (!isFormValid) {
      toast.error(
        "Please fill in all required fields and add at least one item.",
      );
      return;
    }

    setIsGenerating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create an invoice.");
        router.push("/login");
        return;
      }

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert([
          {
            user_id: user.id,
            sender_name: senderName,
            upi_id: upiId,
            client_email: clientEmail,
            total_amount: totalAmount,
            items: items,
            billing_address: showAddresses ? billingAddress : null,
            shipping_address: showAddresses ? shippingAddress : null,
            tax_rate: showTax ? Number(taxRate) : null,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      if (saveAsDefault) {
        await supabase.from("user_settings").upsert({
          user_id: user.id,
          default_sender_name: senderName,
          default_upi_id: upiId,
        });
      }

      // NEW BEHAVIOR: Copy to clipboard and show success UI instead of redirecting
      const finalLink = `${window.location.origin}/invoice/${invoiceData.id}`;
      await navigator.clipboard.writeText(finalLink);
      setGeneratedLink(finalLink);

      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invoice.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
      {/* LEFT COLUMN: THE FORM */}
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-stone-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-[#111827]">Your Details</h2>
            {isLoadingDefaults && (
              <Loader2 className="animate-spin text-slate-300" size={16} />
            )}
          </div>
          <div className="space-y-3 sm:space-y-4">
            <input
              type="text"
              placeholder="Your Name / Business"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm sm:text-base"
            />
            <input
              type="text"
              placeholder="Your UPI ID (e.g. brand@paytm)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm sm:text-base"
            />

            {userId && (
              <div className="flex items-center gap-2 pt-1 pl-1">
                <input
                  type="checkbox"
                  id="saveDefaults"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="saveDefaults"
                  className="text-[11px] sm:text-xs font-medium text-slate-500 cursor-pointer select-none"
                >
                  Save these details as my default
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-stone-200">
          <h2 className="font-bold text-[#111827] mb-4">Client Details</h2>
          <input
            type="email"
            placeholder="Client Email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none mb-5 sm:mb-6 text-sm sm:text-base"
          />

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${showAddresses ? "border-indigo-600 bg-indigo-50/50" : "border-stone-200 hover:border-stone-300"}`}
              onClick={() => setShowAddresses(!showAddresses)}
            >
              <div className="flex justify-between items-center mb-1">
                <MapPin
                  size={18}
                  className={
                    showAddresses ? "text-indigo-600" : "text-slate-400"
                  }
                />
                <div
                  className={`w-8 h-4 rounded-full relative transition-colors ${showAddresses ? "bg-indigo-600" : "bg-stone-300"}`}
                >
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showAddresses ? "left-4.5 right-0.5 translate-x-3.5" : "left-0.5"}`}
                  ></div>
                </div>
              </div>
              <p
                className={`text-xs sm:text-sm font-bold mt-2 ${showAddresses ? "text-indigo-900" : "text-slate-700"}`}
              >
                Addresses
              </p>
            </div>

            <div
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${showTax ? "border-indigo-600 bg-indigo-50/50" : "border-stone-200 hover:border-stone-300"}`}
              onClick={() => setShowTax(!showTax)}
            >
              <div className="flex justify-between items-center mb-1">
                <Percent
                  size={18}
                  className={showTax ? "text-indigo-600" : "text-slate-400"}
                />
                <div
                  className={`w-8 h-4 rounded-full relative transition-colors ${showTax ? "bg-indigo-600" : "bg-stone-300"}`}
                >
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showTax ? "left-4.5 right-0.5 translate-x-3.5" : "left-0.5"}`}
                  ></div>
                </div>
              </div>
              <p
                className={`text-xs sm:text-sm font-bold mt-2 ${showTax ? "text-indigo-900" : "text-slate-700"}`}
              >
                Tax / GST
              </p>
            </div>
          </div>

          {showAddresses && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6 animate-in fade-in slide-in-from-top-2">
              <textarea
                placeholder="Billing Address..."
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none resize-none h-20 sm:h-24"
              />
              <textarea
                placeholder="Shipping Address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none resize-none h-20 sm:h-24"
              />
            </div>
          )}

          {showTax && (
            <div className="mb-5 sm:mb-6 animate-in fade-in slide-in-from-top-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm sm:text-base"
              />
            </div>
          )}

          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Services / Products
            </label>
            <button
              onClick={handleAddItem}
              className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Desc"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                  className="flex-grow p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none w-1/2"
                />
                <div className="relative w-24 sm:w-32 flex-shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={item.amount}
                    onChange={(e) =>
                      handleItemChange(index, "amount", e.target.value)
                    }
                    className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none"
                  />
                </div>
                {items.length > 1 && (
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 sm:p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DYNAMIC ACTION AREA: Shows Button OR Success Card */}
        {!generatedLink ? (
          <button
            onClick={handleGenerate}
            disabled={!isMounted || isGenerating || !isFormValid}
            suppressHydrationWarning
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] text-sm sm:text-base"
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Generate Payment Link"
            )}
          </button>
        ) : (
          <div className="bg-green-50 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-green-200 animate-in fade-in zoom-in-95 duration-300 flex flex-col gap-4 shadow-lg shadow-green-100">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle2 size={24} className="text-green-600" />
              <h3 className="font-bold text-lg tracking-tight">
                Ready to send!
              </h3>
            </div>
            <p className="text-sm text-green-800 font-medium">
              Your payment link has been copied to your clipboard. Paste it
              directly to your client.
            </p>

            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-green-100 shadow-sm">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-grow bg-transparent text-sm font-mono text-slate-500 px-2 outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  toast.success("Copied again!");
                }}
                className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                title="Copy Link"
              >
                <Copy size={16} />
              </button>
            </div>

            <div className="flex gap-3 mt-2">
              <a
                href={generatedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white border border-green-200 text-green-700 hover:bg-green-100 py-3 rounded-xl flex justify-center items-center gap-2 font-bold text-sm transition-colors shadow-sm"
              >
                <ExternalLink size={16} /> Preview
              </a>
              <button
                onClick={handleReset}
                className="flex-1 bg-green-600 text-white hover:bg-green-700 py-3 rounded-xl flex justify-center items-center gap-2 font-bold text-sm transition-colors shadow-md shadow-green-200 active:scale-[0.98]"
              >
                <RefreshCw size={16} /> New Client
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: LIVE PREVIEW (Unchanged) */}
      <div className="sticky top-24 bg-white shadow-2xl shadow-black/5 rounded-sm p-8 sm:p-12 border border-stone-100 hidden lg:block">
        {/* CUSTOM LOGO (Make sure logo.png is in your /public folder) */}
        <div className="flex items-center gap-2 mb-10 pb-6 border-b border-stone-100">
          <Image
            src="/logo.png"
            alt="InstaBill Logo"
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg object-contain"
          />
          <span className="text-lg font-bold text-slate-800 tracking-tight">
            InstaBill
          </span>
        </div>

        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-2xl font-light text-slate-300 tracking-wider">
              INVOICE
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1 uppercase font-medium">
              #PREVIEW
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              Date
            </p>
            {/* HYDRATION SAFE DATE */}
            <p className="font-bold text-[#111827]" suppressHydrationWarning>
              {isMounted ? new Date().toLocaleDateString() : "---"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              From
            </p>
            <p className="font-bold text-[#111827] truncate pr-2">
              {senderName || "Your Business"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Bill To
            </p>
            <p className="font-medium text-slate-800 truncate pl-2">
              {clientEmail || "client@company.com"}
            </p>
          </div>
        </div>

        {showAddresses && (
          <div className="grid grid-cols-2 gap-8 mb-10 bg-stone-50 p-4 rounded-xl border border-stone-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Billing Address
              </p>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">
                {billingAddress || "---"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Shipping Address
              </p>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">
                {shippingAddress || "---"}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 border-b-2 border-stone-100 pb-2 mb-4">
          <p className="col-span-3 font-bold text-slate-400 text-[10px] tracking-wider uppercase">
            Description
          </p>
          <p className="text-right font-bold text-slate-400 text-[10px] tracking-wider uppercase">
            Amount
          </p>
        </div>

        <div className="space-y-3 mb-8 min-h-[100px]">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-4 items-center">
              <p className="col-span-3 text-sm text-slate-700 pr-4">
                {item.description || "—"}
              </p>
              <p className="text-right text-sm font-semibold text-[#111827]">
                ₹{item.amount || "0"}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-stone-100 pt-6">
          {showTax && (
            <>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-slate-500">Subtotal</p>
                <p className="text-sm font-semibold text-slate-700">
                  ₹{subtotal.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-semibold text-slate-500">
                  Tax ({taxRate}%)
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  ₹
                  {calculatedTax.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </>
          )}

          <div className="flex justify-between items-end">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
              Total Amount
            </p>
            <span className="text-3xl font-extrabold text-[#111827] tracking-tight">
              ₹
              {totalAmount.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
