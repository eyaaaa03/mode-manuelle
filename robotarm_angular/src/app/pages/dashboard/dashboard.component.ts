import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RobotService } from '../../core/services/robot.service';
import { HistoryEntry } from '../../core/models';

type JointKey = 'base' | 'shoulder' | 'elbow' | 'gripper';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    :host { display:block; }

    nav { position:sticky; top:0; z-index:100; display:flex; align-items:center; justify-content:space-between; padding:0.8rem 2rem; background:#ebf3fc; backdrop-filter:blur(20px); border-bottom:1px solid var(--border); }
    .nav-left { display:flex; align-items:center; gap:1.5rem; }
    .nav-logo { height:40px; width:auto; }
    .logo { font-family:'Orbitron',monospace; font-weight:900; font-size:1.2rem; color:var(--neon); letter-spacing:4px; text-shadow:none; }
    .logo span { color:var(--neon2); }
    .nav-status { display:flex; align-items:center; gap:0.6rem; font-size:0.7rem; letter-spacing:2px; text-transform:uppercase; }
    .status-dot { width:7px; height:7px; border-radius:50%; animation:blink 1.5s ease-in-out infinite; box-shadow:0 0 8px currentColor; }
    .status-online  { background:var(--neon);   color:var(--neon); }
    .status-offline { background:var(--danger); color:var(--danger); }
    .status-label { color:rgba(31,41,55,0.6); }
    .nav-right { display:flex; align-items:center; gap:1.5rem; }
    .clock { font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:rgba(31,41,55,0.5); }
    .user-chip { display:flex; align-items:center; gap:0.6rem; padding:0.4rem 1rem; border:1px solid var(--border); background:var(--panel); font-size:0.8rem; letter-spacing:1px; color:var(--text); }
    .user-avatar { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,var(--neon),#a855f7); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; color:#FFFFFF; }
    .logout-btn { padding:0.4rem 1rem; border:1px solid rgba(220,38,38,0.4); background:rgba(220,38,38,0.08); color:#DC2626; font-family:'Rajdhani',sans-serif; font-size:0.75rem; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
    .logout-btn:hover { border-color:var(--danger); background:rgba(220,38,38,0.12); }
    .nav-btn { padding:0.4rem 1rem; border:1px solid rgba(30,64,175,0.3); background:rgba(30,64,175,0.05); color:rgba(30,64,175,0.7); font-family:'Rajdhani',sans-serif; font-size:0.75rem; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
    .nav-btn:hover { border-color:var(--neon); color:var(--neon); background:rgba(30,64,175,0.1); }

    .dashboard { position:relative; z-index:1; display:grid; grid-template-columns:300px 1fr 300px; grid-template-rows:auto auto; gap:1px; background:var(--border); min-height:calc(100vh - 54px); }
    .panel { background:var(--bg); padding:1.5rem; position:relative; }
    .panel-title { font-family:'Orbitron',monospace; font-size:0.65rem; letter-spacing:3px; text-transform:uppercase; color:var(--neon); opacity:0.8; margin-bottom:1.2rem; display:flex; align-items:center; gap:0.5rem; }
    .panel-title::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,var(--border),transparent); }

    .servo-panel { grid-column:1; grid-row:1/3; }
    .servo-group { margin-bottom:1.8rem; }
    .servo-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem; }
    .servo-name { font-family:'Orbitron',monospace; font-size:0.7rem; letter-spacing:2px; color:rgba(9, 13, 20, 0.77); text-transform:uppercase; }
    .servo-val  { font-family:'Share Tech Mono',monospace; font-size:1.3rem; color:var(--neon); text-shadow:none; min-width:55px; text-align:right; }
    .servo-val.gripper { color:var(--neon2); text-shadow:0 0 10px var(--neon2); }
    .servo-range { -webkit-appearance:none; width:100%; height:6px; background:rgba(30,64,175,0.12); border-radius:3px; outline:none; cursor:pointer; margin-bottom:0.6rem; }
    .servo-range::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--neon); box-shadow:0 0 12px var(--neon); cursor:pointer; transition:transform 0.1s; }
    .servo-range::-webkit-slider-thumb:active { transform:scale(1.3); }
    .servo-range.gripper::-webkit-slider-thumb { background:var(--neon2); box-shadow:0 0 12px var(--neon2); }
    .servo-labels { display:flex; justify-content:space-between; font-size:0.65rem; color:rgba(47, 46, 66, 0.9); letter-spacing:1px; }
    .quick-btns { display:flex; gap:4px; margin-top:0.5rem; }
    .qbtn { flex:1; padding:0.3rem; background:rgba(30,64,175,0.08); border:1px solid rgba(30,64,175,0.25); color:var(--neon); font-family:'Rajdhani',sans-serif; font-size:0.7rem; letter-spacing:1px; cursor:pointer; transition:all 0.2s; text-align:center; }
    .qbtn:hover { background:rgba(30,64,175,0.15); color:var(--neon); border-color:var(--neon); }

    .visual-panel { grid-column:2; grid-row:1; }
    .arm-display { display:flex; justify-content:center; align-items:center; height:340px; position:relative; overflow:hidden; }
    .arm-display::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at center,rgba(30,64,175,0.04) 0%,transparent 70%); }
    .arm-svg { width:320px; height:320px; overflow:visible; }
    .arm-base-group     { transform-origin:160px 262px; transition:transform 0.08s linear; }
    .arm-shoulder-group { transform-origin:160px 188px; transition:transform 0.08s linear; }
    .arm-elbow-group    { transform-origin:160px 120px; transition:transform 0.08s linear; }
    .j-glow { animation:jg 2.5s ease-in-out infinite; }
    .j-glow:nth-child(2){animation-delay:.5s} .j-glow:nth-child(3){animation-delay:1s}
    @keyframes jg{0%,100%{filter:drop-shadow(0 0 5px #1E40AF)}50%{filter:drop-shadow(0 0 15px #1E40AF)}}

    .mini-bar { display:flex; gap:1px; background:var(--border); }
    .mini-cell { flex:1; padding:0.6rem; background:var(--bg); text-align:center; }
    .mini-label { font-size:0.6rem; letter-spacing:2px; color:rgba(31,41,55,0.5); text-transform:uppercase; }
    .mini-val { font-family:'Share Tech Mono',monospace; font-size:0.9rem; color:var(--neon); }
    .mini-val.gripper { color:var(--neon2); }

    .telemetry-panel { grid-column:3; grid-row:1/3; }
    .tele-grid { display:flex; flex-direction:column; gap:1rem; }
    .tele-card { padding:1rem; background:rgba(30,64,175,0.06); border:1px solid var(--border); position:relative; overflow:hidden; transition:all 0.3s; }
    .tele-card:hover { background:rgba(30,64,175,0.1); }
    .tele-card::before { content:''; position:absolute; top:0; left:0; bottom:0; width:2px; background:var(--neon); opacity:0; transition:opacity 0.3s; }
    .tele-card.active::before { opacity:1; }
    .tele-label { font-size:0.65rem; letter-spacing:3px; text-transform:uppercase; color:rgba(31,41,55,0.6); margin-bottom:0.4rem; }
    .tele-value { font-family:'Share Tech Mono',monospace; font-size:1.8rem; color:var(--neon); text-shadow:0 0 15px rgba(30,64,175,0.3); line-height:1; }
    .tele-value.gripper { color:var(--neon2); text-shadow:0 0 15px rgba(220,38,38,0.4); }
    .tele-unit { font-size:0.7rem; color:rgba(31,41,55,0.5); margin-left:0.3rem; }
    .tele-bar { margin-top:0.6rem; height:3px; background:rgba(30,64,175,0.1); border-radius:2px; overflow:hidden; }
    .tele-bar-fill { height:100%; background:var(--neon); border-radius:2px; transition:width 0.08s linear; box-shadow:0 0 6px var(--neon); }
    .tele-bar-fill.gripper { background:var(--neon2); box-shadow:0 0 6px var(--neon2); }
    .sys-status-card { background:rgba(220,38,38,0.03); border-color:rgba(220,38,38,0.15); }
    .sys-status-row  { display:flex; align-items:center; gap:0.5rem; margin-top:0.3rem; }
    .sys-status-text { font-family:'Share Tech Mono',monospace; font-size:0.85rem; color:var(--neon); }

    .history-list { max-height:200px; overflow-y:auto; }
    .history-list::-webkit-scrollbar { width:3px; }
    .history-list::-webkit-scrollbar-thumb { background:var(--neon); opacity:0.3; border-radius:2px; }
    .history-item { display:flex; align-items:center; justify-content:space-between; padding:0.6rem 0; border-bottom:1px solid rgba(30,64,175,0.06); font-size:0.8rem; }
    .history-item:last-child { border-bottom:none; }
    .hist-name   { color:rgba(31,41,55,0.7); letter-spacing:1px; }
    .hist-angles { font-family:'Share Tech Mono',monospace; font-size:0.7rem; color:rgba(30,64,175,0.6); letter-spacing:1px; }
    .hist-time   { font-size:0.65rem; color:rgba(31,41,55,0.35); }
    .hist-empty  { font-size:0.75rem; color:rgba(31,41,55,0.35); letter-spacing:2px; text-align:center; padding:1rem; }

    .cmd-panel { grid-column:2; grid-row:2; }
    .cmd-row   { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; }
    .cmd-btn { padding:0.7rem 1.5rem; font-family:'Orbitron',monospace; font-size:0.7rem; letter-spacing:2px; cursor:pointer; border-radius:2px; transition:all 0.3s; }
    .cmd-send  { background:var(--neon);  border:none; color:var(--bg); font-weight:700; flex:1; }
    .cmd-send:hover  { box-shadow:0 0 25px rgba(0,255,231,0.5); }
    .cmd-reset { background:transparent; border:1px solid var(--neon2); color:var(--neon2); }
    .cmd-reset:hover { background:rgba(255,107,53,0.1); box-shadow:0 0 20px rgba(255,107,53,0.3); }
    .cmd-save  { background:transparent; border:1px solid #a855f7; color:#a855f7; }
    .cmd-save:hover  { background:rgba(168,85,247,0.1); }
    .cmd-presets { display:flex; gap:0.5rem; flex-wrap:wrap; }
    .preset-btn { padding:0.5rem 1rem; background:rgba(0,255,231,0.04); border:1px solid rgba(0,255,231,0.15); color:rgba(22, 17, 43, 0.6); font-family:'Rajdhani',sans-serif; font-size:0.8rem; letter-spacing:1px; cursor:pointer; transition:all 0.2s; border-radius:2px; }
    .preset-btn:hover { background:rgba(0,255,231,0.1); color:var(--neon); border-color:var(--neon); }

    .toast { position:fixed; bottom:2rem; right:2rem; padding:0.8rem 1.5rem; background:rgba(2,8,18,0.95); border:1px solid var(--neon); color:var(--neon); font-family:'Orbitron',monospace; font-size:0.75rem; letter-spacing:2px; z-index:1000; transform:translateX(120%); transition:transform 0.4s ease; box-shadow:0 0 20px rgba(0,255,231,0.2); }
    .toast.show  { transform:translateX(0); }
    .toast.error { border-color:var(--danger); color:var(--danger); }

    @media(max-width:1100px) {
      .dashboard { grid-template-columns:1fr 1fr; }
      .servo-panel { grid-column:1; grid-row:1; } .visual-panel { grid-column:2; grid-row:1; }
      .telemetry-panel { grid-column:1; grid-row:2; } .cmd-panel { grid-column:2; grid-row:2; }
    }
    @media(max-width:700px) {
      .dashboard { grid-template-columns:1fr; }
      .servo-panel,.visual-panel,.telemetry-panel,.cmd-panel { grid-column:1; grid-row:auto; }
    }
  `],
  template: `
    <div class="scanline"></div>

    <nav>
      <div class="nav-left">
        <img src="assets/icons/logo.png" alt="Starz Electronics" class="nav-logo">
        <div class="logo">ROBOT<span>ARM</span></div>
        <div class="nav-status">
          <div class="status-dot"
               [class.status-online]="sysStatus === 'READY' || sysStatus === 'STREAMING'"
               [class.status-offline]="sysStatus === 'OFFLINE'"></div>
          <span class="status-label">{{ sysStatus === 'READY' ? 'SYSTEM ONLINE' : sysStatus }}</span>
        </div>
      </div>
      <div class="nav-right">
        <span class="clock">{{ clock }}</span>
        <button class="nav-btn" (click)="goToVision()">📷 VISION</button>
        <div class="user-chip">
          <div class="user-avatar">{{ userInitial }}</div>
          <span>{{ userName }}</span>
        </div>
        <button class="logout-btn" (click)="logout()">LOGOUT</button>
      </div>
    </nav>

    <div class="dashboard">

      <!-- LEFT: JOINT CONTROLS -->
      <div class="panel servo-panel">
        <div class="panel-title">// JOINT CONTROL</div>
        @for (joint of joints; track joint.key) {
          <div class="servo-group">
            <div class="servo-header">
              <div>
                <div class="servo-name" [style.color]="joint.key === 'gripper' ? 'var(--neon2)' : '#173de7'">
                  {{ joint.icon }} {{ joint.label }}
                </div>
              </div>
              <div class="servo-val" [class.gripper]="joint.key === 'gripper'">
                {{ pad(getVal(joint.key)) }}°
              </div>
            </div>
            <input type="range" class="servo-range"
                   [class.gripper]="joint.key === 'gripper'"
                   [min]="0" [max]="joint.max" [step]="1"
                   [value]="getVal(joint.key)"
                   (input)="onSlider(joint.key, $any($event.target).value)">
            <div class="servo-labels">
              <span>{{ joint.key === 'gripper' ? 'OPEN' : '0°' }}</span>
              <span>{{ joint.max / 2 }}°</span>
              <span>{{ joint.key === 'gripper' ? 'CLOSE' : '180°' }}</span>
            </div>
            <div class="quick-btns">
              @for (q of joint.quick; track q.v) {
                <div class="qbtn" (click)="setServo(joint.key, q.v)">{{ q.label }}</div>
              }
            </div>
          </div>
        }
      </div>

      <!-- CENTER: ARM VISUALIZATION -->
      <div class="panel visual-panel">
        <div class="panel-title">// ARM VISUALIZATION</div>
        <div class="arm-display">
          <svg class="arm-svg" viewBox="0 0 320 320">
            <defs>
              <filter id="jglow">
                <feGaussianBlur stdDeviation="3" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <linearGradient id="seg1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   style="stop-color:#1E40AF;stop-opacity:0.9"/>
                <stop offset="100%" style="stop-color:#1E2070;stop-opacity:0.5"/>
              </linearGradient>
              <linearGradient id="seg2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   style="stop-color:#1E40AF;stop-opacity:0.8"/>
                <stop offset="100%" style="stop-color:#1E2070;stop-opacity:0.4"/>
              </linearGradient>
              <radialGradient id="baseGrad" cx="50%" cy="50%">
                <stop offset="0%"   style="stop-color:#0d3330"/>
                <stop offset="100%" style="stop-color:#020812"/>
              </radialGradient>
            </defs>

            <ellipse cx="160" cy="296" rx="70" ry="12" fill="url(#baseGrad)" stroke="rgba(30,64,175,0.2)" stroke-width="1"/>
            <rect x="120" y="280" width="80" height="18" rx="4" fill="#0a2a26" stroke="#1E40AF" stroke-width="1.5" filter="url(#jglow)"/>
            <rect x="140" y="268" width="40" height="14" rx="3" fill="#0d332e" stroke="#1E40AF" stroke-width="1"/>
            <circle class="j-glow" cx="160" cy="262" r="16" fill="#041a17" stroke="#1E40AF" stroke-width="2.5" filter="url(#jglow)"/>
            <circle cx="160" cy="262" r="8" fill="rgba(30,64,175,0.3)"/>
            <circle cx="160" cy="262" r="3" fill="#1E40AF"/>

            <g class="arm-base-group" [style.transform]="baseTransform">
              <rect x="150" y="185" width="20" height="82" rx="6" fill="url(#seg1)" stroke="#1E40AF" stroke-width="1.5"/>
              <line x1="155" y1="200" x2="155" y2="255" stroke="rgba(30,64,175,0.2)" stroke-width="1"/>
              <line x1="165" y1="200" x2="165" y2="255" stroke="rgba(30,64,175,0.2)" stroke-width="1"/>
              <circle class="j-glow" cx="160" cy="188" r="15" fill="#041a17" stroke="#1E40AF" stroke-width="2" filter="url(#jglow)"/>
              <circle cx="160" cy="188" r="7" fill="rgba(30,64,175,0.25)"/>
              <circle cx="160" cy="188" r="2.5" fill="#1E40AF"/>

              <g class="arm-shoulder-group" [style.transform]="shoulderTransform">
                <rect x="152" y="118" width="16" height="76" rx="5" fill="url(#seg2)" stroke="#1E40AF" stroke-width="1.2"/>
                <circle class="j-glow" cx="160" cy="120" r="12" fill="#041a17" stroke="#1E40AF" stroke-width="2" filter="url(#jglow)"/>
                <circle cx="160" cy="120" r="5.5" fill="rgba(30,64,175,0.2)"/>
                <circle cx="160" cy="120" r="2" fill="#1E40AF"/>

                <g class="arm-elbow-group" [style.transform]="elbowTransform">
                  <rect x="154" y="62" width="12" height="62" rx="4" fill="#0d332e" stroke="#1E40AF" stroke-width="1.2"/>
                  <circle class="j-glow" cx="160" cy="64" r="10" fill="#041a17" stroke="#1E40AF" stroke-width="1.5" filter="url(#jglow)"/>
                  <circle cx="160" cy="64" r="4" fill="rgba(30,64,175,0.15)"/>
                  <rect x="155" y="28" width="10" height="38" rx="3" fill="#0d332e" stroke="#1E40AF" stroke-width="1"/>
                  <rect [attr.x]="146 - gripOffset" y="10" width="9" height="26" rx="3" fill="rgba(30,64,175,0.6)" stroke="#1E40AF" stroke-width="0.8"/>
                  <rect [attr.x]="165 + gripOffset" y="10" width="9" height="26" rx="3" fill="rgba(30,64,175,0.6)" stroke="#1E40AF" stroke-width="0.8"/>
                  <rect x="153" y="6" width="14" height="10" rx="2" fill="#041a17" stroke="#DC2626" stroke-width="1.5"/>
                  <circle cx="160" cy="11" r="2.5" fill="#DC2626" opacity="0.8"/>
                </g>
              </g>
            </g>

            <text x="8"  y="18" fill="rgba(30,64,175,0.4)" font-size="9" font-family="Share Tech Mono">X</text>
            <text x="18" y="18" fill="rgba(30,64,175,0.2)" font-size="9" font-family="Share Tech Mono">{{ state.base }}</text>
            <text x="8"  y="30" fill="rgba(30,64,175,0.4)" font-size="9" font-family="Share Tech Mono">S</text>
            <text x="18" y="30" fill="rgba(30,64,175,0.2)" font-size="9" font-family="Share Tech Mono">{{ state.shoulder }}</text>
            <text x="8"  y="42" fill="rgba(30,64,175,0.4)" font-size="9" font-family="Share Tech Mono">E</text>
            <text x="18" y="42" fill="rgba(30,64,175,0.2)" font-size="9" font-family="Share Tech Mono">{{ state.elbow }}</text>
            <text x="8"  y="54" fill="rgba(220,38,38,0.5)" font-size="9" font-family="Share Tech Mono">G</text>
            <text x="18" y="54" fill="rgba(220,38,38,0.3)" font-size="9" font-family="Share Tech Mono">{{ state.gripper }}</text>

            <path d="M2 2 L22 2 L22 4 L4 4 L4 22 L2 22 Z"                   fill="#1E40AF" opacity="0.2"/>
            <path d="M318 2 L298 2 L298 4 L316 4 L316 22 L318 22 Z"         fill="#1E40AF" opacity="0.2"/>
            <path d="M2 318 L22 318 L22 316 L4 316 L4 298 L2 298 Z"         fill="#1E40AF" opacity="0.2"/>
            <path d="M318 318 L298 318 L298 316 L316 316 L316 298 L318 298 Z" fill="#1E40AF" opacity="0.2"/>
          </svg>
        </div>

        <div class="mini-bar">
          <div class="mini-cell"><div class="mini-label">Base</div><div class="mini-val">{{ pad(state.base) }}°</div></div>
          <div class="mini-cell"><div class="mini-label">Shoulder</div><div class="mini-val">{{ pad(state.shoulder) }}°</div></div>
          <div class="mini-cell"><div class="mini-label">Elbow</div><div class="mini-val">{{ pad(state.elbow) }}°</div></div>
          <div class="mini-cell"><div class="mini-label">Gripper</div><div class="mini-val gripper">{{ pad(state.gripper) }}°</div></div>
        </div>
      </div>

      <!-- RIGHT: TELEMETRY -->
      <div class="panel telemetry-panel">
        <div class="panel-title">// TELEMETRY</div>
        <div class="tele-grid">
          @for (t of teleItems; track t.key) {
            <div class="tele-card" [class.active]="activeJoint === t.key">
              <div class="tele-label">{{ t.label }}</div>
              <div class="tele-value" [class.gripper]="t.key === 'gripper'">
                {{ pad(getVal(t.key)) }}<span class="tele-unit">DEG</span>
              </div>
              <div class="tele-bar">
                <div class="tele-bar-fill"
                     [class.gripper]="t.key === 'gripper'"
                     [style.width]="barPct(t.key) + '%'"></div>
              </div>
            </div>
          }
          <div class="tele-card sys-status-card">
            <div class="tele-label">SYSTEM STATUS</div>
            <div class="sys-status-row">
              <div class="status-dot"
                   [class.status-online]="sysStatus === 'READY' || sysStatus === 'STREAMING'"
                   [class.status-offline]="sysStatus === 'OFFLINE'"
                   style="width:8px;height:8px;"></div>
              <span class="sys-status-text">{{ sysStatus }}</span>
            </div>
          </div>
          <div class="tele-card">
            <div class="tele-label">COMMANDS SENT</div>
            <div class="tele-value" style="font-size:1.4rem;">{{ cmdCount }}</div>
          </div>
        </div>

        <div class="panel-title" style="margin-top:1.5rem;">// HISTORY</div>
        <div class="history-list">
          @if (history.length === 0) {
            <div class="hist-empty">NO COMMANDS YET</div>
          }
          @for (h of history; track h.time) {
            <div class="history-item">
              <span class="hist-name">{{ h.name }}</span>
              <span class="hist-angles">B:{{ h.base }}° S:{{ h.shoulder }}° E:{{ h.elbow }}° G:{{ h.gripper }}°</span>
              <span class="hist-time">{{ h.time }}</span>
            </div>
          }
        </div>
      </div>

      <!-- BOTTOM: COMMAND DISPATCH -->
      <div class="panel cmd-panel">
        <div class="panel-title">// COMMAND DISPATCH</div>
        <div class="cmd-row">
          <button class="cmd-btn cmd-send"  (click)="sendCommand()">▶ EXECUTE COMMAND</button>
          <button class="cmd-btn cmd-reset" (click)="resetArm()">↺ RESET HOME</button>
        </div>
        <div class="panel-title">// QUICK PRESETS</div>
        <div class="cmd-presets">
          @for (p of presets; track p.name) {
            <button class="preset-btn" (click)="loadPreset(p)">{{ p.icon }} {{ p.name }}</button>
          }
        </div>
      </div>

    </div>

    <div class="toast" [class.show]="toastVisible" [class.error]="toastError">{{ toastMsg }}</div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── State ──────────────────────────────────────────────────────────────────
  state: Record<JointKey, number> = { base: 90, shoulder: 90, elbow: 90, gripper: 0 };

  get baseTransform()     { return `rotate(${(this.state.base     - 90) * 0.5}deg)`; }
  get shoulderTransform() { return `rotate(${(this.state.shoulder - 90) * 0.4}deg)`; }
  get elbowTransform()    { return `rotate(${(this.state.elbow    - 90) * 0.3}deg)`; }
  get gripOffset()        { return (this.state.gripper / 90) * 8; }

  sysStatus   = 'READY';
  cmdCount    = 0;
  history: HistoryEntry[] = [];
  activeJoint: JointKey   = 'base';
  clock       = '';
  toastMsg    = ''; toastVisible = false; toastError = false;
  userName    = 'OPERATOR';
  userInitial = 'O';

  // ── Private ────────────────────────────────────────────────────────────────
  private clockInterval: ReturnType<typeof setInterval> | null = null;
  private userId: string | null = null;
  private readonly THROTTLE_MS = 50;
  private lastSentAt   = 0;
  private pendingFlush: ReturnType<typeof setTimeout> | null = null;

  // ── Static data ────────────────────────────────────────────────────────────
  readonly joints = [
    { key: 'base'     as JointKey, label: 'BASE',icon: '⬤', max: 180,
      quick: [{v:0,label:'0°'},{v:45,label:'45°'},{v:90,label:'90°'},{v:135,label:'135°'},{v:180,label:'180°'}] },
    { key: 'shoulder' as JointKey, label: 'SHOULDER',  icon: '◉', max: 180,
      quick: [{v:0,label:'0°'},{v:45,label:'45°'},{v:90,label:'90°'},{v:135,label:'135°'},{v:180,label:'180°'}] },
    { key: 'elbow'    as JointKey, label: 'ELBOW',icon: '◈', max: 180,
      quick: [{v:0,label:'0°'},{v:45,label:'45°'},{v:90,label:'90°'},{v:135,label:'135°'},{v:180,label:'180°'}] },
    { key: 'gripper'  as JointKey, label: 'GRIPPER',icon: '✊', max: 90,
      quick: [{v:0,label:'OPEN'},{v:30,label:'30°'},{v:60,label:'60°'},{v:90,label:'CLOSE'}] },
  ];

  readonly teleItems = [
    { key: 'base'     as JointKey, label: 'BASE ANGLE'       },
    { key: 'shoulder' as JointKey, label: 'SHOULDER ANGLE'   },
    { key: 'elbow'    as JointKey, label: 'ELBOW ANGLE'      },
    { key: 'gripper'  as JointKey, label: 'GRIPPER POSITION' },
  ];

  readonly presets = [
    { name:'HOME',  icon:'🏠', base:90,  shoulder:90,  elbow:90,  gripper:0  },
    { name:'LEFT',  icon:'←',  base:0,   shoulder:90,  elbow:90,  gripper:0  },
    { name:'RIGHT', icon:'→',  base:180, shoulder:90,  elbow:90,  gripper:0  },
    { name:'PICK',  icon:'🤏', base:90,  shoulder:45,  elbow:45,  gripper:90 },
    { name:'HIGH',  icon:'⬆',  base:90,  shoulder:135, elbow:135, gripper:0  },
    { name:'LOW',   icon:'⬇',  base:90,  shoulder:30,  elbow:90,  gripper:0  },
    { name:'PLACE', icon:'📦', base:45,  shoulder:60,  elbow:120, gripper:60 },
    { name:'GRIP',  icon:'✊', base:90,  shoulder:90,  elbow:90,  gripper:90 },
  ];

  constructor(
    private auth:   AuthService,
    private robot:  RobotService,
    private router: Router,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const s          = this.auth.getSession();
    this.userId      = s.userId;
    this.userName    = (s.fullName || 'OPERATOR').toUpperCase();
    this.userInitial = this.userName.charAt(0);

    this.clockInterval = setInterval(() => {
      this.clock = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' UTC';
    }, 1000);

    this.robot.getState().subscribe({
      next:  data => { this.state.base = data.base; this.state.shoulder = data.shoulder; this.state.elbow = data.elbow; this.state.gripper = data.gripper; },
      error: ()   => {}
    });
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.pendingFlush)  clearTimeout(this.pendingFlush);

  }

  // ── Template helpers ───────────────────────────────────────────────────────
  pad(v: number): string          { return String(v).padStart(3, '0'); }
  getVal(key: JointKey): number   { return this.state[key]; }
  barPct(key: JointKey): number   { return Math.round((this.state[key] / (key === 'gripper' ? 90 : 180)) * 100); }

  // ── Real-time slider ───────────────────────────────────────────────────────
  onSlider(key: JointKey, raw: string): void {
    this.state[key]  = parseInt(raw, 10);
    this.activeJoint = key;
    this.throttleSend();
  }

  setServo(key: JointKey, val: number): void {
    this.state[key]  = val;
    this.activeJoint = key;
    this.throttleSend();
  }

  private throttleSend(): void {
    const now = Date.now();
    if (this.pendingFlush) { clearTimeout(this.pendingFlush); this.pendingFlush = null; }
    if (now - this.lastSentAt >= this.THROTTLE_MS) {
      this.dispatchLive();
    } else {
      this.pendingFlush = setTimeout(() => this.dispatchLive(), this.THROTTLE_MS - (now - this.lastSentAt));
    }
  }

  private dispatchLive(): void {
    this.lastSentAt = Date.now();
    this.sysStatus  = 'STREAMING';
    this.robot.sendCommand({
      userId: this.userId ? parseInt(this.userId, 10) : null,
      baseAngle: this.state.base, shoulderAngle: this.state.shoulder,
      elbowAngle: this.state.elbow, gripperAngle: this.state.gripper,
      commandName: 'LIVE',
    }).subscribe({ next: () => { this.sysStatus = 'READY'; }, error: () => { this.sysStatus = 'READY'; } });
  }

  // ── Manual commands ────────────────────────────────────────────────────────
  sendCommand(name?: string): void {
    this.cmdCount++;
    const cmdName = name ?? `CMD-${String(this.cmdCount).padStart(3, '0')}`;
    this.sysStatus = 'SENDING';
    this.robot.sendCommand({
      userId: this.userId ? parseInt(this.userId, 10) : null,
      baseAngle: this.state.base, shoulderAngle: this.state.shoulder,
      elbowAngle: this.state.elbow, gripperAngle: this.state.gripper,
      commandName: cmdName,
    }).subscribe({
      next:  res => { if (res.success) this.showToast('✓ SENT'); this.sysStatus = 'READY'; },
      error: ()  => { this.sysStatus = 'READY'; }
    });
    this.addToHistory(cmdName);
  }

  resetArm(): void {
    if (this.pendingFlush) { clearTimeout(this.pendingFlush); this.pendingFlush = null; }
    this.sysStatus = 'RESETTING';
    this.robot.reset().subscribe({ next: () => {}, error: () => {} });
    this.state     = { base: 90, shoulder: 90, elbow: 90, gripper: 0 };
    this.sysStatus = 'READY';
    this.showToast('↺ ARM RESET TO HOME');
  }

  loadPreset(p: { name: string; base: number; shoulder: number; elbow: number; gripper: number }): void {
    this.state.base = p.base; this.state.shoulder = p.shoulder;
    this.state.elbow = p.elbow; this.state.gripper = p.gripper;
    this.sendCommand(p.name);
    this.showToast(`▶ PRESET "${p.name}" EXECUTING`);
  }

  savePreset(): void {
    const name = prompt('Enter preset name:');
    if (name) this.showToast(`💾 PRESET "${name.toUpperCase()}" SAVED`);
  }

  goToVision(): void {
    this.router.navigate(['/vision']);
  }

  logout(): void { this.auth.logout(); this.router.navigate(['/']); }

  private addToHistory(name: string): void {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' } as Intl.DateTimeFormatOptions);
    this.history.unshift({ name, time, base: this.state.base, shoulder: this.state.shoulder, elbow: this.state.elbow, gripper: this.state.gripper });
    if (this.history.length > 20) this.history.pop();
  }

  private showToast(msg: string, isError = false): void {
    this.toastMsg = msg; this.toastError = isError; this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 2500);
  }
}