import "./globals.css";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Changed to a sophisticated warm cream background with charcoal text */}
      <body className="bg-[#FEF9F2] text-[#111827] antialiased selection:bg-indigo-100">
        <Toaster position="bottom-center" />
        {children}
      </body>
    </html>
  );
}