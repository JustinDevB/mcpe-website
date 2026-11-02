/* MinecraftPlanetEarth v1.9
 * Navigation, copy-IP, live status, scroll reveals,
 * and a dependency-free WebGL globe.
 */
(() => {
  'use strict';

  const CONFIG = Object.freeze({
    serverAddress: 'mc.minecraftplanetearth.com',
    statusApi: 'https://api.mcsrvstat.us/3/',
    statusTimeoutMs: 8000
  });

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  // Resolve assets relative to this JavaScript file.
  // This works on both the homepage and nested pages.
  const SCRIPT_URL = document.currentScript?.src ||
    document.querySelector('script[src*="main.js"]')?.src;

  const GLOBE_TEXTURE_URL = SCRIPT_URL
    ? new URL('../assets/globe-texture.svg', SCRIPT_URL).href
    : new URL('/assets/globe-texture.svg', window.location.origin).href;

  // --------------------------------------------------
  // Copyright year
  // --------------------------------------------------

  const year = $('#copyright-year');

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  // --------------------------------------------------
  // Mobile navigation
  // --------------------------------------------------

  const menuToggle = $('#menu-toggle');
  const mobileNav = $('#mobile-nav');

  if (menuToggle && mobileNav) {
    const closeMenu = () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      mobileNav.hidden = true;
    };

    menuToggle.addEventListener('click', () => {
      const open = menuToggle.getAttribute('aria-expanded') !== 'true';

      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute(
        'aria-label',
        open ? 'Close navigation' : 'Open navigation'
      );

      mobileNav.hidden = !open;
    });

    $$('#mobile-nav a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !mobileNav.hidden) {
        closeMenu();
        menuToggle.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (
        !mobileNav.hidden &&
        !mobileNav.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });
  }

  // --------------------------------------------------
  // Copy server address
  // --------------------------------------------------

  let toastTimer;

  function showToast(message) {
    const toast = $('#copy-toast');

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2600);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) {
        // Fall through to the legacy clipboard method.
      }
    }

    const input = document.createElement('textarea');

    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.left = '-9999px';

    document.body.appendChild(input);
    input.select();

    let copied = false;

    try {
      copied = document.execCommand('copy');
    } catch (_) {
      // Clipboard access was unavailable.
    }

    input.remove();

    return copied;
  }

  $$('[data-copy-ip]').forEach((button) => {
    button.addEventListener('click', async () => {
      const copied = await copyText(CONFIG.serverAddress);

      showToast(
        copied
          ? `Copied ${CONFIG.serverAddress}`
          : `Server IP: ${CONFIG.serverAddress}`
      );
    });
  });

  // --------------------------------------------------
  // Server status
  // --------------------------------------------------

  const headerText = $('#header-status-text');

  const statusNodes = [
    $('#header-status-dot'),
    $('#community-status-dot')
  ].filter(Boolean);

  const communityText = $('#community-status-text');

  function setStatus(state, text) {
    statusNodes.forEach((node) => {
      node.className = `status-dot status-${state}`;
    });

    if (communityText) {
      communityText.textContent = text;
    }

    if (headerText) {
      headerText.textContent =
        state === 'online'
          ? 'Server online'
          : state === 'offline'
            ? 'Server offline'
            : 'Java Edition';
    }
  }

  async function refreshStatus() {
    const controller = new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      CONFIG.statusTimeoutMs
    );

    try {
      const response = await fetch(
        `${CONFIG.statusApi}${encodeURIComponent(CONFIG.serverAddress)}`,
        {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            Accept: 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (typeof data.online !== 'boolean') {
        throw new Error('Unexpected response');
      }

      if (data.online) {
        const onlinePlayers = Number.isInteger(data.players?.online)
          ? data.players.online
          : null;

        const maxPlayers = Number.isInteger(data.players?.max)
          ? data.players.max
          : null;

        const playerText = onlinePlayers === null
          ? 'Server is online · Join the world'
          : `${onlinePlayers}${maxPlayers === null ? '' : ` / ${maxPlayers}`} players online · Join the world`;

        setStatus('online', playerText);
      } else {
        setStatus(
          'offline',
          'Server currently offline · Check back soon'
        );
      }
    } catch (_) {
      setStatus(
        'unknown',
        'Live status unavailable · Try joining in Minecraft'
      );
    } finally {
      clearTimeout(timer);
    }
  }

  refreshStatus();

  // --------------------------------------------------
  // Scroll reveal animations
  // --------------------------------------------------

  if (
    'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.documentElement.classList.add('js-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px 35px 0px'
      }
    );

    $$('.reveal').forEach((element) => {
      observer.observe(element);
    });
  }

  // --------------------------------------------------
  // Interactive WebGL globe
  // --------------------------------------------------

  function initGlobe() {
    const canvas = $('#earth-globe');
    const fallback = $('#globe-fallback');

    if (!canvas) return;

    const enableFallback = () => {
      document.documentElement.classList.add('globe-fallback-mode');
      canvas.style.display = 'none';

      if (fallback) {
        fallback.style.display = '';
      }
    };

    if (!window.WebGLRenderingContext) {
      enableFallback();
      return;
    }

    let gl;

    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false
      });
    } catch (_) {
      enableFallback();
      return;
    }

    if (!gl) {
      enableFallback();
      return;
    }

    // Shader sources

    const vertexSource = `
      attribute vec3 aPosition;
      attribute vec2 aUV;

      uniform float uYaw;
      uniform float uPitch;
      uniform float uScale;

      varying vec2 vUV;
      varying vec3 vNormal;
      varying float vDepth;

      void main() {
        float cy = cos(uYaw);
        float sy = sin(uYaw);
        float cx = cos(uPitch);
        float sx = sin(uPitch);

        vec3 yawed = vec3(
          cy * aPosition.x + sy * aPosition.z,
          aPosition.y,
          -sy * aPosition.x + cy * aPosition.z
        );

        vec3 p = vec3(
          yawed.x,
          cx * yawed.y - sx * yawed.z,
          sx * yawed.y + cx * yawed.z
        );

        vNormal = normalize(p);
        vUV = aUV;
        vDepth = p.z;

        gl_Position = vec4(
          p.x * uScale,
          p.y * uScale,
          -p.z * 0.65,
          1.0
        );
      }
    `;

    const fragmentSource = `
      precision mediump float;

      uniform sampler2D uTexture;

      varying vec2 vUV;
      varying vec3 vNormal;
      varying float vDepth;

      void main() {
        vec3 n = normalize(vNormal);
        vec3 light = normalize(vec3(-0.48, 0.44, 0.88));

        float diffuse = max(dot(n, light), 0.0);
        float front = max(n.z, 0.0);
        float shade = 0.31 + diffuse * 0.82;

        vec3 tex = texture2D(uTexture, vUV).rgb;
        vec3 ocean = vec3(0.015, 0.06, 0.10);

        float rim = pow(1.0 - front, 2.5);

        vec3 color = tex * shade;
        color += vec3(0.015, 0.20, 0.29) * rim * 0.55;
        color = mix(color, ocean, 0.0);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Shader compilation

    function createShader(type, source) {
      const shader = gl.createShader(type);

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(
          'Globe shader error:',
          gl.getShaderInfoLog(shader)
        );

        gl.deleteShader(shader);
        return null;
      }

      return shader;
    }

    const vertexShader = createShader(
      gl.VERTEX_SHADER,
      vertexSource
    );

    const fragmentShader = createShader(
      gl.FRAGMENT_SHADER,
      fragmentSource
    );

    if (!vertexShader || !fragmentShader) {
      enableFallback();
      return;
    }

    // Shader program

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(
        'Globe program error:',
        gl.getProgramInfoLog(program)
      );

      enableFallback();
      return;
    }

    gl.useProgram(program);

    // Sphere geometry

    const latSegments = 72;
    const lonSegments = 144;

    const positions = [];
    const uvs = [];
    const indices = [];

    for (let y = 0; y <= latSegments; y++) {
      const v = y / latSegments;
      const phi = v * Math.PI;

      for (let x = 0; x <= lonSegments; x++) {
        const u = x / lonSegments;
        const theta = u * Math.PI * 2;

        const radius = Math.sin(phi);

        positions.push(
          radius * Math.sin(theta),
          Math.cos(phi),
          radius * Math.cos(theta)
        );

        uvs.push(u, 1 - v);
      }
    }

    for (let y = 0; y < latSegments; y++) {
      for (let x = 0; x < lonSegments; x++) {
        const a = y * (lonSegments + 1) + x;
        const b = a + lonSegments + 1;

        indices.push(
          a, b, a + 1,
          b, b + 1, a + 1
        );
      }
    }

    // GPU buffers

    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(positions),
      gl.STATIC_DRAW
    );

    const uvBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(uvs),
      gl.STATIC_DRAW
    );

    const indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );

    // Vertex attributes

    const positionLocation = gl.getAttribLocation(
      program,
      'aPosition'
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );

    const uvLocation = gl.getAttribLocation(
      program,
      'aUV'
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(
      uvLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Uniform locations

    const yawLocation = gl.getUniformLocation(program, 'uYaw');
    const pitchLocation = gl.getUniformLocation(program, 'uPitch');
    const scaleLocation = gl.getUniformLocation(program, 'uScale');

    // Globe texture

    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      gl.REPEAT
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      gl.CLAMP_TO_EDGE
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      gl.LINEAR
    );

    gl.uniform1i(
      gl.getUniformLocation(program, 'uTexture'),
      0
    );

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0, 0, 0, 0);

    // Animation state

    let yaw = -0.55;
    let pitch = -0.12;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let autoSpin = !reducedMotion;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let velocity = 0;

    let textureReady = false;
    let animationFrame = 0;
    let lastTime = 0;

    // Canvas sizing

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const width = Math.max(
        1,
        Math.round(rect.width * dpr)
      );

      const height = Math.max(
        1,
        Math.round(rect.height * dpr)
      );

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;

        gl.viewport(0, 0, width, height);
      }
    }

    // Draw one frame.
    // This function never schedules another frame itself.

    function drawFrame(time = 0) {
      if (!textureReady || document.hidden) return;

      resize();

      gl.clear(
        gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT
      );

      gl.uniform1f(yawLocation, yaw);

      gl.uniform1f(
        pitchLocation,
        Math.max(-0.65, Math.min(0.65, pitch))
      );

      gl.uniform1f(scaleLocation, 0.91);

      gl.drawElements(
        gl.TRIANGLES,
        indices.length,
        gl.UNSIGNED_SHORT,
        0
      );

      if (autoSpin && !dragging && !reducedMotion) {
        const delta = lastTime
          ? Math.min((time - lastTime) / 16.67, 2)
          : 1;

        yaw += 0.0032 * delta + velocity;
        velocity *= 0.96;
      }

      lastTime = time;
    }

    // One guarded animation loop.
    // Multiple calls cannot create multiple concurrent loops.

    function scheduleFrame() {
      if (
        reducedMotion ||
        !textureReady ||
        document.hidden ||
        animationFrame !== 0
      ) {
        return;
      }

      animationFrame = requestAnimationFrame((time) => {
        animationFrame = 0;

        drawFrame(time);
        scheduleFrame();
      });
    }

    // Load the local texture.

    const map = new Image();

    map.onload = () => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      gl.pixelStorei(
        gl.UNPACK_FLIP_Y_WEBGL,
        true
      );

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        map
      );

      textureReady = true;

      if (fallback) {
        fallback.style.display = 'none';
      }

      canvas.style.zIndex = '2';

      if (reducedMotion) {
        drawFrame(0);
      } else {
        scheduleFrame();
      }
    };

    map.onerror = () => {
      console.warn(
        'Could not load globe texture:',
        GLOBE_TEXTURE_URL
      );

      enableFallback();
    };

    map.src = GLOBE_TEXTURE_URL;

    // Pointer interaction

    canvas.addEventListener('pointerdown', (event) => {
      dragging = true;

      lastX = event.clientX;
      lastY = event.clientY;

      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!dragging) return;

      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;

      yaw += dx * 0.008;
      pitch += dy * 0.006;
      velocity = dx * 0.00012;

      lastX = event.clientX;
      lastY = event.clientY;

      if (reducedMotion) {
        drawFrame(0);
      }
    });

    const stopDrag = () => {
      dragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerup', stopDrag);
    canvas.addEventListener('pointercancel', stopDrag);
    canvas.addEventListener('lostpointercapture', stopDrag);

    // Pause animation while the page is hidden.

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animationFrame !== 0) {
          cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      } else {
        lastTime = 0;

        if (reducedMotion) {
          drawFrame(0);
        } else {
          scheduleFrame();
        }
      }
    });

    // Handle browser resizing.

    window.addEventListener(
      'resize',
      () => {
        resize();

        if (reducedMotion) {
          drawFrame(0);
        }
      },
      { passive: true }
    );

    // Initial sizing.

    resize();
  }

  initGlobe();
})();