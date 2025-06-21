import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from "./providers" // ✅ this wraps ThemeProvider
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "GreenGrid - Unite, Act, Compete for a Greener Future",
  description: "Community-driven climate action platform with gamified challenges and real-world impact",
  icons: {
    icon: "/Picture1.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Picture1.png" type="image/png" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.className} transition-colors duration-300`} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
