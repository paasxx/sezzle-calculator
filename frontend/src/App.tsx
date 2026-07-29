import { useState } from "react";
import { calculate } from "./api/client";
import type { Operation } from "./types";
import "./App.css";

const OPERATIONS: { value: Operation; label: string }[] = [
  { value: "add", label: "Addition" },
  { value: "subtract", label: "Subtraction" },
  { value: "multiply", label: "Multiplication" },
  { value: "divide", label: "Division" },
  { value: "power", label: "Power" },
  { value: "sqrt", label: "Square Root" },
  { value: "percentage", label: "Percentage" },
];

function App() {
  const [operation, setOperation] = useState<Operation>("add");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    try {
      const response = await calculate(operation, Number(a), Number(b));
      setResult(response.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  return (
    <main className="calculator">
      <h1>Calculator</h1>

      <form onSubmit={handleSubmit}>
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value as Operation)}
        >
          {OPERATIONS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="a"
        />
        <input
          type="number"
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder="b"
        />

        <button type="submit">Calculate</button>
      </form>

      {result !== null && <p className="result">Result: {result}</p>}
      {error !== null && <p className="error">{error}</p>}
    </main>
  );
}

export default App;
