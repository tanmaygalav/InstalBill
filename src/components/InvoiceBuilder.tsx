// src/components/InvoiceBuilder.tsx
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
  MessageCircle,
  ArrowRight,
  Sparkles,
  Building2,
  User,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    scale: 1,
  },
};



export default function InvoiceBuilder() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  const [senderName, setSenderName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [items, setItems] = useState([{ description: "", amount: "" }]);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [showAddresses, setShowAddresses] = useState(false);
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [showTax, setShowTax] = useState(false);
  const [taxRate, setTaxRate] = useState<number | string>(18);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchDefaults = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data } = await supabase
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

  const handleReset = () => {
    setGeneratedLink(null);
    setClientEmail("");
    setClientPhone("");
    setItems([{ description: "", amount: "" }]);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );
  const calculatedTax = showTax ? (subtotal * (Number(taxRate) || 0)) / 100 : 0;
  const totalAmount = subtotal + calculatedTax;

  const isFormValid =
    senderName.trim() !== "" &&
    upiId.trim() !== "" &&
    clientEmail.trim() !== "" &&
    totalAmount > 0;

  const handleGenerate = async () => {
    if (!isFormValid) {
      toast.error("Please fill in all required fields and add at least one item.");
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

      const finalLink = `${window.location.origin}/invoice/${invoiceData.id}`;
      
      try {
        await navigator.clipboard.writeText(finalLink);
        toast.success("Link copied to clipboard!");
      } catch (clipboardError) {
        console.warn("Auto-copy blocked by browser security.", clipboardError);
        toast.success("Invoice generated successfully!");
      }
      setGeneratedLink(finalLink);

    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invoice.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!generatedLink) return;

    let formattedPhone = "";
    if (clientPhone) {
      const cleanPhone = clientPhone.replace(/\D/g, "");
      formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    }

    const clientName = clientEmail.split("@")[0];
    const message = `Hello ${clientName},\n\nHere is your invoice from *${senderName}*.\n\n💰 *Total Amount Due:* ₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n🔗 *Payment Link:* ${generatedLink}\n\nYou can scan the UPI QR code directly on the link to settle the bill securely. Thank you!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsAppUrl = formattedPhone 
      ? `https://wa.me/${formattedPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
      {/* LEFT SIDE */}
      <div className="space-y-6">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -3 }}
          className="
                    bg-white
                    rounded-[32px]
                    p-6
                    sm:p-8
                    "
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="uppercase tracking-[0.25em] text-[11px] text-[#979797] mb-2">
                Business
              </p>

              <h2 className="text-[34px] font-black leading-none">
                YOUR DETAILS
              </h2>
            </div>
            {isLoadingDefaults && (
              <Loader2 className="animate-spin text-[#cccfcf]" size={16} />
            )}
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your Name / Business"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="
              w-full
              h-14
              px-5
              bg-[#f3f3f3]
              rounded-2xl
              border
              border-transparent
              outline-none
              transition-all
              focus:bg-white
              focus:border-black
              "
            />
            <input
              type="text"
              placeholder="Your UPI ID (e.g. brand@paytm)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="
              w-full
              h-14
              px-5
              bg-[#f3f3f3]
              rounded-2xl
              border
              border-transparent
              outline-none
              transition-all
              focus:bg-white
              focus:border-black
              "
            />

            {userId && (
              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="saveDefaults"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="rounded border-[#cccfcf] text-[#0071e3] focus:ring-[#0071e3] w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="saveDefaults"
                  className="text-[14px] text-[#6b6c6c] cursor-pointer select-none"
                >
                  Remember these billing details
                </label>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.08 }}
        whileHover={{ y: -3 }}
        className="
                bg-white
                rounded-[32px]
                p-6
                sm:p-8
                "
        >
          <div className="mb-8">
            <p className="uppercase tracking-[0.25em] text-[11px] text-[#979797] mb-2">
              Customer
            </p>

            <h2
              className="
              text-[28px]
              sm:text-[34px]
              font-black
              leading-none
              "
            >
              CLIENT INFO
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mb-[10px]">
            <input
              type="email"
              placeholder="Client Email (Required)"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full p-[13px] bg-[#f3f6f6] border border-transparent rounded-[12px] focus:border-[#0071e3] outline-none text-[14px] text-[#1d1d1f]"
            />
            <input
              type="tel"
              placeholder="WhatsApp No. (Optional)"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full p-[13px] bg-[#f3f6f6] border border-transparent rounded-[12px] focus:border-[#0071e3] outline-none text-[14px] text-[#1d1d1f]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div
              className={`p-[13px] rounded-[12px] border transition-all cursor-pointer ${showAddresses ? "border-[#0071e3] bg-[#f3f6f6]" : "border-[#cccfcf] bg-white hover:bg-[#f3f6f6]"}`}
              onClick={() => setShowAddresses(!showAddresses)}
            >
              <div className="flex justify-between items-center">
                <p className={`text-[14px] font-medium ${showAddresses ? "text-[#0071e3]" : "text-[#1d1d1f]"}`}>
                  Addresses
                </p>
                <MapPin size={16} className={showAddresses ? "text-[#0071e3]" : "text-[#6b6c6c]"} />
              </div>
            </div>

            <div
               className={`p-[13px] rounded-[12px] border transition-all cursor-pointer ${showTax ? "border-[#0071e3] bg-[#f3f6f6]" : "border-[#cccfcf] bg-white hover:bg-[#f3f6f6]"}`}
              onClick={() => setShowTax(!showTax)}
            >
              <div className="flex justify-between items-center">
                <p className={`text-[14px] font-medium ${showTax ? "text-[#0071e3]" : "text-[#1d1d1f]"}`}>
                  Tax / GST
                </p>
                <Percent size={16} className={showTax ? "text-[#0071e3]" : "text-[#6b6c6c]"} />
              </div>
            </div>
          </div>

          {showAddresses && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mb-[10px]">
              <textarea
                placeholder="Billing Address..."
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full p-[13px] bg-[#f3f6f6] border border-transparent rounded-[12px] text-[14px] outline-none resize-none h-24 text-[#1d1d1f] focus:border-[#0071e3]"
              />
              <textarea
                placeholder="Shipping Address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full p-[13px] bg-[#f3f6f6] border border-transparent rounded-[12px] text-[14px] outline-none resize-none h-24 text-[#1d1d1f] focus:border-[#0071e3]"
              />
            </div>
          )}

          {showTax && (
            <div className="mb-[10px]">
              <input
                type="number"
                placeholder="Tax Rate (%)"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full p-[13px] bg-[#f3f6f6] border border-transparent rounded-[12px] focus:border-[#0071e3] outline-none text-[14px] text-[#1d1d1f]"
              />
            </div>
          )}

          <div
            className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            justify-between
            gap-3
            mb-4
            mt-6
          "
          >
            <label className="text-[14px] font-medium text-[#6b6c6c]">
              Services / Products
            </label>
            <button
              onClick={handleAddItem}
              className="
                        w-full
                        sm:w-auto
                        bg-black
                        text-white
                        h-12
                        px-5
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        gap-2
                        font-medium
                        "
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          <div className="space-y-[10px]">
            {items.map((item, index) => (
              <div
                key={index}
                className="
                bg-[#f6f6f6]
                rounded-2xl
                p-3
                flex
                flex-col
                sm:flex-row
                gap-3
              "
              >
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                  className="flex-grow p-[13px] bg-[#f3f6f6] border border-transparent rounded-[12px] text-[14px] text-[#1d1d1f] focus:border-[#0071e3] outline-none"
                />
                <div
                  className="
                  relative
                  w-full
                  sm:w-36
                  "
                >
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6c6c] font-medium text-[14px]">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={item.amount}
                    onChange={(e) =>
                      handleItemChange(index, "amount", e.target.value)
                    }
                    className="w-full pl-8 pr-3 py-[13px] bg-[#f3f6f6] border border-transparent rounded-[12px] text-[14px] text-[#1d1d1f] focus:border-[#0071e3] outline-none"
                  />
                </div>
                {items.length > 1 && (
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="
                              h-12
                              w-full
                              sm:w-12
                              rounded-xl
                              bg-white
                              hover:bg-red-50
                              transition-colors
                              flex
                              items-center
                              justify-center
                              "
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
        <div className="lg:hidden bg-black text-white rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.2em] opacity-60">
          Total Due
        </p>

        <h2 className="text-4xl font-black mt-2">
          ₹{totalAmount.toLocaleString("en-IN")}
        </h2>
      </div>
        {!generatedLink ? (
          <button
            onClick={handleGenerate}
            disabled={!isMounted || isGenerating || !isFormValid}
            suppressHydrationWarning
            className="
                      sticky
                      bottom-4
                      w-full
                      h-14
                      sm:h-16
                      bg-black
                      text-white
                      rounded-2xl
                      font-semibold
                      text-base
                      sm:text-lg
                      shadow-xl
                      "
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "GENERATE INVOICE"
            )}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="
            bg-black
            text-white
            rounded-[32px]
            p-8
            "
          >
            <div className="flex items-start gap-3 mb-6">
              <div className="
                w-12
                h-12
                rounded-2xl
                bg-[#d1ffca]
                flex
                items-center
                justify-center
              ">
                <CheckCircle2
                  size={22}
                  className="text-black"
                />
              </div>
              <div>
                <p className="uppercase text-[11px] tracking-[0.25em] opacity-60">
                  Success
                </p>

                <h3 className="text-[32px] font-black mt-2 leading-none">
                  READY TO SHARE
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#f3f6f6] p-2 rounded-[12px]">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-grow bg-transparent text-[14px] text-[#6b6c6c] px-2 outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  toast.success("Copied again!");
                }}
                className="p-2 bg-white hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-[8px] transition-colors border border-[#cccfcf]"
                title="Copy Link"
              >
                <Copy size={16} />
              </button>
            </div>

            <div className="space-y-3 mt-5">
              <button
              onClick={handleWhatsAppShare}
              className="
                w-full
                h-14
                rounded-2xl
                bg-[#d1ffca]
                text-black
                font-semibold
                flex
                items-center
                justify-center
                gap-2
                transition-all
                hover:scale-[1.01]
                active:scale-[0.99]
              "
            >
              <MessageCircle size={18} />
              Share via WhatsApp
            </button>
              
            <div className="grid grid-cols-2 gap-3">
              <a
                href={generatedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  h-12
                  rounded-xl
                  bg-white/10
                  hover:bg-white/15
                  transition-colors
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-sm
                  font-medium
                "
              >
                <ExternalLink size={16} />
                Preview
              </a>

              <button
                onClick={handleReset}
                className="
                  h-12
                  rounded-xl
                  border
                  border-white/15
                  hover:bg-white/10
                  transition-colors
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-sm
                  font-medium
                "
              >
                <RefreshCw size={16} />
                New Invoice
              </button>
            </div>


            </div>
          </motion.div>
        )}
      </div>

      {/* RIGHT COLUMN: LIVE PREVIEW */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="
        sticky
        top-24
        hidden
        lg:block
        bg-white
        rounded-[32px]
        p-8
        border
        border-black/5
        "
      >
        <div className="flex justify-between items-start border-b border-[#f3f6f6] pb-6 mb-6">
          <div>
            <div>
              <p className="uppercase tracking-[0.25em] text-[11px] text-[#979797]">
                Live Preview
              </p>

              <h1 className="text-[42px] font-black leading-none mt-2">
                INVOICE
              </h1>
            </div>
            <p className="text-[14px] text-[#1d1d1f] font-medium mt-1">
              #PREVIEW
            </p>
          </div>
          <div className="text-right">
            <p className="text-[14px] text-[#6b6c6c] font-medium mb-1">
              Date
            </p>
            <p className="font-semibold text-[#1d1d1f] text-[17px] tracking-tight" suppressHydrationWarning>
              {isMounted ? new Date().toLocaleDateString() : "---"}
            </p>
          </div>
          <div className="mt-6">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#d1ffca] text-black text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-black" />
              Draft
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-[#f3f3f3] rounded-[24px] p-4">
            <p className="text-[14px] font-medium text-[#6b6c6c] mb-1">From</p>
            <p className="font-semibold text-[#1d1d1f] text-[17px] tracking-tight">
              {senderName || "Your Business"}
            </p>
          </div>
          <div className="bg-[#f3f3f3] rounded-[24px] p-4">
            <p className="text-[14px] font-medium text-[#6b6c6c] mb-1">Bill To</p>
            <p className="font-semibold text-[#1d1d1f] text-[17px] tracking-tight truncate">
              {clientEmail || "client@email.com"}
            </p>
          </div>
        </div>
        {showAddresses && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#f3f3f3] rounded-3xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#666] mb-2">
                Billing Address
              </p>

              <p className="text-sm whitespace-pre-wrap break-words">
                {billingAddress || "Not provided"}
              </p>
            </div>

            <div className="bg-[#f3f3f3] rounded-3xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#666] mb-2">
                Shipping Address
              </p>

              <p className="text-sm whitespace-pre-wrap break-words">
                {shippingAddress || "Not provided"}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 border-b border-[#f3f6f6] pb-2 mb-4">
          <p className="col-span-3 font-medium text-[#6b6c6c] text-[14px]">
            Description
          </p>
          <p className="text-right font-medium text-[#6b6c6c] text-[14px]">
            Amount
          </p>
        </div>

        <div className="space-y-3 mb-10 min-h-[140px]">
          {items.map((item, i) => (
            <motion.div
              key={i}
              layout
              className="
              grid
              grid-cols-4
              items-center
              bg-[#f3f3f3]
              rounded-2xl
              p-3
              "
            >
              <p className="col-span-3 text-[14px] text-[#1d1d1f]">
                {item.description || "—"}
              </p>
              <p className="text-right text-[14px] font-semibold text-[#1d1d1f]">
                ₹{item.amount || "0"}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-[#f3f6f6] pt-6 flex flex-col gap-2">
          {showTax && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-medium text-[#6b6c6c]">Subtotal</p>
                <p className="text-[14px] font-semibold text-[#1d1d1f]">
                  ₹{subtotal.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[14px] font-medium text-[#6b6c6c]">
                  Tax ({taxRate}%)
                </p>
                <p className="text-[14px] font-semibold text-[#1d1d1f]">
                  ₹{calculatedTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </p>
              </div>
            </>
          )}

          <div className="mt-8 bg-black text-white rounded-[28px] p-6">
            <p className="uppercase tracking-[0.25em] text-[11px] opacity-60">
              Total Due
            </p>

            <motion.div
              key={totalAmount}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-[48px] font-black leading-none mt-3">
                ₹
                {totalAmount.toLocaleString(
                  "en-IN",
                  { maximumFractionDigits: 2 }
                )}
              </h2>
            </motion.div>

            <p className="text-sm opacity-60 mt-3">
              Auto updates while editing.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}