import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    nav {
      position: fixed; top: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 3rem;
      background: rgba(2,8,18,0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      z-index: 100;
    }
    .logo { font-family:'Orbitron',monospace; font-weight:900; font-size:1.5rem; color:var(--neon); text-shadow:0 0 20px var(--neon); letter-spacing:4px; }
    .logo span { color:var(--neon2); }
    .nav-links { display:flex; gap:1rem; }

    .hero {
      position:relative; z-index:1;
      min-height:100vh;
      display:flex; align-items:center;
      padding:8rem 3rem 4rem;
      max-width:1400px; margin:0 auto; gap:4rem;
    }
    .hero-content { flex:1; }
    .hero-badge {
      display:inline-flex; align-items:center; gap:0.5rem;
      padding:0.4rem 1rem;
      border:1px solid rgba(0,255,231,0.3); border-radius:20px;
      font-size:0.75rem; letter-spacing:3px; text-transform:uppercase;
      color:var(--neon); margin-bottom:2rem;
      background:rgba(0,255,231,0.05);
      animation:fadeUp 0.8s ease both;
    }
    .badge-dot { width:6px; height:6px; background:var(--neon); border-radius:50%; animation:blink 1.5s ease-in-out infinite; box-shadow:0 0 8px var(--neon); }
    .hero h1 { font-family:'Orbitron',monospace; font-size:clamp(2.5rem,6vw,5rem); font-weight:900; line-height:1.05; margin-bottom:1.5rem; animation:fadeUp 0.8s 0.1s ease both; }
    .line1 { color:#fff; }
    .line2 { color:var(--neon); text-shadow:0 0 40px var(--neon),0 0 80px rgba(0,255,231,0.3); }
    .line3 { color:rgba(255,255,255,0.5); font-size:0.5em; letter-spacing:8px; display:block; margin-top:0.3em; }
    .hero-desc { font-size:1.15rem; line-height:1.8; color:rgba(200,230,227,0.7); max-width:500px; margin-bottom:2.5rem; font-weight:300; animation:fadeUp 0.8s 0.2s ease both; }
    .hero-cta { display:flex; gap:1rem; animation:fadeUp 0.8s 0.3s ease both; }

    .hero-visual { flex:1; display:flex; justify-content:center; align-items:center; animation:fadeUp 0.8s 0.4s ease both; }
    .arm-canvas { width:380px; height:420px; position:relative; }
    svg.robot-svg { width:100%; height:100%; overflow:visible; }
    .joint { animation:jointPulse 3s ease-in-out infinite; }
    .joint:nth-child(2){animation-delay:0.5s} .joint:nth-child(3){animation-delay:1s}
    @keyframes jointPulse { 0%,100%{filter:drop-shadow(0 0 6px #00ffe7)} 50%{filter:drop-shadow(0 0 16px #00ffe7)} }
    .arm-segment { animation:armSway 6s ease-in-out infinite; transform-origin:bottom center; }
    @keyframes armSway { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(3deg)} }

    .stats {
      position:relative; z-index:1;
      display:flex; justify-content:center;
      padding:0 3rem 6rem;
      max-width:1400px; margin:0 auto;
      animation:fadeUp 0.8s 0.5s ease both;
    }
    .stat-item { flex:1; padding:2rem; border:1px solid var(--border); background:var(--panel); text-align:center; position:relative; transition:all 0.3s; }
    .stat-item:not(:last-child) { border-right:none; }
    .stat-item:hover { background:rgba(0,255,231,0.07); transform:translateY(-2px); }
    .stat-num { font-family:'Orbitron',monospace; font-size:2.5rem; font-weight:900; color:var(--neon); text-shadow:0 0 20px var(--neon); display:block; }
    .stat-label { font-size:0.75rem; letter-spacing:3px; text-transform:uppercase; color:rgba(200,230,227,0.5); margin-top:0.3rem; }

    .features { position:relative; z-index:1; padding:4rem 3rem 8rem; max-width:1400px; margin:0 auto; }
    .section-title { font-family:'Orbitron',monospace; font-size:0.7rem; letter-spacing:5px; text-transform:uppercase; color:var(--neon); margin-bottom:1rem; }
    .section-heading { font-family:'Orbitron',monospace; font-size:clamp(1.5rem,3vw,2.5rem); color:#fff; margin-bottom:3rem; }
    .features-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1px; background:var(--border); border:1px solid var(--border); }
    .feature-card { background:var(--bg); padding:2.5rem; transition:all 0.3s; position:relative; overflow:hidden; }
    .feature-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--neon),transparent); transform:translateX(-100%); transition:transform 0.5s; }
    .feature-card:hover::before { transform:translateX(0); }
    .feature-card:hover { background:rgba(0,255,231,0.03); }
    .feature-icon { font-size:2rem; margin-bottom:1.5rem; display:block; }
    .feature-card h3 { font-family:'Orbitron',monospace; font-size:0.85rem; letter-spacing:2px; color:#fff; margin-bottom:0.8rem; }
    .feature-card p { font-size:0.9rem; color:rgba(200,230,227,0.5); line-height:1.7; font-weight:300; }

    .cta-section { position:relative; z-index:1; text-align:center; padding:6rem 3rem; background:linear-gradient(180deg,transparent,rgba(0,255,231,0.03),transparent); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
    .cta-section h2 { font-family:'Orbitron',monospace; font-size:clamp(1.8rem,4vw,3rem); color:#fff; margin-bottom:1rem; }
    .cta-section p { color:rgba(200,230,227,0.6); margin-bottom:2.5rem; font-size:1.1rem; }
    .cta-btns { display:flex; gap:1rem; justify-content:center; }

    footer { position:relative; z-index:1; text-align:center; padding:2rem; font-size:0.8rem; color:rgba(200,230,227,0.3); letter-spacing:2px; border-top:1px solid var(--border); }
  `],
  template: `
    <div class="scanline"></div>
    <div class="orb orb1"></div>
    <div class="orb orb2"></div>

    <nav>
      <div class="logo">ROBOT<span>ARM</span></div>
      <div class="nav-links">
        <a routerLink="/login"  class="btn btn-outline">LOGIN</a>
        <a routerLink="/signup" class="btn btn-primary">SIGNUP</a>
      </div>
    </nav>

    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <div class="badge-dot"></div>
          System Online
        </div>
        <h1>
          <span class="line1">PRECISION</span><br>
          <span class="line2">ROBOT ARM</span>
          <span class="line3">CONTROL INTERFACE</span>
        </h1>
        <p class="hero-desc">
          Advanced 4-degree-of-freedom robotic arm control system with
          precision servo control
        </p>
        <div class="hero-cta">
          <a routerLink="/signup" class="btn btn-primary" style="font-size:1rem;padding:0.8rem 2.5rem;">REGISTER USER</a>
          <a routerLink="/login"  class="btn btn-outline" style="font-size:1rem;padding:0.8rem 2.5rem;">ACCESS USER</a>
        </div>
      </div>

      <div class="hero-visual">
        <div class="arm-canvas">
          <svg class="robot-svg" viewBox="0 0 380 420">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <linearGradient id="segGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   style="stop-color:#00ffe7;stop-opacity:0.8"/>
                <stop offset="100%" style="stop-color:#006b5e;stop-opacity:0.4"/>
              </linearGradient>
            </defs>
            <rect x="120" y="370" width="140" height="20" rx="4" fill="#0a2a26" stroke="#00ffe7" stroke-width="1.5" filter="url(#glow)"/>
            <rect x="145" y="355" width="90"  height="20" rx="3" fill="#0d332e" stroke="#00ffe7" stroke-width="1"/>
            <circle class="joint" cx="190" cy="350" r="16" fill="#041a17" stroke="#00ffe7" stroke-width="2" filter="url(#glow)"/>
            <circle cx="190" cy="350" r="8" fill="#00ffe7" opacity="0.4"/>
            <text x="240" y="365" fill="#00ffe7" font-size="10" font-family="Orbitron" opacity="0.7">BASE</text>
            <g class="arm-segment" style="transform-origin:190px 350px">
              <rect x="180" y="245" width="20" height="110" rx="6" fill="url(#segGrad)" stroke="#00ffe7" stroke-width="1.5" filter="url(#glow)"/>
              <circle class="joint" cx="190" cy="250" r="16" fill="#041a17" stroke="#00ffe7" stroke-width="2" filter="url(#glow)"/>
              <circle cx="190" cy="250" r="8" fill="#00ffe7" opacity="0.4"/>
              <text x="215" y="300" fill="#00ffe7" font-size="9" font-family="Orbitron" opacity="0.7">SHOULDER</text>
            </g>
            <g style="transform-origin:190px 250px;transform:rotate(-15deg)">
              <rect x="180" y="155" width="20" height="100" rx="6" fill="url(#segGrad)" stroke="#00ffe7" stroke-width="1.5" filter="url(#glow)"/>
              <circle class="joint" cx="190" cy="160" r="14" fill="#041a17" stroke="#00ffe7" stroke-width="2" filter="url(#glow)"/>
              <circle cx="190" cy="160" r="6" fill="#00ffe7" opacity="0.4"/>
              <text x="215" y="200" fill="#00ffe7" font-size="9" font-family="Orbitron" opacity="0.7">ELBOW</text>
            </g>
            <g style="transform-origin:188px 160px;transform:rotate(-10deg)">
              <rect x="182" y="100" width="16" height="65" rx="4" fill="#0d332e" stroke="#00ffe7" stroke-width="1.5"/>
              <rect x="175" y="85"  width="10" height="28" rx="3" fill="#00ffe7" opacity="0.6"/>
              <rect x="195" y="85"  width="10" height="28" rx="3" fill="#00ffe7" opacity="0.6"/>
              <rect x="183" y="80"  width="14" height="14" rx="2" fill="#041a17" stroke="#ff6b35" stroke-width="1.5"/>
              <text x="215" y="120" fill="#ff6b35" font-size="9" font-family="Orbitron" opacity="0.9">GRIPPER</text>
            </g>
            <text x="20" y="30"  fill="#00ffe7" font-size="9" font-family="Rajdhani" opacity="0.5">BASE: 90°</text>
            <text x="20" y="45"  fill="#00ffe7" font-size="9" font-family="Rajdhani" opacity="0.5">SHOULDER: 90°</text>
            <text x="20" y="60"  fill="#00ffe7" font-size="9" font-family="Rajdhani" opacity="0.5">ELBOW: 90°</text>
            <text x="20" y="75"  fill="#ff6b35" font-size="9" font-family="Rajdhani" opacity="0.5">GRIPPER: 0°</text>
            <path d="M10 10 L40 10 L40 12 L12 12 L12 40 L10 40 Z"    fill="#00ffe7" opacity="0.3"/>
            <path d="M370 10 L340 10 L340 12 L368 12 L368 40 L370 40 Z"  fill="#00ffe7" opacity="0.3"/>
            <path d="M10 410 L40 410 L40 408 L12 408 L12 380 L10 380 Z"  fill="#00ffe7" opacity="0.3"/>
            <path d="M370 410 L340 410 L340 408 L368 408 L368 380 L370 380 Z" fill="#00ffe7" opacity="0.3"/>
          </svg>
        </div>
      </div>
    </section>

    <section class="stats">
      <div class="stat-item"><span class="stat-num">4</span><span class="stat-label">Degrees of Freedom</span></div>
      <div class="stat-item"><span class="stat-num">180°</span><span class="stat-label">Servo Range</span></div>
      <div class="stat-item"><span class="stat-num">0.1°</span><span class="stat-label">Precision Control</span></div>
      <div class="stat-item"><span class="stat-num">RT</span><span class="stat-label">Real-Time Feedback</span></div>
    </section>

    <section class="features">
      <p class="section-title">// SYSTEM CAPABILITIES</p>
      <h2 class="section-heading">CORE FUNCTIONS</h2>
      <div class="features-grid">
        <div class="feature-card"><span class="feature-icon">⚙️</span><h3>BASE ROTATION</h3><p>360° horizontal rotation with precision servo control. Full range 0–180° mapping for sweep operations.</p></div>
        <div class="feature-card"><span class="feature-icon">🦾</span><h3>SHOULDER & ELBOW</h3><p>Independent joint control for precise vertical positioning. Synchronized movement sequences available.</p></div>
        <div class="feature-card"><span class="feature-icon">✊</span><h3>GRIPPER CONTROL</h3><p>Variable grip pressure from 0–90°. Object detection feedback and hold-force adjustment.</p></div>
        <div class="feature-card"><span class="feature-icon">📊</span><h3>LIVE DASHBOARD</h3><p>Real-time telemetry display with angle readouts, command history, and visual 3D arm preview.</p></div>
        <div class="feature-card"><span class="feature-icon">💾</span><h3>COMMAND HISTORY</h3><p>Every movement logged with timestamp. Replay sequences or save presets for repeatable operations.</p></div>
        <div class="feature-card"><span class="feature-icon">🔐</span><h3>SECURE ACCESS</h3><p>Multi-user authentication system. Role-based control with individual command logging per operator.</p></div>
      </div>
    </section>

    <section class="cta-section">
      <h2>READY TO TAKE CONTROL?</h2>
      <p>Initialize your operator session and start commanding precision robotics.</p>
      <div class="cta-btns">
        <a routerLink="/signup" class="btn btn-primary"  style="font-size:1rem;padding:0.9rem 3rem;">CREATE ACCOUNT</a>
        <a routerLink="/login"  class="btn btn-outline" style="font-size:1rem;padding:0.9rem 3rem;">LOGIN</a>
      </div>
    </section>

    <footer>ROBOT ARM CONTROL SYSTEM &nbsp;|&nbsp; 4DOF ROBOT ARM INTERFACE &nbsp;|&nbsp; © 2025</footer>
  `
})
export class HomeComponent {}
