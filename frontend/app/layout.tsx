import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SITE } from "@/constants/site";
import "./globals.css";

/**
 * Fonts:
 *  - Geist Sans  -> exposes the CSS var `--font-geist-sans` (default UI font).
 *  - JetBrains Mono -> bound to `--font-mono` (used for code / complexity readouts).
 * Both variables are consumed by `tailwind.config.ts` fontFamily.
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${GeistSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
