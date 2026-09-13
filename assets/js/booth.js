// assets/js/booth.js — the interactive booth on try-it-out.html.
// Webcam preview, frame overlays, capture to a 1080×1350 JPEG, custom frame
// upload, and the scroll-linked printer. Vanilla JS, no dependencies.
//
// Everything runs on the visitor's device. The MediaStream never leaves the
// page, the microphone is never requested, and nothing is uploaded.
(() => {
  'use strict';

  const OUTPUT_W = 1080;
  const OUTPUT_H = 1350; // 4:5 — the booth's print ratio
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ───────────────────────────────────────────────────────────────────────────
  // Frames
  // ───────────────────────────────────────────────────────────────────────────
  // FRAME COLOURS ARE INDEPENDENT OF THE SITE THEME. A frame composites onto a
  // visitor's photograph, not onto the page, so its contrast requirement is
  // against arbitrary image content. Classic White stays white regardless of
  // the dark theme; Ocean Deco happens to reuse two palette values because they
  // suit the frame, not because the page is dark. Do not "fix" these to tokens.
  //
  // Each frame is an inline SVG data URI so the page has zero external asset
  // dependencies, and because data: URIs are same-origin and never taint the
  // canvas. The root <svg> carries explicit width and height attributes, not
  // just a viewBox — without them Firefox and Safari draw nothing to <canvas>.
  const svgFrame = (inner) =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_W}" height="${OUTPUT_H}" viewBox="0 0 ${OUTPUT_W} ${OUTPUT_H}">${inner}</svg>`
    )}`;

  const FRAMES = [
    {
      id: 'classic',
      name: 'Classic White',
      src: svgFrame(`
        <path fill="#FFFFFF" fill-rule="evenodd" d="M0 0H1080V1350H0Z M56 56H1024V1110H56Z"/>
        <text x="540" y="1252" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="46" letter-spacing="1" fill="#2A2A2A">Hawaii Booths</text>`),
    },
    {
      id: 'gold',
      name: 'Gold Leaf',
      src: svgFrame(`
        <g fill="none" stroke="#C9A24A">
          <rect x="34" y="34" width="1012" height="1282" stroke-width="8"/>
          <rect x="60" y="60" width="960" height="1230" stroke-width="2"/>
        </g>
        <g id="fl" fill="none" stroke="#C9A24A" stroke-width="3" stroke-linecap="round">
          <path d="M60 190 C60 120 120 60 190 60"/>
          <path d="M96 96 q46 -14 72 22 q-40 14 -72 -22 z" fill="#C9A24A" stroke="none"/>
          <path d="M96 96 q-14 46 22 72 q14 -40 -22 -72 z" fill="#C9A24A" stroke="none"/>
          <circle cx="96" cy="96" r="5" fill="#C9A24A" stroke="none"/>
        </g>
        <use href="#fl" transform="translate(1080 0) scale(-1 1)"/>
        <use href="#fl" transform="translate(0 1350) scale(1 -1)"/>
        <use href="#fl" transform="translate(1080 1350) scale(-1 -1)"/>`),
    },
    {
      id: 'deco',
      name: 'Ocean Deco',
      src: svgFrame(`
        <rect x="92" y="92" width="896" height="1166" fill="none" stroke="#4FB3C7" stroke-width="3"/>
        <g id="cb" fill="#1E5266">
          <path d="M0 0H340V44H44V340H0Z"/>
          <path d="M60 60H240V80H80V240H60Z"/>
          <rect x="112" y="112" width="28" height="28"/>
        </g>
        <use href="#cb" transform="translate(1080 0) scale(-1 1)"/>
        <use href="#cb" transform="translate(0 1350) scale(1 -1)"/>
        <use href="#cb" transform="translate(1080 1350) scale(-1 -1)"/>`),
    },
    {
      id: 'tropical',
      name: 'Tropical',
      src: svgFrame(`
        <g fill="#1F5A3C" transform="translate(-60 -70) rotate(-32 200 250)">
          <path fill-rule="evenodd" d="M200 30 C300 20 380 90 370 180 L290 190 C380 210 400 300 360 360 L280 350 C350 400 330 480 250 500 L200 470 C120 490 60 430 90 360 L160 350 C70 320 40 240 90 190 L170 190 C60 160 80 70 200 30 Z M228 250 a22 38 0 1 0 0.1 0 Z M180 320 a18 30 0 1 0 0.1 0 Z"/>
          <path d="M192 470 L208 470 L214 600 L186 600 Z"/>
        </g>
        <g fill="#2E7D52" transform="translate(-30 -20) rotate(-58 180 220) scale(0.62)">
          <path fill-rule="evenodd" d="M200 30 C300 20 380 90 370 180 L290 190 C380 210 400 300 360 360 L280 350 C350 400 330 480 250 500 L200 470 C120 490 60 430 90 360 L160 350 C70 320 40 240 90 190 L170 190 C60 160 80 70 200 30 Z"/>
        </g>
        <g fill="#1F5A3C" transform="translate(1080 1350)">
          <ellipse cx="185" cy="0" rx="185" ry="20" transform="rotate(192)"/>
          <ellipse cx="200" cy="0" rx="200" ry="22" transform="rotate(207)"/>
          <ellipse cx="210" cy="0" rx="210" ry="22" transform="rotate(222)"/>
          <ellipse cx="210" cy="0" rx="210" ry="22" transform="rotate(237)"/>
          <ellipse cx="200" cy="0" rx="200" ry="22" transform="rotate(252)"/>
          <ellipse cx="185" cy="0" rx="185" ry="20" transform="rotate(267)"/>
        </g>
        <g fill="#2E7D52" transform="translate(1080 1350)">
          <ellipse cx="130" cy="0" rx="130" ry="14" transform="rotate(200)"/>
          <ellipse cx="140" cy="0" rx="140" ry="14" transform="rotate(229)"/>
          <ellipse cx="130" cy="0" rx="130" ry="14" transform="rotate(259)"/>
        </g>`),
    },
  ];

  // The visitor's own frame, if they upload one. Session only — it is never
  // persisted, and the object URL is revoked when replaced.
  let customFrame = null;
  const allFrames = () => (customFrame ? [...FRAMES, customFrame] : FRAMES);

  // ───────────────────────────────────────────────────────────────────────────
  // DOM
  // ───────────────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const video = $('video');
  const overlay = $('frame-overlay');
  const shot = $('shot');
  const countdownEl = $('countdown');
  const flashEl = $('flash');
  const messageEl = $('preview-message');
  const framesEl = $('frames');
  const uploadInput = $('frame-upload');
  const uploadLabel = $('frame-upload-label');
  const uploadNote = $('upload-note');
  const startBtn = $('start');
  const shootBtn = $('shoot');
  const retakeBtn = $('retake');
  const saveLink = $('save');
  const watchPrintBtn = $('watch-print');

  // Two off-DOM canvases: `raw` holds the mirrored camera frame alone, `out`
  // holds the composite. Changing frames after a shot re-composites from `raw`
  // without making the visitor re-shoot.
  const raw = document.createElement('canvas');
  const out = document.createElement('canvas');
  raw.width = out.width = OUTPUT_W;
  raw.height = out.height = OUTPUT_H;

  // ───────────────────────────────────────────────────────────────────────────
  // State
  // ───────────────────────────────────────────────────────────────────────────
  // idle → live → countdown → captured. `captured` keeps the photo even if the
  // stream has since been stopped (tab hidden); Retake restarts it if needed.
  let state = 'idle';
  let stream = null;
  let currentFrameId = FRAMES[0].id;
  let photoUrl = null;     // object URL of the composite JPEG
  let hasRaw = false;      // raw canvas holds a capture
  let countdownToken = 0;  // incremented to cancel an in-flight countdown
  const hooks = { onPhoto: [] }; // the printer subscribes here (see bottom)

  const show = (el, on) => el.classList.toggle('hidden', !on);

  function setMessage(text) {
    messageEl.firstElementChild.textContent = text || '';
    show(messageEl, Boolean(text));
  }

  function render() {
    const live = state === 'live';
    const captured = state === 'captured';
    show(startBtn, state === 'idle');
    show(shootBtn, live);
    show(retakeBtn, captured);
    show(saveLink, captured && Boolean(photoUrl));
    show(watchPrintBtn, captured && Boolean(photoUrl));
    shootBtn.disabled = !live;
    show(shot, captured);
    show(overlay, !captured);
    if (live || state === 'countdown') setMessage('');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Frame thumbnails — role="radiogroup" with roving tabindex and arrow keys
  // ───────────────────────────────────────────────────────────────────────────
  const THUMB = 'relative aspect-[4/5] w-16 overflow-hidden rounded-md bg-sand/45 ring-1 ring-white/15 transition aria-checked:ring-2 aria-checked:ring-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surf';

  function renderThumbs() {
    framesEl.innerHTML = '';
    allFrames().forEach((f) => {
      const wrap = document.createElement('div');
      wrap.className = 'flex w-16 flex-col items-center gap-1.5';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = THUMB;
      btn.dataset.frame = f.id;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-label', f.name);
      btn.setAttribute('aria-checked', String(f.id === currentFrameId));
      btn.tabIndex = f.id === currentFrameId ? 0 : -1;
      const img = document.createElement('img');
      img.src = f.src;
      img.alt = '';
      img.draggable = false;
      img.className = 'absolute inset-0 h-full w-full';
      btn.appendChild(img);
      btn.addEventListener('click', () => selectFrame(f.id));
      const label = document.createElement('span');
      label.className = 'text-center text-[11px] leading-tight tracking-[0.01em] text-sand/70';
      label.textContent = f.name;
      wrap.append(btn, label);
      framesEl.appendChild(wrap);
    });
  }

  framesEl.addEventListener('keydown', (e) => {
    const radios = [...framesEl.querySelectorAll('[role="radio"]')];
    const i = radios.indexOf(document.activeElement);
    if (i < 0) return;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % radios.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + radios.length) % radios.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = radios.length - 1;
    if (next === null) return;
    e.preventDefault();
    radios[next].focus();
    selectFrame(radios[next].dataset.frame);
  });

  async function selectFrame(id) {
    const frame = allFrames().find((f) => f.id === id);
    if (!frame) return;
    currentFrameId = id;
    overlay.src = frame.src;
    framesEl.querySelectorAll('[role="radio"]').forEach((r) => {
      const on = r.dataset.frame === id;
      r.setAttribute('aria-checked', String(on));
      r.tabIndex = on ? 0 : -1;
    });
    // A photo is on screen: re-composite it with the new frame, no re-shoot.
    if (state === 'captured' && hasRaw) await composite();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Custom frame upload
  // ───────────────────────────────────────────────────────────────────────────
  // A locally chosen file becomes a blob: URL, which is same-origin — so it does
  // NOT taint the canvas and Save photo keeps working. That is the whole reason
  // we read the file locally instead of uploading it anywhere.
  uploadInput.addEventListener('change', async () => {
    const file = uploadInput.files && uploadInput.files[0];
    if (!file) return;
    if (!/^image\/(png|svg\+xml)$/.test(file.type)) {
      note('Choose a PNG or SVG file.');
      uploadInput.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    let img;
    try {
      img = await loadImage(url);
    } catch (err) {
      URL.revokeObjectURL(url);
      note('That file could not be read as an image.');
      uploadInput.value = '';
      return;
    }
    if (customFrame) URL.revokeObjectURL(customFrame.src); // revoke the previous one
    imageCache.delete(customFrame?.src);
    customFrame = { id: 'custom', name: 'Your frame', src: url };
    imageCache.set(url, Promise.resolve(img));

    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) {
      note('This SVG has no width and height attributes, so some browsers will draw nothing. Add width="1080" height="1350" to its root element.');
    } else if (Math.abs(w / h - OUTPUT_W / OUTPUT_H) > 0.02) {
      note(`Your frame is ${w} by ${h}, not 4:5. It will be stretched to 1080 by 1350.`);
    } else {
      note('');
    }
    uploadLabel.textContent = 'Replace your frame';
    renderThumbs();
    selectFrame('custom');
    framesEl.querySelector('[data-frame="custom"]')?.focus();
  });

  function note(text) {
    uploadNote.textContent = text;
    show(uploadNote, Boolean(text));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Images for the canvas
  // ───────────────────────────────────────────────────────────────────────────
  // Frame images from another origin would taint the canvas and make toBlob
  // throw SecurityError. Inline SVG data: URIs and blob: URLs are safe. If a
  // hosted PNG is ever used it must be same-origin (assets/frames/), or served
  // with Access-Control-Allow-Origin AND loaded with img.crossOrigin =
  // 'anonymous' set BEFORE img.src.
  const imageCache = new Map();
  function loadImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    const p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${src.slice(0, 40)}`));
      img.src = src;
    });
    imageCache.set(src, p);
    return p;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Camera
  // ───────────────────────────────────────────────────────────────────────────
  const MESSAGES = {
    insecure: 'The camera needs a secure connection. Open this page over https or localhost.',
    blocked: 'Camera access is blocked. Enable it in your browser’s address-bar permissions, then press Start camera again.',
    notFound: 'No camera found. Connect one and try again.',
    generic: 'The camera could not start. Check nothing else is using it, then press Start camera again.',
    hidden: 'The camera was stopped while this tab was hidden. Press Start camera to continue.',
    ended: 'The camera was turned off. Press Start camera to continue.',
    warming: 'The camera is still warming up. Try again in a second.',
  };

  function cameraErrorMessage(err) {
    switch (err && err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return MESSAGES.blocked;
      case 'NotFoundError':
      case 'DevicesNotFoundError':
      case 'OverconstrainedError':
        return MESSAGES.notFound;
      default:
        console.error('[booth] getUserMedia failed:', err && err.name, err);
        return MESSAGES.generic;
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage(MESSAGES.insecure);
      return;
    }
    startBtn.disabled = true;
    setMessage('Waiting for camera permission.');
    try {
      // Requests camera access. The browser owns this MediaStream and the user
      // can revoke it at any time from the address bar.
      //   video: 4:5 portrait at up to 1080px wide. `ideal` rather than `exact`
      //          so laptops with fixed 16:9 sensors still work — the browser
      //          returns the closest match and we crop in the canvas.
      //   audio: false. We never touch the microphone, and the UI says so.
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1080 }, height: { ideal: 1350 }, facingMode: 'user' },
        audio: false,
      });
    } catch (err) {
      setMessage(cameraErrorMessage(err));
      startBtn.disabled = false;
      return;
    }
    video.srcObject = stream;
    // autoplay + muted + playsinline handle most browsers; the explicit play()
    // is for Safari. Wait for metadata so videoWidth is real before enabling
    // Take photo, but don't hang forever on a stalled device.
    await Promise.race([
      new Promise((r) => video.addEventListener('loadedmetadata', r, { once: true })),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    video.play().catch(() => {});
    stream.getVideoTracks().forEach((t) => t.addEventListener('ended', () => {
      stopCamera();
      setMessage(MESSAGES.ended);
    }));
    startBtn.disabled = false;
    state = state === 'captured' ? 'captured' : 'live';
    render();
  }

  function stopCamera() {
    countdownToken++; // cancels any in-flight countdown
    show(countdownEl, false);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    video.srcObject = null;
    if (state !== 'captured') state = 'idle';
    render();
  }

  // Leaving the camera light on when the visitor can't see the page is a trust
  // problem: stop the tracks whenever the tab is hidden and on leaving.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && stream) {
      stopCamera();
      if (state === 'idle') setMessage(MESSAGES.hidden);
    }
  });
  window.addEventListener('pagehide', () => stopCamera());

  // ───────────────────────────────────────────────────────────────────────────
  // Capture
  // ───────────────────────────────────────────────────────────────────────────
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function takePhoto() {
    if (state !== 'live' || !stream) return;
    state = 'countdown';
    render();
    const token = ++countdownToken;
    // The countdown numerals are information, not decoration — they stay under
    // reduced motion. Only the flash is skipped.
    for (let n = 3; n >= 1; n--) {
      countdownEl.textContent = String(n);
      show(countdownEl, true);
      countdownEl.classList.add('flex');
      await wait(1000);
      if (token !== countdownToken) return; // cancelled (retake, tab hidden, stream ended)
    }
    show(countdownEl, false);

    if (!captureRaw()) {
      state = 'live';
      render();
      setMessage(MESSAGES.warming);
      return;
    }
    if (!reduceMotion) flash();
    try {
      await composite();
    } catch (err) {
      console.error('[booth] composite failed:', err);
      state = 'live';
      render();
      setMessage(err && err.name === 'SecurityError'
        ? 'This frame was loaded from another site, so the browser will not let the photo be saved. Choose another frame.'
        : 'The photo could not be created. Try again.');
      return;
    }
    state = 'captured';
    render();
    hooks.onPhoto.forEach((fn) => fn(photoUrl, { first: !hasPrintedOnce }));
    hasPrintedOnce = true;
  }
  let hasPrintedOnce = false;

  function captureRaw() {
    // Safari can resolve play() before the first frame arrives; drawing then
    // produces NaN coordinates and a blank capture.
    if (!video.videoWidth || !video.videoHeight) return false;
    const ctx = raw.getContext('2d');

    // Cover-crop: the camera's native aspect ratio rarely matches our output,
    // so we scale the video up until it covers the canvas on both axes, centre
    // it, and let the overflow fall off the edges. Same behaviour as CSS
    // object-fit: cover — this is what makes the capture match the preview.
    const scale = Math.max(OUTPUT_W / video.videoWidth, OUTPUT_H / video.videoHeight);
    const drawW = video.videoWidth * scale;
    const drawH = video.videoHeight * scale;
    const dx = (OUTPUT_W - drawW) / 2;
    const dy = (OUTPUT_H - drawH) / 2;

    // The preview is mirrored for the visitor's benefit, so the capture must be
    // too, or the photo won't match what they just saw. Flip the coordinate
    // system, draw the video, then RESTORE before drawing the frame — otherwise
    // the frame's wordmark comes out backwards.
    ctx.clearRect(0, 0, OUTPUT_W, OUTPUT_H);
    ctx.save();
    ctx.translate(OUTPUT_W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, dx, dy, drawW, drawH);
    ctx.restore();
    hasRaw = true;
    return true;
  }

  async function composite() {
    const ctx = out.getContext('2d');
    ctx.clearRect(0, 0, OUTPUT_W, OUTPUT_H);
    ctx.drawImage(raw, 0, 0);
    const frame = allFrames().find((f) => f.id === currentFrameId);
    const img = await loadImage(frame.src);
    ctx.drawImage(img, 0, 0, OUTPUT_W, OUTPUT_H); // overlay, unmirrored

    const blob = await new Promise((resolve, reject) => {
      try {
        out.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/jpeg', 0.92);
      } catch (err) {
        reject(err); // SecurityError from a tainted canvas surfaces here
      }
    });
    if (photoUrl) URL.revokeObjectURL(photoUrl); // revoke the previous shot
    photoUrl = URL.createObjectURL(blob);
    shot.src = photoUrl;
    saveLink.href = photoUrl;
    hooks.onPhoto.forEach((fn) => fn(photoUrl, { first: false, recomposite: true }));
    render();
  }

  function flash() {
    // 0.7, not 0.9 — against a dark page a full white flash is violent.
    flashEl.style.transition = 'opacity 90ms ease-out';
    flashEl.style.opacity = '0.7';
    setTimeout(() => {
      flashEl.style.transition = 'opacity 230ms ease-in';
      flashEl.style.opacity = '0';
    }, 90);
  }

  async function retake() {
    if (photoUrl) { URL.revokeObjectURL(photoUrl); photoUrl = null; }
    shot.removeAttribute('src');
    saveLink.removeAttribute('href');
    hasRaw = false;
    hooks.onPhoto.forEach((fn) => fn(null, {}));
    if (stream) {
      state = 'live';
      render();
    } else {
      state = 'idle';
      render();
      await startCamera();
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Wire up
  // ───────────────────────────────────────────────────────────────────────────
  startBtn.addEventListener('click', startCamera);
  shootBtn.addEventListener('click', takePhoto);
  retakeBtn.addEventListener('click', retake);

  renderThumbs();
  overlay.src = FRAMES[0].src;
  render();

  // Exposed for the printer module below and for debugging in the console.
  window.HB_BOOTH = { hooks, get state() { return state; }, get photoUrl() { return photoUrl; }, reduceMotion };
})();
