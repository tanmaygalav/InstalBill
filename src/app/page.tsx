import InvoiceBuilder from "@/components/InvoiceBuilder";
import App from "next/app";
import DashboardPage from "./dashboard/page";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardPage />
    </main>
  );
}