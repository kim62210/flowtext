# Error Model

Flowtext treats invalid input and unsupported behavior as explicit public errors.

## Public Error Codes

### `INVALID_NODE`

Raised when the input tree shape is structurally invalid.

Examples:

- a node is missing required identity or type information
- a text node contains incompatible child structure
- a public field has the wrong primitive type

### `UNSUPPORTED_STYLE`

Raised when a caller uses a style outside the documented v1 subset.

Examples:

- unsupported positioning properties
- unsupported text layout flags
- style combinations intentionally deferred from the first public release line

### `MEASURE_FAILED`

Raised when Flowtext cannot complete paragraph measurement safely.

Examples:

- missing or unusable measurement inputs
- runtime limitations that prevent text measurement
- unexpected failures inside the text measurement adapter

## Design Rules

- no silent fallback for unsupported public input
- no swallowing errors from the measurement boundary
- public documentation should describe the category of each public error code
- internal implementation details may be wrapped, but the public error code must remain stable once committed to the public API
