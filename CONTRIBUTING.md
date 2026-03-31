# Contributing to Flowtext

Thanks for your interest in Flowtext.

## Ground Rules

- Keep all code, comments, documentation, examples, issue templates, and review notes in English.
- Prefer small, focused pull requests with one clear responsibility.
- Do not expand scope casually. Flowtext intentionally starts as a small layout core.
- Document limitations honestly. If a behavior depends on runtime, font, or locale constraints, say so explicitly.

## Development Workflow

1. Start from a clean branch or worktree.
2. Write or update the failing test first when changing behavior.
3. Implement the smallest possible change.
4. Run the relevant verification commands.
5. Update docs when public behavior, guarantees, or limitations change.

## Commit Style

Use commit messages in the form:

```text
feat: add layout result schema version

- describe the functional change
- note any public contract impact
- mention verification scope when helpful
```

Allowed prefixes:

- `feat`
- `fix`
- `bug`
- `refactor`
- `docs`

Non-trivial commits should include a 3-5 line body that explains the user-visible or maintainer-relevant change.

## Pull Requests

Pull requests should include:

- a clear summary
- verification steps
- documentation updates when public behavior changes
- explicit mention of limitations or known follow-up work

## Reporting Bugs

Bug reports are most useful when they include:

- the runtime environment
- font information
- locale information
- a minimal input tree
- the actual output and the expected output

## Security

Please follow `SECURITY.md` for security reporting.
