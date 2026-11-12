# SANEZO X ULTRA

A multi-user bot platform starter with a dark-purple web portal and an Express API.

## Current status

This repository contains the initial web/API scaffold. The pairing screen is intentionally a preview; device pairing is not active yet.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Open http://localhost:3000. Health check: http://localhost:3000/api/health

## Hosting

The app listens on the `PORT` environment variable and binds to `0.0.0.0`, as expected by common Node hosting platforms.

## Security notes

- Never commit `.env`, database passwords, API keys, WhatsApp verification codes, or session credentials.
- Each account must have its own isolated session and explicit owner authorization.
- Add authentication, persistent storage, quotas, abuse prevention, and operational monitoring before inviting users.
- Free hosting plans may sleep or impose CPU, memory, and connection limits; test capacity before advertising support for 100+ users.
- Use official, supported messaging integrations where possible and comply with provider terms and applicable privacy rules.

## License

MIT
