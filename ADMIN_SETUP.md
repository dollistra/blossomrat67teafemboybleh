# Blossom Vale website setup

## Live server status

The home page reads one public document from Cloud Firestore:

- Collection: `siteConfig`
- Document: `serverStats`
- `status`: `online`, `offline`, or `maintenance`
- `restartedAt`: timestamp

The player count is queried from MCStatus using the Java address in `mcstatus-config.js`.

## Staff application delivery

New Helper and Content Creator applications are sent to the private Discord channel attached to a Cloudflare Worker webhook. Answers are included in a `.txt` attachment; Content Creator submissions also include the compressed YouTube Studio proof image. The Worker keeps the Discord webhook secret server-side, validates fields, checks the upload type and size, applies an approximate per-IP rate limit (5 submissions per minute), and blocks cross-origin requests from other sites. The Worker does not store application records in Firebase. Review new applications in the Discord channel. The `/review-114f3c61cfb6` panel remains for older applications previously stored in Firestore.

### Important: rotate the webhook first

The webhook URL was pasted into a chat, so treat that URL as exposed. Delete it in Discord and create a replacement webhook in the intended private staff review channel before deployment. Do not put the replacement URL in this repository, a website JavaScript file, or a message.

### Deploy the Worker

Install Node.js, then from `staff-applications-worker` run:

```powershell
npx wrangler login
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler deploy
```

When prompted for `DISCORD_WEBHOOK_URL`, paste the newly rotated webhook URL into the terminal prompt. It is stored as a Cloudflare Worker secret and is not included in deploy output or source control. Cloudflare Workers Free has a daily request limit; the rate limit binding in `wrangler.toml` is approximate per Cloudflare location, so it is an anti-spam speed bump rather than a strict global quota. Because this first-pass limiter keys on IP, people sharing one network could hit it together.

Wrangler prints the deployed `workers.dev` URL. Copy that URL and edit `submitUrl` in `staff-application-config.js` to append `/submit`, for example:

```js
submitUrl: "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/submit"
```

That config file is public and contains only the endpoint, never the webhook secret. Then publish the website using the Hosting instructions below. Until the Worker is deployed and its URL is configured and published, the form will show an unavailable message instead of silently losing applications.

### Review access and privacy

The webhook posts to the channel where it was created. Keep that channel private and grant access only to staff who review applications. The embed suppresses user and role mentions; complete answers and the creator screenshot are attached for staff review. Delete application messages when they are no longer needed. Applicants can request a copy or deletion by emailing `hello@blossomvale.world`.

## Local preview

Run `npm start` in the website folder and open `http://localhost:3000`. For local form submission, temporarily set `ALLOW_LOCAL_ORIGIN = "true"` in the Worker environment and include `http://localhost:3000` as the configured endpoint in the local config. Turn local-origin access back off before deploying the production Worker. Do not use a webhook URL from browser code.

## Deploy to Firebase Hosting

The Firebase project alias is set to `blossomvale-9721c`. From the website folder, after updating `staff-application-config.js`, publish the site with:

```powershell
firebase deploy --only hosting
```

Firestore still supplies the live server status and supports the legacy reviewer panel. The public application form no longer calls or requires the Firebase Cloud Function, so do not deploy `submitStaffApplication` for new applications. Firebase web app settings in `firebase-config.js` are public configuration, not credentials.

## Staff applications now go through the Discord bot (updated 17 Nov 2026)

The application form no longer posts to a Discord webhook. It logs the applicant in with Discord and sends the application to the Blossomvale Discord bot (hosted on Render, address in `staff-application-config.js`), which checks:

- applications are open (see "Close applications" below),
- the person is in the Discord server and is Discord level 15 or higher,
- they do not have the blocked role (role ID `1570910004549259455`; set `APPLICATION_BLOCKED_ROLE_ID` on the bot to change it),
- their Minecraft account is linked (`/link` in the game, then `/link <code>` in Discord) and they are in-game level 15 or higher,

and then posts the application in the staff channel (`APPLICATIONS_CHANNEL_ID` on the bot). Change the minimum with `APPLICATION_MIN_LEVEL`. The old webhook that was in `staff-application-config.js` is not used any more: delete it in Discord (it was visible in this repository).

### Close or open applications

Sign in to the review panel (`/review-114f3c61cfb6`). At the top is "New applications" with a **Close applications** / **Open applications** button (click twice to confirm). It writes `siteConfig/applications` (`open: true/false`) in Firestore; the bot reads it every 20 seconds, so a closed switch stops applications at the bot, not only on the page. Publish the rules for it with:

```powershell
firebase deploy --only firestore:rules,hosting
```
