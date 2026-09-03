import { describe, expect, it } from "vitest";
import { shouldAttemptProxyRedeem } from "./access";

describe("shouldAttemptProxyRedeem", () => {
  it("skips the proxy in local development unless an explicit URL is configured", () => {
    expect(
      shouldAttemptProxyRedeem({
        env: { DEV: true, VITE_REDEEM_PROXY_URL: "" },
      }),
    ).toBe(false);
  });

  it("uses the proxy when a dedicated URL is configured in production", () => {
    expect(
      shouldAttemptProxyRedeem({
        env: { DEV: false, VITE_REDEEM_PROXY_URL: "https://example.com/api/redeem-access" },
      }),
    ).toBe(true);
  });
});
