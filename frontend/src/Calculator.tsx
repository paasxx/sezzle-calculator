import { useState, type FormEvent } from "react";
import { calculate } from "./api/client";
import { OPERATIONS, OPERATIONS_CONFIG } from "./operations";
import type { Operation } from "./types";

function parseNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

function Calculator() {
  const [operation, setOperation] = useState<Operation>("add");
  const [value1, setValue1] = useState("");
  const [value2, setValue2] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Not stored in state — recomputed from `operation` on every render. That's
  // the reactive part: the form doesn't imperatively show/hide inputs, it
  // just renders whatever this lookup says for the current operation.
  const config = OPERATIONS_CONFIG[operation];

  function handleOperationChange(next: Operation) {
    setOperation(next);
    setValue2("");
    setResult(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setResult(null);
    setError(null);

    const a = parseNumber(value1);
    const b = config.secondFieldLabel === null ? 0 : parseNumber(value2);

    if (a === null || b === null) {
      setError("Please enter a valid number in every field.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await calculate(operation, a, b);
      setResult(response.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="calculator">
      <h1>Calculator</h1>

      <form onSubmit={handleSubmit}>
        <select
          value={operation}
          onChange={(e) => handleOperationChange(e.target.value as Operation)}
        >
          {OPERATIONS.map((op) => (
            <option key={op} value={op}>
              {OPERATIONS_CONFIG[op].label}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={value1}
          onChange={(e) => setValue1(e.target.value)}
          placeholder={config.firstFieldLabel}
          aria-label={config.firstFieldLabel}
        />

        {config.secondFieldLabel !== null && (
          <input
            type="number"
            value={value2}
            onChange={(e) => setValue2(e.target.value)}
            placeholder={config.secondFieldLabel}
            aria-label={config.secondFieldLabel}
          />
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Calculating…" : "Calculate"}
        </button>
      </form>

      {result !== null && <p className="result">Result: {result}</p>}
      {error !== null && <p className="error">Error: {error}</p>}
    </main>
  );
}

export default Calculator;
