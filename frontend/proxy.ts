import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Route protection (Next.js 16 "proxy" convention — replaces middleware.ts).
 * Everything is public by default; routes matched below require an authenticated
 * Clerk session. `auth.protect()` redirects signed-out users to the sign-in URL.
 */
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/lab(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
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
