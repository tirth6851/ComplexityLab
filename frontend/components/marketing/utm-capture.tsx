"use client";

import { useEffect } from "react";
import { parseUtmParams, storeUtmParams } from "@/lib/utm";

/**
 * Mount once, anywhere in the tree — renders nothing, just captures
 * first-touch UTM params from the landing URL into localStorage on mount.
 * See `lib/utm.ts` for the honest caveat: capture only, nothing consumes
 * this yet.
 *
 * Deliberately reads `window.location.search` directly instead of
 * `next/navigation`'s `useSearchParams()`. That hook requires the caller
 * to sit inside a `<Suspense>` boundary in the App Router, which would
 * force whoever mounts this component (e.g. the root layout) to add one
 * just for this. This component only needs the query string once, on
 * first client paint — it doesn't need to react to subsequent
 * client-side navigations — so reading `window.location.search` directly
 * gets the same result without imposing that constraint on the caller.
 */
export function UtmCapture() {
  useEffect(() => {
    const params = parseUtmParams(window.location.search);
    if (params) storeUtmParams(params);
  }, []);

  return null;
}
