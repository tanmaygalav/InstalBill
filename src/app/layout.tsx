import "./globals.css";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {/* The Toaster handles the smooth popups globally */}
        <Toaster position="bottom-center" />
        {children}
      </body>
    </html>
  );
}