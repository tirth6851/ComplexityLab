import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Route protection (Next.js 16 "proxy" convention — replaces middleware.ts).
 * Everything is public by default; routes matched below require an authenticated
 * Clerk session. `auth.protect()` redirects signed-out users to the sign-in URL.
 */
/** Route patterns that require an authenticated session (exported for tests). */
export const PROTECTED_ROUTES = [
  "/dashboard(.*)",
  "/analyzer(.*)",
  "/analyses(.*)",
  "/snippets(.*)",
  "/playground(.*)",
  "/settings(.*)",
] as const;

const isProtectedRoute = createRouteMatcher([...PROTECTED_ROUTES]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Send signed-out visitors to the branded in-app sign-in page rather
    // than Clerk's hosted accounts.dev page.
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", req.url).toString(),
    });
  }
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets...
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // ...and always run on API routes.
    "/(api|trpc)(.*)",
  ],
};
