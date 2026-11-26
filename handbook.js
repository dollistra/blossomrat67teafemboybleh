// The staff handbook page. It signs in with Discord (through the Blossomvale bot) and the bot decides who may read: staff only.
// Nothing from the handbook is in this website's files: it arrives from the bot after the login, and is put on the page as text
// and elements built here, never as HTML.
import { staffApplicationConfig } from "./staff-application-config.js";

const apiBase = (staffApplicationConfig.apiBase || "").replace(/\/$/, "");
const SESSION_KEY = "bv-staff-session";
const loginLink = document.getElementById("staff-login");
const signOutButton = document.getElementById("staff-sign-out");
const authStatus = document.getElementById("staff-auth-status");
const book = document.getElementById("handbook");
const text = document.getElementById("handbook-text");
const contents = document.getElementById("handbook-contents");
let session = "";

try { session = sessionStorage.getItem(SESSION_KEY) || ""; } catch { session = ""; }
const fragment = new URLSearchParams(window.location.hash.slice(1));
if (fragment.get("session")) {
  session = fragment.get("session");
  try { sessionStorage.setItem(SESSION_KEY, session); } catch { /* private mode: the login lasts until this page closes */ }
}
const loginError = fragment.get("error");
if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
const clearSession = () => { session = ""; try { sessionStorage.removeItem(SESSION_KEY); } catch { /* nothing to clear */ } };
loginLink.href = apiBase + "/apply/login?return=" + encodeURIComponent(window.location.pathname);

function showLoggedOut(message) {
  book.hidden = true;
  text.replaceChildren();
  contents.replaceChildren();
  loginLink.hidden = false;
  signOutButton.hidden = true;
  authStatus.textContent = message;
}

// ---------------------------------------------------------------- the document (the markdown Google Docs exports), as elements
const unescape = (value) => value.replace(/\\([\\`*_{}[\]()#+\-.!|<>~=&:])/g, "$1");
const element = (tag, content) => {
  const node = document.createElement(tag);
  if (content !== undefined) node.textContent = content;
  return node;
};

// bold, italic, `code`, [links](https://...) and bare web addresses; everything else stays as written
const INLINE = /(\*\*(?:\\.|[^*\\])+?\*\*|(?<![\\*\w])\*(?!\s)(?:\\.|[^*\\])+?\*(?!\w)|`[^`]+`|\[(?:\\.|[^\]\\])*\]\([^)\s]+\)|https:\/\/[^\s<>()]+)/;
function inline(parent, value) {
  value.split(INLINE).forEach((part, index) => {
    if (!part) return;
    if (index % 2 === 0) { parent.append(unescape(part)); return; }
    if (part.startsWith("**")) { const node = element("strong"); inline(node, part.slice(2, -2)); parent.append(node); }
    else if (part.startsWith("*")) { const node = element("em"); inline(node, part.slice(1, -1)); parent.append(node); }
    else if (part.startsWith("`")) parent.append(element("code", part.slice(1, -1)));
    else {
      const link = part.match(/^\[(.*)\]\(([^)\s]+)\)$/);
      const address = link ? link[2] : part;
      const label = link ? link[1] : part;
      if (!/^https:\/\//i.test(address)) { inline(parent, label); return; }
      const node = element("a");
      node.href = unescape(address); node.target = "_blank"; node.rel = "noopener noreferrer";
      if (link) inline(node, label); else node.textContent = label;
      parent.append(node);
    }
  });
}

function render(markdown) {
  text.replaceChildren();
  contents.replaceChildren();
  const pictures = new Map();       // "![][image1]" with "[image1]: <data:image/png;base64,...>" at the end of the file
  const lines = String(markdown).replace(/\r/g, "").split("\n").filter((line) => {
    const picture = line.match(/^\[([^\]]+)\]:\s*<?(data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+)>?\s*$/);
    if (picture) pictures.set(picture[1], picture[2]);
    return !picture;
  });
  let lists = [];                   // open lists, outermost first: { indent, node }
  let table = null;
  let count = 0;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const item = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    const row = line.match(/^\s*\|(.*)\|\s*$/);
    if (!item) lists = [];
    if (!row) table = null;
    if (!line.trim()) continue;
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const picture = line.trim().match(/^!\[[^\]]*\]\[([^\]]+)\]$/);
    if (heading) {
      const label = heading[2].replace(/\s*\{#[^}]*\}\s*$/, "");
      if (!label.replace(/[*_\s]/g, "")) continue;
      const node = element(`h${Math.min(6, heading[1].length + 1)}`);
      node.id = `section-${++count}`;
      inline(node, label);
      text.append(node);
      if (heading[1].length <= 2) {
        const entry = element("li");
        const link = element("a", node.textContent);
        link.href = `#${node.id}`;
        link.addEventListener("click", (event) => { event.preventDefault(); node.scrollIntoView({ behavior: "smooth", block: "start" }); });
        entry.append(link);
        contents.append(entry);
      }
    } else if (item) {
      const indent = item[1].length;
      while (lists.length && lists.at(-1).indent > indent) lists.pop();
      if (!lists.length || lists.at(-1).indent < indent) {
        const node = element(/\d/.test(item[2]) ? "ol" : "ul");
        if (node.tagName === "OL") node.start = parseInt(item[2], 10);
        (lists.length ? lists.at(-1).node.lastElementChild : text).append(node);
        lists.push({ indent, node });
      }
      const entry = element("li");
      inline(entry, item[3]);
      lists.at(-1).node.append(entry);
    } else if (row) {
      if (/^[\s|:-]+$/.test(row[1])) continue;
      if (!table) {
        const wrap = element("div"); wrap.className = "handbook-table";
        table = element("table"); wrap.append(table); text.append(wrap);
      }
      const tr = element("tr");
      for (const cell of row[1].split(/(?<!\\)\|/)) { const td = element("td"); inline(td, cell.trim()); tr.append(td); }
      table.append(tr);
    } else if (picture && pictures.has(picture[1])) {
      const node = element("img"); node.src = pictures.get(picture[1]); node.alt = "Picture from the handbook";
      text.append(node);
    } else if (/^\s*([-*_]\s*){3,}$/.test(line)) {
      text.append(element("hr"));
    } else {
      const quote = line.match(/^>\s?(.*)$/);
      const node = element(quote ? "blockquote" : "p");
      inline(node, (quote ? quote[1] : line).replace(/\\$/, ""));
      text.append(node);
    }
  }
  contents.parentElement.hidden = !contents.childElementCount;
}

// ---------------------------------------------------------------- reading it
async function load() {
  authStatus.textContent = "Opening the handbook… The bot can take a moment to wake up.";
  let response, data;
  try {
    response = await fetch(apiBase + "/apply/handbook", { headers: { Authorization: "Bearer " + session }, cache: "no-store" });
    data = await response.json().catch(() => ({}));
  } catch {
    showLoggedOut("Could not reach the bot. Please try again in a minute.");
    return;
  }
  if (response.status === 401) { clearSession(); showLoggedOut("Your login ran out. Please log in with Discord again."); return; }
  if (response.status === 403) { clearSession(); showLoggedOut(data.error || "Only the staff team can read the handbook."); return; }
  if (!response.ok) { showLoggedOut(data.error || "The handbook could not be opened. Please try again."); signOutButton.hidden = false; return; }
  render(data.markdown);
  loginLink.hidden = true;
  signOutButton.hidden = false;
  book.hidden = false;
  authStatus.textContent = `Signed in as ${data.reader || "staff"}.`;
}

signOutButton.addEventListener("click", async () => {
  const old = session;
  clearSession();
  showLoggedOut("You are signed out.");
  try { await fetch(apiBase + "/apply/logout", { method: "POST", headers: { Authorization: "Bearer " + old } }); } catch { /* it runs out by itself */ }
});

if (session) load();
else showLoggedOut(loginError ? "The Discord login did not finish. Please try again." : "Log in with your staff Discord account.");
