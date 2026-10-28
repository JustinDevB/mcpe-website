/* MinecraftPlanetEarth v1.3: navigation, copy-IP, live status, scroll reveals and a dependency-free WebGL globe. */
(() => {
  'use strict';
  const CONFIG = Object.freeze({ serverAddress: 'mc.minecraftplanetearth.com', statusApi: 'https://api.mcsrvstat.us/3/', statusTimeoutMs: 8000 });
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const year = $('#copyright-year');
  if (year) year.textContent = String(new Date().getFullYear());

  const menuToggle = $('#menu-toggle');
  const mobileNav = $('#mobile-nav');
  if (menuToggle && mobileNav) {
    const closeMenu = () => { menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation'); mobileNav.hidden = true; };
    menuToggle.addEventListener('click', () => { const open = menuToggle.getAttribute('aria-expanded') !== 'true'; menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); mobileNav.hidden = !open; });
    $$('#mobile-nav a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); menuToggle.focus(); } });
    document.addEventListener('click', e => { if (!mobileNav.hidden && !mobileNav.contains(e.target) && !menuToggle.contains(e.target)) closeMenu(); });
  }

  let toastTimer;
  function showToast(message) { const toast = $('#copy-toast'); if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600); }
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) { try { await navigator.clipboard.writeText(text); return true; } catch (_) {} }
    const input = document.createElement('textarea'); input.value = text; input.setAttribute('readonly', ''); input.style.position = 'fixed'; input.style.left = '-9999px'; document.body.appendChild(input); input.select(); let copied = false; try { copied = document.execCommand('copy'); } catch (_) {} input.remove(); return copied;
  }
  $$('[data-copy-ip]').forEach(button => button.addEventListener('click', async () => { const ok = await copyText(CONFIG.serverAddress); showToast(ok ? `Copied ${CONFIG.serverAddress}` : `Server IP: ${CONFIG.serverAddress}`); }));

  const headerText = $('#header-status-text');
  const statusNodes = [$('#header-status-dot'), $('#community-status-dot')].filter(Boolean);
  const communityText = $('#community-status-text');
  function setStatus(state, text) { statusNodes.forEach(node => { node.className = `status-dot status-${state}`; }); if (communityText) communityText.textContent = text; if (headerText) headerText.textContent = state === 'online' ? 'Server online' : state === 'offline' ? 'Server offline' : 'Java Edition'; }
  async function refreshStatus() {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), CONFIG.statusTimeoutMs);
    try { const response = await fetch(`${CONFIG.statusApi}${encodeURIComponent(CONFIG.serverAddress)}`, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); if (typeof data.online !== 'boolean') throw new Error('Unexpected response');
      if (data.online) { const n = Number.isInteger(data.players?.online) ? data.players.online : null; const max = Number.isInteger(data.players?.max) ? data.players.max : null; setStatus('online', n === null ? 'Server is online · Join the world' : `${n}${max === null ? '' : ` / ${max}`} players online · Join the world`); }
      else setStatus('offline', 'Server currently offline · Check back soon');
    } catch (_) { setStatus('unknown', 'Live status unavailable · Try joining in Minecraft'); }
    finally { clearTimeout(timer); }
  }
  refreshStatus();

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .08, rootMargin: '0px 0px 35px 0px' });
    $$('.reveal').forEach(el => observer.observe(el));
  }

  // A small custom WebGL renderer keeps the animated globe dependency-free and GitHub-Pages friendly.
  function initGlobe() {
    const canvas = $('#earth-globe'); const fallback = $('#globe-fallback');
    const enableFallback = () => { document.documentElement.classList.add('globe-fallback-mode'); if (canvas) canvas.style.display = 'none'; };
    if (!canvas) return;
    if (!window.WebGLRenderingContext) { enableFallback(); return; }
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) { enableFallback(); return; }
    const vertexSource = `attribute vec3 aPosition; attribute vec2 aUV; uniform float uYaw; uniform float uPitch; uniform float uScale; varying vec2 vUV; varying vec3 vNormal; varying float vDepth; void main(){ float cy=cos(uYaw); float sy=sin(uYaw); float cx=cos(uPitch); float sx=sin(uPitch); vec3 yawed=vec3(cy*aPosition.x+sy*aPosition.z,aPosition.y,-sy*aPosition.x+cy*aPosition.z); vec3 p=vec3(yawed.x,cx*yawed.y-sx*yawed.z,sx*yawed.y+cx*yawed.z); vNormal=normalize(p); vUV=aUV; vDepth=p.z; gl_Position=vec4(p.x*uScale,p.y*uScale,-p.z*0.65,1.0); }`;
    const fragmentSource = `precision mediump float; uniform sampler2D uTexture; varying vec2 vUV; varying vec3 vNormal; varying float vDepth; void main(){ vec3 n=normalize(vNormal); vec3 light=normalize(vec3(-0.48,0.44,0.88)); float diffuse=max(dot(n,light),0.0); float front=max(n.z,0.0); float shade=0.31+diffuse*0.82; vec3 tex=texture2D(uTexture,vUV).rgb; vec3 ocean=vec3(0.015,0.06,0.10); float rim=pow(1.0-front,2.5); vec3 color=tex*shade; color+=vec3(0.015,0.20,0.29)*rim*0.55; color=mix(color,ocean,0.0); gl_FragColor=vec4(color,1.0); }`;
    function shader(type, source) { const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('Globe shader error:', gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; } return s; }
    const vs = shader(gl.VERTEX_SHADER, vertexSource), fs = shader(gl.FRAGMENT_SHADER, fragmentSource); if (!vs || !fs) { enableFallback(); return; }
    const program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.warn('Globe program error:', gl.getProgramInfoLog(program)); enableFallback(); return; }
    gl.useProgram(program);
    const latSegments = 72, lonSegments = 144, positions = [], uvs = [], indices = [];
    for (let y = 0; y <= latSegments; y++) {
      const v = y / latSegments, phi = v * Math.PI;
      for (let x = 0; x <= lonSegments; x++) {
        const u = x / lonSegments, theta = u * Math.PI * 2;
        const r = Math.sin(phi);
        positions.push(r * Math.sin(theta), Math.cos(phi), r * Math.cos(theta));
        uvs.push(u, 1 - v);
      }
    }
    for (let y = 0; y < latSegments; y++) for (let x = 0; x < lonSegments; x++) { const a = y * (lonSegments + 1) + x, b = a + lonSegments + 1; indices.push(a, b, a + 1, b, b + 1, a + 1); }
    const posBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const uvBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'aPosition'); gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer); gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    const uvLoc = gl.getAttribLocation(program, 'aUV'); gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer); gl.enableVertexAttribArray(uvLoc); gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const yawLoc = gl.getUniformLocation(program, 'uYaw'), pitchLoc = gl.getUniformLocation(program, 'uPitch'), scaleLoc = gl.getUniformLocation(program, 'uScale');
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const map = new Image(); map.onload = () => { gl.bindTexture(gl.TEXTURE_2D, texture); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, map); if (fallback) fallback.style.display = 'none'; canvas.style.zIndex = '2'; draw(); }; map.onerror = () => { console.warn('Could not load local globe texture; CSS fallback remains visible.'); enableFallback(); }; map.src = 'assets/globe-texture.svg';
    gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.clearColor(0,0,0,0);
    let yaw = -0.55, pitch = -0.12, autoSpin = !window.matchMedia('(prefers-reduced-motion: reduce)').matches, dragging = false, lastX = 0, lastY = 0, velocity = 0, raf = 0, lastTime = 0;
    function resize() { const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2); const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr)); if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); } }
    function draw(time=0) { resize(); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.uniform1f(yawLoc, yaw); gl.uniform1f(pitchLoc, Math.max(-0.65, Math.min(0.65, pitch))); gl.uniform1f(scaleLoc, .91); gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0); if (autoSpin && !dragging && !document.hidden) { const delta = lastTime ? Math.min((time-lastTime)/16.67, 2) : 1; yaw += .0032 * delta + velocity; velocity *= .96; } lastTime = time; if (!document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) raf = requestAnimationFrame(draw); }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { autoSpin = false; draw(0); }
    else raf = requestAnimationFrame(draw);
    canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture?.(e.pointerId); canvas.style.cursor = 'grabbing'; });
    canvas.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lastX, dy = e.clientY - lastY; yaw += dx * .008; pitch += dy * .006; velocity = dx * .00012; lastX = e.clientX; lastY = e.clientY; if (reduced) draw(0); });
    const stopDrag = () => { dragging = false; canvas.style.cursor = 'grab'; }; canvas.addEventListener('pointerup', stopDrag); canvas.addEventListener('pointercancel', stopDrag); canvas.addEventListener('lostpointercapture', stopDrag);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); } else if (!reduced) { lastTime = 0; raf = requestAnimationFrame(draw); } });
    window.addEventListener('resize', () => { resize(); if (reduced) draw(0); }, { passive: true });
  }
  initGlobe();
})();