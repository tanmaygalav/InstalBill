import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

// This is a Server Component. It fetches data securely before rendering.
export default async function PublicInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  // 1. Await params (Next.js best practice for dynamic routing)
  const resolvedParams = await params;
  const invoiceId = resolvedParams.id;

  // 2. Fetch the specific invoice from Supabase
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  // 3. If no invoice is found, show a 404 page
  if (error || !invoice) {
    notFound();
  }

  // 4. Generate the official UPI Intent String
  // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR
  const upiString = `upi://pay?pa=${invoice.upi_id}&pn=${encodeURIComponent(
    invoice.sender_name
  )}&am=${invoice.total_amount}&cu=INR`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-5xl w-full grid md:grid-cols-5 gap-8">
        
        {/* LEFT SIDE: The Invoice Summary */}
        <div className="md:col-span-3 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-3xl font-light text-gray-400">INVOICE</h1>
              <p className="text-sm text-gray-500 mt-2">
                Date: {new Date(invoice.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800 text-lg">{invoice.sender_name}</p>
              <p className="text-sm text-gray-500 text-mono">#{invoice.id.split('-')[0]}</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-400 mb-1">BILLED TO</p>
            <p className="text-gray-800">{invoice.client_email}</p>
          </div>

          <div className="flex-grow mb-12">
            <div className="flex justify-between border-b border-gray-200 pb-2 mb-4">
              <p className="font-semibold text-gray-600 text-sm">DESCRIPTION</p>
              <p className="font-semibold text-gray-600 text-sm">AMOUNT</p>
            </div>
            
            <div className="space-y-4">
              {invoice.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <p className="text-gray-800">{item.description}</p>
                  <p className="text-gray-800">₹{item.amount}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <p className="text-gray-500 font-medium">Total Due</p>
            <p className="text-2xl font-bold text-blue-600">₹{invoice.total_amount}</p>
          </div>
        </div>

        {/* RIGHT SIDE: The Payment Portal */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pay via UPI</h3>
            <p className="text-gray-500 text-sm mb-6">Scan with any UPI app to pay instantly</p>
            
            <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm mb-6">
              <QRCodeSVG 
                value={upiString} 
                size={200} 
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p className="text-sm text-gray-500">
              Paying: <span className="font-semibold text-gray-800">{invoice.sender_name}</span>
            </p>
            <p className="text-sm font-mono text-gray-400 mt-1">{invoice.upi_id}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">Secure Payment</p>
              <p className="text-xs text-blue-700 mt-1">100% direct to freelancer</p>
            </div>
            <div className="text-2xl font-bold text-blue-600">₹{invoice.total_amount}</div>
          </div>
        </div>

      </div>
    </div>
  );
}