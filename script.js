"use strict";

const audio = document.getElementById("soundtrack-audio");
const trackButtons = [...document.querySelectorAll(".track-button")];
const status = document.getElementById("music-status");
let playRequest = 0;
trackButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const request = ++playRequest;
    if (audio.getAttribute("src") !== button.dataset.src) {
      audio.src = button.dataset.src;
      audio.load();
    }
    document.getElementById("song-title").textContent = button.dataset.title;
    document.getElementById("song-artist").textContent = button.dataset.artist;
    trackButtons.forEach((track) => track.setAttribute("aria-pressed", String(track === button)));
    status.textContent = "Loading your soundtrack…";
    try {
      await audio.play();
    } catch (error) {
      if (request !== playRequest) return;
      status.textContent = error.name === "NotAllowedError"
        ? "Press play on the player to start the song."
        : "This song couldn’t play. Try again, or choose the other song.";
    }
  });
});
audio.addEventListener("playing", () => { status.textContent = "Playing. Take your time here."; });
audio.addEventListener("pause", () => { if (!audio.ended) status.textContent = "Paused. Pick up whenever you like."; });
audio.addEventListener("ended", () => { status.textContent = "One more listen? Press play, or pick the other song."; });
audio.addEventListener("error", () => { status.textContent = "This song couldn’t load. Try the other song or refresh the page."; });

const photos = [...document.querySelectorAll(".polaroid")];
const photoDialog = document.getElementById("photo-dialog");
const secretDialog = document.getElementById("secret-dialog");
const fullPhoto = document.getElementById("photo-full");
let currentPhoto = 0;
function showPhoto(index) {
  currentPhoto = (index + photos.length) % photos.length;
  const card = photos[currentPhoto];
  fullPhoto.src = card.getAttribute("href");
  fullPhoto.alt = card.querySelector("img").alt;
  document.getElementById("photo-title").textContent = card.querySelector("p").textContent;
  document.getElementById("photo-story").textContent = card.dataset.story;
  document.getElementById("photo-counter").textContent = String(currentPhoto + 1).padStart(2, "0") + " / " + photos.length;
}
function openDialog(dialog) {
  dialog.showModal();
  document.body.classList.add("modal-open");
}
photos.forEach((card, index) => {
  card.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof photoDialog.showModal !== "function") return;
    event.preventDefault();
    showPhoto(index);
    openDialog(photoDialog);
  });
});
document.getElementById("previous-photo").addEventListener("click", () => showPhoto(currentPhoto - 1));
document.getElementById("next-photo").addEventListener("click", () => showPhoto(currentPhoto + 1));
photoDialog.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    showPhoto(currentPhoto + (event.key === "ArrowLeft" ? -1 : 1));
  }
});
document.getElementById("secret-heart").addEventListener("click", () => openDialog(secretDialog));
[photoDialog, secretDialog].forEach((dialog) => {
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener("close", () => { document.body.classList.remove("modal-open"); });
});


// The native audio controls remain available until custom controls are ready.
const customPlayer = document.getElementById("custom-player");
const playToggle = document.getElementById("play-toggle");
const playSymbol = document.getElementById("play-symbol");
const seek = document.getElementById("music-seek");
const elapsed = document.getElementById("elapsed");
const durationLabel = document.getElementById("duration");
const musicCard = document.querySelector(".music-card");
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
}
function syncPlayback() {
  const playing = !audio.paused && !audio.ended && audio.readyState >= 3;
  musicCard.classList.toggle("is-playing", playing);
  playToggle.setAttribute("aria-label", audio.paused ? "Play music" : "Pause music");
  playSymbol.textContent = audio.paused ? "▶" : "Ⅱ";
}
function syncProgress() {
  const duration = audio.duration;
  const ready = Number.isFinite(duration) && duration > 0;
  seek.disabled = !ready;
  seek.max = ready ? String(duration) : "100";
  seek.value = ready ? String(audio.currentTime) : "0";
  seek.style.setProperty("--progress", ready ? (audio.currentTime / duration * 100) + "%" : "0%");
  seek.setAttribute("aria-valuetext", formatTime(audio.currentTime) + " of " + formatTime(duration));
  elapsed.textContent = formatTime(audio.currentTime);
  durationLabel.textContent = formatTime(duration);
}
playToggle.addEventListener("click", async () => {
  if (!audio.paused) { ++playRequest; audio.pause(); return; }
  const request = ++playRequest;
  status.textContent = "Loading your soundtrack…";
  try { await audio.play(); }
  catch (error) {
    if (request !== playRequest) return;
    status.textContent = "This song couldn’t play. Try again, or choose the other song.";
  }
});
seek.addEventListener("input", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = Number(seek.value);
    syncProgress();
  }
});
["play", "playing", "pause", "ended", "waiting", "emptied", "error"].forEach(event => audio.addEventListener(event, syncPlayback));
["loadedmetadata", "durationchange", "timeupdate", "emptied"].forEach(event => audio.addEventListener(event, syncProgress));
audio.addEventListener("waiting", () => {
  musicCard.classList.remove("is-playing");
  status.textContent = "Loading your soundtrack…";
});
audio.addEventListener("error", () => musicCard.classList.remove("is-playing"));
syncPlayback();
syncProgress();
customPlayer.hidden = false;
audio.controls = false;
audio.hidden = true;

// Animate only when a card enters view; content is never hidden waiting for JS.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if ("IntersectionObserver" in window && typeof Element.prototype.animate === "function") {
  const entranceObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entranceObserver.unobserve(entry.target);
      if (reducedMotion.matches) return;
      const animation = entry.target.animate([
        { opacity: .45, translate: "0 22px" },
        { opacity: 1, translate: "0 0" }
      ], { duration: 750, easing: "cubic-bezier(.2,.7,.2,1)" });
      const stopForFocus = () => animation.finish();
      entry.target.addEventListener("focusin", stopForFocus, { once: true });
      animation.finished.then(() => entry.target.removeEventListener("focusin", stopForFocus));
    });
  }, { threshold: .08 });
  document.querySelectorAll(".polaroid, .sticky-note, .section-heading").forEach(card => entranceObserver.observe(card));
}
