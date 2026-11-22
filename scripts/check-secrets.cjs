// Defensive check: never print matching contents, only filenames and the category.
const { execFileSync } = require('node:child_process');
const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const staged = process.argv.includes('--staged');
const names = (staged ? git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z') : git('ls-tree', '-r', '--name-only', '-z', 'HEAD')).toString('utf8').split('\0').filter(Boolean);
const checks = [
  ['Discord webhook credential', /https?:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w.-]{15,}/i],
  ['Private key', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/],
  ['Discord bot token pattern', /\b(?:mfa\.[\w-]{40,}|[\w-]{24,30}\.[\w-]{6}\.[\w-]{27,})\b/],
  ['GitHub token pattern', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/],
];
let failed = false;
for (const name of names) {
  if (/(^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?)(?<!\.example)$|(?:\.pem|\.key|(?:service-account|firebase-adminsdk)[^/]*\.json)$/i.test(name)) {
    console.error(`Blocked sensitive filename: ${name}`); failed = true; continue;
  }
  const data = git('show', `${staged ? '' : 'HEAD'}:${name}`);
  if (data.includes(0)) continue;
  const text = data.toString('utf8');
  for (const [label, regex] of checks) if (regex.test(text)) {
    console.error(`Blocked ${label}: ${name}`); failed = true;
  }
}
if (failed) process.exitCode = 1;
else console.log(`Secret check passed (${names.length} files; known patterns only).`);
