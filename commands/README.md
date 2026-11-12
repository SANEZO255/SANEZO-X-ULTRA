# SANEZO X ULTRA Commands

Commands are implemented as JavaScript modules and registered in `lib/commands.js`.

Included: `.menu`, `.ping`, `.alive`.

## Local smoke test

From the repository root, run:

```bash
node --input-type=module -e 'import {runCommand} from "./lib/commands.js"; console.log(await runCommand(".menu"))'
```

These commands currently run locally only. No WhatsApp integration, pairing, or persistent session hosting has been implemented. Do not expose an unauthenticated command execution API.
