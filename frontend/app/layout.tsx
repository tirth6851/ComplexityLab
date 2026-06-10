import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConsentGate } from "@/components/legal/consent-gate";
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

/**
 * Runs before first paint to set the theme class, avoiding a flash of the wrong
 * theme. Dark-first: defaults to dark unless the user has explicitly chosen
 * light (persisted in localStorage under "theme").
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : true;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body
          className={`${GeistSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        >
          {children}
          <ConsentGate />
        </body>
      </html>
    </ClerkProvider>
  );
}
