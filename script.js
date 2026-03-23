const introSection = document.getElementById("intro");
const mainContent = document.getElementById("mainContent");
const typedTextEl = document.getElementById("typedText");
const enterMainBtn = document.getElementById("enterMainBtn");
const startVoiceBtn = document.getElementById("startVoiceBtn");
const introHint = document.getElementById("introHint");
const voiceAudio = document.getElementById("voice");
const bgMusic = document.getElementById("bgMusic");
const celebrationOverlay = document.getElementById("celebrationOverlay");
const fireworksCanvas = document.getElementById("fireworksCanvas");
const birthdayBanner = document.getElementById("birthdayBanner");
const textSparkles = document.getElementById("textSparkles");
const celebrationStars = document.getElementById("celebrationStars");

const introScript = `Hello Astha, main Shivansh...
Aaj ka din bada special hai for you,
so wishing you a happiest birthday dost.
Aise hi khush raho, hamesha muskurate raho,
khub tarakki karo.
Aur aaj ka din to bhayankar tarike se jiyo...
Abhi aage aur bhi bahut kuch hai,
so wait... aur enter karo.`;

let typingInterval;
let confettiStarted = false;
let narrationStarted = false;
let fallbackInProgress = false;
let fallbackTimeoutId;
let celebrationPlayed = false;

let fireworksRunning = false;
let fireworksFrameId;
let fireworksLastSpawn = 0;
let activeRockets = [];
let activeBursts = [];
let sparkleTimer;
let fireworksCleanupTimer;
let overlayHideTimer;

const fireworksPalette = ["#ff4d59", "#ffe066", "#4aa3ff", "#ff77d6", "#a46dff"];

function typeNarrationText(speed = 50) {
  let index = 0;
  typedTextEl.textContent = "";

  clearInterval(typingInterval);
  typingInterval = setInterval(() => {
    typedTextEl.textContent += introScript[index] ?? "";
    index += 1;

    if (index >= introScript.length) {
      clearInterval(typingInterval);
    }
  }, speed);
}

function getTypingSpeedFromAudio() {
  if (!Number.isFinite(voiceAudio.duration) || voiceAudio.duration <= 0) {
    return 52;
  }

  const calculatedSpeed = Math.round((voiceAudio.duration * 1000) / introScript.length);
  return Math.min(90, Math.max(28, calculatedSpeed));
}

function getBestHindiVoice() {
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  return voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("hi"));
}

function waitForVoices() {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoices, { once: true });

    // Prevent hanging if voiceschanged does not fire.
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve(window.speechSynthesis.getVoices());
    }, 1000);
  });
}

async function speakFallbackNarration() {
  const voices = await waitForVoices();

  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("speech synthesis not supported"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(introScript);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const bestHindi = voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("hi"));
    const bestIndianEnglish = voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("en-in"));
    const chosenVoice = bestHindi || bestIndianEnglish || voices[0];

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = "en-US";
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(event.error || new Error("tts failed"));

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  });
}

function clearFallbackTimeout() {
  if (fallbackTimeoutId) {
    clearTimeout(fallbackTimeoutId);
    fallbackTimeoutId = null;
  }
}

async function runFallbackFlow() {
  if (fallbackInProgress) {
    return;
  }

  fallbackInProgress = true;
  introSection.classList.add("intro-playing");
  startVoiceBtn.classList.add("hidden");
  introHint.textContent = "Intro audio missing, fallback voice starting...";
  typeNarrationText(52);

  clearFallbackTimeout();
  fallbackTimeoutId = setTimeout(() => {
    if (fallbackInProgress) {
      introHint.textContent = "Surprise ready. Tap Enter 🎁";
      showEnterButton();
      fallbackInProgress = false;
    }
  }, 18000);

  try {
    await speakFallbackNarration();
    clearFallbackTimeout();
    introHint.textContent = "Surprise ready. Tap Enter 🎁";
    showEnterButton();
  } catch (ttsError) {
    clearFallbackTimeout();
    console.log("Fallback voice failed. Please verify intro audio file in p3 folder.", ttsError);
    introHint.textContent = "Fallback voice unavailable. Please verify intro audio file.";
    startVoiceBtn.classList.remove("hidden");
    narrationStarted = false;
  } finally {
    fallbackInProgress = false;
  }
}

function showEnterButton() {
  enterMainBtn.classList.remove("hidden");
}

function buildCelebrationStars() {
  if (!celebrationStars || celebrationStars.childElementCount > 0) {
    return;
  }

  const isMobile = window.innerWidth < 720;
  const count = isMobile ? 60 : 100;

  for (let i = 0; i < count; i += 1) {
    const star = document.createElement("i");
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty("--twinkle", `${2.4 + Math.random() * 2.7}s`);
    star.style.setProperty("--delay", `${Math.random() * 2.2}s`);
    celebrationStars.appendChild(star);
  }
}

function spawnSparkle() {
  if (!textSparkles || textSparkles.childElementCount > 40) {
    return;
  }

  const sparkle = document.createElement("span");
  const x = 20 + Math.random() * 60;
  const y = 8 + Math.random() * 78;
  const driftX = (Math.random() - 0.5) * 90;
  const driftY = -20 - Math.random() * 60;

  sparkle.style.left = `${x}%`;
  sparkle.style.top = `${y}%`;
  sparkle.style.setProperty("--sparkle-x", `${driftX}px`);
  sparkle.style.setProperty("--sparkle-y", `${driftY}px`);

  textSparkles.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1000);
}

function maybePlayFireworkPop() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return;
  }

  if (Math.random() > 0.38) {
    return;
  }

  const AudioContextRef = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContextRef();
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(170 + Math.random() * 90, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.02, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.15);
  oscillator.onended = () => {
    ctx.close();
  };
}

function resizeFireworksCanvas() {
  if (!fireworksCanvas) {
    return;
  }

  fireworksCanvas.width = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
}

function spawnRocket() {
  const w = fireworksCanvas.width;
  const h = fireworksCanvas.height;
  const originX = w * (0.1 + Math.random() * 0.8);
  const originY = h + 20;
  const targetX = w * (0.1 + Math.random() * 0.8);
  const targetY = h * (0.12 + Math.random() * 0.38);

  activeRockets.push({
    x: originX,
    y: originY,
    targetX,
    targetY,
    vx: (targetX - originX) / (35 + Math.random() * 18),
    vy: -6.3 - Math.random() * 2.4,
    color: fireworksPalette[Math.floor(Math.random() * fireworksPalette.length)]
  });
}

function explodeRocket(rocket) {
  const burst = [];
  const count = window.innerWidth < 720 ? 46 : 74;

  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.22;
    const speed = 1.5 + Math.random() * 3.4;
    burst.push({
      x: rocket.x,
      y: rocket.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      friction: 0.985,
      gravity: 0.048 + Math.random() * 0.03,
      color: fireworksPalette[Math.floor(Math.random() * fireworksPalette.length)],
      radius: 1.2 + Math.random() * 2.2
    });
  }

  activeBursts.push(...burst);
  maybePlayFireworkPop();
}

function drawFireworksFrame(timestamp) {
  if (!fireworksCanvas || !fireworksRunning) {
    return;
  }

  const ctx = fireworksCanvas.getContext("2d");
  ctx.fillStyle = "rgba(4, 6, 16, 0.25)";
  ctx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

  const spawnInterval = window.innerWidth < 720 ? 260 : 180;
  if (timestamp - fireworksLastSpawn > spawnInterval) {
    spawnRocket();
    if (Math.random() > 0.48) {
      spawnRocket();
    }
    fireworksLastSpawn = timestamp;
  }

  for (let i = activeRockets.length - 1; i >= 0; i -= 1) {
    const rocket = activeRockets[i];
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    rocket.vy += 0.035;

    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = rocket.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = `${rocket.color}30`;
    ctx.fill();

    if (rocket.y <= rocket.targetY || rocket.vy >= 0) {
      explodeRocket(rocket);
      activeRockets.splice(i, 1);
    }
  }

  for (let i = activeBursts.length - 1; i >= 0; i -= 1) {
    const spark = activeBursts[i];
    spark.vx *= spark.friction;
    spark.vy *= spark.friction;
    spark.vy += spark.gravity;
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.alpha -= 0.016;

    if (spark.alpha <= 0) {
      activeBursts.splice(i, 1);
      continue;
    }

    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
    ctx.fillStyle = `${spark.color}${Math.round(spark.alpha * 255)
      .toString(16)
      .padStart(2, "0")}`;
    ctx.fill();
  }

  fireworksFrameId = requestAnimationFrame(drawFireworksFrame);
}

function stopFireworks() {
  fireworksRunning = false;
  cancelAnimationFrame(fireworksFrameId);
  activeRockets = [];
  activeBursts = [];

  if (fireworksCanvas) {
    const ctx = fireworksCanvas.getContext("2d");
    ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
  }
}

function runGrandCelebration() {
  if (!celebrationOverlay || celebrationPlayed) {
    return;
  }

  celebrationPlayed = true;
  buildCelebrationStars();
  resizeFireworksCanvas();

  celebrationOverlay.classList.remove("hidden");
  requestAnimationFrame(() => {
    celebrationOverlay.classList.add("is-active");
  });

  clearTimeout(fireworksCleanupTimer);
  clearTimeout(overlayHideTimer);
  clearInterval(sparkleTimer);

  birthdayBanner.classList.remove("show");
  textSparkles.innerHTML = "";

  // Step 3: start fireworks after 0.5s.
  setTimeout(() => {
    fireworksRunning = true;
    fireworksLastSpawn = 0;
    fireworksFrameId = requestAnimationFrame(drawFireworksFrame);
  }, 500);

  // Step 4: reveal central birthday line after 1.5s.
  setTimeout(() => {
    birthdayBanner.classList.add("show");
    sparkleTimer = setInterval(spawnSparkle, 120);
  }, 1500);

  // Step 5: continue for a few seconds, then fade everything out smoothly.
  fireworksCleanupTimer = setTimeout(() => {
    stopFireworks();
  }, 7800);

  overlayHideTimer = setTimeout(() => {
    clearInterval(sparkleTimer);
    birthdayBanner.classList.remove("show");
    celebrationOverlay.classList.remove("is-active");

    setTimeout(() => {
      celebrationOverlay.classList.add("hidden");
    }, 700);
  }, 8800);
}

function beginExperience() {
  mainContent.classList.remove("hidden");
  introSection.classList.add("hidden");
  runGrandCelebration();

  if (bgMusic) {
    bgMusic.volume = 0.2;
    bgMusic.play().catch(() => {
      // Safe ignore if background music is blocked.
    });
  }

  document.getElementById("landing").scrollIntoView({ behavior: "smooth" });
}

function setupSmoothButtons() {
  const buttons = document.querySelectorAll("[data-scroll]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.dataset.scroll);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

function setupRevealOnScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.18 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function setupQuiz() {
  const form = document.getElementById("quizForm");
  const result = document.getElementById("quizResult");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const selected = ["q1", "q2", "q3"].map((q) => data.get(q));

    if (selected.some((v) => v === null)) {
      result.textContent = "Arre! Har question ka answer do pehle 😄";
      return;
    }

    const score = selected.reduce((sum, val) => sum + Number(val), 0);

    if (score === 3) {
      result.textContent = "Legend alert! Tu mujhe bahut zyada samajhta/samajhti hai 😂✨";
    } else if (score === 2) {
      result.textContent = "Solid score! Tu close friend zone ka CEO hai 😎";
    } else {
      result.textContent = "Hmm... lagta hai ek aur memory session karna padega 😄";
    }
  });
}

function setupConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  const confettiPieces = [];
  let animationFrame;

  const colors = ["#44f0ff", "#ff5fae", "#ffd166", "#7cf29a", "#ffffff"];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createBurst() {
    const count = 220;
    for (let i = 0; i < count; i += 1) {
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.3,
        r: 2 + Math.random() * 5,
        d: Math.random() * count,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 10,
        tiltAngle: 0,
        tiltAngleIncrement: 0.03 + Math.random() * 0.08,
        velocity: 1 + Math.random() * 3
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettiPieces.forEach((p) => {
      p.tiltAngle += p.tiltAngleIncrement;
      p.y += p.velocity;
      p.tilt = Math.sin(p.tiltAngle) * 12;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });

    for (let i = confettiPieces.length - 1; i >= 0; i -= 1) {
      if (confettiPieces[i].y > canvas.height + 30) {
        confettiPieces.splice(i, 1);
      }
    }

    if (confettiPieces.length > 0) {
      animationFrame = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animationFrame);
    }
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const finalSection = document.getElementById("final");
  const finalObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !confettiStarted) {
          confettiStarted = true;
          createBurst();
          draw();
        }
      });
    },
    { threshold: 0.45 }
  );

  finalObserver.observe(finalSection);
}

document.addEventListener("DOMContentLoaded", async () => {
  enterMainBtn.classList.add("hidden");
  typedTextEl.textContent = "";

  window.addEventListener("resize", resizeFireworksCanvas);

  setupSmoothButtons();
  setupRevealOnScroll();
  setupQuiz();
  setupConfetti();
});

startVoiceBtn.addEventListener("click", async () => {
  if (narrationStarted) {
    return;
  }
  narrationStarted = true;

  voiceAudio.currentTime = 0;
  voiceAudio.volume = 1;

  try {
    await voiceAudio.play();

    introSection.classList.add("intro-playing");
    startVoiceBtn.classList.add("hidden");
    introHint.textContent = "Playing your surprise...";

    const typingSpeed = getTypingSpeedFromAudio();
    typeNarrationText(typingSpeed);
  } catch (error) {
    console.log("Audio failed to play. Check intro audio path in p3 folder.", error);
    await runFallbackFlow();
  }
});

voiceAudio.onended = function onVoiceEnded() {
  introHint.textContent = "Surprise ready. Tap Enter 🎁";
  showEnterButton();
};

voiceAudio.onerror = function onVoiceError(error) {
  console.log("Audio error event. Check intro audio file in same folder.", error);
  clearInterval(typingInterval);
  runFallbackFlow();
};

enterMainBtn.addEventListener("click", beginExperience);
