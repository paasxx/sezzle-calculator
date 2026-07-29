import type { CalculateResult, Operation } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function post(path: string, body: unknown): Promise<CalculateResult> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }

  return data as CalculateResult;
}

// Each operation expects different fields (sqrt only takes "a", power takes
// "base"/"exponent"), so the request shape is built per operation here rather
// than always sending {a, b} — the backend rejects unexpected fields.
export function calculate(
  operation: Operation,
  a: number,
  b: number,
): Promise<CalculateResult> {
  switch (operation) {
    case "sqrt":
      return post("/api/v1/sqrt", { a });
    case "power":
      return post("/api/v1/power", { base: a, exponent: b });
    default:
      return post(`/api/v1/${operation}`, { a, b });
  }
}
