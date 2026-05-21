import InvoiceBuilder from "@/components/InvoiceBuilder";
import Link from "next/link";
import { CheckCircle, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FEF9F2] text-[#111827]">
      
      {/* TOP NAVIGATION BAR */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <CheckCircle className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111827]">InstaBill</span>
          </div>
          
          {/* Action Section */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 group">
                <LayoutDashboard size={16} className="text-indigo-500 group-hover:text-indigo-700 transition-colors" />
                My Dashboard
              </button>
            </Link>
          </div>
          
        </div>
      </nav>

      {/* MAIN INVOICE BUILDER AREA */}
      <main className="py-8">
        <InvoiceBuilder />
      </main>
      
    </div>
  );
}