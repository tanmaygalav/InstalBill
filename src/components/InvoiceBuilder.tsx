"use client";
import { supabase } from "@/lib/supabase"; // <-- NEW
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Receipt, Send, FileText, Plus, Trash2 } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"; // <-- NEW IMPORT

export default function InvoiceBuilder() {
  const [invoiceData, setInvoiceData] = useState({
    senderName: "",
    clientEmail: "",
    upiId: "",
  });

  const router = useRouter();

  const [items, setItems] = useState([{ id: 1, description: "", amount: "" }]);
  const [isGenerating, setIsGenerating] = useState(false); // <-- NEW
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





  // --- NEW: DATABASE INSERTION ENGINE ---
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

    // 1. Construct the full public URL
    const publicUrl = `${window.location.origin}/invoice/${data[0].id}`;
    
    // 2. Copy the URL to the user's clipboard automatically
    await navigator.clipboard.writeText(publicUrl);

    // 3. Let them know, then immediately redirect them to the page
    alert("Success! Payment link copied to your clipboard.");
    router.push(`/invoice/${data[0].id}`);

  } catch (error) {
    console.error("Error saving to database:", error);
    alert("Failed to connect to database. Check the console.");
  } finally {
    setIsGenerating(false);
  }
};






  // --- NEW: PDF GENERATION ENGINE ---
  const generatePDF = async () => {
    // 1. Create a new document and set fonts
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // 2. Add a standard A4 Page
    const page = pdfDoc.addPage([595.28, 841.89]); 
    const { width, height } = page.getSize();
    let y = height - 80; // Start near the top

    // 3. Draw Header
    page.drawText("INVOICE", { x: 50, y, size: 28, font: boldFont, color: rgb(0.7, 0.7, 0.7) });
    page.drawText(invoiceData.senderName || "Your Business", { x: width - 200, y, size: 14, font: boldFont });
    y -= 20;
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y, size: 10, font });
    page.drawText(invoiceData.upiId || "UPI ID Pending", { x: width - 200, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) });

    // 4. Draw Bill To Section
    y -= 60;
    page.drawText("BILL TO", { x: 50, y, size: 10, font: boldFont, color: rgb(0.5, 0.5, 0.5) });
    y -= 15;
    page.drawText(invoiceData.clientEmail || "Client Email", { x: 50, y, size: 12, font });

    // 5. Draw Table Headers
    y -= 50;
    page.drawText("DESCRIPTION", { x: 50, y, size: 10, font: boldFont });
    page.drawText("AMOUNT", { x: width - 100, y, size: 10, font: boldFont });
    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
    y -= 25;

    // 6. Loop Through Dynamic Items
    items.forEach(item => {
      page.drawText(item.description || "Item description...", { x: 50, y, size: 12, font });
      page.drawText(`INR ${item.amount || "0"}`, { x: width - 100, y, size: 12, font });
      y -= 20; // Move down for the next row
    });

    // 7. Draw Totals
    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
    y -= 25;
    page.drawText("Total Due", { x: width - 200, y, size: 12, font: boldFont });
    page.drawText(`INR ${totalAmount}`, { x: width - 100, y, size: 14, font: boldFont, color: rgb(0.14, 0.38, 0.88) });

    // 8. Serialize and Trigger Download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Invoice_${invoiceData.senderName.replace(/\s+/g, '_') || 'Draft'}.pdf`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-2 gap-8 h-screen">
      
      {/* LEFT COLUMN: The Input Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-fit">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="text-blue-600" />
            Create Invoice
          </h2>
          <p className="text-gray-500 text-sm mt-1">No signup required. Generate in seconds.</p>
        </div>

        <div className="space-y-4 flex-grow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name / Business</label>
            <input 
              name="senderName"
              onChange={handleChange}
              placeholder="e.g. Rohan Designs"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
            <input 
              name="clientEmail"
              onChange={handleChange}
              placeholder="client@company.com"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your UPI ID</label>
              <input 
                name="upiId"
                onChange={handleChange}
                placeholder="name@okaxis"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* DYNAMIC LINE ITEMS SECTION */}
          <div className="pt-4 border-t border-gray-100 mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Line Items</label>
              <button onClick={addItem} className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700">
                <Plus size={16} /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="flex-grow">
                    <input 
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="Service description"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="w-32">
                    <input 
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                      placeholder="₹ Amount"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className={`p-3 rounded-lg flex items-center justify-center transition-colors ${items.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50 cursor-pointer'}`}
                    disabled={items.length === 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
          <button 
            onClick={generateLink}
            disabled={isGenerating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
            <Send size={18} /> {isGenerating ? "Saving..." : "Generate Link"}
            </button>
          {/* NEW: OnClick Handler Added Here */}
          <button 
            onClick={generatePDF}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-all group" 
            title="Download PDF"
          >
            <FileText size={18} className="group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: The Live Preview */}
      <div className="bg-gray-100 rounded-2xl p-4 md:p-8 flex items-start justify-center overflow-y-auto">
        <div className="bg-white w-full max-w-md min-h-[1.414 aspect-ratio] shadow-lg rounded-sm p-8 flex flex-col">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-3xl font-light text-gray-400">INVOICE</h1>
              <p className="text-sm text-gray-500 mt-2">Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800 text-lg">{invoiceData.senderName || "Your Business"}</p>
              <p className="text-sm text-gray-500">{invoiceData.upiId || "UPI ID Pending"}</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-400 mb-1">BILL TO</p>
            <p className="text-gray-800">{invoiceData.clientEmail || "Client Email"}</p>
          </div>

          <div className="flex-grow">
            <div className="flex justify-between border-b border-gray-200 pb-2 mb-4">
              <p className="font-semibold text-gray-600 text-sm">DESCRIPTION</p>
              <p className="font-semibold text-gray-600 text-sm">AMOUNT</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <p className="text-gray-800">{item.description || "Item description..."}</p>
                  <p className="text-gray-800">₹{item.amount || "0"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <p className="text-gray-500 font-medium">Total Due</p>
            <p className="text-2xl font-bold text-blue-600">₹{totalAmount}</p>
          </div>
        </div>
      </div>

    </div>
  );
}