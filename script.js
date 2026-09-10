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
