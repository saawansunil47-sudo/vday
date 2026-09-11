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


// ===== Interactive discoveries (v5) =====
const relationshipCounter=document.getElementById("relationship-counter");
const relationshipStart=new Date("2026-01-15T13:37:00+05:30");
function updateRelationshipCounter(){const elapsedMs=Math.max(0,Date.now()-relationshipStart.getTime());const totalSeconds=Math.floor(elapsedMs/1000);const days=Math.floor(totalSeconds/86400);const hours=Math.floor(totalSeconds%86400/3600);const minutes=Math.floor(totalSeconds%3600/60);const seconds=totalSeconds%60;relationshipCounter.textContent=days+" days · "+hours+" hours · "+minutes+" minutes · "+seconds+" seconds"}updateRelationshipCounter();setInterval(updateRelationshipCounter,1000);
document.getElementById("random-memory").addEventListener("click",()=>{let next=Math.floor(Math.random()*photos.length);if(photos.length>1&&next===currentPhoto)next=(next+1)%photos.length;showPhoto(next);openDialog(photoDialog)});
let pileZ=10;
document.querySelectorAll(".loose-polaroid").forEach(card=>{let drag=null;let offsetX=0;let offsetY=0;card.addEventListener("pointerdown",event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,startX:offsetX,startY:offsetY,moved:false};card.setPointerCapture(event.pointerId);card.style.zIndex=String(++pileZ)});card.addEventListener("pointermove",event=>{if(!drag||!card.hasPointerCapture(event.pointerId))return;const dx=event.clientX-drag.x;const dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>7)drag.moved=true;offsetX=drag.startX+dx;offsetY=drag.startY+dy;card.style.translate=offsetX+"px "+offsetY+"px"});card.addEventListener("pointerup",event=>{if(!drag)return;const wasMoved=drag.moved;drag=null;try{card.releasePointerCapture(event.pointerId)}catch(_){}if(!wasMoved){showPhoto(Number(card.dataset.photo)-1);openDialog(photoDialog)}});card.addEventListener("keydown",event=>{if(event.key!=="Enter"&&event.key!==" ")return;event.preventDefault();showPhoto(Number(card.dataset.photo)-1);openDialog(photoDialog)})});
const scratchCanvas=document.getElementById("scratch-canvas");const scratchContext=scratchCanvas.getContext("2d");let scratchRevealed=false;let scratchDrawing=false;let scratchMoves=0;
function paintScratchCover(){if(scratchRevealed)return;const rect=scratchCanvas.getBoundingClientRect();const ratio=Math.min(window.devicePixelRatio||1,2);scratchCanvas.width=Math.max(1,Math.round(rect.width*ratio));scratchCanvas.height=Math.max(1,Math.round(rect.height*ratio));scratchContext.setTransform(ratio,0,0,ratio,0,0);const gradient=scratchContext.createLinearGradient(0,0,rect.width,rect.height);gradient.addColorStop(0,"#9b8c91");gradient.addColorStop(.5,"#d3c1b6");gradient.addColorStop(1,"#726875");scratchContext.globalCompositeOperation="source-over";scratchContext.fillStyle=gradient;scratchContext.fillRect(0,0,rect.width,rect.height);scratchContext.fillStyle="rgba(26,22,31,.72)";scratchContext.font="600 15px sans-serif";scratchContext.textAlign="center";scratchContext.fillText("scratch me",rect.width/2,rect.height/2+5)}
function eraseScratch(event){if(!scratchDrawing||scratchRevealed)return;const rect=scratchCanvas.getBoundingClientRect();scratchContext.globalCompositeOperation="destination-out";scratchContext.beginPath();scratchContext.arc(event.clientX-rect.left,event.clientY-rect.top,28,0,Math.PI*2);scratchContext.fill();scratchMoves++;if(scratchMoves>38)revealScratch()}
function revealScratch(){scratchRevealed=true;scratchCanvas.style.transition="opacity .55s ease";scratchCanvas.style.opacity="0";scratchCanvas.style.pointerEvents="none"}
scratchCanvas.addEventListener("pointerdown",event=>{scratchDrawing=true;scratchCanvas.setPointerCapture(event.pointerId);eraseScratch(event)});scratchCanvas.addEventListener("pointermove",eraseScratch);scratchCanvas.addEventListener("pointerup",()=>{scratchDrawing=false});scratchCanvas.addEventListener("pointercancel",()=>{scratchDrawing=false});scratchCanvas.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();revealScratch()}});document.getElementById("reveal-scratch").addEventListener("click",revealScratch);paintScratchCover();window.addEventListener("resize",paintScratchCover);
document.querySelectorAll(".message-star").forEach(star=>star.addEventListener("click",()=>{document.querySelectorAll(".message-star").forEach(item=>item.classList.toggle("is-active",item===star));document.getElementById("constellation-message").textContent=star.dataset.message}));
document.getElementById("couple-quiz").addEventListener("submit",event=>{event.preventDefault();const fields=[...event.currentTarget.querySelectorAll("fieldset")];const answered=fields.filter(field=>field.querySelector("input:checked")).length;const result=document.getElementById("quiz-result");if(answered<fields.length){result.textContent="You missed "+(fields.length-answered)+" question"+(fields.length-answered===1?"":"s")+", cheater ♡";return}const score=fields.reduce((total,field)=>total+(field.querySelector("input:checked").value===field.dataset.answer?1:0),0);const endings=["Suspicious. Have we met?","You know enough to earn a kiss.","Strong work, extremely credible girlfriend behaviour.","Basically an expert on us.","Perfect score. Fine, you can keep me.","Five out of five. Annoyingly perfect ♡"];result.textContent=score+" / "+fields.length+" — "+endings[score]});
const capsule=document.getElementById("time-capsule");const capsuleTarget=new Date(capsule.dataset.unlock);const capsuleLocked=document.getElementById("capsule-locked");const capsuleReveal=document.getElementById("capsule-reveal");const capsuleCountdown=document.getElementById("capsule-countdown");let capsuleTimer;
function updateCapsule(){const remaining=capsuleTarget.getTime()-Date.now();if(remaining<=0){capsuleLocked.hidden=true;capsuleReveal.hidden=false;clearInterval(capsuleTimer);return}const total=Math.floor(remaining/1000);const days=Math.floor(total/86400);const hours=Math.floor(total%86400/3600);const minutes=Math.floor(total%3600/60);const seconds=total%60;capsuleCountdown.textContent=days+" days · "+hours+"h "+minutes+"m "+seconds+"s"}updateCapsule();capsuleTimer=setInterval(updateCapsule,1000);
document.getElementById("capsule-photo-input").addEventListener("change",event=>{const file=event.target.files&&event.target.files[0];if(!file||!file.type.startsWith("image/"))return;const reader=new FileReader();reader.addEventListener("load",()=>{document.getElementById("capsule-photo").src=reader.result});reader.readAsDataURL(file)});
const mandaDialog=document.getElementById("manda-dialog");mandaDialog.querySelector(".dialog-close").addEventListener("click",()=>mandaDialog.close());mandaDialog.addEventListener("click",event=>{const bounds=mandaDialog.getBoundingClientRect();if(event.target===mandaDialog&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom))mandaDialog.close()});mandaDialog.addEventListener("close",()=>document.body.classList.remove("modal-open"));
let secretTyped="";let secretReset;document.addEventListener("keydown",event=>{if(event.target.closest("input,textarea,select")||event.ctrlKey||event.metaKey||event.altKey||event.key.length!==1)return;secretTyped=(secretTyped+event.key.toLowerCase()).slice(-5);clearTimeout(secretReset);secretReset=setTimeout(()=>{secretTyped=""},1800);if(secretTyped==="manda"){secretTyped="";openDialog(mandaDialog)}});
const easterToast=document.getElementById("easter-toast");let toastTimer;function showEasterToast(message){easterToast.textContent=message;easterToast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>easterToast.classList.remove("show"),2800)}
function releaseHearts(origin){if(reducedMotion.matches)return;const rect=origin.getBoundingClientRect();for(let i=0;i<12;i++){const heart=document.createElement("span");heart.className="heart-confetti";heart.textContent="♡";heart.style.left=(rect.left+rect.width/2)+"px";heart.style.top=(rect.top+rect.height/2)+"px";heart.style.setProperty("--heart-x",((Math.random()-.5)*220)+"px");document.body.appendChild(heart);setTimeout(()=>heart.remove(),1900)}}
document.querySelector(".wordmark").addEventListener("dblclick",event=>{releaseHearts(event.currentTarget);showEasterToast("You found a little shower of love ♡")});let coverTaps=0;document.querySelector(".album-cover").addEventListener("click",()=>{coverTaps++;if(coverTaps===5){showEasterToast("Five taps? Someone is nosy. I love you.");coverTaps=0}});audio.addEventListener("ended",()=>showEasterToast("You stayed until the last note. This one was always for you."));

const nicknameForm=document.getElementById("nickname-form");const nicknameInput=document.getElementById("nickname-input");const nicknameResult=document.getElementById("nickname-result");
nicknameForm.addEventListener("submit",event=>{event.preventDefault();const guess=nicknameInput.value.trim().toLowerCase();if(guess==="manda"){nicknameResult.textContent="Correct. Of course it is you ♡";nicknameInput.value="";openDialog(mandaDialog);return}nicknameResult.textContent=guess?"Nope—but that was a cute attempt.":"You have to guess something first, silly.";nicknameInput.focus();nicknameInput.select()});


// ===== Play together (v7) =====
const dateIdeas=[
{m:"peaceful",s:"outdoors",b:"cheap",p:"food",t:"Lake snacks and sunset",d:"Pick two drinks, split one snack, sit by the water and rate every dog that walks past."},
{m:"peaceful",s:"outdoors",b:"cheap",p:"wandering",t:"The no-destination walk",d:"Choose a neighbourhood neither of us knows, walk until something looks interesting, then take one photo each."},
{m:"peaceful",s:"outdoors",b:"treat",p:"food",t:"A slow rooftop dinner",d:"Dress slightly better than necessary, order something new and stay long enough for the city lights."},
{m:"peaceful",s:"outdoors",b:"treat",p:"activity",t:"A garden and a camera roll",d:"Find a botanical garden or pretty open space, bring the camera and take deliberately dramatic portraits."},
{m:"peaceful",s:"indoors",b:"cheap",p:"food",t:"Cook, plate and judge",d:"Choose one recipe, cook it together and score the result like deeply unqualified food critics."},
{m:"peaceful",s:"indoors",b:"cheap",p:"activity",t:"Our tiny cinema",d:"One comfort film, homemade snacks, phones away and a compulsory blanket."},
{m:"peaceful",s:"indoors",b:"treat",p:"food",t:"Dessert before dinner",d:"Go somewhere cosy, order the dessert first and take our sweet time with everything else."},
{m:"peaceful",s:"indoors",b:"treat",p:"wandering",t:"Bookshop roulette",d:"Pick a book for each other, wander every aisle and end with coffee somewhere quiet."},
{m:"chaotic",s:"outdoors",b:"cheap",p:"activity",t:"The ₹500 photo challenge",d:"Find the strangest props or accessories under budget and produce the most unserious photoshoot possible."},
{m:"chaotic",s:"outdoors",b:"cheap",p:"wandering",t:"Coin-flip expedition",d:"At every junction, flip a coin for left or right until we find food or admit defeat."},
{m:"chaotic",s:"outdoors",b:"treat",p:"activity",t:"Competitive nonsense",d:"Bowling, arcade games or anything with a scoreboard. Winner chooses dessert; loser claims it was rigged."},
{m:"chaotic",s:"outdoors",b:"treat",p:"food",t:"Three-stop food crawl",d:"One starter somewhere, the main somewhere else and dessert wherever looks most irresponsible."},
{m:"chaotic",s:"indoors",b:"cheap",p:"activity",t:"PowerPoint night",d:"Make five-slide presentations on ridiculous topics and defend them with absolute sincerity."},
{m:"chaotic",s:"indoors",b:"cheap",p:"food",t:"Mystery ingredient battle",d:"Pick one ingredient for each other and somehow turn both into an edible dinner."},
{m:"chaotic",s:"indoors",b:"treat",p:"activity",t:"Karaoke with consequences",d:"Pick songs for each other. Refusing a song means surrendering control of the next date."},
{m:"chaotic",s:"indoors",b:"treat",p:"wandering",t:"Mall side-quest day",d:"Set five absurd missions, complete them without buying anything sensible, then celebrate with food."}
];
let lastDateIdea="";
document.getElementById("date-builder-form").addEventListener("submit",event=>{event.preventDefault();const choice={m:document.getElementById("date-mood").value,s:document.getElementById("date-setting").value,b:document.getElementById("date-budget").value,p:document.getElementById("date-plan").value};const ranked=dateIdeas.map(idea=>({idea,score:Number(idea.m===choice.m)+Number(idea.s===choice.s)+Number(idea.b===choice.b)+Number(idea.p===choice.p)}));const best=Math.max(...ranked.map(item=>item.score));let pool=ranked.filter(item=>item.score===best&&item.idea.t!==lastDateIdea).map(item=>item.idea);if(!pool.length)pool=ranked.filter(item=>item.score===best).map(item=>item.idea);const picked=pool[Math.floor(Math.random()*pool.length)];lastDateIdea=picked.t;document.getElementById("date-result").innerHTML="<div><strong>"+picked.t+"</strong>"+picked.d+"</div>"});
const rouletteButton=document.getElementById("song-roulette");const rouletteResult=document.getElementById("roulette-result");
rouletteButton.addEventListener("click",()=>{if(rouletteButton.disabled)return;rouletteButton.disabled=true;rouletteButton.classList.remove("spinning");void rouletteButton.offsetWidth;rouletteButton.classList.add("spinning");rouletteResult.textContent="The record is deciding…";setTimeout(()=>{const active=trackButtons.findIndex(button=>button.getAttribute("aria-pressed")==="true");let choice=Math.floor(Math.random()*trackButtons.length);if(trackButtons.length>1&&choice===active)choice=(choice+1)%trackButtons.length;trackButtons[choice].click();rouletteResult.textContent="Fate chose "+trackButtons[choice].dataset.title+" ♡";rouletteButton.classList.remove("spinning");rouletteButton.disabled=false},2400)});
const bouquet=[];const bouquetStage=document.getElementById("bouquet-stage");const bouquetStatus=document.getElementById("bouquet-status");
function renderBouquet(){bouquetStage.replaceChildren();if(!bouquet.length){const note=document.createElement("p");note.textContent="tap a flower to begin";bouquetStage.appendChild(note);return}bouquet.forEach(symbol=>{const flower=document.createElement("span");flower.className="bouquet-flower";flower.textContent=symbol;bouquetStage.appendChild(flower)})}
document.querySelectorAll("[data-flower]").forEach(button=>button.addEventListener("click",()=>{if(bouquet.length>=9){bouquetStatus.textContent="Nine flowers. The bouquet is officially enormous ♡";return}bouquet.push(button.dataset.flower);bouquetStatus.textContent=button.querySelector("span").textContent+" added";renderBouquet()}));
document.getElementById("bouquet-undo").addEventListener("click",()=>{bouquet.pop();bouquetStatus.textContent=bouquet.length?"One flower returned.":"Back to an empty vase.";renderBouquet()});document.getElementById("bouquet-clear").addEventListener("click",()=>{bouquet.length=0;bouquetStatus.textContent="Fresh start.";renderBouquet()});
document.getElementById("bouquet-save").addEventListener("click",()=>{if(!bouquet.length){bouquetStatus.textContent="Pick at least one flower first, silly.";return}const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1080;const ctx=canvas.getContext("2d");ctx.fillStyle="#090e1c";ctx.fillRect(0,0,1080,1080);ctx.fillStyle="#e2b976";ctx.textAlign="center";ctx.font="56px serif";ctx.fillText("a bouquet for Manda",540,125);ctx.font="150px serif";bouquet.forEach((flower,index)=>{const columns=Math.min(bouquet.length,5);const row=Math.floor(index/columns);const col=index%columns;const width=columns*165;ctx.fillText(flower,540-width/2+82+col*165,410+row*185)});ctx.fillStyle="#f4eadb";ctx.font="42px serif";ctx.fillText("picked with love ♡",540,970);const link=document.createElement("a");link.download="manda-bouquet.png";link.href=canvas.toDataURL("image/png");link.click();bouquetStatus.textContent="Bouquet saved ♡"});
const doodleCanvas=document.getElementById("doodle-canvas");const doodleContext=doodleCanvas.getContext("2d");const doodleHistory=[];let doodleInk="#be4168";let doodling=false;
doodleContext.lineCap="round";doodleContext.lineJoin="round";
function doodlePoint(event){const rect=doodleCanvas.getBoundingClientRect();return{x:(event.clientX-rect.left)*doodleCanvas.width/rect.width,y:(event.clientY-rect.top)*doodleCanvas.height/rect.height}}
document.querySelectorAll(".ink-swatch").forEach(button=>button.addEventListener("click",()=>{doodleInk=button.dataset.ink;document.querySelectorAll(".ink-swatch").forEach(item=>item.classList.toggle("active",item===button))}));
doodleCanvas.addEventListener("pointerdown",event=>{doodleHistory.push(doodleContext.getImageData(0,0,doodleCanvas.width,doodleCanvas.height));if(doodleHistory.length>15)doodleHistory.shift();doodling=true;doodleCanvas.setPointerCapture(event.pointerId);const point=doodlePoint(event);doodleContext.beginPath();doodleContext.moveTo(point.x,point.y)});
doodleCanvas.addEventListener("pointermove",event=>{if(!doodling)return;const point=doodlePoint(event);doodleContext.strokeStyle=doodleInk;doodleContext.lineWidth=Number(document.getElementById("brush-size").value)*doodleCanvas.width/doodleCanvas.getBoundingClientRect().width;doodleContext.lineTo(point.x,point.y);doodleContext.stroke()});doodleCanvas.addEventListener("pointerup",()=>{doodling=false});doodleCanvas.addEventListener("pointercancel",()=>{doodling=false});
document.getElementById("doodle-undo").addEventListener("click",()=>{const previous=doodleHistory.pop();if(previous)doodleContext.putImageData(previous,0,0);document.getElementById("doodle-status").textContent=previous?"Last stroke undone.":"Nothing left to undo."});document.getElementById("doodle-clear").addEventListener("click",()=>{doodleHistory.push(doodleContext.getImageData(0,0,doodleCanvas.width,doodleCanvas.height));doodleContext.clearRect(0,0,doodleCanvas.width,doodleCanvas.height);document.getElementById("doodle-status").textContent="Clean page."});
document.getElementById("doodle-save").addEventListener("click",()=>{const output=document.createElement("canvas");output.width=doodleCanvas.width;output.height=doodleCanvas.height;const ctx=output.getContext("2d");ctx.fillStyle="#f4eadb";ctx.fillRect(0,0,output.width,output.height);ctx.drawImage(doodleCanvas,0,0);const link=document.createElement("a");link.download="our-little-doodle.png";link.href=output.toDataURL("image/png");link.click();document.getElementById("doodle-status").textContent="Drawing saved ♡"});
