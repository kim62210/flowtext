# Measurement Profile

Flowtext does not promise universal cross-platform pixel identity.

Instead, it aims to produce predictable output within a documented **measurement profile**.

## A Measurement Profile Includes

- JavaScript runtime
- selected Yoga binding and version
- Pretext version
- font configuration
- locale
- line-height inputs
- output rounding policy

## Current v0.x Direction

Until Flowtext proves a better alternative, the intended Yoga integration path is the official `yoga-layout` package. This implies:

- an async bootstrap boundary for Yoga initialization
- explicit node and config disposal
- version pinning in documentation and tests
- caution around behavior changes introduced by Yoga standards fixes or errata changes

## Why This Exists

Box layout and paragraph measurement depend on runtime and font behavior. Two environments that look similar can still produce small differences in line breaks, widths, heights, or baselines.

Documenting the measurement profile keeps public expectations honest.

## v0.x Policy

Before `1.0.0`, Flowtext may still adjust its default rounding rules, supported environments, and wording around output guarantees.

## v1.0 Readiness Requirement

Before `1.0.0`, Flowtext should be able to state:

- which runtime profiles are officially exercised
- which fonts are used in reproducible tests
- which output differences are considered acceptable
- which limitations are known and documented
- which Yoga package and version are treated as the release baseline
