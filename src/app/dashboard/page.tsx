"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  Clock,
  Receipt,
  Plus,
  ArrowUpRight,
  Search,
  MoreHorizontal,
  Loader2,
  Copy,
  Check,
  Download,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    let channel: any;

    const fetchInvoices = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) setInvoices(data);

        channel = supabase
          .channel(`dashboard-sync-${Math.random()}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "invoices",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              setInvoices((prev) =>
                prev.map((inv) =>
                  inv.id === payload.new.id ? payload.new : inv,
                ),
              );
            },
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
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleVerifyStatus = async (
    invoiceId: string,
    confirmPaid: boolean,
  ) => {
    const finalStatus = confirmPaid ? "verified" : "pending";

    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: finalStatus })
        .eq("id", invoiceId);

      if (error) throw error;

      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: finalStatus } : inv,
        ),
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

  const handleCopyLink = (invoiceId: string) => {
    const url = `${window.location.origin}/invoice/${invoiceId}`;
    navigator.clipboard.writeText(url);
    toast.success("Payment link copied to clipboard!");
    setOpenMenuId(null);
  };

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error("No invoices to export.");
      return;
    }

    const headers = [
      "Invoice ID",
      "Date",
      "Client Email",
      "Amount (INR)",
      "Status",
      "UTR Reference",
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.id.split("-")[0],
      new Date(inv.created_at).toLocaleDateString(),
      inv.client_email,
      inv.total_amount,
      inv.status.replace("_", " ").toUpperCase(),
      inv.utr_number ? `'${inv.utr_number}` : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `InstaBill_Export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Excel report downloaded!");
  };

  const totalCollected = invoices
    .filter((inv) => inv.status === "paid" || inv.status === "verified")
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const pendingAmount = invoices
    .filter(
      (inv) =>
        inv.status === "pending" || inv.status === "verification_pending",
    )
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const pendingCount = invoices.filter(
    (inv) => inv.status === "pending" || inv.status === "verification_pending",
  ).length;
  const totalInvoices = invoices.length;

  const filteredInvoices = invoices.filter((invoice) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "paid")
      return invoice.status === "paid" || invoice.status === "verified";
    return invoice.status === filterStatus;
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3f6f6] flex flex-col items-center justify-center text-[#1d1d1f]">
        <Loader2 className="animate-spin text-[#0071e3] mb-4" size={40} />
        <p className="font-medium text-[#6b6c6c]">
          Syncing secure billing data...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-[#f3f6f6] text-[#1d1d1f] font-sans">
      {/* TOP NAVIGATION BAR */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="InstaBill Logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">
              InstaBill
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-[#f3f6f6] px-3 py-1.5 rounded-full text-sm font-medium text-[#1d1d1f]">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
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
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
        >
          <div>
            <p className="text-[14px] font-medium text-[#6b6c6c] mb-1 tracking-tight">
              Overview
            </p>
            <h1 className="text-4xl md:text-[44px] font-semibold tracking-[-0.02em] text-[#1d1d1f] leading-tight">
              Welcome back
            </h1>
          </div>

          <Link href="/">
            <button className="bg-[#0071e3] hover:bg-[#0066cc] text-white font-medium py-[11px] px-6 rounded-[28px] flex items-center gap-2 transition-all w-full md:w-auto justify-center text-[17px] tracking-[-0.16px]">
              <Plus size={18} /> Create New Link
            </button>
          </Link>
        </motion.div>

        {/* FINANCIAL DATA SUMMARY CARDS */}
        <div className="grid md:grid-cols-3 gap-[10px] mb-12">
          <motion.div
            variants={itemVariants}
            className="bg-white p-[24px] rounded-[28px] relative overflow-hidden group flex flex-col justify-between"
          >
            <p className="text-[14px] font-medium text-[#6b6c6c] tracking-tight mb-2">
              Total Collected
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">
              ₹{totalCollected.toLocaleString("en-IN")}
            </h2>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white p-[24px] rounded-[28px] flex flex-col justify-between"
          >
            <div>
              <p className="text-[14px] font-medium text-[#6b6c6c] tracking-tight mb-2">
                Awaiting Payment
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                ₹{pendingAmount.toLocaleString("en-IN")}
              </h2>
            </div>
            <p className="text-sm text-[#6b6c6c] mt-2 tracking-tight">
              Across {pendingCount} pending invoice(s)
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white p-[24px] rounded-[28px] flex flex-col justify-between"
          >
            <div>
              <p className="text-[14px] font-medium text-[#6b6c6c] tracking-tight mb-2">
                Invoices Generated
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                {totalInvoices}
              </h2>
            </div>
            <p className="text-sm text-[#6b6c6c] mt-2 tracking-tight">
              Lifetime total
            </p>
          </motion.div>
        </div>

        {/* BOTTOM CONTENT GRID */}
        <div className="grid lg:grid-cols-3 gap-[10px]">
          {/* Main List */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 bg-white rounded-[28px] h-fit"
          >
            <div className="p-[24px] border-b border-[#f3f6f6] flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                  Recent Activity
                </h3>
              </div>

              {/* FILTER TABS */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-4 py-2 rounded-[28px] text-[14px] font-medium transition-all ${
                    filterStatus === "all"
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f3f6f6] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  All Invoices
                </button>

                <button
                  onClick={() => setFilterStatus("pending")}
                  className={`px-4 py-2 rounded-[28px] text-[14px] font-medium transition-all ${
                    filterStatus === "pending"
                      ? "bg-[#0071e3] text-white"
                      : "bg-[#f3f6f6] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  Awaiting Payment
                </button>

                <button
                  onClick={() => setFilterStatus("verification_pending")}
                  className={`px-4 py-2 rounded-[28px] text-[14px] font-medium transition-all flex items-center gap-2 ${
                    filterStatus === "verification_pending"
                      ? "bg-[#b64400] text-white"
                      : "bg-[#f3f6f6] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  Needs Verification
                  {invoices.some(
                    (inv) => inv.status === "verification_pending",
                  ) && (
                    <span className="flex h-2 w-2 rounded-full bg-white"></span>
                  )}
                </button>

                <button
                  onClick={() => setFilterStatus("paid")}
                  className={`px-4 py-2 rounded-[28px] text-[14px] font-medium transition-all ${
                    filterStatus === "paid"
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f3f6f6] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  Settled
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#f3f6f6]">
              {filteredInvoices.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-[#6b6c6c] font-medium mb-4">
                    {invoices.length === 0
                      ? "No tracking elements configured yet."
                      : "No invoices found for this status."}
                  </p>
                </div>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid =
                    inv.status === "paid" || inv.status === "verified";
                  const isVerificationPending =
                    inv.status === "verification_pending";

                  return (
                    <motion.div
                      key={inv.id}
                      className="p-[24px] flex flex-col transition-colors group"
                    >
                      {/* TOP ROW: Main Invoice Details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                        {/* LEFT: Icon & Info */}
                        <div className="flex items-start sm:items-center gap-4 w-full">
                          <div className="flex-grow">
                            <p className="font-semibold text-[#1d1d1f] tracking-tight truncate max-w-[200px] md:max-w-[300px]">
                              {inv.client_email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[14px] text-[#6b6c6c]">
                                #{inv.id.split("-")[0]}
                              </span>
                              <span className="text-[14px] text-[#6b6c6c]">
                                • {new Date(inv.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT: Price, Status Pill, and Menu */}
                        <div className="text-left sm:text-right flex flex-col sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full">
                            <div className="flex flex-col items-start sm:items-end">
                              <p className="font-semibold text-[#1d1d1f] text-lg tracking-tight">
                                ₹
                                {Number(inv.total_amount).toLocaleString(
                                  "en-IN",
                                )}
                              </p>

                              <span
                                className={`text-[12px] font-medium tracking-tight mt-1 ${
                                  isPaid
                                    ? "text-[#1d1d1f]"
                                    : isVerificationPending
                                    ? "text-[#b64400]"
                                    : "text-[#6b6c6c]"
                                }`}
                              >
                                {inv.status === "verification_pending"
                                  ? "Verifying"
                                  : inv.status === "pending"
                                  ? "Pending"
                                  : "Paid"}
                              </span>
                            </div>

                            {/* THREE DOTS DROPDOWN MENU */}
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === inv.id ? null : inv.id,
                                  )
                                }
                                className="text-[#6b6c6c] hover:text-[#1d1d1f] p-1.5 rounded-[12px] transition-colors"
                              >
                                <MoreHorizontal size={20} />
                              </button>

                              {/* Dropdown Card */}
                              {openMenuId === inv.id && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#cccfcf] shadow-[rgba(0,0,0,0.11)_0px_0px_1px_0px_inset] rounded-[12px] z-50 overflow-hidden text-left p-1">
                                  <button
                                    onClick={() => handleCopyLink(inv.id)}
                                    className="w-full px-4 py-2 text-[14px] text-[#1d1d1f] hover:bg-[#f3f6f6] rounded-[8px] transition-colors flex items-center gap-2"
                                  >
                                    <Copy size={14} /> Copy Link
                                  </button>
                                  {inv.status === "pending" && (
                                    <button
                                      onClick={() =>
                                        handleVerifyStatus(inv.id, true)
                                      }
                                      className="w-full px-4 py-2 text-[14px] text-[#0071e3] hover:bg-[#f3f6f6] rounded-[8px] transition-colors flex items-center gap-2"
                                    >
                                      <Check size={14} /> Mark Paid
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ACTION BOX (For verification) */}
                      {isVerificationPending && (
                        <div className="mt-4 p-4 bg-[#f3f6f6] rounded-[12px] w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <p className="text-[14px] font-medium text-[#1d1d1f]">
                              Client claims paid.
                            </p>
                            {inv.utr_number && (
                              <p className="text-[12px] text-[#6b6c6c]">
                                UTR: {inv.utr_number}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleVerifyStatus(inv.id, true)}
                              className="flex-1 sm:flex-none text-[14px] bg-[#1d1d1f] text-white px-4 py-2 rounded-[28px] font-medium transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyStatus(inv.id, false)}
                              className="flex-1 sm:flex-none text-[14px] bg-transparent border border-[#cccfcf] text-[#1d1d1f] px-4 py-2 rounded-[28px] font-medium transition-colors hover:bg-white"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* RIGHT SIDEBAR */}
          <motion.div variants={itemVariants} className="space-y-[10px]">
            <div className="bg-white rounded-[28px] p-[24px]">
              <h4 className="text-[14px] font-medium text-[#6b6c6c] mb-4">
                Quick Actions
              </h4>
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-4 py-[11px] rounded-[12px] bg-[#f3f6f6] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[14px] font-medium transition-all flex justify-between items-center"
              >
                <span className="flex items-center gap-2">
                  <Download size={16} className="text-[#1d1d1f]" />
                  Export to Excel
                </span>
              </button>
              <p className="text-[12px] text-[#6b6c6c] mt-4 tracking-tight leading-relaxed">
                Exports currently respect your active filters. To export all
                time data, ensure the "All Invoices" tab is selected.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}