export type Operation =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "power"
  | "sqrt"
  | "percentage";

export interface CalculateResult {
  result: number;
  operation: string;
}
