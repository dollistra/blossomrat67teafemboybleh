# Secret safety

- Never put Discord webhook URLs, bot tokens, private keys, or service-account files in browser JavaScript or any committed file. Encoding a secret is not protection.
- The application worker reads `DISCORD_WEBHOOK_URL` from a server-side deployment secret. If that worker is in use, set the replacement through its hosting dashboard's Secrets settings; never in `wrangler.toml` or public config.
- The website's public config contains only the API address. Keep it that way.
- Revoke compromised webhooks immediately in Discord Server Settings > Integrations > Webhooks. If the integration still needs a webhook, create a replacement and store it server-side. Do not reuse the old one.
- Enable GitHub secret scanning and push protection where available. The included CI check detects several common credential patterns and reports filenames only; it cannot guarantee that all secrets are detected.
- After cloning, run `git config core.hooksPath .githooks` to enable local checks. Never bypass them to publish a credential.
- If a secret was committed historically, revoking it is the first priority. Coordinate any history rewrite with repository collaborators; do not force-push without approval.
