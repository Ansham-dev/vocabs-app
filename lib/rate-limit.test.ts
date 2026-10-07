import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter (sliding window)", () => {
  it("allows up to the limit, then denies", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(true);
    const last = rl.check("a");
    expect(last.allowed).toBe(true);
    expect(last.remaining).toBe(0);
    const denied = rl.check("a");
    expect(denied.allowed).toBe(false);
    expect(denied.resetMs).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check("alice").allowed).toBe(true);
    expect(rl.check("alice").allowed).toBe(false);
    expect(rl.check("bob").allowed).toBe(true);
  });

  it("slides the window with an injected clock", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect(rl.check("k").allowed).toBe(true);
    expect(rl.check("k").allowed).toBe(true);
    expect(rl.check("k").allowed).toBe(false);
    t += 1001; // first two hits fall out of the window
    const ok = rl.check("k");
    expect(ok.allowed).toBe(true);
    expect(ok.remaining).toBe(1);
  });

  it("reports remaining counts without consuming", () => {
    const rl = createRateLimiter({ limit: 15, windowMs: 1000 });
    expect(rl.count("ip:1")).toBe(0);
    rl.check("ip:1");
    rl.check("ip:1");
    expect(rl.count("ip:1")).toBe(2);
  });
});
