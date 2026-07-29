// Package calculator implements the arithmetic operations exposed by the API.
// It has no knowledge of HTTP, JSON, or transport concerns — just pure
// functions over float64 that return an error when the operation is invalid.
package calculator

import (
	"errors"
	"math"
)

var (
	ErrDivideByZero  = errors.New("division by zero")
	ErrNegativeSqrt  = errors.New("cannot take square root of a negative number")
	ErrInvalidResult = errors.New("operation produced a non-finite result")
)

func Add(a, b float64) (float64, error) {
	return checked(a + b)
}

func Subtract(a, b float64) (float64, error) {
	return checked(a - b)
}

func Multiply(a, b float64) (float64, error) {
	return checked(a * b)
}

func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivideByZero
	}
	return checked(a / b)
}

func Power(base, exponent float64) (float64, error) {
	return checked(math.Pow(base, exponent))
}

func Sqrt(a float64) (float64, error) {
	if a < 0 {
		return 0, ErrNegativeSqrt
	}
	return checked(math.Sqrt(a))
}

// Percentage returns a% of b (e.g. Percentage(50, 200) == 100).
func Percentage(a, b float64) (float64, error) {
	return checked((a / 100) * b)
}

// checked rejects results that overflowed to +/-Inf or NaN (e.g. a fractional
// power of a negative base), so callers never see a "successful" bogus value.
func checked(result float64) (float64, error) {
	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrInvalidResult
	}
	return result, nil
}
