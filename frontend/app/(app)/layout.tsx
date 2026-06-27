import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ToastProvider } from "@/components/ui/toaster";

/**
 * Authenticated app shell. Route protection is enforced upstream in proxy.ts;
 * this layout composes the persistent chrome (sidebar + topbar) and hosts the
 * toast stack for action feedback.
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-grid-lines opacity-25 [mask-image:radial-gradient(70%_46%_at_50%_0%,black,transparent)]" />
        <div className="absolute left-1/2 top-[-22rem] h-[38rem] w-[64rem] -translate-x-1/2 rounded-full bg-primary/7 blur-3xl" />
        <div className="absolute bottom-[-24rem] right-[-18rem] h-[38rem] w-[38rem] rounded-full bg-info/5 blur-3xl" />
      </div>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <ToastProvider>
          <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-6 lg:p-10">
            {children}
          </main>
        </ToastProvider>
      </div>
    </div>
  );
}
