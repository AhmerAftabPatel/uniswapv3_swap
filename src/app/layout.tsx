import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Thirdweb from "@/components/Thirdweb";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Uniswapv3 Swap",
  description: "A UniSwap frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Thirdweb>
        <body className={`${inter.className} min-h-screen bg-white flex flex-col`}>
          <Toaster />
          <Header />
          {children}
        </body>
      </Thirdweb>
    </html>
  );
}
