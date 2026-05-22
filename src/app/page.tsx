import InvoiceBuilder from "@/components/InvoiceBuilder";
import Link from "next/link";
import { CheckCircle, LayoutDashboard } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FEF9F2] text-[#111827]">
      
      {/* TOP NAVIGATION BAR */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="InstaBill Logo" 
              width={32} 
              height={32} 
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-[#111827]">InstaBill</span>
          </div>  
          
          {/* Action Section */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 group">
                <LayoutDashboard size={16} className="text-indigo-500 group-hover:text-indigo-700 transition-colors" />
                <span className="hidden sm:inline">My Dashboard</span>
              </button>
            </Link>
          </div>
          
        </div>
      </nav>

      {/* MAIN INVOICE BUILDER AREA */}
      {/* Added px-4 sm:px-8 and max-w-7xl to constrain the form on mobile safely */}
      <main className="py-6 sm:py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <InvoiceBuilder />
      </main>
      
    </div>
  );
}