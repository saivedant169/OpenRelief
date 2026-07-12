# Architecture

OpenRelief V1 uses a local-first web architecture.

## Layers

- `packages/core`: domain logic with no React dependency.
- `apps/web`: React interface and browser adapters.
- `packages/evals`: synthetic cases and graders.
- `plans`: planning and safety source of truth.

## Key Constraint

V1 does not need a backend. Browser-local state keeps PII off remote systems while the workflow is proven.

## Data Flow

```text
letter text
  -> letter classification
  -> risk detection
  -> checklist generation
  -> evidence packet outline
  -> source-backed review UI
```

