package calculator

import (
	"errors"
	"math"
	"testing"
)

// Each test uses a table of cases: this is the idiomatic Go way to cover many
// inputs without duplicating the assertion logic per case.
func TestAdd(t *testing.T) {
	cases := []struct {
		name string
		a, b float64
		want float64
	}{
		{"positive numbers", 2, 3, 5},
		{"negative numbers", -2, -3, -5},
		{"mixed signs", -2, 3, 1},
		{"zero", 0, 0, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := Add(c.a, c.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != c.want {
				t.Errorf("Add(%v, %v) = %v, want %v", c.a, c.b, got, c.want)
			}
		})
	}
}

func TestSubtract(t *testing.T) {
	cases := []struct {
		name string
		a, b float64
		want float64
	}{
		{"positive result", 10, 4, 6},
		{"negative result", 4, 10, -6},
		{"zero", 5, 5, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := Subtract(c.a, c.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != c.want {
				t.Errorf("Subtract(%v, %v) = %v, want %v", c.a, c.b, got, c.want)
			}
		})
	}
}

func TestMultiply(t *testing.T) {
	cases := []struct {
		name string
		a, b float64
		want float64
	}{
		{"positive numbers", 3, 4, 12},
		{"by zero", 5, 0, 0},
		{"negative numbers", -3, -4, 12},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := Multiply(c.a, c.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != c.want {
				t.Errorf("Multiply(%v, %v) = %v, want %v", c.a, c.b, got, c.want)
			}
		})
	}
}

func TestDivide(t *testing.T) {
	t.Run("normal division", func(t *testing.T) {
		got, err := Divide(10, 2)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got != 5 {
			t.Errorf("Divide(10, 2) = %v, want 5", got)
		}
	})

	t.Run("division by zero", func(t *testing.T) {
		_, err := Divide(10, 0)
		if !errors.Is(err, ErrDivideByZero) {
			t.Errorf("Divide(10, 0) error = %v, want ErrDivideByZero", err)
		}
	})

	t.Run("zero divided by zero", func(t *testing.T) {
		_, err := Divide(0, 0)
		if !errors.Is(err, ErrDivideByZero) {
			t.Errorf("Divide(0, 0) error = %v, want ErrDivideByZero", err)
		}
	})
}

func TestPower(t *testing.T) {
	cases := []struct {
		name           string
		base, exponent float64
		want           float64
	}{
		{"positive base and exponent", 2, 3, 8},
		{"exponent zero", 5, 0, 1},
		{"negative exponent", 2, -1, 0.5},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := Power(c.base, c.exponent)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != c.want {
				t.Errorf("Power(%v, %v) = %v, want %v", c.base, c.exponent, got, c.want)
			}
		})
	}

	t.Run("negative base with fractional exponent is rejected", func(t *testing.T) {
		_, err := Power(-8, 0.5)
		if !errors.Is(err, ErrInvalidResult) {
			t.Errorf("Power(-8, 0.5) error = %v, want ErrInvalidResult", err)
		}
	})
}

func TestSqrt(t *testing.T) {
	t.Run("perfect square", func(t *testing.T) {
		got, err := Sqrt(16)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got != 4 {
			t.Errorf("Sqrt(16) = %v, want 4", got)
		}
	})

	t.Run("zero", func(t *testing.T) {
		got, err := Sqrt(0)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got != 0 {
			t.Errorf("Sqrt(0) = %v, want 0", got)
		}
	})

	t.Run("negative number", func(t *testing.T) {
		_, err := Sqrt(-1)
		if !errors.Is(err, ErrNegativeSqrt) {
			t.Errorf("Sqrt(-1) error = %v, want ErrNegativeSqrt", err)
		}
	})
}

func TestPercentage(t *testing.T) {
	cases := []struct {
		name string
		a, b float64
		want float64
	}{
		{"50 percent of 200", 50, 200, 100},
		{"10 percent of 50", 10, 50, 5},
		{"0 percent of anything", 0, 100, 0},
		{"100 percent of 100", 100, 100, 100},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := Percentage(c.a, c.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != c.want {
				t.Errorf("Percentage(%v, %v) = %v, want %v", c.a, c.b, got, c.want)
			}
		})
	}
}

func TestChecked(t *testing.T) {
	t.Run("NaN is rejected", func(t *testing.T) {
		_, err := checked(math.NaN())
		if !errors.Is(err, ErrInvalidResult) {
			t.Errorf("checked(NaN) error = %v, want ErrInvalidResult", err)
		}
	})

	t.Run("+Inf is rejected", func(t *testing.T) {
		_, err := checked(math.Inf(1))
		if !errors.Is(err, ErrInvalidResult) {
			t.Errorf("checked(+Inf) error = %v, want ErrInvalidResult", err)
		}
	})

	t.Run("finite value passes through", func(t *testing.T) {
		got, err := checked(42)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got != 42 {
			t.Errorf("checked(42) = %v, want 42", got)
		}
	})
}
