// Two small guards. Static hosting cannot send security headers, so the page does these itself:
// 1. it will not run inside somebody else's frame (stops clickjacking), and
// 2. a copy of the site on another address sends visitors back to the real one.
(function () {
  var host = location.hostname;
  var real = location.protocol === "file:" || host === "localhost" || host === "127.0.0.1"
    || host === "blossomvale.world" || host === "www.blossomvale.world"
    || host === "blossomvale-9721c.web.app" || host === "blossomvale-9721c.firebaseapp.com";
  if (!real) {
    try { document.documentElement.style.display = "none"; } catch (e) { /* nothing to hide */ }
    location.replace("https://blossomvale.world" + location.pathname);
    return;
  }
  if (window.top !== window.self) {
    try { document.documentElement.style.display = "none"; window.top.location = window.self.location; } catch (e) { document.documentElement.innerHTML = ""; }
  }
})();
