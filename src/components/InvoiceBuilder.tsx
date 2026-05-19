"use client";

import { useState } from "react";
import { Receipt, Send, FileText, Plus, Trash2 } from "lucide-react";

export default function InvoiceBuilder() {
  const [invoiceData, setInvoiceData] = useState({
    senderName: "",
    clientEmail: "",
    upiId: "",
  });

  // 1. New State for Line Items
  const [items, setItems] = useState([{ id: 1, description: "", amount: "" }]);

  // 2. Helper to handle main form inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceData({ ...invoiceData, [e.target.name]: e.target.value });
  };

  // 3. Helpers for dynamic items
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

  // 4. Calculate Total automatically
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

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
              {items.map((item, index) => (
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
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all">
            <Send size={18} /> Generate Link
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-all group" title="Download PDF">
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
            
            {/* Mapped Line Items */}
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