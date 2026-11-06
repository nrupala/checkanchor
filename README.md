# CheckAnchor — Blockchain Credential Anchoring

CheckAnchor creates verifiable, long-lived credentials anchored in a SHA-256 hash chain, entirely in your browser.

You enter a credential — a certificate, licence, or achievement, with its issuer, dates, and skills — and CheckAnchor hashes it with the Web Crypto API and links it to the hash of the credential before it, forming a chain that starts at a `GENESIS` anchor. Any later change to a credential changes its digest, so a stored credential can be checked against the chain. Everything runs locally: there is no server, no account, and no network call; the wallet lives in your browser's `localStorage`.

## What it does

- **Create credentials** — name, issuer, issue date, optional expiry date, a comma-separated skills list, and optional JSON metadata.
- **Anchor with SHA-256** — each credential's hash is computed over the credential plus the previous credential's hash (`GENESIS` for the first), using `crypto.subtle.digest` (Web Crypto).
- **Preview the hash** — see the SHA-256 digest of the form contents before anchoring.
- **Verify by ID** — look a credential up by its `CA-<year>-<sequence>` ID and see its stored hash, previous-hash link, and anchoring time.
- **Wallet** — credentials are kept in `localStorage`; the wallet can be exported to a JSON file and imported back.
- **Explore** — a simple view of the first blocks of the chain, with a simulate-new-block action.
- **Handshake helper** — `handshake.js` provides a small localStorage-based message queue (`CheckinfoHandshake`) for inter-app communication between CheckAnchor-family apps: register, discover, send, and receive.

## How to use it

1. Clone or download this repository.
2. Open `index.html` in any modern browser (no build step, no server needed).
3. On the **Create** tab, fill in the credential name and issuer (skills and dates are optional), then click **Anchor Credential**.
4. Find the credential and its ID on the **Wallet** tab; check it any time on the **Verify** tab.
5. Use **Export Wallet** / **Import Wallet** on the Wallet tab to back up or restore your credentials as JSON.

## Development

- Run the tests: `node tests/smoke.test.js` (Node 18+, no dependencies — the suite loads the page's own script and exercises the SHA-256 hash chain, credential creation, and the handshake queue).
- CI runs the same suite on every push and pull request (`.github/workflows/tests.yml`), alongside the repository-structure check in `.github/workflows/ci.yml`.
- The test plan (scope, suites, gates, cadence) lives in [TEST-PLAN.md](TEST-PLAN.md).

## Security

Found a vulnerability? Please report it privately — see [SECURITY.md](SECURITY.md) for the reporting route (GitHub Private Vulnerability Reporting). Do not open a public issue for a security vulnerability.

## Contributing

Contributions are welcome — the process is in [CONTRIBUTING.md](CONTRIBUTING.md). Note its PR-flow discipline: changes land through pull requests, every PR adds a CHANGELOG entry, and the version in `index.html` and `handshake.js` is kept in sync.

## License

MIT — see [LICENSE](LICENSE).
