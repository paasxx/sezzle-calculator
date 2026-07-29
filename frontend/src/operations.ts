import type { Operation } from "./types";

// Drives what the form renders for each operation: how many inputs, and what
// to call them. `secondFieldLabel: null` means "hide the second input" (sqrt
// only takes one number). Nothing here is React — it's plain data, which is
// what lets Calculator.tsx stay a dumb "render what the config says" component.
export interface OperationConfig {
  label: string;
  firstFieldLabel: string;
  secondFieldLabel: string | null;
}

export const OPERATIONS_CONFIG: Record<Operation, OperationConfig> = {
  add: { label: "Addition", firstFieldLabel: "First number", secondFieldLabel: "Second number" },
  subtract: { label: "Subtraction", firstFieldLabel: "First number", secondFieldLabel: "Second number" },
  multiply: { label: "Multiplication", firstFieldLabel: "First number", secondFieldLabel: "Second number" },
  divide: { label: "Division", firstFieldLabel: "First number", secondFieldLabel: "Second number" },
  power: { label: "Power", firstFieldLabel: "Base", secondFieldLabel: "Exponent" },
  sqrt: { label: "Square Root", firstFieldLabel: "Number", secondFieldLabel: null },
  percentage: { label: "Percentage", firstFieldLabel: "Percentage", secondFieldLabel: "Of number" },
};

export const OPERATIONS = Object.keys(OPERATIONS_CONFIG) as Operation[];
