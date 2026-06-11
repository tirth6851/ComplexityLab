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
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <ToastProvider>
          <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </ToastProvider>
      </div>
    </div>
  );
}
