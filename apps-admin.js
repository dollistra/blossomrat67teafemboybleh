// The application review page. It signs in with Discord (through the Blossomvale bot) and the bot decides who may see anything:
// only people who can decide applications in Discord (the staff manager, management and admins). There is no password and no Firebase here.
// Everything from applicants is put on the page as plain text, never as HTML.
import { staffApplicationConfig } from "./staff-application-config.js";

const apiBase = (staffApplicationConfig.apiBase || "").replace(/\/$/, "");
const SESSION_KEY = "bv-admin-session";
const loginLink = document.getElementById("reviewer-login");
const signOutButton = document.getElementById("reviewer-sign-out");
const authStatus = document.getElementById("reviewer-auth-status");
const reviewSection = document.getElementById("application-review");
const reviewerAccount = document.getElementById("reviewer-account");
const appList = document.getElementById("application-list");
const appStatus = document.getElementById("applications-status");
const roleFilter = document.getElementById("filter-role");
const statusFilter = document.getElementById("filter-status");
const switchStatus = document.getElementById("apps-switch-status");
const switchToggle = document.getElementById("apps-switch-toggle");
let applications = [];
let applicationsOpen = true;
let confirmTimer = null;
let session = "";

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// ---------------------------------------------------------------- the Discord login (the bot sends the session back in the address after #)
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

async function call(path, options = {}) {
  const response = await fetch(apiBase + path, {
    ...options,
    headers: { Authorization: "Bearer " + session, ...(options.body ? { "Content-Type": "application/json" } : {}) }
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

function showLoggedOut(message) {
  reviewSection.hidden = true;
  loginLink.hidden = false;
  signOutButton.hidden = true;
  authStatus.textContent = message;
}

// ---------------------------------------------------------------- applications
function addDetail(list, label, content) {
  list.append(el("dt", "", label), el("dd", "", content || "—"));
}

function readableDate(ms) {
  return Number.isFinite(ms) ? new Date(ms).toLocaleString() : "Unknown";
}

function makeApplicationCard(application) {
  const card = el("article", "review-card");
  const header = el("div", "review-card-header");
  const identity = el("div");
  identity.append(el("h3", "", application.discordName || "Applicant"));
  identity.append(el("p", "review-card-meta", `${application.role === "creator" ? "Content Creator" : "Helper"} · Submitted ${readableDate(application.at)} · Discord ID ${application.discordId || "—"}`));
  header.append(identity);
  const status = application.status || "New";
  header.append(el("span", `review-status review-status-${status.toLowerCase()}`, status));
  const dl = el("dl");
  addDetail(dl, "Minecraft username", application.minecraft);
  addDetail(dl, "Levels", `Discord ${application.serverLevel ?? "?"} · In-game ${application.gameLevel ?? "?"}`);
  for (const answer of Array.isArray(application.answers) ? application.answers : []) addDetail(dl, String(answer.label || ""), String(answer.value || ""));
  if (application.screenshots) addDetail(dl, "Screenshots", `${application.screenshots} attached to the application post in Discord`);
  if (application.decidedBy) addDetail(dl, status, `Decided in Discord by ${application.decidedBy}${application.decidedAt ? ` on ${readableDate(application.decidedAt)}` : ""}${application.reason ? `. ${application.reason}` : ""}`);
  card.append(header, dl);
  card.append(el("p", "review-card-meta", "To accept or decline, use the buttons under the application post in Discord. The applicant gets a message from the bot."));
  return card;
}

function renderApplications() {
  appList.replaceChildren();
  const filtered = applications.filter((application) =>
    (roleFilter.value === "all" || application.role === roleFilter.value)
    && (statusFilter.value === "all" || (application.status || "New") === statusFilter.value));
  if (!filtered.length) {
    appList.append(el("p", "review-empty", applications.length ? "No applications match these filters." : "There are no applications yet."));
    return;
  }
  filtered.forEach((application) => appList.append(makeApplicationCard(application)));
}

function showSwitch() {
  switchStatus.textContent = applicationsOpen ? "Applications are OPEN. People who meet the requirements can apply." : "Applications are CLOSED. Nobody can send a new application.";
  switchToggle.textContent = applicationsOpen ? "Close applications" : "Open applications";
  switchToggle.disabled = false;
}

async function loadApplications() {
  appStatus.textContent = "Loading applications…";
  let result;
  try { result = await call("/admin/applications"); } catch {
    appStatus.textContent = "Could not reach the bot. It may be waking up: try Refresh in a minute.";
    return;
  }
  if (result.status === 401) { clearSession(); showLoggedOut("Your login ran out. Please log in with Discord again."); return; }
  if (result.status === 403) { clearSession(); showLoggedOut(result.data.error || "This Discord account is not allowed to open this page."); return; }
  if (!result.ok) { appStatus.textContent = "Could not load applications. Please try Refresh."; return; }
  loginLink.hidden = true;
  signOutButton.hidden = false;
  reviewSection.hidden = false;
  authStatus.textContent = "Signed in with Discord.";
  reviewerAccount.textContent = result.data.reviewer || "";
  applications = Array.isArray(result.data.applications) ? result.data.applications : [];
  applicationsOpen = result.data.open !== false;
  showSwitch();
  appStatus.textContent = `${applications.length} application${applications.length === 1 ? "" : "s"}.`;
  renderApplications();
}

switchToggle.addEventListener("click", async () => {
  if (confirmTimer === null) {
    switchToggle.textContent = applicationsOpen ? "Click again to close" : "Click again to open";
    confirmTimer = setTimeout(() => { confirmTimer = null; showSwitch(); }, 4000);
    return;
  }
  clearTimeout(confirmTimer);
  confirmTimer = null;
  switchToggle.disabled = true;
  try {
    const result = await call("/admin/switch", { method: "POST", body: JSON.stringify({ open: !applicationsOpen }) });
    if (!result.ok) throw new Error(String(result.status));
    applicationsOpen = result.data.open !== false;
    showSwitch();
  } catch {
    switchStatus.textContent = "Could not change it. Please log in with Discord again and retry.";
    switchToggle.disabled = false;
  }
});

signOutButton.addEventListener("click", () => { clearSession(); showLoggedOut("Signed out."); });
document.getElementById("reload-applications").addEventListener("click", loadApplications);
roleFilter.addEventListener("change", renderApplications);
statusFilter.addEventListener("change", renderApplications);

if (!apiBase) showLoggedOut("The admin page is not available right now.");
else if (session) loadApplications();
else showLoggedOut(loginError === "denied" ? "You cancelled the Discord login." : loginError ? "The Discord login did not work. Please try again." : "Log in with Discord. Only people who can decide applications in the server can open this page.");
