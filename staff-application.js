import { staffApplicationConfig } from "./staff-application-config.js";

const form = document.getElementById("staff-application-form");
const status = document.getElementById("staff-form-status");
if (form && status) {
  const apiBase = String(staffApplicationConfig.apiBase || "").replace(/\/$/, "");
  const roleSelect = document.getElementById("app-role");
  const roleSections = [...form.querySelectorAll("[data-role-questions]")];
  const submitButton = form.querySelector(".staff-submit");
  form.addEventListener("invalid", (event) => {
    const section = event.target.closest("details");
    if (section && !section.open) section.open = true;
  }, true);

  // the requirements board only shows the lists for the role that is picked
  function updateRequirements() {
    const picked = roleSelect.value;
    document.querySelectorAll("[data-for]").forEach((list) => { list.hidden = list.dataset.for !== picked; });
    const note = document.getElementById("requirements-pick");
    if (note) note.hidden = Boolean(picked);
    document.querySelectorAll("[data-pick-role]").forEach((button) => {
      const active = button.dataset.pickRole === picked;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("is-active", active);
    });
  }
  document.querySelectorAll("[data-pick-role]").forEach((button) => button.addEventListener("click", () => {
    roleSelect.value = button.dataset.pickRole;
    roleSelect.dispatchEvent(new Event("change"));
  }));

  // the top of the page and one label read differently for a Content Creator (no talk of "the team")
  const wording = {
    eyebrow: document.getElementById("apply-eyebrow"), title: document.getElementById("staff-heading"), intro: document.getElementById("apply-intro"), reason: document.getElementById("app-reason-text")
  };
  const wordingDefault = Object.fromEntries(Object.entries(wording).map(([key, el]) => [key, el ? el.textContent : ""]));
  const wordingCreator = {
    eyebrow: "✿ Create with us ✿", title: "Become a Blossom Vale Creator",
    intro: "Do you make videos or other content? Tell us about your channel and what you would make about Blossom Vale. There is no minimum number of followers, but we look for a good channel that makes good videos.",
    reason: "Tell us about yourself and why you would like to be a Blossom Vale creator"
  };
  const wordingBuilder = {
    eyebrow: "✿ Build with us ✿", title: "Become a Blossom Vale Lobby Builder",
    intro: "Do you love building cozy places? Tell us about your builds and the tools you use, and show us a few screenshots. You don’t need to be famous, we look for good builds that fit our style.",
    reason: "Tell us about yourself and why you would like to build for Blossom Vale"
  };
  function updateWording(role) {
    const text = role === "creator" ? wordingCreator : role === "builder" ? wordingBuilder : wordingDefault;
    for (const key of Object.keys(wording)) if (wording[key] && text[key]) wording[key].textContent = text[key];
  }

  const updateRoleQuestions = () => {
    updateRequirements();
    updateWording(roleSelect.value);
    const selectedRole = roleSelect.value;
    roleSections.forEach((section) => {
      const active = section.dataset.roleQuestions === selectedRole;
      section.hidden = !active;
      section.querySelectorAll("input, textarea, select").forEach((field) => {
        field.disabled = !active;
        field.required = active && field.dataset.required === "true";
      });
    });
  };

  const value = (data, name) => String(data.get(name) || "").trim();

  const applicationLabels = {
    name: "Name",
    discordId: "Discord User ID",
    minecraft: "Minecraft username",
    availability: "Time zone",
    age: "Age",
    experience: "Relevant experience",
    extra: "Anything else",
    reason: "About them and why they want to join",
    helperTenure: "Time in the community and weekly hours",
    helperRole: "What a Helper does, and whether they can do it",
    helperLand: "Saving a spot and protecting it (SMP)",
    helperRanks: "Ranks and cosmetics",
    helperReport: "Reporting a rule breaker",
    helperEarn: "Getting started and earning money",
    helper: "Damaged build and items you can’t restore",
    helperStaffAbuse: "Staff member misusing permissions",
    helperDiscordChannels: "Discord: where to send bug reports and suggestions",
    helperDiscordScam: "Discord: scam link",
    helperDiscordAccusation: "Discord: public accusation",
    helperDiscordWellbeing: "Discord: a member who is struggling",
    platforms: "Content and where they post",
    audience: "Followers or subscribers",
    exampleLinks: "Example videos or posts",
    creatorPlayed: "Have they played, and what they liked",
    creatorPlan: "What they would make, and how often",
    creatorSafety: "Keeping content friendly and suitable for all ages",
    contentLink: "Channel link",
    typicalViews: "Views on their last 5 videos or posts",
    postRate: "How often they post, and in which language",
    helperPunished: "Previous punishments or bans",
    builderTime: "How long they have been building",
    builderTools: "Tools they use",
    builderLobby: "Lobby or spawn experience",
    builderCozy: "What cozy means to them",
    builderFeedback: "Their feedback on our lobby: what to keep and what to improve",
    builderHours: "Hours a week",
    builderLinks: "Links to their builds"
  };

  function applicationText(application) {
    const common = ["name", "discordId", "minecraft", "age", "availability", "experience", "reason", "extra"];
    const roleFields = application.role === "helper"
      ? ["helperTenure", "helperPunished", "helperRanks", "helperEarn", "helper", "helperStaffAbuse", "helperDiscordScam", "helperDiscordAccusation", "helperDiscordWellbeing"]
      : application.role === "builder"
        ? ["builderTime", "builderTools", "builderLobby", "builderCozy", "builderFeedback", "builderHours", "builderLinks"]
        : ["platforms", "audience", "typicalViews", "postRate", "contentLink", "exampleLinks", "creatorPlayed", "creatorPlan", "creatorSafety"];
    return [...common, ...roleFields]
      .filter((key) => application[key])
      .map((key) => `${applicationLabels[key]}\n${application[key]}`)
      .concat(application.experienceProofCount ? [`Experience proof\n${application.experienceProofCount} screenshot${application.experienceProofCount === 1 ? "" : "s"} attached`] : [])
      .concat(application.disclosureConfirmed ? ["Rewards\nThey will say it when Blossom Vale gives them rewards."] : [])
      .concat(application.requirementsConfirmed ? ["Requirements\nThey confirmed they read the guidelines, meet the requirements and wrote their answers without AI."] : [])
      .join("\n\n");
  }

  // the answers in reading order, for the bot to put in the staff message
  function applicationAnswers(application) {
    const common = ["name", "discordId", "minecraft", "age", "availability", "experience", "reason", "extra"];
    const roleFields = application.role === "helper"
      ? ["helperTenure", "helperPunished", "helperRanks", "helperEarn", "helper", "helperStaffAbuse", "helperDiscordScam", "helperDiscordAccusation", "helperDiscordWellbeing"]
      : application.role === "builder"
        ? ["builderTime", "builderTools", "builderLobby", "builderCozy", "builderFeedback", "builderHours", "builderLinks"]
        : ["platforms", "audience", "typicalViews", "postRate", "contentLink", "exampleLinks", "creatorPlayed", "creatorPlan", "creatorSafety"];
    const answers = [...common, ...roleFields].filter((key) => application[key]).map((key) => ({ label: applicationLabels[key], value: String(application[key]) }));
    if (application.disclosureConfirmed) answers.push({ label: "Rewards", value: "They will say it when Blossom Vale gives them rewards." });
    if (application.requirementsConfirmed) answers.push({ label: "Requirements", value: "They confirmed they read the guidelines, meet the requirements and wrote their answers without AI." });
    return answers;
  }

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  // ---------------------------------------------------------------- Discord login and the checks (the bot decides; this only shows the result)
  const SESSION_KEY = "bv-apply-session";
  const gate = {
    text: document.getElementById("apply-gate-text"), list: document.getElementById("apply-gate-list"), help: document.getElementById("apply-gate-help"),
    login: document.getElementById("apply-login"), logout: document.getElementById("apply-logout")
  };
  let session = "";
  let eligible = false;
  let gatedFor = "";
  const urlRole = new URLSearchParams(window.location.search).get("role");
  const gateRole = () => { const picked = roleSelect.value || urlRole; return picked === "creator" || picked === "builder" ? picked : "helper"; };        // Content Creators and Lobby Builders need no level
  try { session = sessionStorage.getItem(SESSION_KEY) || ""; } catch { session = ""; }
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  if (fragment.get("session")) {
    session = fragment.get("session");
    try { sessionStorage.setItem(SESSION_KEY, session); } catch { /* private mode: the login lasts until this page closes */ }
  }
  const loginError = fragment.get("error");
  if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
  const clearSession = () => { session = ""; try { sessionStorage.removeItem(SESSION_KEY); } catch { /* nothing to clear */ } };
  const loginUrl = () => apiBase + "/apply/login?return=" + encodeURIComponent(window.location.pathname + window.location.search);

  function renderGate(state) {
    gate.list.replaceChildren();
    gate.help.hidden = true;
    gate.login.hidden = true;
    gate.logout.hidden = !session;
    const rows = state.checks || [];
    gate.list.hidden = rows.length === 0;
    rows.forEach(([ok, label]) => {
      const item = document.createElement("li");
      item.className = ok ? "is-ok" : "is-no";
      item.textContent = label;
      gate.list.append(item);
    });
    gate.text.textContent = state.message;
    if (state.help) { gate.help.textContent = state.help; gate.help.hidden = false; }
    if (state.needsLogin) { gate.login.href = loginUrl(); gate.login.hidden = false; }
  }

  async function startGate() {
    eligible = false;
    gatedFor = gateRole();
    form.hidden = true;
    if (!apiBase) { renderGate({ message: "Applications are not available right now. Please try again later." }); return; }
    if (loginError && !session) {
      renderGate({ message: loginError === "denied" ? "You cancelled the Discord login. You need to log in to apply." : "The Discord login did not work. Please try again.", needsLogin: true });
      return;
    }
    if (!session) {
      let open = true;
      try { open = (await (await fetch(apiBase + "/apply/open")).json()).open !== false; } catch { /* the bot may be waking up */ }
      renderGate(open
        ? { message: gateRole() !== "helper"
            ? "To apply, log in with Discord. We check that you are in the server and that your Minecraft account is linked. There is no level requirement for this role."
            : "To apply, log in with Discord. We check that you are in the server, that you are level 15 in Discord and in the game, and that your Minecraft account is linked.", needsLogin: true }
        : { message: "Applications are closed right now. Please check again later." });
      return;
    }
    renderGate({ message: "Checking your account…" });
    let state;
    try {
      const response = await fetch(apiBase + "/apply/status?role=" + gateRole(), { headers: { Authorization: "Bearer " + session } });
      if (response.status === 401) { clearSession(); renderGate({ message: "Your login ran out. Please log in with Discord again.", needsLogin: true }); return; }
      if (!response.ok) throw new Error("status " + response.status);
      state = await response.json();
    } catch {
      renderGate({ message: "We could not check your account just now. The service may be waking up: please reload this page in a minute.", help: "If this keeps happening, email hello@blossomvale.world." });
      return;
    }
    const min = state.minLevel;
    const levelRows = state.levelRequired === false ? [] : [
      [(state.serverLevel || 0) >= min, "Discord level " + min + " or higher (you are level " + (state.serverLevel || 0) + ")"],
      [state.gameLevel !== null && state.gameLevel >= min, "In-game level " + min + " or higher" + (state.gameLevel === null ? "" : " (you are level " + state.gameLevel + ")")]
    ];
    const checks = [
      [state.open, "Applications are open"],
      [state.inServer, "You are in the Blossomvale Discord server"],
      [Boolean(state.linked), state.linked ? "Minecraft account linked: " + state.linked.name : "Minecraft account linked"],
      ...levelRows
    ];
    if (state.blocked) checks.push([false, "You are not able to apply right now"]);
    if (state.eligible) {
      eligible = true;
      renderGate({ message: "You are logged in as " + state.discord.name + " and can apply. ✿", checks });
      form.hidden = false;
      const discordField = document.getElementById("app-discord");
      const minecraftField = document.getElementById("app-minecraft");
      const nameField = document.getElementById("app-name");
      discordField.value = state.discord.id; discordField.readOnly = true;
      minecraftField.value = state.linked.name; minecraftField.readOnly = true;
      if (!nameField.value) nameField.value = state.discord.name;
      return;
    }
    renderGate({
      message: state.open ? "You cannot apply yet. Here is what is missing:" : "Applications are closed right now. Please check again later.",
      checks,
      help: state.linked ? "" : "To link your Minecraft account: type /link in the game, then type /link in the Discord server and paste the code."
    });
  }
  gate.logout.addEventListener("click", () => { clearSession(); startGate(); });
  startGate();

  async function compressProof(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1500 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    for (const quality of [0.9, 0.84, 0.78, 0.7, 0.62]) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= 480 * 1024) {
        return blob;
      }
    }
    throw new Error("The screenshot is too detailed to store safely. Please crop it to the channel name and audience overview, then try again.");
  }

  // answer length: a live counter under each long answer, and a minimum so one-liners can't be sent
  const countedFields = [...form.querySelectorAll("textarea[data-min]")];
  countedFields.forEach((field) => {
    const note = document.createElement("p");
    note.className = "staff-field-hint staff-count";
    field.insertAdjacentElement("afterend", note);
    const update = () => {
      const length = field.value.trim().length;
      const min = Number(field.dataset.min);
      note.textContent = length + " / " + field.maxLength + " characters" + (length < min ? " · write at least " + min : " · long enough");
      note.classList.toggle("is-short", length < min);
    };
    field.addEventListener("input", update);
    form.addEventListener("reset", () => setTimeout(update));
    update();
  });

  const requestedRole = new URLSearchParams(window.location.search).get("role");
  if (["helper", "creator", "builder"].includes(requestedRole)) roleSelect.value = requestedRole;
  roleSelect.addEventListener("change", updateRoleQuestions);
  roleSelect.addEventListener("change", () => { if (gateRole() !== gatedFor) startGate(); });       // the checks differ for Content Creators
  updateRoleQuestions();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!eligible || !session) { status.textContent = "Please log in with Discord first."; return; }
    if (!form.reportValidity()) return;

    const ageInput = document.getElementById("app-age");
    if (Number(ageInput.value) < 13) {
      status.textContent = "You need to be at least 13 to join the team.";
      ageInput.focus();
      return;
    }

    const tooShort = countedFields.find((field) => !field.disabled && field.value.trim().length < Number(field.dataset.min));
    if (tooShort) {
      const group = tooShort.closest("details");
      if (group) group.open = true;
      status.textContent = "Please write a little more in the answer we’ve taken you to (at least " + tooShort.dataset.min + " characters). Specific answers help us get to know you.";
      tooShort.focus();
      return;
    }

    const data = new FormData(form);
    if (value(data, "website")) {
      form.reset();
      updateRoleQuestions();
      status.textContent = "Your application has been submitted. Thank you! The Blossom Vale team will review it and contact you on Discord.";
      return;
    }
    const role = value(data, "role");
    const application = {
      name: value(data, "name"),
      discordId: value(data, "discordId"),
      role,
      minecraft: value(data, "minecraft"),
      availability: value(data, "availability"),
      age: value(data, "age"),
      experience: value(data, "experience"),
      extra: value(data, "extra"),
      reason: value(data, "reason"),
      consented: data.get("consent") === "on",
      requirementsConfirmed: data.get("requirements") === "on",
      website: value(data, "website"),
      startedAt: Number(form.dataset.startedAt || Date.now())
    };

    if (role === "helper") {
      for (const field of ["helperTenure", "helperPunished", "helperRanks", "helperEarn", "helper", "helperStaffAbuse", "helperDiscordScam", "helperDiscordAccusation", "helperDiscordWellbeing"]) {
        application[field] = value(data, field);
      }
    } else if (role === "builder") {
      for (const field of ["builderTime", "builderTools", "builderLobby", "builderCozy", "builderFeedback", "builderHours", "builderLinks"]) application[field] = value(data, field);
    } else if (role === "creator") {
      const proof = data.get("channelProof");
      const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!proof || !allowedTypes.includes(proof.type)) {
        status.textContent = "Please choose a PNG, JPG, or WebP screenshot from YouTube Studio.";
        document.getElementById("app-channel-proof").focus();
        return;
      }
      if (proof.size > 10 * 1024 * 1024) {
        status.textContent = "That screenshot is larger than 10 MB. Please choose a smaller image.";
        document.getElementById("app-channel-proof").focus();
        return;
      }
      application.platforms = value(data, "platforms");
      application.contentLink = value(data, "contentLink");
      for (const field of ["audience", "typicalViews", "postRate", "exampleLinks", "creatorPlayed", "creatorPlan", "creatorSafety"]) application[field] = value(data, field);
      application.disclosureConfirmed = data.get("disclose") === "on";
      submitButton.disabled = true;
      status.textContent = "Preparing your screenshot…";
      try {
        application.proof = await compressProof(proof);
      } catch (error) {
        status.textContent = error.message || "Could not prepare that screenshot. Please try another image.";
        submitButton.disabled = false;
        return;
      }
    }

    const proofFiles = data.getAll("experienceProof").filter((file) => file && file.size > 0);
    const proofImages = [];
    if (proofFiles.length) {
      const allowedProof = ["image/png", "image/jpeg", "image/webp"];
      const proofInput = document.getElementById("app-experience-proof");
      if (proofFiles.length > 3) {
        status.textContent = "Please attach no more than 3 screenshots of your experience.";
        proofInput.focus();
        return;
      }
      if (proofFiles.some((file) => !allowedProof.includes(file.type) || file.size > 10 * 1024 * 1024)) {
        status.textContent = "Experience screenshots must be PNG, JPG, or WebP files up to 10 MB each.";
        proofInput.focus();
        return;
      }
      submitButton.disabled = true;
      status.textContent = "Preparing your screenshots…";
      try {
        for (const file of proofFiles) proofImages.push(await compressProof(file));
      } catch (error) {
        status.textContent = error.message || "Could not prepare those screenshots. Please try other images.";
        submitButton.disabled = false;
        return;
      }
      application.experienceProofCount = proofImages.length;
    }

    submitButton.disabled = true;
    status.textContent = "Sending your application…";
    try {
      const payload = { ...application };
      const proof = payload.proof;
      delete payload.proof;
      const blobs = [...(proof ? [proof] : []), ...proofImages];
      const body = { role: payload.role, answers: applicationAnswers(payload), files: await Promise.all(blobs.map(async (blob) => ({ type: blob.type || "image/webp", data: await blobToBase64(blob) }))) };
      const response = await fetch(apiBase + "/apply/submit", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { clearSession(); startGate(); throw new Error(result.error || "Please log in with Discord again."); }
      if (!response.ok) throw new Error(result.error || "Application submission failed.");
      form.reset();
      updateRoleQuestions();
      form.hidden = true;
      eligible = false;
      renderGate({ message: "Your application has been submitted. Thank you! ✿ The Blossom Vale team will review it and contact you on Discord." });
      status.textContent = "Your application has been submitted. Thank you! The Blossom Vale team will review it and contact you on Discord.";
    } catch (error) {
      console.error("Application submission failed", error);
      status.textContent = error.message && !/^Failed to fetch|NetworkError/.test(error.message) ? error.message : "We couldn’t submit your application just now. Please try again later or email hello@blossomvale.world.";
    } finally {
      submitButton.disabled = false;
    }
  });
  form.dataset.startedAt = String(Date.now());
}
