# CheckAnchor - Blockchain Credential Anchoring

Create verifiable 50-year credentials anchored with SHA-256 hash chain.

## Features

- **Credential Creation**: Anchor skills, certificates, achievements
- **SHA-256 Hashing**: Cryptographic integrity via hash chain
- **Verification**: Verify credentials instantly
- **Wallet**: Export/import credentials as JSON
- **50-Year Validity**: Credentials persist indefinitely

## Usage

1. Open `index.html` in browser
2. Fill in credential details (name, issuer, skills)
3. Click "Anchor Credential"
4. Credential is hashed and stored in localStorage

## API

```javascript
// Create credential
const cred = await sha256(JSON.stringify(data));

// Verify credential
const valid = await verifyCredential(id);

// Export wallet
exportWallet(); // Downloads JSON file

// Import wallet  
importWallet(); // Import from JSON file
```

## Security

- Uses Web Crypto API for SHA-256
- Hash chain ensures integrity
- No server - all local

## License

MIT