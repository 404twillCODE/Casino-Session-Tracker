import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SessionStack",
  description: "Casino session tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0f1114] text-[#e8eaed]">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: "#22262b", border: "1px solid #2a2f36", color: "#e8eaed" },
          }}
        />
      </body>
    </html>
  );
}
