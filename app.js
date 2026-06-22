// CAFÉ landing — pull live download links from the latest GitHub Release.
// Public downloads repo (separate from the private source repo).
const REPO = "yungmoogle/cafe-dist";
const RELEASES = `https://github.com/${REPO}/releases`;

// Classify a release asset by filename into a platform bucket.
function classify(name) {
  const n = name.toLowerCase();
  if (n.endsWith(".dmg")) return "mac";
  if (n.endsWith(".exe") || n.endsWith(".msi")) return "windows";
  if (n.endsWith(".appimage") || n.endsWith(".deb")) return "linux";
  return null;
}

const LABEL = { mac: "macOS", windows: "Windows", linux: "Linux" };

function detectOS() {
  const p = (navigator.userAgent + " " + (navigator.platform || "")).toLowerCase();
  if (p.includes("win")) return "windows";
  if (p.includes("mac")) return "mac";
  if (p.includes("linux") || p.includes("x11")) return "linux";
  return "windows";
}

async function load() {
  const all = document.getElementById("dl-all");
  const primary = document.getElementById("dl-primary");
  const osEl = document.getElementById("dl-os");
  const subEl = document.getElementById("dl-sub");
  const me = detectOS();

  let release = null;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (r.ok) release = await r.json();
  } catch {}

  if (!release || !release.assets || !release.assets.length) {
    osEl.textContent = "BUILDS COMING SOON";
    subEl.textContent = "watch the repo for the first release";
    primary.href = RELEASES;
    return;
  }

  document.getElementById("ver").textContent = release.tag_name || "v—";

  // best asset per platform (prefer installer over raw)
  const byOS = {};
  for (const a of release.assets) {
    const os = classify(a.name);
    if (!os) continue;
    // prefer .dmg/.msi/.AppImage as the "main" installer
    const isInstaller = /\.(dmg|msi|appimage)$/i.test(a.name);
    if (!byOS[os] || (isInstaller && !byOS[os].installer)) {
      byOS[os] = { url: a.browser_download_url, name: a.name, installer: isInstaller };
    }
  }

  // primary button = detected OS
  if (byOS[me]) {
    osEl.textContent = `DOWNLOAD FOR ${LABEL[me].toUpperCase()}`;
    subEl.textContent = byOS[me].name;
    primary.href = byOS[me].url;
  } else {
    osEl.textContent = "DOWNLOAD";
    subEl.textContent = "choose your platform →";
    primary.href = RELEASES;
  }

  // chips for every platform
  all.innerHTML = ["mac", "windows", "linux"].map((os) => {
    const a = byOS[os];
    return a
      ? `<a class="dl-chip" href="${a.url}">${LABEL[os]} ↓</a>`
      : `<span class="dl-chip off">${LABEL[os]} — soon</span>`;
  }).join("");
}

load();
