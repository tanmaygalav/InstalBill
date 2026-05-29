// src/app/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#e5e7eb] text-black">
      {/* NAVBAR */}

      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#e5e7eb]/90 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="InstaBill"
              width={36}
              height={36}
            />

            <span className="font-semibold text-xl">
              InstaBill
            </span>
          </div>

          <Link href="/dashboard">
            <button className="h-11 px-5 rounded-lg bg-black text-white flex items-center gap-2 transition hover:scale-[1.03]">
              <LayoutDashboard size={16} />
              Dashboard
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO */}

      <section className="grid-noise">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="uppercase tracking-widest text-sm text-[#444] mb-6">
                Billing Infrastructure For Modern Businesses
              </p>

              <h1 className="display-text text-[clamp(3.5rem,14vw,7.5rem)] leading-[0.9]">
                INSTANT
                <br />
                BILLING.
              </h1>

              <p className="mt-8 max-w-xl text-lg text-[#444]">
                Create payment links.
                Collect through UPI.
                Track settlements.
                Verify transactions.
                All from one place.
              </p>

              <div className="flex flex-wrap gap-4 mt-10">
                <a href="#builder">
                  <button className="bg-black text-white px-6 h-12 rounded-lg flex items-center gap-2 hover:translate-x-1 transition">
                    Generate Invoice
                    <ArrowRight size={16} />
                  </button>
                </a>

                <Link href="/dashboard">
                  <button className="h-12 px-6 rounded-lg bg-white border border-black/10">
                    View Dashboard
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: .2 }}
              className="card p-8 md:p-12"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#444]">
                  Live Revenue
                </span>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-black pulse-status" />
                  <span className="text-sm">
                    Live
                  </span>
                </div>
              </div>

              <h2 className="display-text text-[80px] md:text-[120px] mt-8">
                ₹9K
              </h2>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-[#f3f3f3] rounded-3xl p-5">
                  <p className="text-sm text-[#444]">
                    Pending
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    ₹6.7K
                  </h3>
                </div>

                <div className="bg-[#d1ffca] rounded-3xl p-5">
                  <p className="text-sm text-[#444]">
                    Verified
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    24
                  </h3>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* BUILDER */}

      <section
        id="builder"
        className="max-w-7xl mx-auto px-5 md:px-8 pb-20"
      >
        <div className="mb-10">
          <p className="uppercase tracking-widest text-sm text-[#444]">
            Workspace
          </p>

          <h2 className="display-text text-[clamp(3rem,10vw,5rem)] leading-[0.9] mt-2">
            CREATE
            <br />
            INVOICE
          </h2>
        </div>

        <InvoiceBuilder />
      </section>
    </main>
  );
}
