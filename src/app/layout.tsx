import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { PWARegister } from "@/components/providers/pwa-register";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        spaceGrotesk.variable,
      )}
    >
      <body className="h-full flex">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClerkProvider>
            <SidebarProvider>
              <AppSidebar />
              <div className="flex flex-1 flex-col h-full overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
            </SidebarProvider>
            <Toaster richColors position="bottom-right" />
            <PWARegister />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
