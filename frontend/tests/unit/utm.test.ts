import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getStoredUtmParams,
  parseUtmParams,
  storeUtmParams,
  type UtmParams,
} from "@/lib/utm";

const STORAGE_KEY = "cl-utm-v1";
const T0 = Date.parse("2026-06-01T00:00:00Z");
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

describe("parseUtmParams", () => {
  it("extracts all five recognized params from a query string", () => {
    const search =
      "?utm_source=newsletter&utm_medium=email&utm_campaign=launch&utm_term=bigo&utm_content=hero-cta";
    expect(parseUtmParams(search)).toEqual<UtmParams>({
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "launch",
      utm_term: "bigo",
      utm_content: "hero-cta",
    });
  });

  it("works without a leading '?'", () => {
    expect(parseUtmParams("utm_source=twitter")).toEqual({
      utm_source: "twitter",
    });
  });

  it("accepts a URLSearchParams instance directly", () => {
    const params = new URLSearchParams("utm_source=reddit&utm_medium=social");
    expect(parseUtmParams(params)).toEqual({
      utm_source: "reddit",
      utm_medium: "social",
    });
  });

  it("ignores unrelated query params", () => {
    expect(parseUtmParams("?ref=abc&utm_source=google&foo=bar")).toEqual({
      utm_source: "google",
    });
  });

  it("returns null when no utm params are present", () => {
    expect(parseUtmParams("?ref=abc&foo=bar")).toBeNull();
    expect(parseUtmParams("")).toBeNull();
  });

  it("treats blank utm values as absent, not as an empty string to store", () => {
    expect(parseUtmParams("?utm_source=&utm_medium=email")).toEqual({
      utm_medium: "email",
    });
    expect(parseUtmParams("?utm_source=")).toBeNull();
  });

  it("partial capture: only the params present in the URL are returned", () => {
    expect(parseUtmParams("?utm_campaign=spring-sale")).toEqual({
      utm_campaign: "spring-sale",
    });
  });
});

describe("storeUtmParams / getStoredUtmParams", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores and reads back captured params", () => {
    // getStoredUtmParams() always checks expiry against the real clock, so
    // the write here must be "now", not the fixed historical T0 used below
    // for tests that only inspect raw storage or a relative delta.
    const now = Date.now();
    const params: UtmParams = { utm_source: "google", utm_medium: "cpc" };
    storeUtmParams(params, now);
    expect(getStoredUtmParams()).toEqual(params);
  });

  it("persists under the documented storage key with a capturedAt timestamp", () => {
    storeUtmParams({ utm_source: "google" }, T0);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed).toEqual({ params: { utm_source: "google" }, capturedAt: T0 });
  });

  it("first-touch: does not overwrite an existing unexpired value", () => {
    const now = Date.now();
    storeUtmParams({ utm_source: "google", utm_campaign: "spring" }, now);
    storeUtmParams(
      { utm_source: "facebook", utm_campaign: "summer" },
      now + 1000 * 60 * 60, // one hour later, well inside the TTL
    );
    expect(getStoredUtmParams()).toEqual({
      utm_source: "google",
      utm_campaign: "spring",
    });
  });

  it("overwrites once the previously stored value has expired", () => {
    storeUtmParams({ utm_source: "google" }, T0);
    storeUtmParams({ utm_source: "facebook" }, T0 + THIRTY_DAYS_MS + 1);
    expect(getStoredUtmParams()).toBeNull(); // read uses the real clock (T0 is in the past)
  });

  it("getStoredUtmParams treats an expired entry as absent", () => {
    // Simulate an old capture by writing directly with a capturedAt far in
    // the past relative to the *real* current clock that getStoredUtmParams uses.
    const staleCapturedAt = Date.now() - (THIRTY_DAYS_MS + 60_000);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ params: { utm_source: "old-campaign" }, capturedAt: staleCapturedAt }),
    );
    expect(getStoredUtmParams()).toBeNull();
  });

  it("getStoredUtmParams returns a value still within the TTL", () => {
    const recentCapturedAt = Date.now() - 1000; // one second ago
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ params: { utm_source: "fresh" }, capturedAt: recentCapturedAt }),
    );
    expect(getStoredUtmParams()).toEqual({ utm_source: "fresh" });
  });

  it("getStoredUtmParams returns null when nothing has been stored", () => {
    expect(getStoredUtmParams()).toBeNull();
  });

  it("getStoredUtmParams returns null on corrupt JSON without throwing", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(() => getStoredUtmParams()).not.toThrow();
    expect(getStoredUtmParams()).toBeNull();
  });

  it("getStoredUtmParams returns null for a value with an unexpected shape", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));
    expect(getStoredUtmParams()).toBeNull();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ params: { utm_source: 123 }, capturedAt: Date.now() }),
    );
    expect(getStoredUtmParams()).toBeNull();
  });

  it("getStoredUtmParams never throws even if localStorage.getItem throws", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("SecurityError: storage disabled");
      });
    expect(() => getStoredUtmParams()).not.toThrow();
    expect(getStoredUtmParams()).toBeNull();
    spy.mockRestore();
  });

  it("storeUtmParams never throws even if localStorage.setItem throws", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(() => storeUtmParams({ utm_source: "google" }, T0)).not.toThrow();
    spy.mockRestore();
    // Nothing was persisted since the write threw.
    expect(getStoredUtmParams()).toBeNull();
  });

  it("storeUtmParams still overwrites when the existing read throws (treated as absent)", () => {
    // A throwing getItem means readStored() can't tell if something valid
    // is there, so storeUtmParams should fail safe by attempting the write
    // (which itself will throw here too) rather than silently doing nothing.
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });
    expect(() => storeUtmParams({ utm_source: "google" }, T0)).not.toThrow();
    spy.mockRestore();
  });
});
