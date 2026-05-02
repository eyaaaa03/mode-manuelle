import { Component, OnInit, OnDestroy, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RobotService } from '../../core/services/robot.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

// ── Types ─────────────────────────────────────────────────────────────────────
type InspectionResult = 'OK' | 'DEFECT' | 'PENDING' | 'SCANNING';
type PickStatus       = 'IDLE' | 'PICKING' | 'PICKED' | 'ERROR';

interface InspectionEvent {
  id:          string;
  time:        string;
  result:      InspectionResult;
  confidence:  number;
  defectType?: string;
  pickStatus:  PickStatus;
}

// ── Component ─────────────────────────────────────────────────────────────────
@Component({
  selector:    'app-vision-inspection',
  standalone:  true,
  imports:     [CommonModule],
  styles: [`
    :host { display: block; }

    /* ── Nav ── */
    nav {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.8rem 2rem;
      background: #ebf3fc; backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
    }
    .nav-left  { display: flex; align-items: center; gap: 2rem; }
    .nav-logo  { height: 40px; width: auto; }
    .logo      { font-family: 'Orbitron', monospace; font-weight: 900; font-size: 1.2rem; color: var(--neon); letter-spacing: 4px; }
    .logo span { color: var(--neon2); }
    .nav-tabs  { display: flex; gap: 4px; }
    .nav-tab   { padding: 0.35rem 1rem; font-family: 'Rajdhani', sans-serif; font-size: 0.72rem; letter-spacing: 2px; text-transform: uppercase; border: 1px solid var(--border); background: transparent; color: rgba(67,71,90,0.77); cursor: pointer; transition: all 0.2s; }
    .nav-tab:hover  { color: var(--neon); border-color: rgba(0,255,231,0.3); }
    .nav-tab.active { color: var(--neon); border-color: var(--neon); background: rgba(0,255,231,0.06); }
    .nav-status { display: flex; align-items: center; gap: 0.6rem; font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; animation: blink 1.5s ease-in-out infinite; box-shadow: 0 0 8px currentColor; }
    .status-online   { background: var(--neon);   color: var(--neon); }
    .status-scanning { background: #a855f7;        color: #a855f7; }
    .status-offline  { background: var(--danger);  color: var(--danger); }
    .status-label    { color: rgba(31,41,55,0.6); }
    .nav-right { display: flex; align-items: center; gap: 1.5rem; }
    .clock     { font-family: 'Share Tech Mono', monospace; font-size: 0.75rem; color: rgba(31,41,55,0.5); }
    .user-chip { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 1rem; border: 1px solid var(--border); background: var(--panel); font-size: 0.8rem; letter-spacing: 1px; color: var(--text); }
    .user-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--neon), #a855f7); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: var(--bg); }
    .logout-btn { padding: 0.4rem 1rem; border: 1px solid rgba(255,68,68,0.3); background: rgba(255,68,68,0.05); color: rgba(255,130,130,0.7); font-family: 'Rajdhani', sans-serif; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
    .logout-btn:hover { border-color: var(--danger); color: var(--danger); background: rgba(255,68,68,0.1); }

    /* ── Page layout ── */
    .page { display: grid; grid-template-columns: 1fr 380px; grid-template-rows: auto 1fr; gap: 1px; background: var(--border); min-height: calc(100vh - 54px); }
    .panel { background: var(--bg); padding: 1.5rem; position: relative; }
    .panel-title { font-family: 'Orbitron', monospace; font-size: 0.65rem; letter-spacing: 3px; text-transform: uppercase; color: var(--neon); opacity: 0.7; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem; }
    .panel-title::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--border), transparent); }

    /* ── Camera feed panel ── */
    .camera-panel { grid-column: 1; grid-row: 1 / 3; }
    .camera-feed  {
      position: relative; width: 100%; aspect-ratio: 16/9; max-height: 700px;
      background: #010a0e; border: 1px solid rgba(0,255,231,0.12); overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }

    /*
     * The MJPEG stream is displayed via <img> pointing to http://localhost:5050/stream.
     * A hidden <canvas> is used only for frame capture before inspection.
     */
    .camera-feed img   { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
    .camera-feed canvas { display: none; }   /* hidden — capture-only */

    /* Scan-line sweep */
    .scan-sweep { position: absolute; inset: 0; z-index: 3; pointer-events: none; background: linear-gradient(180deg, transparent 0%, rgba(0,255,231,0.06) 50%, transparent 100%); background-size: 100% 60px; animation: sweep 2.5s linear infinite; opacity: 0; transition: opacity 0.4s; }
    .scan-sweep.active { opacity: 1; }
    @keyframes sweep { 0% { background-position: 0 -60px; } 100% { background-position: 0 calc(100% + 60px); } }

    /* Corner brackets */
    .cam-corner { position: absolute; width: 22px; height: 22px; z-index: 4; }
    .cam-corner.tl { top: 8px; left: 8px;   border-top: 2px solid var(--neon); border-left: 2px solid var(--neon); }
    .cam-corner.tr { top: 8px; right: 8px;  border-top: 2px solid var(--neon); border-right: 2px solid var(--neon); }
    .cam-corner.bl { bottom: 8px; left: 8px;  border-bottom: 2px solid var(--neon); border-left: 2px solid var(--neon); }
    .cam-corner.br { bottom: 8px; right: 8px; border-bottom: 2px solid var(--neon); border-right: 2px solid var(--neon); }

    /* Detection bounding box overlay */
    .detect-box { position: absolute; z-index: 5; border: 2px solid var(--danger); box-shadow: 0 0 14px rgba(255,68,68,0.5), inset 0 0 14px rgba(255,68,68,0.05); animation: pulse-box 0.8s ease-in-out infinite; pointer-events: none; transition: all 0.3s; }
    .detect-box.ok { border-color: var(--neon); box-shadow: 0 0 14px rgba(0,255,231,0.4), inset 0 0 14px rgba(0,255,231,0.05); animation: none; }
    @keyframes pulse-box { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .detect-label { position: absolute; top: -22px; left: 0; font-family: 'Share Tech Mono', monospace; font-size: 0.7rem; padding: 2px 6px; letter-spacing: 1px; }
    .detect-label.defect { background: var(--danger); color: #fff; }
    .detect-label.ok     { background: var(--neon);   color: var(--bg); }

    /* No-signal placeholder */
    .no-signal { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; color: rgba(200,230,227,0.2); font-family: 'Share Tech Mono', monospace; font-size: 0.8rem; letter-spacing: 3px; }
    .no-signal-icon { font-size: 3rem; opacity: 0.3; }

    /* Service-error banner */
    .service-error { position: absolute; bottom: 0; left: 0; right: 0; z-index: 6; background: rgba(255,68,68,0.85); color: #fff; font-family: 'Share Tech Mono', monospace; font-size: 0.7rem; letter-spacing: 1px; text-align: center; padding: 6px; }

    /* Result badge */
    .result-badge { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; padding: 0.8rem 1.2rem; background: rgba(0,255,231,0.03); border: 1px solid var(--border); }
    .result-icon  { font-size: 2rem; line-height: 1; }
    .result-text  { flex: 1; }
    .result-label { font-family: 'Orbitron', monospace; font-size: 0.65rem; letter-spacing: 2px; color: rgba(11,39,36,0.95); }
    .result-value { font-family: 'Share Tech Mono', monospace; font-size: 1.6rem; margin-top: 2px; }
    .result-value.ok      { color: var(--neon);   text-shadow: 0 0 12px rgba(0,255,231,0.5); }
    .result-value.defect  { color: var(--danger); text-shadow: 0 0 12px rgba(255,68,68,0.5); }
    .result-value.pending { color: rgba(11,39,36,0.95); }
    .result-confidence    { font-family: 'Share Tech Mono', monospace; font-size: 0.8rem; color: rgba(200,230,227,0.35); }
    .conf-bar  { height: 3px; background: rgba(0,255,231,0.1); margin-top: 4px; border-radius: 2px; overflow: hidden; }
    .conf-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
    .conf-fill.ok     { background: var(--neon);   box-shadow: 0 0 6px var(--neon); }
    .conf-fill.defect { background: var(--danger); box-shadow: 0 0 6px var(--danger); }

    /* Camera controls */
    .cam-controls { display: flex; gap: 0.6rem; margin-top: 1rem; flex-wrap: wrap; }
    .cam-btn    { padding: 0.55rem 1.2rem; font-family: 'Orbitron', monospace; font-size: 0.65rem; letter-spacing: 2px; cursor: pointer; border-radius: 2px; transition: all 0.3s; }
    .cam-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .cam-start  { background: var(--neon); border: none; color: var(--bg); font-weight: 700; flex: 1; }
    .cam-start:hover:not(:disabled) { box-shadow: 0 0 25px rgba(0,255,231,0.5); }
    .cam-preset { background: transparent; border: 1px solid #10b981;  color: #10b981;}
    .cam-preset:hover:not(:disabled) { background: rgba(16,185,129,0.1); }
    .cam-stop   { background: transparent; border: 1px solid var(--danger); color: var(--danger); }
    .cam-stop:hover:not(:disabled)   { background: rgba(255,68,68,0.1); }
    .cam-snap   { background: transparent; border: 1px solid #a855f7; color: #a855f7; }
    .cam-snap:hover:not(:disabled)   { background: rgba(168,85,247,0.1); }
    .cam-auto   { background: transparent; border: 1px solid rgba(0,255,231,0.3); color: rgba(57,100,96,0.8); font-family: 'Rajdhani', sans-serif; font-size: 0.75rem; padding: 0.55rem 1rem; }
    .cam-auto.armed { border-color: var(--neon2); color: var(--neon2); background: rgba(255,107,53,0.07); box-shadow: 0 0 10px rgba(255,107,53,0.2); }

    /* ── Side panels ── */
    .stats-panel { grid-column: 2; grid-row: 1; }
    .stat-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); margin-bottom: 1.2rem; }
    .stat-cell   { background: var(--bg); padding: 0.9rem 1rem; }
    .stat-label  { font-size: 0.6rem; letter-spacing: 2px; text-transform: uppercase; color: rgba(11,39,36,0.95); margin-bottom: 3px; }
    .stat-value  { font-family: 'Share Tech Mono', monospace; font-size: 1.6rem; color: var(--neon); }
    .stat-value.defect-count { color: var(--danger); text-shadow: 0 0 10px rgba(255,68,68,0.4); }
    .stat-value.pick-count   { color: #a855f7; text-shadow: 0 0 10px rgba(168,85,247,0.4); }

    .gauge-wrap  { margin-bottom: 1.4rem; }
    .gauge-label { font-size: 0.65rem; letter-spacing: 2px; color: rgba(11,39,36,0.95); margin-bottom: 0.5rem; text-transform: uppercase; }
    .gauge-track { height: 8px; background: rgba(0,255,231,0.08); border-radius: 4px; overflow: hidden; }
    .gauge-fill  { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .gauge-fill.low    { background: var(--neon);   box-shadow: 0 0 8px var(--neon); }
    .gauge-fill.medium { background: #f0a500;       box-shadow: 0 0 8px #f0a500; }
    .gauge-fill.high   { background: var(--danger); box-shadow: 0 0 8px var(--danger); }
    .gauge-pct { font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; margin-top: 4px; }

    .arm-status-card { padding: 0.9rem 1rem; background: rgba(0,255,231,0.03); border: 1px solid var(--border); display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1.2rem; transition: all 0.3s; }
    .arm-status-card.picking { border-color: var(--neon2); background: rgba(255,107,53,0.06); }
    .arm-status-card.error   { border-color: var(--danger); background: rgba(255,68,68,0.06); }
    .arm-status-icon { font-size: 1.8rem; line-height: 1; }
    .arm-status-info { flex: 1; }
    .arm-status-lbl  { font-size: 0.6rem; letter-spacing: 2px; color: rgba(11,39,36,0.95); text-transform: uppercase; }
    .arm-status-val  { font-family: 'Share Tech Mono', monospace; font-size: 1rem; margin-top: 2px; }
    .arm-status-val.picking { color: var(--neon2); }
    .arm-status-val.picked  { color: var(--neon); }
    .arm-status-val.idle    { color: rgba(11,39,36,0.95); }
    .arm-status-val.error   { color: var(--danger); }

    .log-panel  { grid-column: 2; grid-row: 2; overflow: hidden; display: flex; flex-direction: column; }
    .log-list   { flex: 1; overflow-y: auto; max-height: 340px; }
    .log-list::-webkit-scrollbar { width: 3px; }
    .log-list::-webkit-scrollbar-thumb { background: var(--neon); opacity: 0.3; border-radius: 2px; }
    .log-item   { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.6rem; padding: 0.55rem 0; border-bottom: 1px solid rgba(0,255,231,0.05); font-size: 0.75rem; }
    .log-item:last-child { border-bottom: none; }
    .log-badge  { font-family: 'Share Tech Mono', monospace; font-size: 0.6rem; letter-spacing: 1px; padding: 2px 6px; border-radius: 2px; white-space: nowrap; }
    .log-badge.ok     { background: rgba(0,255,231,0.12);  color: var(--neon);   border: 1px solid rgba(0,255,231,0.25); }
    .log-badge.defect { background: rgba(255,68,68,0.12);  color: var(--danger); border: 1px solid rgba(255,68,68,0.25); }
    .log-info  { color: rgba(11,39,36,0.95); letter-spacing: 0.5px; font-family: 'Share Tech Mono', monospace; font-size: 0.68rem; }
    .log-time  { color: rgba(11,39,36,0.95); font-size: 0.62rem; font-family: 'Share Tech Mono', monospace; }
    .log-empty { font-size: 0.75rem; color: rgba(11,39,36,0.95); letter-spacing: 2px; text-align: center; padding: 1.5rem; font-family: 'Share Tech Mono', monospace; }

    .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 0.8rem 1.5rem; background: rgba(2,8,18,0.95); border: 1px solid var(--neon); color: var(--neon); font-family: 'Orbitron', monospace; font-size: 0.75rem; letter-spacing: 2px; z-index: 1000; transform: translateX(120%); transition: transform 0.4s ease; box-shadow: 0 0 20px rgba(0,255,231,0.2); }
    .toast.show  { transform: translateX(0); }
    .toast.error { border-color: var(--danger); color: var(--danger); }

    @media(max-width: 900px) {
      .page { grid-template-columns: 1fr; grid-template-rows: auto auto auto; }
      .camera-panel { grid-column: 1; grid-row: 1; }
      .stats-panel  { grid-column: 1; grid-row: 2; }
      .log-panel    { grid-column: 1; grid-row: 3; }
    }
  `],
  template: `
    <div class="scanline"></div>

    <!-- NAV -->
    <nav>
      <div class="nav-left">
        <img src="assets/icons/logo.png" alt="Starz Electronics" class="nav-logo">
        <div class="logo">ROBOT<span>ARM</span></div>
        <div class="nav-tabs">
          <button class="nav-tab" (click)="goToDashboard()">⬤ CONTROL</button>
          <button class="nav-tab active">◈ VISION</button>
        </div>
        <div class="nav-status">
          <div class="status-dot"
               [class.status-online]="camActive && !isScanning"
               [class.status-scanning]="isScanning"
               [class.status-offline]="!camActive"></div>
          <span class="status-label">{{ camActive ? (isScanning ? 'SCANNING' : 'CAM LIVE') : 'CAM OFFLINE' }}</span>
        </div>
      </div>
      <div class="nav-right">
        <span class="clock">{{ clock }}</span>
        <div class="user-chip">
          <div class="user-avatar">{{ userInitial }}</div>
          <span>{{ userName }}</span>
        </div>
        <button class="logout-btn" (click)="logout()">LOGOUT</button>
      </div>
    </nav>

    <!-- MAIN LAYOUT -->
    <div class="page">

      <!-- CENTER: CAMERA FEED -->
      <div class="panel camera-panel">
        <div class="panel-title">// VISION FEED — REAL-TIME INSPECTION</div>

        <div class="camera-feed">

          <!--
            MJPEG live stream — points directly at the Python FastAPI streamer.
            The browser handles the multipart stream natively; no getUserMedia needed.
            Hidden while camera is offline so the no-signal placeholder shows.
          -->
          @if (camActive) {
            <img [src]="streamSafeUrl"
                 alt="Live camera feed"
                 (error)="onStreamError()"
                 style="z-index:0" />
          }

          <!--
            Hidden canvas — used ONLY to capture a single frame before inspection.
            We draw a snapshot of the last MJPEG frame onto it via an offscreen fetch.
          -->
          <canvas #canvasEl></canvas>

          <!-- Scan sweep overlay -->
          <div class="scan-sweep" [class.active]="isScanning"></div>

          <!-- Corner HUD brackets -->
          <div class="cam-corner tl"></div>
          <div class="cam-corner tr"></div>
          <div class="cam-corner bl"></div>
          <div class="cam-corner br"></div>

          <!-- Detection bounding box -->
          @if (camActive && currentResult !== 'PENDING' && currentResult !== 'SCANNING') {
            <div class="detect-box"
                 [class.ok]="currentResult === 'OK'"
                 [style.left.px]="detectBox.x"
                 [style.top.px]="detectBox.y"
                 [style.width.px]="detectBox.w"
                 [style.height.px]="detectBox.h">
              <div class="detect-label"
                   [class.defect]="currentResult === 'DEFECT'"
                   [class.ok]="currentResult === 'OK'">
                {{ currentResult === 'DEFECT' ? '⚠ DEFECT — PICK' : '✓ OK' }}
              </div>
            </div>
          }

          <!-- No-signal state -->
          @if (!camActive) {
            <div class="no-signal">
              <div class="no-signal-icon">📷</div>
              <span>NO CAMERA SIGNAL</span>
            </div>
          }

          <!-- Python service offline warning -->
          @if (serviceOffline) {
            <div class="service-error">
              ⚠ PYTHON VISION SERVICE OFFLINE — run: uvicorn vision_bridge_fastapi:app --port 5050
            </div>
          }
        </div>

        <!-- Result badge -->
        <div class="result-badge">
          <div class="result-icon">
            {{ currentResult === 'OK' ? '✅' : currentResult === 'DEFECT' ? '🚨' : currentResult === 'SCANNING' ? '🔍' : '⏳' }}
          </div>
          <div class="result-text">
            <div class="result-label">LAST INSPECTION RESULT</div>
            <div class="result-value"
                 [class.ok]="currentResult === 'OK'"
                 [class.defect]="currentResult === 'DEFECT'"
                 [class.pending]="currentResult === 'PENDING' || currentResult === 'SCANNING'">
              {{ currentResult }}
              @if (currentResult === 'DEFECT') { — PICK SIGNAL SENT }
            </div>
          </div>
          <div class="result-confidence">
            <div>CONF {{ currentConfidence }}%</div>
            <div class="conf-bar">
              <div class="conf-fill"
                   [class.ok]="currentResult === 'OK'"
                   [class.defect]="currentResult === 'DEFECT'"
                   [style.width.%]="currentConfidence"></div>
            </div>
          </div>
        </div>

        <!-- Camera controls -->
        <div class="cam-controls">
          <button class="cam-btn cam-start" (click)="startCamera()"  [disabled]="camActive || isStarting">
            {{ isStarting ? '⏳ STARTING...' : '▶ START CAMERA' }}
          </button>
          <button class="cam-btn cam-preset" (click)="savePreset()"  [disabled]="!camActive">💾 SAVE PRESET</button>
          <button class="cam-btn cam-stop"   (click)="stopCamera()"  [disabled]="!camActive">■ STOP</button>
          <button class="cam-btn cam-snap"   (click)="manualScan()"  [disabled]="!camActive || isScanning">📸 SCAN NOW</button>
          <button class="cam-btn cam-auto"   (click)="toggleAuto()"  [class.armed]="autoMode" [disabled]="!camActive">
            {{ autoMode ? '⚡ AUTO-ON' : '⚡ AUTO' }}
          </button>
        </div>
      </div>

      <!-- RIGHT TOP: STATS -->
      <div class="panel stats-panel">
        <div class="panel-title">// INSPECTION STATS</div>

        <div class="stat-grid">
          <div class="stat-cell">
            <div class="stat-label">Total Scanned</div>
            <div class="stat-value">{{ totalScanned }}</div>
          </div>
          <div class="stat-cell">
            <div class="stat-label">Defects Found</div>
            <div class="stat-value defect-count">{{ totalDefects }}</div>
          </div>
          <div class="stat-cell">
            <div class="stat-label">Parts OK</div>
            <div class="stat-value">{{ totalScanned - totalDefects }}</div>
          </div>
          <div class="stat-cell">
            <div class="stat-label">Picks Executed</div>
            <div class="stat-value pick-count">{{ totalPicks }}</div>
          </div>
        </div>

        <!-- Defect rate gauge -->
        <div class="gauge-wrap">
          <div class="gauge-label">Defect Rate</div>
          <div class="gauge-track">
            <div class="gauge-fill"
                 [class.low]="defectRate < 10"
                 [class.medium]="defectRate >= 10 && defectRate < 30"
                 [class.high]="defectRate >= 30"
                 [style.width.%]="defectRate"></div>
          </div>
          <div class="gauge-pct"
               [style.color]="defectRate >= 30 ? 'var(--danger)' : defectRate >= 10 ? '#f0a500' : 'var(--neon)'">
            {{ defectRate | number:'1.1-1' }}%
          </div>
        </div>

        <!-- Robot arm pick status -->
        <div class="arm-status-card" [class.picking]="pickStatus === 'PICKING'" [class.error]="pickStatus === 'ERROR'">
          <div class="arm-status-icon">🦾</div>
          <div class="arm-status-info">
            <div class="arm-status-lbl">ROBOT ARM — PICK STATUS</div>
            <div class="arm-status-val" [class]="pickStatus.toLowerCase()">
              — {{ pickStatus === 'IDLE' ? 'IDLE / STANDBY' : pickStatus === 'PICKING' ? 'EXECUTING PICK...' : pickStatus === 'PICKED' ? 'PICK COMPLETE' : 'ERROR' }}
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT BOTTOM: INSPECTION LOG -->
      <div class="panel log-panel">
        <div class="panel-title">// INSPECTION LOG</div>
        <div class="log-list">
          @if (eventLog.length === 0) {
            <div class="log-empty">NO EVENTS YET</div>
          }
          @for (ev of eventLog; track ev.id) {
            <div class="log-item">
              <span class="log-badge" [class.ok]="ev.result === 'OK'" [class.defect]="ev.result === 'DEFECT'">
                {{ ev.result }}
              </span>
              <span class="log-info">
                {{ ev.confidence }}% {{ ev.defectType ? '· ' + ev.defectType : '' }}
              </span>
              <span class="log-time">{{ ev.time }}</span>
            </div>
          }
        </div>
      </div>

    </div>

    <div class="toast" [class.show]="toastVisible" [class.error]="toastError">{{ toastMsg }}</div>
  `
})
export class VisionInspectionComponent implements OnInit, OnDestroy {

  // ── State ──────────────────────────────────────────────────────────────────
  camActive         = false;
  isStarting        = false;   // shows spinner on START CAMERA button
  isScanning        = false;
  autoMode          = false;
  serviceOffline    = false;
  currentResult:    InspectionResult = 'PENDING';
  currentConfidence = 0;
  pickStatus:       PickStatus = 'IDLE';

  totalScanned = 0;
  totalDefects = 0;
  totalPicks   = 0;
  get defectRate() { return this.totalScanned ? (this.totalDefects / this.totalScanned) * 100 : 0; }

  eventLog:  InspectionEvent[] = [];
  detectBox  = { x: 80, y: 60, w: 200, h: 180 };

  clock        = '';
  userName     = 'OPERATOR';
  userInitial  = 'O';
  toastMsg     = '';
  toastVisible = false;
  toastError   = false;

  /**
   * Sanitized safe URL for the MJPEG stream <img> tag.
   * Angular blocks external URLs by default; DomSanitizer marks it trusted.
   */
  streamSafeUrl!: SafeUrl;

  // ── Private ────────────────────────────────────────────────────────────────
  private clockInterval: ReturnType<typeof setInterval> | null = null;
  private autoInterval:  ReturnType<typeof setInterval> | null = null;
  private userId:        string | null = null;
  private eventIdCounter = 0;

  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;

  constructor(
    private auth:      AuthService,
    private robot:     RobotService,
    private router:    Router,
    private zone:      NgZone,
    private sanitizer: DomSanitizer,
  ) {
    // Pre-sanitize the MJPEG stream URL once
    this.streamSafeUrl = this.sanitizer.bypassSecurityTrustUrl(this.robot.streamUrl);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const s          = this.auth.getSession();
    this.userId      = s.userId;
    this.userName    = (s.fullName || 'OPERATOR').toUpperCase();
    this.userInitial = this.userName.charAt(0);

    this.clockInterval = setInterval(() => {
      this.clock = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' UTC';
    }, 1000);
  }

  ngOnDestroy(): void {
    this.stopCamera();
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.autoInterval)  clearInterval(this.autoInterval);
  }

  // ── Camera lifecycle ───────────────────────────────────────────────────────

  /**
   * 1. Call Spring Boot → Python to open the USB camera.
   * 2. If successful, set camActive = true so the <img> tag appears and
   *    starts receiving the MJPEG stream from Python.
   */
  async startCamera(): Promise<void> {
    if (this.isStarting || this.camActive) return;
    this.isStarting = true;
    this.serviceOffline = false;

    this.robot.startVisionCamera().subscribe({
      next: () => {
        this.zone.run(() => {
          this.camActive  = true;
          this.isStarting = false;
          this.showToast('📷 CAMERA INITIALIZED');
          console.log('[VISION] Camera started via Spring Boot → Python');
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.isStarting     = false;
          this.serviceOffline = true;
          this.showToast('✗ VISION SERVICE OFFLINE', true);
          console.error('[VISION] Camera start error:', err);
        });
      }
    });
  }

  /**
   * 1. Stop auto-mode.
   * 2. Tell Spring Boot → Python to release the camera.
   * 3. Clear local state so the <img> tag is removed from the DOM.
   */
  stopCamera(): void {
    this.stopAutoMode();
    this.camActive         = false;
    this.isScanning        = false;
    this.currentResult     = 'PENDING';
    this.currentConfidence = 0;

    this.robot.stopVisionCamera().subscribe({
      next:  () => console.log('[VISION] Camera stopped'),
      error: (e) => console.warn('[VISION] Camera stop (best-effort):', e),
    });
  }

  onStreamError(): void {
    if (this.camActive) {
      this.serviceOffline = true;
      this.showToast('⚠ STREAM LOST — CHECK PYTHON SERVICE', true);
    }
  }

  // ── Save preset ────────────────────────────────────────────────────────────

  /**
   * Capture a single JPEG frame from the MJPEG stream via a one-shot fetch
   * to /stream (same endpoint, but we read just the first JPEG boundary).
   * Then save it as a preset in the DB via Spring Boot.
   */
  savePreset(): void {
    if (!this.camActive) {
      this.showToast('⚠ START CAMERA FIRST', true);
      return;
    }
    this.showToast('💾 CAPTURING FRAME...');

    this.captureFrame().then(imageData => {
      if (!imageData) {
        this.showToast('⚠ COULD NOT CAPTURE FRAME', true);
        return;
      }
      const ts         = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
      const presetName = `Preset_${ts}`;
      const userId     = this.userId ? parseInt(this.userId, 10) : 0;

      this.robot.savePreset(imageData, presetName, userId).subscribe({
        next:  (res) => this.zone.run(() => {
          this.showToast(`✅ PRESET SAVED — ID #${res.presetId}`);
          console.log('[VISION] Preset saved:', res);
        }),
        error: (err) => this.zone.run(() => {
          this.showToast('❌ FAILED TO SAVE PRESET', true);
          console.error('[VISION] Save preset error:', err);
        }),
      });
    });
  }

  // ── Scan logic ─────────────────────────────────────────────────────────────

  manualScan(): void {
    if (!this.camActive || this.isScanning) return;
    this.runInspection();
  }

  toggleAuto(): void {
    this.autoMode = !this.autoMode;
    if (this.autoMode) {
      this.showToast('⚡ AUTO-INSPECT ARMED — 3s INTERVAL');
      this.autoInterval = setInterval(() => this.runInspection(), 3000);
    } else {
      this.stopAutoMode();
      this.showToast('⚡ AUTO-INSPECT DISARMED');
    }
  }

  private stopAutoMode(): void {
    this.autoMode = false;
    if (this.autoInterval) { clearInterval(this.autoInterval); this.autoInterval = null; }
  }

  /**
   * Core inspection pipeline:
   * 1. Capture a JPEG frame from the MJPEG stream (fetch → canvas → base64).
   * 2. POST it to Spring Boot /inspect → Python FastAPI.
   * 3. If DEFECT → trigger robot arm pick command.
   */
  private async runInspection(): Promise<void> {
    if (!this.camActive || this.isScanning) return;

    this.isScanning    = true;
    this.currentResult = 'SCANNING';

    const imageData = await this.captureFrame();
    if (!imageData) {
      this.zone.run(() => {
        this.isScanning = false;
        this.showToast('⚠ FRAME CAPTURE FAILED', true);
      });
      return;
    }

    this.robot.inspectVision(imageData).subscribe({
      next:  (result) => this.zone.run(() => this.handleInspectionResult(result)),
      error: (err)    => this.zone.run(() => {
        this.isScanning = false;
        this.showToast('❌ VISION API ERROR', true);
        console.error('[VISION] Inspection failed:', err);
      }),
    });
  }

  private handleInspectionResult(result: { isDefect: boolean; confidence: number; defectType?: string }): void {
    const { isDefect, confidence, defectType } = result;

    this.currentResult     = isDefect ? 'DEFECT' : 'OK';
    this.currentConfidence = confidence;
    this.isScanning        = false;
    this.totalScanned++;

    // Randomise bounding box position for visual feedback
    this.detectBox = {
      x: 60  + Math.random() * 120,
      y: 40  + Math.random() * 100,
      w: 140 + Math.random() * 100,
      h: 100 + Math.random() * 100,
    };

    if (isDefect) {
      this.totalDefects++;
      this.triggerPickSignal(defectType ?? 'UNKNOWN');
    }

    this.logEvent(isDefect ? 'DEFECT' : 'OK', confidence, defectType);
  }

  // ── Robot pick signal ──────────────────────────────────────────────────────
  private triggerPickSignal(defectType: string): void {
    this.pickStatus = 'PICKING';
    this.showToast(`🚨 DEFECT: ${defectType} — ARM DISPATCHED`);

    this.robot.sendCommand({
      userId:        this.userId ? parseInt(this.userId, 10) : null,
      baseAngle:     90,
      shoulderAngle: 45,
      elbowAngle:    45,
      gripperAngle:  90,
      commandName:   'AUTO-PICK',
    }).subscribe({
      next: res => {
        this.pickStatus = res.success ? 'PICKED' : 'ERROR';
        if (res.success) {
          this.totalPicks++;
          this.showToast('✓ PICK COMPLETE — DEFECT REMOVED');
          if (this.eventLog.length) {
            this.eventLog[0] = { ...this.eventLog[0], pickStatus: 'PICKED' };
          }
          setTimeout(() => {
            this.pickStatus = 'IDLE';
            this.robot.sendCommand({
              userId: this.userId ? parseInt(this.userId, 10) : null,
              baseAngle: 90, shoulderAngle: 90, elbowAngle: 90, gripperAngle: 0,
              commandName: 'RETURN-HOME',
            }).subscribe({ next: () => {}, error: () => {} });
          }, 1500);
        }
      },
      error: () => {
        this.pickStatus = 'ERROR';
        this.showToast('✗ PICK COMMAND FAILED', true);
        setTimeout(() => this.pickStatus = 'IDLE', 2000);
      },
    });
  }

  // ── Frame capture helper ───────────────────────────────────────────────────

  /**
   * Fetches a single JPEG frame directly from the Python /stream endpoint
   * and returns it as a base64 data-URL string.
   *
   * Strategy: fetch the MJPEG endpoint with a 2-second abort timeout,
   * read the first JPEG boundary chunk, decode it, draw it to the hidden
   * canvas, then export as JPEG base64.
   *
   * Fallback: if the browser fetch is blocked by CORS on the direct Python URL,
   * Spring Boot can proxy /api/robot/vision/frame → Python /stream.
   */
  private async captureFrame(): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 2000);

      // Fetch one JPEG frame from the Python streamer
      const resp = await fetch(this.robot.streamUrl, {
        signal: controller.signal,
        cache:  'no-store',
      });
      clearTimeout(timeout);

      // Read the raw bytes of the first multipart chunk
      const reader = resp.body!.getReader();
      let   chunks: Uint8Array[] = [];
      let   total  = 0;
      const MAX    = 400_000; // 400 KB — more than enough for one JPEG

      while (total < MAX) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.length;

        // Detect end of first JPEG (FFD9)
        const combined = this.mergeChunks(chunks, total);
        const soi = this.indexOfBytes(combined, [0xFF, 0xD8]);
        const eoi = this.indexOfBytes(combined, [0xFF, 0xD9]);
        if (soi !== -1 && eoi !== -1 && eoi > soi) {
          reader.cancel();
          const jpeg = combined.slice(soi, eoi + 2);
          return await this.jpegToBase64(jpeg);
        }
      }
      reader.cancel();
      return null;

    } catch (err) {
      console.error('[VISION] captureFrame error:', err);
      return null;
    }
  }

  private mergeChunks(chunks: Uint8Array[], total: number): Uint8Array {
    const out = new Uint8Array(total);
    let   off = 0;
    for (const c of chunks) { out.set(c, off); off += c.length; }
    return out;
  }

  private indexOfBytes(buf: Uint8Array, pattern: number[]): number {
    outer: for (let i = 0; i <= buf.length - pattern.length; i++) {
      for (let j = 0; j < pattern.length; j++) {
        if (buf[i + j] !== pattern[j]) continue outer;
      }
      return i;
    }
    return -1;
  }

  private jpegToBase64(bytes: Uint8Array): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = this.canvasEl?.nativeElement;
      if (!canvas) { reject('No canvas'); return; }

      const standardBuffer = new Uint8Array(bytes).buffer;
      const blob = new Blob([standardBuffer], { type: 'image/jpeg' });
      const url  = URL.createObjectURL(blob);
      const img  = new Image();
      img.onload = () => {
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject('Image load failed'); };
      img.src = url;
    });
  }

  // ── Log ────────────────────────────────────────────────────────────────────
  private logEvent(result: InspectionResult, confidence: number, defectType?: string): void {
    this.eventIdCounter++;
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    } as Intl.DateTimeFormatOptions);

    this.eventLog.unshift({
      id:         String(this.eventIdCounter),
      time,
      result,
      confidence,
      defectType,
      pickStatus: result === 'DEFECT' ? 'PICKING' : 'IDLE',
    });
    if (this.eventLog.length > 50) this.eventLog.pop();
  }

  // ── Navigation & helpers ───────────────────────────────────────────────────
  goToDashboard(): void { this.router.navigate(['/dashboard']); }
  logout():        void { this.auth.logout(); this.router.navigate(['/']); }

  private showToast(msg: string, isError = false): void {
    this.toastMsg     = msg;
    this.toastError   = isError;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 2800);
  }
}