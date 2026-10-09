(() => {
  'use strict';

  const revealTargets = document.querySelectorAll('.reveal-section');

  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealTargets.forEach((target) => {
      revealObserver.observe(target);
    });
  }

  const canvas = document.querySelector('#hero-canvas');
  const context = canvas?.getContext('2d', { alpha: false });
  const frameCount = 300;

  if (!canvas || !context) {
    return;
  }

  const frames = new Array(frameCount);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let loadedFrame = -1;
  let currentFrame = 0;
  let targetFrame = 0;
  let drawQueued = false;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let pixelRatio = 1;

  const resizeCanvas = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = Math.round(canvasWidth * pixelRatio);
    canvas.height = Math.round(canvasHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    queueDraw();
  };

  const nearestLoadedFrame = (frameIndex) => {
    if (frames[frameIndex]?.complete && frames[frameIndex].naturalWidth > 0) {
      return frames[frameIndex];
    }

    for (let distance = 1; distance < frameCount; distance += 1) {
      const before = frameIndex - distance;
      const after = frameIndex + distance;
      if (before >= 0 && frames[before]?.complete && frames[before].naturalWidth > 0) {
        return frames[before];
      }
      if (after < frameCount && frames[after]?.complete && frames[after].naturalWidth > 0) {
        return frames[after];
      }
    }
    return null;
  };

  const drawFrame = () => {
    drawQueued = false;
    if (!reducedMotion.matches) {
      const difference = targetFrame - currentFrame;
      currentFrame = Math.abs(difference) < 0.35
        ? targetFrame
        : currentFrame + difference * 0.16;
    } else {
      currentFrame = targetFrame;
    }

    const frameIndex = Math.round(currentFrame);
    const image = nearestLoadedFrame(frameIndex);

    if (image) {
      const scale = Math.max(canvasWidth / image.naturalWidth, canvasHeight / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(image, (canvasWidth - width) / 2, (canvasHeight - height) / 2, width, height);
      loadedFrame = frameIndex;
    }

    if (!reducedMotion.matches && Math.abs(targetFrame - currentFrame) >= 0.35) {
      queueDraw();
    }
  };

  function queueDraw() {
    if (!drawQueued) {
      drawQueued = true;
      window.requestAnimationFrame(drawFrame);
    }
  }

  const updateScrollFrame = () => {
    const scrollableHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollableHeight));
    targetFrame = progress * (frameCount - 1);
    if (reducedMotion.matches) {
      currentFrame = targetFrame;
    }
    if (Math.round(currentFrame) !== loadedFrame || !reducedMotion.matches) {
      queueDraw();
    }
  };

  const loadFrame = (index) => new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      frames[index] = image;
      resolve();
      queueDraw();
    };
    image.onerror = () => {
      console.error(`Unable to load scroll animation frame ${index + 1}.`);
      resolve();
    };
    image.src = `frames/frame_${String(index + 1).padStart(4, '0')}.jpg`;
  });

  const loadFrames = async () => {
    let nextFrame = 0;
    const workers = Array.from({ length: 8 }, async () => {
      while (nextFrame < frameCount) {
        const index = nextFrame;
        nextFrame += 1;
        await loadFrame(index);
      }
    });
    await Promise.all(workers);
  };

  resizeCanvas();
  updateScrollFrame();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('scroll', updateScrollFrame, { passive: true });
  reducedMotion.addEventListener('change', updateScrollFrame);
  loadFrames();
})();
