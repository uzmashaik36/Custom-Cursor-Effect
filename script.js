(function () {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const cursorTrail = document.querySelector('.cursor-trail');
    const body = document.body;

    let supportsPointer = window.PointerEvent !== undefined;
    let isTouch = false;

    // touch detection: if the device supports touch or screen width small -> treat as touch
    function detectTouch() {
        isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 860;
        if (isTouch) {
            cursorDot.style.display = 'none';
            cursorOutline.style.display = 'none';
            cursorTrail.style.display = 'none';
            document.querySelector('.touch-indicator').style.display = 'block';
        } else {
            document.querySelector('.touch-indicator').style.display = 'none';
        }
    }
    detectTouch();
    window.addEventListener('resize', () => { detectTouch(); });

    if (isTouch) return; // do not init cursor on touch devices

    // initial positions
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let pos = { x: mouse.x, y: mouse.y }; // outline position (smoothed)

    // simple lerp
    function lerp(a, b, n) { return (1 - n) * a + n * b }

    // create a soft svg blob for the trail
    function createTrailSVG() {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 200 200');
        const g = document.createElementNS(ns, 'g');
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', 'M40,100 C40,40 160,40 160,100 C160,160 40,160 40,100 Z');
        path.setAttribute('fill', 'url(#g)');
        const defs = document.createElementNS(ns, 'defs');
        const grad = document.createElementNS(ns, 'radialGradient');
        grad.setAttribute('id', 'g');
        const stop1 = document.createElementNS(ns, 'stop'); stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', 'rgba(124,92,255,0.95)');
        const stop2 = document.createElementNS(ns, 'stop'); stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', 'rgba(0,212,255,0.05)');
        grad.appendChild(stop1); grad.appendChild(stop2); defs.appendChild(grad); svg.appendChild(defs);
        g.appendChild(path); svg.appendChild(g);
        cursorTrail.appendChild(svg);
    }
    createTrailSVG();

    // pointer move
    function onPointerMove(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        cursorDot.style.opacity = 1;
        cursorOutline.style.opacity = 1;
        cursorTrail.style.opacity = 1;
        // position dot immediately
        cursorDot.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
    }

    // click ripple
    function createRipple(x, y) {
        const r = document.createElement('div');
        r.className = 'ripple';
        r.style.left = x + 'px';
        r.style.top = y + 'px';
        r.style.width = '22px'; r.style.height = '22px';
        r.style.background = 'radial-gradient(circle at 30% 30%, rgba(124,92,255,0.9), rgba(0,212,255,0.2))';
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 700);
    }

    // hover locking: when hovering elements with data-action or .faux-link, enlarge & lock to center of element
    function tryLock(e) {
        const t = e.target.closest('[data-action], .faux-link');
        if (t) {
            body.classList.add('is-hovering');
            // lock cursor outline to element center
            const rect = t.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            cursorOutline.style.transform = `translate(${cx}px, ${cy}px)`; // visual lock (JS will keep smoothing)
            body.classList.add('is-locked');
        } else {
            body.classList.remove('is-hovering');
            body.classList.remove('is-locked');
        }
    }

    // event listeners
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', (ev) => {
        createRipple(ev.clientX, ev.clientY);
    });

    // delegation for hover/lock
    document.addEventListener('pointerover', tryLock);
    document.addEventListener('pointerout', tryLock);

    // keyboard accessibility: show focus outline — when keyboard navigating, show hover state on focused buttons
    document.addEventListener('focusin', (e) => {
        const t = e.target.closest('.btn, .faux-link');
        if (t) { body.classList.add('is-hovering'); body.classList.add('is-locked'); }
    });
    document.addEventListener('focusout', (e) => { body.classList.remove('is-hovering'); body.classList.remove('is-locked'); });

    // animate outline smoothly toward mouse
    function raf() {
        pos.x = lerp(pos.x, mouse.x, 0.16);
        pos.y = lerp(pos.y, mouse.y, 0.16);
        cursorOutline.style.left = pos.x + 'px';
        cursorOutline.style.top = pos.y + 'px';

        // trail wobble based on time
        const t = Date.now() * 0.002;
        const tx = pos.x + Math.sin(t) * 8;
        const ty = pos.y + Math.cos(t * 1.2) * 8;
        cursorTrail.style.left = tx + 'px';
        cursorTrail.style.top = (ty - 8) + 'px';

        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // small performance guard when the tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { cursorDot.style.opacity = 0; cursorOutline.style.opacity = 0; cursorTrail.style.opacity = 0; }
        else { cursorDot.style.opacity = 1; cursorOutline.style.opacity = 1; cursorTrail.style.opacity = 1; }
    });

})();
