import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Calculator from "./Calculator";
import { calculate } from "./api/client";

vi.mock("./api/client", () => ({
  calculate: vi.fn(),
}));

const mockedCalculate = vi.mocked(calculate);

// Buttons, not the display div, so a result like "0" never collides with the
// "0" digit key — getByText would match both.
function key(name: string) {
  return screen.getByRole("button", { name });
}

function display() {
  return screen.getByTestId("display");
}

beforeEach(() => {
  mockedCalculate.mockReset();
});

describe("Calculator", () => {
  it("computes a basic addition: 12 + 3 = 15", async () => {
    mockedCalculate.mockResolvedValue({ result: 15, operation: "add" });
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(key("1"));
    await user.click(key("2"));
    await user.click(key("+"));
    await user.click(key("3"));
    await user.click(key("="));

    expect(mockedCalculate).toHaveBeenCalledWith("add", 12, 3);
    await waitFor(() => expect(display()).toHaveTextContent("15"));
  });

  it("applies square root immediately, without pressing =", async () => {
    mockedCalculate.mockResolvedValue({ result: 3, operation: "sqrt" });
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(key("9"));
    await user.click(key("√"));

    expect(mockedCalculate).toHaveBeenCalledWith("sqrt", 9, 0);
    await waitFor(() => expect(display()).toHaveTextContent("3"));
  });

  it("enters percentage as base, then %, then percent (200, %, 50 -> 50% of 200)", async () => {
    mockedCalculate.mockResolvedValue({ result: 100, operation: "percentage" });
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(key("2"));
    await user.click(key("0"));
    await user.click(key("0"));
    await user.click(key("%"));
    await user.click(key("5"));
    await user.click(key("0"));
    await user.click(key("="));

    // API contract is percentage(a=percent, b=base): percent (50) typed
    // second, base (200) typed first — swapped from typing order on purpose.
    expect(mockedCalculate).toHaveBeenCalledWith("percentage", 50, 200);
  });

  it("shows the backend's error message and blocks further input until C is pressed", async () => {
    mockedCalculate.mockRejectedValue(new Error("division by zero"));
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(key("1"));
    await user.click(key("0"));
    await user.click(key("÷"));
    await user.click(key("0"));
    await user.click(key("="));

    await waitFor(() =>
      expect(screen.getByText("Error: division by zero")).toBeInTheDocument(),
    );
    expect(display()).toHaveTextContent("Error");

    await user.click(key("C"));
    expect(display()).toHaveTextContent("0");
    expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
  });

  it("backspace removes the last typed digit", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(key("4"));
    await user.click(key("5"));
    await user.click(key("6"));
    await user.click(key("⌫"));

    expect(display()).toHaveTextContent("45");
  });

  it("only allows one decimal point per number", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(key("7"));
    await user.click(key("."));
    await user.click(key("8"));
    await user.click(key("."));
    await user.click(key("9"));

    expect(display()).toHaveTextContent("7.89");
  });

  it("computes multiplication, subtraction, and power with the remaining digit/operator keys", async () => {
    mockedCalculate.mockResolvedValue({ result: 42, operation: "multiply" });
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(key("8"));
    await user.click(key("×"));
    await user.click(key("6"));
    await user.click(key("="));
    expect(mockedCalculate).toHaveBeenCalledWith("multiply", 8, 6);

    await user.click(key("C"));
    mockedCalculate.mockResolvedValue({ result: 4, operation: "subtract" });
    await user.click(key("9"));
    await user.click(key("−"));
    await user.click(key("5"));
    await user.click(key("="));
    expect(mockedCalculate).toHaveBeenCalledWith("subtract", 9, 5);

    await user.click(key("C"));
    mockedCalculate.mockResolvedValue({ result: 8, operation: "power" });
    await user.click(key("2"));
    await user.click(key("ˆ"));
    await user.click(key("3"));
    await user.click(key("="));
    expect(mockedCalculate).toHaveBeenCalledWith("power", 2, 3);
  });

  it("blocks switching operators once the second number has started being typed", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(key("5"));
    await user.click(key("+"));
    await user.click(key("2"));
    // A second operand digit has been typed, so this must be ignored — the
    // only valid next moves are more digits, "=", or "C".
    await user.click(key("×"));

    expect(display()).toHaveTextContent("5 + 2");
  });

  it("shows the backend's error message when sqrt is rejected", async () => {
    mockedCalculate.mockRejectedValue(
      new Error("cannot take square root of a negative number"),
    );
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(key("9"));
    await user.click(key("√"));

    await waitFor(() =>
      expect(
        screen.getByText("Error: cannot take square root of a negative number"),
      ).toBeInTheDocument(),
    );
  });
});
