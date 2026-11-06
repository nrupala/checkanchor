# Test plan — CheckAnchor

## Scope

Testing covers the single-page app in `index.html` (credential creation, the
SHA-256 hash chain, verification lookup, wallet persistence) and the
`handshake.js` inter-app message queue. Rendering, styling, and browser
file-download mechanics (export/import file pickers) are out of scope for the
automated suite and are checked manually in a browser before a release.

## Suites

| Suite | Covers | Run it | Runs in CI |
|---|---|---|---|
| Smoke suite (`tests/smoke.test.js`) | Page structure (core element IDs and button wiring); the page's own `sha256()` against the known empty-string SHA-256 vector; credential creation (ID format, GENESIS anchor, skills parsing, localStorage persistence); hash-chain linkage across two credentials; tamper evidence of the digest primitive; verify of an unknown ID; `handshake.js` register/send/receive round-trip | `node tests/smoke.test.js` | Yes — `.github/workflows/tests.yml` |
| Repository structure check | Presence of `index.html`, `README.md`, `LICENSE`, `.gitignore` | (shell steps in the workflow) | Yes — `.github/workflows/ci.yml` |

## CI gates

- Smoke suite green on every push and pull request to `main`.
- CodeQL (javascript-typescript) runs on push, pull request, and weekly; findings are dispositioned per the house SLA (Critical 48 h, High 7 d, Medium 14 d — fix, or a dismissal with the reason recorded).

## Cadence

- Every pull request: smoke suite + structure check + CodeQL.
- Weekly: CodeQL scheduled run.
- Every release candidate: the release-readiness run (checker + evidence reads), per the house Release-Readiness Standard.

## Coverage bar

No numeric floor; new functionality lands with tests per CONTRIBUTING.
