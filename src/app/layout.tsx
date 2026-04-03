import type { Metadata } from "next";
import { Google_Sans_Code, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

// const googleSansCode = Google_Sans_Code({
//   subsets: ["latin"],
//   variable: "--font-google-sans-code",
// });

export const metadata: Metadata = {
  title: "Ops Dashboard",
  description: "Internal operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        // googleSansCode.variable,
        "font-sans",
        spaceGrotesk.variable,
      )}
    >
      <body className="h-full flex">
        <Sidebar />
        <div className="flex flex-1 flex-col ml-60 h-full overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
