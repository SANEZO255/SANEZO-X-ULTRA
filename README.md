# SANEZO X ULTRA

Website and Node.js backend starter for a future messaging bot service.

## Status

- Website: static Vercel deployment from `website/`.
- Commands: `.menu`, `.ping`, `.alive` registered in `lib/commands.js`.
- Backend: authenticated command API, ready for testing on a separate Node host.
- **Not yet connected to WhatsApp**: no WhatsApp provider credentials, webhook integration, device pairing, user sessions, or production backend hosting is configured.

## Local setup

Install Node.js 20+, then:

```bash
npm install
cp .env.example .env
npm test
npm start
```

Set `COMMAND_API_KEY` to a long randomly generated secret in your local `.env` or host's secret settings. Never commit it.

## API

- `GET /api/health` — public health check
- `GET /api/commands` — requires `x-api-key` header
- `POST /api/commands/execute` — requires `x-api-key` header and JSON body `{"message":".ping"}`

The execute API is for a trusted backend integration only; do not expose your key in browser code or the public Vercel website. The command endpoint does not send WhatsApp messages.

## Deployment

Vercel hosts the static `website/` directory. Deploy the Node backend separately on a service that supports Node.js processes and environment secrets. Free tiers may sleep or have usage limits. Connect a supported messaging provider only after configuring authenticated webhook verification, user consent, and secure session handling.

## Security

- Never commit passwords, `.env`, API keys, verification codes, or session credentials.
- Keep each user's account data isolated and require explicit account-owner authorization.
- Add persistent storage, authentication, quotas, and monitoring before opening multi-user access.
- Follow messaging provider rules; do not send unsolicited messages.

## License

MIT
