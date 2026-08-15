import type { Metadata } from "next";
import {
  IBM_Plex_Sans,
  JetBrains_Mono,
  Space_Grotesk,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConsentGate } from "@/components/legal/consent-gate";
import { SITE } from "@/constants/site";
import { SiteBanner } from "@/components/marketing/site-banner";
import { SiteSearch } from "@/components/marketing/site-search";
import { UtmCapture } from "@/components/marketing/utm-capture";
import { FloatingContact } from "@/components/marketing/floating-contact";
import { BackToTop } from "@/components/ui/back-to-top";
import { ScrollProgressBar } from "@/components/ui/scroll-progress-bar";
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
  metadataBase: new URL("https://www.complexitylab.top"),
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/brand/icon.svg",
    shortcut: "/brand/icon.svg",
  },
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    url: "https://www.complexitylab.top",
    siteName: SITE.name,
    type: "website",
  },
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
          {/* Visual chrome that reads page scroll state — mounted first so it
              paints above everything else without fighting z-index. */}
          <ScrollProgressBar />
          <SiteBanner />
          {/* Invisible until triggered — safe to mount once, site-wide. */}
          <UtmCapture />
          <SiteSearch />
          {children}
          {/* Floating chrome, bottom corners — both self-hide on the
              authenticated (app) shell, which has its own nav/Chat feature. */}
          <BackToTop />
          <FloatingContact />
          <ConsentGate />
        </body>
      </html>
    </ClerkProvider>
  );
}
