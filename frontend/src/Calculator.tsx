import { useState } from "react";
import { calculate } from "./api/client";

const OPERATOR_SYMBOLS = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
  power: "ˆ",
  percentage: "%",
} as const;

type BinaryOperation = keyof typeof OPERATOR_SYMBOLS;

// float64 (both here and in the Go backend) only carries ~15-17 significant
// digits reliably — beyond that, further digits wouldn't reflect the actual
// value being sent, so there's no point letting the user type them.
const MAX_DISPLAY_LENGTH = 15;

// Shrinks the display font as the text gets longer (e.g. a full "12345678 +
// 87654321" expression) instead of clipping it off-screen.
function screenFontSize(text: string): string {
  if (text.length <= 8) return "40px";
  if (text.length <= 12) return "32px";
  if (text.length <= 18) return "24px";
  if (text.length <= 24) return "19px";
  return "16px";
}

function Calculator() {
  const [display, setDisplay] = useState("0");
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operation, setOperation] = useState<BinaryOperation | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Once the second number has started being typed, block picking a
  // different operator — avoids the ambiguity of "what happens to the
  // half-typed number" that real chained-calculator logic has to resolve.
  const secondOperandInProgress = operation !== null && !waitingForSecondOperand;

  function inputDigit(digit: string) {
    if (error) return;
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
      return;
    }
    setDisplay((prev) => {
      if (prev === "0") return digit;
      if (prev.length >= MAX_DISPLAY_LENGTH) return prev;
      return prev + digit;
    });
  }

  function inputDecimal() {
    if (error) return;
    if (waitingForSecondOperand) {
      setDisplay("0.");
      setWaitingForSecondOperand(false);
      return;
    }
    setDisplay((prev) => {
      if (prev.includes(".") || prev.length >= MAX_DISPLAY_LENGTH) return prev;
      return prev + ".";
    });
  }

  function backspace() {
    if (error || waitingForSecondOperand) return;
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
  }

  function clearAll() {
    setDisplay("0");
    setFirstOperand(null);
    setOperation(null);
    setWaitingForSecondOperand(false);
    setError(null);
  }

  function selectOperator(nextOperation: BinaryOperation) {
    if (error || secondOperandInProgress) return;
    setFirstOperand(Number(display));
    setOperation(nextOperation);
    setWaitingForSecondOperand(true);
  }

  async function applySqrt() {
    if (error || isBusy) return;
    setIsBusy(true);
    try {
      const response = await calculate("sqrt", Number(display), 0);
      setDisplay(String(response.result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function equals() {
    if (operation === null || firstOperand === null || isBusy) return;
    setIsBusy(true);
    try {
      const secondOperand = Number(display);
      // Percentage is entered "base, %, percent" (200, %, 50 -> 50% of 200),
      // matching how most calculators do it — but the backend's contract is
      // Percentage(a=percent, b=base), so the two get swapped only here.
      const response =
        operation === "percentage"
          ? await calculate("percentage", secondOperand, firstOperand)
          : await calculate(operation, firstOperand, secondOperand);
      setDisplay(String(response.result));
      setFirstOperand(null);
      setOperation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsBusy(false);
      setWaitingForSecondOperand(false);
    }
  }

  // One line, built from current state — no separate "expression" row that
  // could end up repeating the first number while it's still frozen.
  const screenText =
    operation === null
      ? display
      : waitingForSecondOperand
        ? `${firstOperand} ${OPERATOR_SYMBOLS[operation]}`
        : `${firstOperand} ${OPERATOR_SYMBOLS[operation]} ${display}`;

  const shownText = error ? "Error" : screenText;

  return (
    <main className="calculator">
      <h1>Calculator</h1>
      <div className="screen">
        <div
          className="display"
          data-testid="display"
          style={{ fontSize: screenFontSize(shownText) }}
        >
          {shownText}
        </div>
      </div>
      {error && <p className="error-text">Error: {error}</p>}

      <div className="keypad">
        <button onClick={clearAll} className="key key-clear">C</button>
        <button onClick={backspace} className="key key-function">⌫</button>
        <button onClick={() => selectOperator("percentage")} className="key key-operator">{OPERATOR_SYMBOLS.percentage}</button>
        <button onClick={() => selectOperator("divide")} className="key key-operator">{OPERATOR_SYMBOLS.divide}</button>

        <button onClick={() => inputDigit("7")} className="key">7</button>
        <button onClick={() => inputDigit("8")} className="key">8</button>
        <button onClick={() => inputDigit("9")} className="key">9</button>
        <button onClick={() => selectOperator("multiply")} className="key key-operator">{OPERATOR_SYMBOLS.multiply}</button>

        <button onClick={() => inputDigit("4")} className="key">4</button>
        <button onClick={() => inputDigit("5")} className="key">5</button>
        <button onClick={() => inputDigit("6")} className="key">6</button>
        <button onClick={() => selectOperator("subtract")} className="key key-operator">{OPERATOR_SYMBOLS.subtract}</button>

        <button onClick={() => inputDigit("1")} className="key">1</button>
        <button onClick={() => inputDigit("2")} className="key">2</button>
        <button onClick={() => inputDigit("3")} className="key">3</button>
        <button onClick={() => selectOperator("add")} className="key key-operator">{OPERATOR_SYMBOLS.add}</button>

        <button onClick={applySqrt} className="key key-function">√</button>
        <button onClick={() => inputDigit("0")} className="key">0</button>
        <button onClick={inputDecimal} className="key">.</button>
        <button onClick={() => selectOperator("power")} className="key key-operator">{OPERATOR_SYMBOLS.power}</button>

        <button
          onClick={equals}
          className="key key-equals"
          disabled={isBusy || operation === null}
        >
          {isBusy ? "…" : "="}
        </button>
      </div>
    </main>
  );
}

export default Calculator;
