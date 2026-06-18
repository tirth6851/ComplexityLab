import type { Metadata } from "next";
import {
  IBM_Plex_Sans,
  JetBrains_Mono,
  Space_Grotesk,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConsentGate } from "@/components/legal/consent-gate";
import { SITE } from "@/constants/site";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-face",
  weight: ["600", "700"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans-face",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
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
          className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        >
          {children}
          <ConsentGate />
        </body>
      </html>
    </ClerkProvider>
  );
}
