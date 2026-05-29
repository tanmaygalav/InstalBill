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
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
    <div className="w-full grid lg:grid-cols-2 gap-[10px] items-start font-sans">
      {/* LEFT COLUMN: THE FORM */}
      <div className="space-y-[10px]">
        <div className="bg-white p-6 rounded-[28px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-[20px] text-[#1d1d1f] tracking-tight">Your Details</h2>
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
              className="w-full p-[13px] bg-[#f3f6f6] border border-transparent rounded-[12px] focus:border-[#0071e3] outline-none text-[14px] text-[#1d1d1f]"
            />
            <input
              type="text"
              placeholder="Your UPI ID (e.g. brand@paytm)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full p-[13px] bg-[#f3f6f6] border border-transparent rounded-[12px] focus:border-[#0071e3] outline-none text-[14px] text-[#1d1d1f]"
            />

            {userId && (
              <div className="flex items-center gap-2 pt-2">
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
                  Save these details as my default
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px]">
          <h2 className="font-semibold text-[20px] text-[#1d1d1f] tracking-tight mb-4">Client Details</h2>
          
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

          <div className="grid grid-cols-2 gap-[10px] mb-[10px]">
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

          <div className="flex justify-between items-center mb-3 mt-4">
            <label className="text-[14px] font-medium text-[#6b6c6c]">
              Services / Products
            </label>
            <button
              onClick={handleAddItem}
              className="text-[14px] text-[#0071e3] font-medium flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> Add Line
            </button>
          </div>

          <div className="space-y-[10px]">
            {items.map((item, index) => (
              <div key={index} className="flex gap-[10px] items-center">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                  className="flex-grow p-[13px] bg-[#f3f6f6] border border-transparent rounded-[12px] text-[14px] text-[#1d1d1f] focus:border-[#0071e3] outline-none"
                />
                <div className="relative w-32 flex-shrink-0">
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
                    className="p-3 text-[#1d1d1f] hover:bg-[#e8e8ed] rounded-[12px] transition-colors bg-[#f3f6f6]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {!generatedLink ? (
          <button
            onClick={handleGenerate}
            disabled={!isMounted || isGenerating || !isFormValid}
            suppressHydrationWarning
            className="w-full bg-[#0071e3] hover:bg-[#0066cc] disabled:bg-[#cccfcf] text-white p-[15px] rounded-[28px] flex items-center justify-center gap-2 font-medium tracking-tight transition-all text-[17px]"
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Generate Payment Link"
            )}
          </button>
        ) : (
          <div className="bg-white p-6 rounded-[28px] border border-[#cccfcf] flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[#1d1d1f]">
              <CheckCircle2 size={24} />
              <h3 className="font-semibold text-[20px] tracking-tight">Ready to send</h3>
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

            <div className="grid grid-cols-2 gap-[10px] mt-2">
              <button
                onClick={handleWhatsAppShare}
                className="col-span-2 bg-[#1d1d1f] text-white py-[11px] rounded-[28px] flex justify-center items-center gap-2 font-medium text-[17px]"
              >
                <MessageCircle size={18} /> Share via WhatsApp
              </button>
              
              <a
                href={generatedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#f3f6f6] text-[#1d1d1f] py-[11px] rounded-[28px] flex justify-center items-center gap-2 font-medium text-[14px] hover:bg-[#e8e8ed]"
              >
                <ExternalLink size={16} /> Preview
              </a>
              <button
                onClick={handleReset}
                className="w-full bg-white border border-[#cccfcf] text-[#1d1d1f] hover:bg-[#f3f6f6] py-[11px] rounded-[28px] flex justify-center items-center gap-2 font-medium text-[14px]"
              >
                <RefreshCw size={16} /> Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: LIVE PREVIEW */}
      <div className="sticky top-24 bg-white rounded-[28px] p-8 hidden lg:block">
        <div className="flex justify-between items-start border-b border-[#f3f6f6] pb-6 mb-6">
          <div>
            <h1 className="text-[24px] font-medium text-[#6b6c6c] tracking-tight">
              Invoice
            </h1>
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
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-[14px] font-medium text-[#6b6c6c] mb-1">From</p>
            <p className="font-semibold text-[#1d1d1f] text-[17px] tracking-tight">
              {senderName || "Your Business"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-medium text-[#6b6c6c] mb-1">Bill To</p>
            <p className="font-semibold text-[#1d1d1f] text-[17px] tracking-tight truncate">
              {clientEmail || "client@email.com"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 border-b border-[#f3f6f6] pb-2 mb-4">
          <p className="col-span-3 font-medium text-[#6b6c6c] text-[14px]">
            Description
          </p>
          <p className="text-right font-medium text-[#6b6c6c] text-[14px]">
            Amount
          </p>
        </div>

        <div className="space-y-4 mb-8 min-h-[100px]">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-4 items-center">
              <p className="col-span-3 text-[14px] text-[#1d1d1f]">
                {item.description || "—"}
              </p>
              <p className="text-right text-[14px] font-semibold text-[#1d1d1f]">
                ₹{item.amount || "0"}
              </p>
            </div>
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

          <div className="flex justify-between items-end mt-4">
            <p className="text-[14px] font-medium text-[#6b6c6c]">
              Total Amount
            </p>
            <span className="text-[34px] font-semibold text-[#1d1d1f] tracking-[-0.02em]">
              ₹{totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}