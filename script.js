// Consistently sized and optimized script for Cinematic Birthday Surprise
const intro = document.getElementById("intro");
const enterBtn = document.getElementById("enterBtn");
const mainContent = document.getElementById("mainContent");
const celebration = document.getElementById("celebration");
const slidesTrack = document.getElementById("slidesTrack");
const openVideoSlideBtn = document.getElementById("openVideoSlideBtn");
const openCakeSlideBtn = document.getElementById("openCakeSlideBtn");
const openAstha12Btn = document.getElementById("openAstha12Btn");
const prevSlideBtn = document.getElementById("prevSlideBtn");
const nextSlideBtn = document.getElementById("nextSlideBtn");
const slideDotsWrap = document.getElementById("slideDots");
const astha2Video = document.getElementById("astha2Video");
const astha12Video = document.getElementById("astha12Video");
const surpriseVideos = Array.from(document.querySelectorAll(".video-grid video"));
const cakeStage = document.getElementById("cakeStage");
const cakeCutWrap = document.getElementById("cakeCutWrap");
const cakeMessage = document.getElementById("cakeMessage");
const cakeHint = document.getElementById("cakeHint");
const recutCakeBtn = document.getElementById("recutCakeBtn");
const partyEntryBtn = document.getElementById("partyEntryBtn");
const cakeConfettiCanvas = document.getElementById("cakeConfettiCanvas");
const cakeCrumbs = document.getElementById("cakeCrumbs");
const birthdayText = document.getElementById("birthdayText");
const textSparkles = document.getElementById("textSparkles");
const narrationBox = document.getElementById("narrationBox");
const narrationText = document.getElementById("narrationText");
const nextSurpriseBtn = document.getElementById("nextSurpriseBtn");
const stars = document.getElementById("stars");
const particlesLayer = document.getElementById("particles");
const fireworksCanvas = document.getElementById("fireworksCanvas");
const confettiCanvas = document.getElementById("confettiCanvas");
const introVoice = document.getElementById("introVoice");
const birthdaySong = document.getElementById("birthdaySong");
const cutSound = document.getElementById("cutSound");

const fwCtx = fireworksCanvas?.getContext("2d");
const cfCtx = confettiCanvas?.getContext("2d");
const cakeCtx = cakeConfettiCanvas?.getContext("2d");

let played = false;
let fireworksRunning = false;
let confettiRunning = false;
let frameId;
let confettiFrameId;
let lastLaunch = 0;
let rockets = [];
let sparks = [];
let confettiPieces = [];
let sparkleTimer;
let narrationTimer;
let lastFireworkFrame = 0;
let lastConfettiFrame = 0;
let lastShakeAt = 0;
let popAudioContext;
let activeSlideIndex = 0;
let cakeCutDone = false;
let isVideoSequenceRunning = false;
let cakeConfettiFrameId;
let cakeConfettiPieces = [];
let slideVideoAutoplayTimer;
let scrollAutoplayRaf = 0;
let totalSlides = 0;

const palette = ["#ffd166", "#ff6bb8", "#5da9ff", "#a575ff", "#fff5b7"];
const narrationScript = `Hello Astha, main Shivansh...
Aaj ka din bada special hai for you,
so wishing you a happiest birthday dost.
Aise hi khush raho, hamesha muskurate raho,
khub tarakki karo.
Aur aaj ka din to bhayankar tarike se jiyo...
Abhi aage aur bhi bahut kuch hai,
so wait... aur enter karo.`;

// Performance throttling based on device
const isMobile = window.innerWidth < 700;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasLowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
const hasLowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
const lowPerformanceMode = prefersReducedMotion || (isMobile && (hasLowMemory || hasLowCpu));
const particleModifier = lowPerformanceMode ? 0.35 : (isMobile ? 0.5 : 1.0);
const fireworkTargetFps = lowPerformanceMode ? 22 : (isMobile ? 30 : 60);
const confettiTargetFps = lowPerformanceMode ? 18 : (isMobile ? 28 : 60);
const fireworkFrameInterval = 1000 / fireworkTargetFps;
const confettiFrameInterval = 1000 / confettiTargetFps;
let lastFireworkRender = 0;
let lastConfettiRender = 0;
let resizeDebounceTimer;

if (lowPerformanceMode) {
    document.body.classList.add("reduced-effects");
}

function sizeCanvases() {
    if (!fireworksCanvas || !confettiCanvas || !cakeCutWrap) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    fireworksCanvas.width = Math.floor(w * dpr);
    fireworksCanvas.height = Math.floor(h * dpr);
    fireworksCanvas.style.width = `${w}px`;
    fireworksCanvas.style.height = `${h}px`;
    fwCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    confettiCanvas.width = Math.floor(w * dpr);
    confettiCanvas.height = Math.floor(h * dpr);
    confettiCanvas.style.width = `${w}px`;
    confettiCanvas.style.height = `${h}px`;
    cfCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cakeRect = cakeCutWrap.getBoundingClientRect();
    const cw = Math.max(1, Math.floor(cakeRect.width));
    const ch = Math.max(1, Math.floor(cakeRect.height));
    cakeConfettiCanvas.width = Math.floor(cw * dpr);
    cakeConfettiCanvas.height = Math.floor(ch * dpr);
    cakeConfettiCanvas.style.width = `${cw}px`;
    cakeConfettiCanvas.style.height = `${ch}px`;
    cakeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function buildStars() {
    if (!stars) return;
    const count = lowPerformanceMode ? 30 : (isMobile ? 50 : 100);
    stars.innerHTML = '';
    for (let i = 0; i < count; i += 1) {
        const star = document.createElement("i");
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.setProperty("--dur", `${2.2 + Math.random() * 2.6}s`);
        star.style.setProperty("--delay", `${Math.random() * 2.4}s`);
        stars.appendChild(star);
    }
}

function buildFloatingParticles() {
    if (!particlesLayer) return;
    const count = lowPerformanceMode ? 10 : (isMobile ? 15 : 30);
    particlesLayer.innerHTML = '';
    for (let i = 0; i < count; i += 1) {
        const orb = document.createElement("i");
        orb.style.left = `${Math.random() * 100}%`;
        orb.style.bottom = `${-10 - Math.random() * 35}%`;
        orb.style.setProperty("--float-dur", `${6 + Math.random() * 4}s`);
        orb.style.setProperty("--float-delay", `${Math.random() * 5}s`);
        particlesLayer.appendChild(orb);
    }
}

function launchRocket() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const fromX = w * (0.12 + Math.random() * 0.76);
    const targetX = w * (0.1 + Math.random() * 0.8);
    const targetY = h * (0.16 + Math.random() * 0.42);
    const trail = [];

    rockets.push({
        x: fromX,
        y: h + 15,
        vx: (targetX - fromX) / (30 + Math.random() * 20),
        vy: -6.1 - Math.random() * 2.5,
        targetY,
        color: palette[Math.floor(Math.random() * palette.length)],
        trail
    });
}

function addExplosion(x, y) {
    const burstCount = Math.floor((isMobile ? 30 : 60) * particleModifier);
    for (let i = 0; i < burstCount; i += 1) {
        const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.25;
        const speed = 1.2 + Math.random() * 3.7;

        sparks.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: 0.985,
            gravity: 0.045 + Math.random() * 0.03,
            alpha: 1,
            radius: 1.2 + Math.random() * 2.1,
            color: palette[Math.floor(Math.random() * palette.length)]
        });
    }

    const now = performance.now();
    if (now - lastShakeAt > 260) {
        lastShakeAt = now;
        celebration.classList.add("screen-shake");
        setTimeout(() => celebration.classList.remove("screen-shake"), 220);
    }
    playSoftPop();
}

function drawRocketTrail(rocket) {
    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > 8) {
        rocket.trail.shift();
    }

    for (let i = 0; i < rocket.trail.length; i += 1) {
        const point = rocket.trail[i];
        const alpha = i / rocket.trail.length;
        fwCtx.beginPath();
        fwCtx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        fwCtx.fillStyle = `${rocket.color}${Math.floor(alpha * 255).toString(16).padStart(2, "0")}`;
        fwCtx.fill();
    }
}

function animateFireworks(now) {
    if (!fireworksRunning) return;

    if (!lastFireworkRender) lastFireworkRender = now;
    const elapsed = now - lastFireworkRender;
    if (elapsed < fireworkFrameInterval) {
        frameId = requestAnimationFrame(animateFireworks);
        return;
    }

    const delta = Math.min(2.1, Math.max(0.7, elapsed / 16.67 || 1));
    lastFireworkFrame = now;
    lastFireworkRender = now;

    fwCtx.fillStyle = "rgba(3, 4, 14, 0.15)";
    fwCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const interval = isMobile ? 400 : 250;
    if (now - lastLaunch > interval) {
        launchRocket();
        if (Math.random() > 0.75) launchRocket();
        lastLaunch = now;
    }

    for (let i = rockets.length - 1; i >= 0; i -= 1) {
        const rocket = rockets[i];
        rocket.x += rocket.vx * delta;
        rocket.y += rocket.vy * delta;
        rocket.vy += 0.035 * delta;

        drawRocketTrail(rocket);

        fwCtx.beginPath();
        fwCtx.arc(rocket.x, rocket.y, 2.6, 0, Math.PI * 2);
        fwCtx.fillStyle = rocket.color;
        fwCtx.fill();

        if (rocket.y <= rocket.targetY || rocket.vy >= 0.2) {
            addExplosion(rocket.x, rocket.y);
            rockets.splice(i, 1);
        }
    }

    for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const p = sparks[i];
        p.vx *= Math.pow(p.drag, delta);
        p.vy *= Math.pow(p.drag, delta);
        p.vy += p.gravity * delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.alpha -= 0.015 * delta;

        if (p.alpha <= 0) {
            sparks.splice(i, 1);
            continue;
        }

        fwCtx.beginPath();
        fwCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const hexAlpha = Math.max(0, Math.floor(p.alpha * 255)).toString(16).padStart(2, "0");
        fwCtx.fillStyle = `${p.color}${hexAlpha}`;
        fwCtx.fill();
    }

    frameId = requestAnimationFrame(animateFireworks);
}

function seedConfetti() {
    const count = isMobile ? 60 : 120;
    confettiPieces = [];
    for (let i = 0; i < count; i += 1) {
        confettiPieces.push({
            x: Math.random() * window.innerWidth,
            y: -Math.random() * window.innerHeight,
            size: 4 + Math.random() * 8,
            vy: 0.8 + Math.random() * 1.8,
            vx: (Math.random() - 0.5) * 0.8,
            tilt: Math.random() * Math.PI * 2,
            spin: 0.03 + Math.random() * 0.06,
            color: palette[Math.floor(Math.random() * palette.length)]
        });
    }
}

function animateConfetti(now) {
    if (!confettiRunning) return;

    if (!lastConfettiRender) lastConfettiRender = now;
    const elapsed = now - lastConfettiRender;
    if (elapsed < confettiFrameInterval) {
        confettiFrameId = requestAnimationFrame(animateConfetti);
        return;
    }

    const delta = Math.min(2, Math.max(0.7, elapsed / 16.67 || 1));
    lastConfettiFrame = now;
    lastConfettiRender = now;

    cfCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const c of confettiPieces) {
        c.x += c.vx * delta;
        c.y += c.vy * delta;
        c.tilt += c.spin * delta;

        if (c.y > window.innerHeight + 14) {
            c.y = -20;
            c.x = Math.random() * window.innerWidth;
        }

        cfCtx.save();
        cfCtx.translate(c.x, c.y);
        cfCtx.rotate(c.tilt);
        cfCtx.fillStyle = c.color;
        cfCtx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.58);
        cfCtx.restore();
    }

    confettiFrameId = requestAnimationFrame(animateConfetti);
}

function spawnTextSparkle() {
    if (!textSparkles || textSparkles.childElementCount > 30) return;

    const sparkle = document.createElement("span");
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${8 + Math.random() * 80}%`;
    sparkle.style.setProperty("--sx", `${(Math.random() - 0.5) * 90}px`);
    sparkle.style.setProperty("--sy", `${-18 - Math.random() * 75}px`);
    textSparkles.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 900);
}

function typeNarration(speed) {
    if (!narrationText || !narrationBox) return 0;
    clearInterval(narrationTimer);
    narrationText.textContent = "";
    narrationBox.classList.add("show");

    let idx = 0;
    narrationTimer = setInterval(() => {
        narrationText.textContent += narrationScript[idx] || "";
        idx += 1;
        if (idx >= narrationScript.length) clearInterval(narrationTimer);
    }, speed);

    return narrationScript.length * speed;
}

function speechFallback() {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(narrationScript);
    u.lang = "hi-IN";
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
}

async function startNarration() {
    let speed = 46;
    if (Number.isFinite(introVoice?.duration) && introVoice.duration > 0) {
        speed = Math.max(28, Math.min(85, Math.round((introVoice.duration * 1000) / narrationScript.length)));
    }

    const estimatedMs = typeNarration(speed);
    try {
        if (introVoice) {
            introVoice.currentTime = 0;
            introVoice.volume = 1;
            await introVoice.play();
        }
    } catch (error) {
        speechFallback();
    }

    return Math.max(estimatedMs + 1600, 7800);
}

function playSoftPop() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (Math.random() > 0.35) return;

    const AudioRef = window.AudioContext || window.webkitAudioContext;
    if (!popAudioContext) popAudioContext = new AudioRef();
    if (popAudioContext.state === 'suspended') popAudioContext.resume();

    const osc = popAudioContext.createOscillator();
    const gain = popAudioContext.createGain();
    const now = popAudioContext.currentTime;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(160 + Math.random() * 120, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.02, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(popAudioContext.destination);
    osc.start(now);
    osc.stop(now + 0.15);
}

function stopBirthdaySong() {
    if (!birthdaySong) return;
    birthdaySong.pause();
    birthdaySong.currentTime = 0;
}

async function playBirthdaySong() {
    if (!birthdaySong) return;
    birthdaySong.currentTime = 0;
    birthdaySong.volume = 0.6;
    try {
        await birthdaySong.play();
    } catch (e) {}
}

function stopCelebration() {
    fireworksRunning = false;
    confettiRunning = false;
    cancelAnimationFrame(frameId);
    cancelAnimationFrame(confettiFrameId);
    clearInterval(sparkleTimer);
    clearInterval(narrationTimer);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (introVoice) introVoice.pause();
    stopBirthdaySong();
    
    if (narrationBox) narrationBox.classList.remove("show");
    if (nextSurpriseBtn) nextSurpriseBtn.classList.add("hidden");
    if (narrationText) narrationText.textContent = "";
    
    rockets = [];
    sparks = [];

    setTimeout(() => {
        if (celebration) {
            celebration.classList.remove("active");
            setTimeout(() => celebration.classList.add("hidden"), 700);
        }
    }, 200);
}

// LAZY LOADING HANDLER
function loadVideo(video) {
    const source = video.querySelector('source');
    if (source && source.dataset.src) {
        source.src = source.dataset.src;
        delete source.dataset.src;
        video.load();
    }
}

function setMainSlide(index) {
    if (!totalSlides) return;
    activeSlideIndex = Math.max(0, Math.min(totalSlides - 1, index));
    if (slidesTrack) slidesTrack.style.transform = `translateX(-${activeSlideIndex * 100}%)`;

    surpriseVideos.forEach((video) => {
        video.pause();
    });

    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "auto" });

    updateSlideControls();

    clearTimeout(slideVideoAutoplayTimer);
    slideVideoAutoplayTimer = setTimeout(() => {
        autoplayVisibleVideoInActiveSlide();
    }, 600);
}

function updateSlideControls() {
    if (prevSlideBtn) prevSlideBtn.disabled = activeSlideIndex === 0;
    if (nextSlideBtn) nextSlideBtn.disabled = activeSlideIndex >= totalSlides - 1;

    if (!slideDotsWrap) return;
    const dots = slideDotsWrap.querySelectorAll("button[data-slide-index]");
    dots.forEach((dot) => {
        const isActive = Number(dot.dataset.slideIndex) === activeSlideIndex;
        dot.classList.toggle("active", isActive);
        dot.setAttribute("aria-selected", isActive ? "true" : "false");
    });
}

function setupSlideDots() {
    if (!slidesTrack || !slideDotsWrap) return;
    slideDotsWrap.innerHTML = "";

    for (let i = 0; i < totalSlides; i += 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "slide-dot";
        dot.dataset.slideIndex = String(i);
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.setAttribute("aria-selected", "false");
        slideDotsWrap.appendChild(dot);
    }
}

async function playWithFallback(video) {
    if (!video) return;
    loadVideo(video); // Ensure loaded
    try {
        await video.play();
    } catch (error) {
        video.muted = true;
        await video.play().catch(() => {});
    }
}

async function autoplayVisibleVideoInActiveSlide() {
    if (mainContent?.classList.contains("hidden") || !slidesTrack) return;

    const activeSlide = slidesTrack.children[activeSlideIndex];
    if (!activeSlide) return;

    const slideVideos = Array.from(activeSlide.querySelectorAll("video"));
    if (!slideVideos.length) return;

    let targetVideo = slideVideos[0];
    let bestRatio = 0;

    for (const video of slideVideos) {
        const rect = video.getBoundingClientRect();
        const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
        const ratio = visibleHeight / (rect.height || 1);
        if (ratio > bestRatio) {
            bestRatio = ratio;
            targetVideo = video;
        }
    }

    surpriseVideos.forEach((video) => {
        if (video !== targetVideo) video.pause();
    });

    if (targetVideo.paused) targetVideo.currentTime = 0;
    await playWithFallback(targetVideo);
}

function setupHoverPlayForVideos() {
    const supportsHover = window.matchMedia("(hover: hover)").matches;
    if (!supportsHover || !surpriseVideos.length) return;

    surpriseVideos.forEach((video) => {
        video.addEventListener("mouseenter", async () => {
            surpriseVideos.forEach(v => v !== video && v.pause());
            await playWithFallback(video);
        });
        video.addEventListener("mouseleave", () => video.pause());
    });
}

function setupLazyVideoObserver() {
    if (!surpriseVideos.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const video = entry.target;
            loadVideo(video);
            observer.unobserve(video);
        });
    }, {
        root: null,
        rootMargin: "260px 0px",
        threshold: 0.01
    });

    surpriseVideos.forEach((video) => observer.observe(video));
}

function seedCakeConfetti() {
    if (!cakeCutWrap) return;
    const w = cakeCutWrap.clientWidth;
    const h = cakeCutWrap.clientHeight;
    const count = isMobile ? 50 : 100;
    cakeConfettiPieces = [];

    for (let i = 0; i < count; i += 1) {
        cakeConfettiPieces.push({
            x: Math.random() * w,
            y: -Math.random() * h,
            vx: (Math.random() - 0.5) * 1.6,
            vy: 1 + Math.random() * 2.4,
            size: 4 + Math.random() * 8,
            tilt: Math.random() * Math.PI * 2,
            spin: 0.03 + Math.random() * 0.08,
            life: 200 + Math.random() * 100,
            color: palette[Math.floor(Math.random() * palette.length)]
        });
    }
}

function animateCakeConfetti() {
    if (!cakeCtx || !cakeCutWrap) return;
    const w = cakeCutWrap.clientWidth;
    const h = cakeCutWrap.clientHeight;
    cakeCtx.clearRect(0, 0, w, h);

    let alive = 0;
    for (const p of cakeConfettiPieces) {
        if (p.life <= 0) continue;
        p.x += p.vx; p.y += p.vy; p.tilt += p.spin; p.life -= 1;
        if (p.y > h + 22) { p.life = 0; continue; }
        alive += 1;
        cakeCtx.save();
        cakeCtx.translate(p.x, p.y);
        cakeCtx.rotate(p.tilt);
        cakeCtx.fillStyle = p.color;
        cakeCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.58);
        cakeCtx.restore();
    }

    if (alive > 0) cakeConfettiFrameId = requestAnimationFrame(animateCakeConfetti);
}

function cutCakeNow() {
    if (cakeCutDone) return;
    cakeCutDone = true;
    cakeCutWrap?.classList.add("punch");
    setTimeout(() => cakeCutWrap?.classList.remove("punch"), 360);

    if (navigator.vibrate) navigator.vibrate([15, 15, 20]);
    
    if (cutSound) {
        cutSound.currentTime = 0;
        cutSound.volume = 0.8;
        cutSound.play().catch(() => {});
    }
    playBirthdaySong();

    setTimeout(() => cakeCutWrap?.classList.add("cut"), 180);

    setTimeout(() => {
        if (cakeHint) cakeHint.textContent = "Perfect cut!";
        cakeMessage?.classList.add("show");
        recutCakeBtn?.classList.remove("hidden");
        cakeStage?.classList.add("shake");
        setTimeout(() => cakeStage?.classList.remove("shake"), 320);
        seedCakeConfetti();
        animateCakeConfetti();
    }, 1200);
}

function resetCakeCut() {
    cakeCutDone = false;
    cakeCutWrap?.classList.remove("cut", "punch");
    cakeMessage?.classList.remove("show");
    recutCakeBtn?.classList.add("hidden");
    if (cakeHint) cakeHint.textContent = "Please tap on cake and cut the cake";
    if (cutSound) cutSound.pause();
    stopBirthdaySong();
    cancelAnimationFrame(cakeConfettiFrameId);
    if (cakeCrumbs) cakeCrumbs.innerHTML = "";
}

function runCinematicSequence() {
    if (played) return;
    played = true;

    intro?.classList.add("fade-out");
    setTimeout(() => intro?.classList.add("hidden"), 300);

    if (celebration) {
        celebration.classList.remove("hidden");
        requestAnimationFrame(() => celebration.classList.add("active"));
    }

    setTimeout(() => {
        fireworksRunning = true; confettiRunning = true;
        seedConfetti();
        lastFireworkFrame = performance.now();
        lastConfettiFrame = performance.now();
        lastFireworkRender = 0;
        lastConfettiRender = 0;
        frameId = requestAnimationFrame(animateFireworks);
        confettiFrameId = requestAnimationFrame(animateConfetti);
    }, 500);

    setTimeout(() => {
        birthdayText?.classList.add("show");
        sparkleTimer = setInterval(spawnTextSparkle, 150);
    }, 1500);

    setTimeout(async () => {
        const totalNarrationMs = await startNarration();
        setTimeout(() => nextSurpriseBtn?.classList.remove("hidden"), totalNarrationMs);
    }, 900);
}

function enterFirstSmileSurprise() {
    if (nextSurpriseBtn) nextSurpriseBtn.classList.add("hidden");
    stopCelebration();
    setTimeout(() => {
        resetCakeCut();
        setMainSlide(2);
        mainContent?.classList.remove("hidden");
    }, 460);
}

// INIT
sizeCanvases();
buildStars();
buildFloatingParticles();
setupHoverPlayForVideos();
setupLazyVideoObserver();
totalSlides = slidesTrack ? slidesTrack.children.length : 0;
setupSlideDots();
updateSlideControls();

window.addEventListener("resize", () => {
    clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
        sizeCanvases();
        buildStars();
        buildFloatingParticles();
    }, 140);
}, { passive: true });

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        surpriseVideos.forEach((video) => video.pause());
    }
});

window.addEventListener("scroll", () => {
    if (![1, 3, 4].includes(activeSlideIndex)) return;
    if (scrollAutoplayRaf) return;
    scrollAutoplayRaf = requestAnimationFrame(async () => {
        scrollAutoplayRaf = 0;
        await autoplayVisibleVideoInActiveSlide();
    });
}, { passive: true });

slidesTrack?.addEventListener("transitionend", () => autoplayVisibleVideoInActiveSlide());
enterBtn?.addEventListener("click", runCinematicSequence);
nextSurpriseBtn?.addEventListener("click", enterFirstSmileSurprise);
openVideoSlideBtn?.addEventListener("click", () => setMainSlide(1));
openCakeSlideBtn?.addEventListener("click", () => {
    setMainSlide(3);
    if (astha2Video) playWithFallback(astha2Video);
});
openAstha12Btn?.addEventListener("click", () => setMainSlide(4));
prevSlideBtn?.addEventListener("click", () => setMainSlide(activeSlideIndex - 1));
nextSlideBtn?.addEventListener("click", () => setMainSlide(activeSlideIndex + 1));
slideDotsWrap?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const index = Number(target.dataset.slideIndex);
    if (!Number.isFinite(index)) return;
    setMainSlide(index);
});
cakeCutWrap?.addEventListener("click", cutCakeNow);
cakeCutWrap?.addEventListener("touchstart", cutCakeNow, { passive: true });
recutCakeBtn?.addEventListener("click", resetCakeCut);
partyEntryBtn?.addEventListener("click", () => {
    stopBirthdaySong();
    setMainSlide(1);
    if (surpriseVideos[0]) playWithFallback(surpriseVideos[0]);
});

// INITIAL PRELOAD FOR FIRST VIDEO
if (surpriseVideos[0]) loadVideo(surpriseVideos[0]);

document.addEventListener("keydown", (event) => {
    if (mainContent?.classList.contains("hidden")) return;
    if (event.key === "ArrowLeft") setMainSlide(activeSlideIndex - 1);
    if (event.key === "ArrowRight") setMainSlide(activeSlideIndex + 1);
});
