import { afterEach, describe, expect, it, vi } from "vitest";
import { calculate } from "./client";

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status < 400,
      json: () => Promise.resolve(body),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("calculate", () => {
  it("sends {a, b} for a binary operation like add", async () => {
    mockFetchOnce(200, { result: 15, operation: "add" });

    const result = await calculate("add", 10, 5);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/add"),
      expect.objectContaining({ body: JSON.stringify({ a: 10, b: 5 }) }),
    );
    expect(result).toEqual({ result: 15, operation: "add" });
  });

  it("sends only {a} for sqrt, ignoring the second argument", async () => {
    mockFetchOnce(200, { result: 4, operation: "sqrt" });

    await calculate("sqrt", 16, 999);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/sqrt"),
      expect.objectContaining({ body: JSON.stringify({ a: 16 }) }),
    );
  });

  it("sends {base, exponent} for power", async () => {
    mockFetchOnce(200, { result: 8, operation: "power" });

    await calculate("power", 2, 3);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/power"),
      expect.objectContaining({ body: JSON.stringify({ base: 2, exponent: 3 }) }),
    );
  });

  it("throws the backend's error message on a 4xx response", async () => {
    mockFetchOnce(400, { error: "division by zero" });

    await expect(calculate("divide", 10, 0)).rejects.toThrow("division by zero");
  });
});
