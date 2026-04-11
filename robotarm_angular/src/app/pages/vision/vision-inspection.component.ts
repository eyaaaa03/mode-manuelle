import { Component, OnInit, OnDestroy, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RobotService } from '../../core/services/robot.service';

// ── Types ─────────────────────────────────────────────────────────────────────
type InspectionResult = 'OK' | 'DEFECT' | 'PENDING' | 'SCANNING';
type PickStatus = 'IDLE' | 'PICKING' | 'PICKED' | 'ERROR';

interface InspectionEvent {
  id: string;
  time: string;
  result: InspectionResult;
  confidence: number;
  defectType?: string;
  pickStatus: PickStatus;
}

// ── Component ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-vision-inspection',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: block; }

    /* ── Nav (mirrors dashboard nav) ── */
    nav {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.8rem 2rem;
      background: rgba(2,8,18,0.92); backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
    }
    .nav-left  { display: flex; align-items: center; gap: 2rem; }
    .logo      { font-family: 'Orbitron', monospace; font-weight: 900; font-size: 1.2rem; color: var(--neon); letter-spacing: 4px; text-shadow: 0 0 15px var(--neon); }
    .logo span { color: var(--neon2); }
    .nav-tabs  { display: flex; gap: 4px; }
    .nav-tab   { padding: 0.35rem 1rem; font-family: 'Rajdhani', sans-serif; font-size: 0.72rem; letter-spacing: 2px; text-transform: uppercase; border: 1px solid var(--border); background: transparent; color: rgba(200,230,227,0.4); cursor: pointer; transition: all 0.2s; }
    .nav-tab:hover  { color: var(--neon); border-color: rgba(0,255,231,0.3); }
    .nav-tab.active { color: var(--neon); border-color: var(--neon); background: rgba(0,255,231,0.06); }
    .nav-status { display: flex; align-items: center; gap: 0.6rem; font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; animation: blink 1.5s ease-in-out infinite; box-shadow: 0 0 8px currentColor; }
    .status-online  { background: var(--neon);   color: var(--neon); }
    .status-scanning{ background: #a855f7;        color: #a855f7; }
    .status-offline { background: var(--danger);  color: var(--danger); }
    .status-label   { color: rgba(200,230,227,0.5); }
    .nav-right { display: flex; align-items: center; gap: 1.5rem; }
    .clock     { font-family: 'Share Tech Mono', monospace; font-size: 0.75rem; color: rgba(200,230,227,0.3); }
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
      position: relative; width: 100%; aspect-ratio: 16/9; max-height: 480px;
      background: #010a0e; border: 1px solid rgba(0,255,231,0.12); overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }
    .camera-feed video, .camera-feed canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .camera-feed canvas { z-index: 2; pointer-events: none; }

    /* Scan-line sweep */
    .scan-sweep {
      position: absolute; inset: 0; z-index: 3; pointer-events: none;
      background: linear-gradient(180deg, transparent 0%, rgba(0,255,231,0.06) 50%, transparent 100%);
      background-size: 100% 60px;
      animation: sweep 2.5s linear infinite;
      opacity: 0;
      transition: opacity 0.4s;
    }
    .scan-sweep.active { opacity: 1; }
    @keyframes sweep { 0% { background-position: 0 -60px; } 100% { background-position: 0 calc(100% + 60px); } }

    /* Corner brackets */
    .cam-corner { position: absolute; width: 22px; height: 22px; z-index: 4; }
    .cam-corner.tl { top: 8px; left: 8px; border-top: 2px solid var(--neon); border-left: 2px solid var(--neon); }
    .cam-corner.tr { top: 8px; right: 8px; border-top: 2px solid var(--neon); border-right: 2px solid var(--neon); }
    .cam-corner.bl { bottom: 8px; left: 8px; border-bottom: 2px solid var(--neon); border-left: 2px solid var(--neon); }
    .cam-corner.br { bottom: 8px; right: 8px; border-bottom: 2px solid var(--neon); border-right: 2px solid var(--neon); }

    /* Detection box overlay */
    .detect-box {
      position: absolute; z-index: 5;
      border: 2px solid var(--danger);
      box-shadow: 0 0 14px rgba(255,68,68,0.5), inset 0 0 14px rgba(255,68,68,0.05);
      animation: pulse-box 0.8s ease-in-out infinite;
      pointer-events: none;
      transition: all 0.3s;
    }
    .detect-box.ok { border-color: var(--neon); box-shadow: 0 0 14px rgba(0,255,231,0.4), inset 0 0 14px rgba(0,255,231,0.05); animation: none; }
    @keyframes pulse-box { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    .detect-label {
      position: absolute; top: -22px; left: 0;
      font-family: 'Share Tech Mono', monospace; font-size: 0.7rem;
      padding: 2px 6px; letter-spacing: 1px;
    }
    .detect-label.defect { background: var(--danger); color: #fff; }
    .detect-label.ok     { background: var(--neon);   color: var(--bg); }

    /* No-signal placeholder */
    .no-signal {
      display: flex; flex-direction: column; align-items: center; gap: 0.8rem;
      color: rgba(200,230,227,0.2); font-family: 'Share Tech Mono', monospace;
      font-size: 0.8rem; letter-spacing: 3px;
    }
    .no-signal-icon { font-size: 3rem; opacity: 0.3; }

    /* Result badge under camera */
    .result-badge {
      display: flex; align-items: center; gap: 1rem;
      margin-top: 1rem; padding: 0.8rem 1.2rem;
      background: rgba(0,255,231,0.03); border: 1px solid var(--border);
    }
    .result-icon { font-size: 2rem; line-height: 1; }
    .result-text { flex: 1; }
    .result-label { font-family: 'Orbitron', monospace; font-size: 0.65rem; letter-spacing: 2px; color: rgba(200,230,227,0.35); }
    .result-value { font-family: 'Share Tech Mono', monospace; font-size: 1.6rem; margin-top: 2px; }
    .result-value.ok      { color: var(--neon);   text-shadow: 0 0 12px rgba(0,255,231,0.5); }
    .result-value.defect  { color: var(--danger); text-shadow: 0 0 12px rgba(255,68,68,0.5); }
    .result-value.pending { color: rgba(200,230,227,0.3); }
    .result-confidence    { font-family: 'Share Tech Mono', monospace; font-size: 0.8rem; color: rgba(200,230,227,0.35); }
    .conf-bar { height: 3px; background: rgba(0,255,231,0.1); margin-top: 4px; border-radius: 2px; overflow: hidden; }
    .conf-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
    .conf-fill.ok     { background: var(--neon); box-shadow: 0 0 6px var(--neon); }
    .conf-fill.defect { background: var(--danger); box-shadow: 0 0 6px var(--danger); }

    /* Camera controls */
    .cam-controls { display: flex; gap: 0.6rem; margin-top: 1rem; flex-wrap: wrap; }
    .cam-btn {
      padding: 0.55rem 1.2rem; font-family: 'Orbitron', monospace; font-size: 0.65rem;
      letter-spacing: 2px; cursor: pointer; border-radius: 2px; transition: all 0.3s;
    }
    .cam-start { background: var(--neon); border: none; color: var(--bg); font-weight: 700; flex: 1; }
    .cam-start:hover { box-shadow: 0 0 25px rgba(0,255,231,0.5); }
    .cam-stop  { background: transparent; border: 1px solid var(--danger); color: var(--danger); }
    .cam-stop:hover { background: rgba(255,68,68,0.1); }
    .cam-snap  { background: transparent; border: 1px solid #a855f7; color: #a855f7; }
    .cam-snap:hover { background: rgba(168,85,247,0.1); }
    .cam-auto  {
      background: transparent; border: 1px solid rgba(0,255,231,0.3); color: rgba(200,230,227,0.6);
      font-family: 'Rajdhani', sans-serif; font-size: 0.75rem; padding: 0.55rem 1rem;
    }
    .cam-auto.armed { border-color: var(--neon2); color: var(--neon2); background: rgba(255,107,53,0.07); box-shadow: 0 0 10px rgba(255,107,53,0.2); }

    /* ── Side: stats + pick log ── */
    .stats-panel { grid-column: 2; grid-row: 1; }
    .stat-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); margin-bottom: 1.2rem; }
    .stat-cell   { background: var(--bg); padding: 0.9rem 1rem; }
    .stat-label  { font-size: 0.6rem; letter-spacing: 2px; text-transform: uppercase; color: rgba(200,230,227,0.3); margin-bottom: 3px; }
    .stat-value  { font-family: 'Share Tech Mono', monospace; font-size: 1.6rem; color: var(--neon); }
    .stat-value.defect-count { color: var(--danger); text-shadow: 0 0 10px rgba(255,68,68,0.4); }
    .stat-value.pick-count   { color: #a855f7; text-shadow: 0 0 10px rgba(168,85,247,0.4); }

    /* Defect rate gauge */
    .gauge-wrap { margin-bottom: 1.4rem; }
    .gauge-label { font-size: 0.65rem; letter-spacing: 2px; color: rgba(200,230,227,0.35); margin-bottom: 0.5rem; text-transform: uppercase; }
    .gauge-track { height: 8px; background: rgba(0,255,231,0.08); border-radius: 4px; overflow: hidden; position: relative; }
    .gauge-fill  { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .gauge-fill.low    { background: var(--neon);   box-shadow: 0 0 8px var(--neon); }
    .gauge-fill.medium { background: #f0a500;       box-shadow: 0 0 8px #f0a500; }
    .gauge-fill.high   { background: var(--danger); box-shadow: 0 0 8px var(--danger); }
    .gauge-pct { font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; margin-top: 4px; }

    /* Pick arm status */
    .arm-status-card {
      padding: 0.9rem 1rem; background: rgba(0,255,231,0.03); border: 1px solid var(--border);
      display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1.2rem; transition: all 0.3s;
    }
    .arm-status-card.picking { border-color: var(--neon2); background: rgba(255,107,53,0.06); }
    .arm-status-card.error   { border-color: var(--danger); background: rgba(255,68,68,0.06); }
    .arm-status-icon { font-size: 1.8rem; line-height: 1; }
    .arm-status-info { flex: 1; }
    .arm-status-lbl  { font-size: 0.6rem; letter-spacing: 2px; color: rgba(200,230,227,0.3); text-transform: uppercase; }
    .arm-status-val  { font-family: 'Share Tech Mono', monospace; font-size: 1rem; margin-top: 2px; }
    .arm-status-val.picking { color: var(--neon2); }
    .arm-status-val.picked  { color: var(--neon); }
    .arm-status-val.idle    { color: rgba(200,230,227,0.4); }
    .arm-status-val.error   { color: var(--danger); }

    /* Log panel */
    .log-panel  { grid-column: 2; grid-row: 2; overflow: hidden; display: flex; flex-direction: column; }
    .log-list   { flex: 1; overflow-y: auto; max-height: 340px; }
    .log-list::-webkit-scrollbar { width: 3px; }
    .log-list::-webkit-scrollbar-thumb { background: var(--neon); opacity: 0.3; border-radius: 2px; }

    .log-item {
      display: grid; grid-template-columns: auto 1fr auto; align-items: center;
      gap: 0.6rem; padding: 0.55rem 0; border-bottom: 1px solid rgba(0,255,231,0.05);
      font-size: 0.75rem;
    }
    .log-item:last-child { border-bottom: none; }
    .log-badge {
      font-family: 'Share Tech Mono', monospace; font-size: 0.6rem; letter-spacing: 1px;
      padding: 2px 6px; border-radius: 2px; white-space: nowrap;
    }
    .log-badge.ok     { background: rgba(0,255,231,0.12);  color: var(--neon);   border: 1px solid rgba(0,255,231,0.25); }
    .log-badge.defect { background: rgba(255,68,68,0.12);  color: var(--danger); border: 1px solid rgba(255,68,68,0.25); }
    .log-info  { color: rgba(200,230,227,0.55); letter-spacing: 0.5px; font-family: 'Share Tech Mono', monospace; font-size: 0.68rem; }
    .log-time  { color: rgba(200,230,227,0.2); font-size: 0.62rem; font-family: 'Share Tech Mono', monospace; }
    .log-pick  { font-size: 0.7rem; }
    .log-empty { font-size: 0.75rem; color: rgba(200,230,227,0.2); letter-spacing: 2px; text-align: center; padding: 1.5rem; font-family: 'Share Tech Mono', monospace; }

    /* Toast */
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
          <video #videoEl autoplay muted playsinline [style.display]="camActive ? 'block' : 'none'"></video>
          <canvas #canvasEl [style.display]="camActive ? 'block' : 'none'"></canvas>

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
                 [style.left]="detectBox.x + 'px'" [style.top]="detectBox.y + 'px'"
                 [style.width]="detectBox.w + 'px'" [style.height]="detectBox.h + 'px'">
              <div class="detect-label" [class.defect]="currentResult === 'DEFECT'" [class.ok]="currentResult === 'OK'">
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
                   [style.width]="currentConfidence + '%'"></div>
            </div>
          </div>
        </div>

        <!-- Camera controls -->
        <div class="cam-controls">
          <button class="cam-btn cam-start" (click)="startCamera()" [disabled]="camActive">▶ START CAMERA</button>
          <button class="cam-btn cam-stop"  (click)="stopCamera()"  [disabled]="!camActive">■ STOP</button>
          <button class="cam-btn cam-snap"  (click)="manualScan()"  [disabled]="!camActive">📸 SCAN NOW</button>
          <button class="cam-btn cam-auto"  (click)="toggleAuto()"  [class.armed]="autoMode">
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
                 [class.low]="defectRate < 20"
                 [class.medium]="defectRate >= 20 && defectRate < 50"
                 [class.high]="defectRate >= 50"
                 [style.width]="defectRate + '%'"></div>
          </div>
          <div class="gauge-pct"
               [style.color]="defectRate >= 50 ? 'var(--danger)' : defectRate >= 20 ? '#f0a500' : 'var(--neon)'">
            {{ defectRate.toFixed(1) }}%
          </div>
        </div>

        <!-- Arm pick status -->
        <div class="arm-status-card"
             [class.picking]="pickStatus === 'PICKING'"
             [class.error]="pickStatus === 'ERROR'">
          <div class="arm-status-icon">🦾</div>
          <div class="arm-status-info">
            <div class="arm-status-lbl">ROBOT ARM — PICK STATUS</div>
            <div class="arm-status-val"
                 [class.idle]="pickStatus === 'IDLE'"
                 [class.picking]="pickStatus === 'PICKING'"
                 [class.picked]="pickStatus === 'PICKED'"
                 [class.error]="pickStatus === 'ERROR'">
              {{ pickStatus === 'IDLE'    ? '— IDLE / STANDBY'      :
                 pickStatus === 'PICKING' ? '▶ PICKING DEFECT...'   :
                 pickStatus === 'PICKED'  ? '✓ DEFECT REMOVED'       :
                                            '✗ PICK ERROR' }}
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT BOTTOM: EVENT LOG -->
      <div class="panel log-panel">
        <div class="panel-title">// INSPECTION LOG</div>
        <div class="log-list">
          @if (eventLog.length === 0) {
            <div class="log-empty">NO EVENTS YET</div>
          }
          @for (e of eventLog; track e.id) {
            <div class="log-item">
              <div class="log-badge" [class.ok]="e.result === 'OK'" [class.defect]="e.result === 'DEFECT'">
                {{ e.result }}
              </div>
              <div class="log-info">
                {{ e.result === 'DEFECT' ? (e.defectType ?? 'SURFACE DEFECT') : 'PART OK' }}
                — {{ e.confidence }}%
              </div>
              <div style="text-align:right;">
                <div class="log-pick">{{ e.pickStatus === 'PICKED' ? '🤏' : e.pickStatus === 'PICKING' ? '⏳' : '' }}</div>
                <div class="log-time">{{ e.time }}</div>
              </div>
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
  camActive       = false;
  isScanning      = false;
  autoMode        = false;
  currentResult:  InspectionResult = 'PENDING';
  currentConfidence = 0;
  pickStatus:     PickStatus = 'IDLE';

  totalScanned = 0;
  totalDefects = 0;
  totalPicks   = 0;
  get defectRate() { return this.totalScanned ? (this.totalDefects / this.totalScanned) * 100 : 0; }

  eventLog: InspectionEvent[] = [];

  detectBox = { x: 80, y: 60, w: 200, h: 180 };

  clock        = '';
  userName     = 'OPERATOR';
  userInitial  = 'O';
  toastMsg     = ''; toastVisible = false; toastError = false;

  // ── Private ────────────────────────────────────────────────────────────────
  private stream:         MediaStream | null = null;
  private clockInterval:  ReturnType<typeof setInterval> | null = null;
  private autoInterval:   ReturnType<typeof setInterval> | null = null;
  private userId:         string | null = null;
  private eventIdCounter  = 0;

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;

  // Defect type labels for simulation / real classification
  private readonly DEFECT_TYPES = [
    'SCRATCH', 'CRACK', 'DENT', 'MISALIGNMENT', 'CORROSION', 'FOREIGN OBJECT'
  ];

  constructor(
    private auth:   AuthService,
    private robot:  RobotService,
    private router: Router,
    private zone:   NgZone,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const s         = this.auth.getSession();
    this.userId     = s.userId;
    this.userName   = (s.fullName || 'OPERATOR').toUpperCase();
    this.userInitial = this.userName.charAt(0);

    this.clockInterval = setInterval(() => {
      this.clock = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' UTC';
    }, 1000);

    // Check browser camera support
    console.log('[VISION] Component initialized');
    console.log('[VISION] Camera support:', !!navigator.mediaDevices?.getUserMedia);
    setTimeout(() => {
      console.log('[VISION] Video element ref:', this.videoEl);
      console.log('[VISION] Canvas element ref:', this.canvasEl);
    }, 100);
  }

  ngOnDestroy(): void {
    this.stopCamera();
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.autoInterval)  clearInterval(this.autoInterval);
  }

  // ── Camera ─────────────────────────────────────────────────────────────────
  async startCamera(): Promise<void> {
    try {
      console.log('[VISION] Requesting camera access...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false
      });
      
      console.log('[VISION] Camera stream obtained:', this.stream);
      
      // Attach stream to video element using ViewChild
      if (this.videoEl && this.videoEl.nativeElement) {
        const video = this.videoEl.nativeElement;
        video.srcObject = this.stream;
        
        // Wait for video to load metadata before playing
        video.onloadedmetadata = () => {
          console.log('[VISION] Video metadata loaded, started playing');
          video.play().catch(err => {
            console.error('[VISION] Play error:', err);
            this.showToast('✗ CAMERA PLAY ERROR', true);
          });
        };
        
        video.onerror = (err) => {
          console.error('[VISION] Video error:', err);
          this.showToast('✗ CAMERA PLAYBACK ERROR', true);
        };
      } else {
        console.warn('[VISION] Video element not found');
        this.showToast('✗ VIDEO ELEMENT NOT FOUND', true);
        return;
      }
      
      this.camActive = true;
      console.log('[VISION] Camera activated successfully');
      this.showToast('📷 CAMERA INITIALIZED');
    } catch (err: any) {
      console.error('[VISION] Camera access error:', err);
      this.showToast('✗ CAMERA ACCESS DENIED: ' + err.name, true);
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.camActive      = false;
    this.isScanning     = false;
    this.currentResult  = 'PENDING';
    this.currentConfidence = 0;
    this.stopAutoMode();
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
   * 1. Capture frame from video  →  canvas
   * 2. Send to backend vision API (or simulate)
   * 3. If DEFECT → dispatch pick command to robot arm
   */
  private runInspection(): void {
    if (!this.camActive || this.isScanning) return;

    this.isScanning    = true;
    this.currentResult = 'SCANNING';

    // Capture frame to canvas
    if (this.videoEl && this.canvasEl) {
      const video  = this.videoEl.nativeElement;
      const canvas = this.canvasEl.nativeElement;
      
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          console.log('[VISION] Frame captured: ' + canvas.width + 'x' + canvas.height);
        }
      } else {
        console.warn('[VISION] Video not ready yet');
        this.isScanning = false;
        return;
      }
    }

    // ── Call vision backend ──
    const canvas = this.canvasEl?.nativeElement as HTMLCanvasElement;
    const imageData = canvas?.toDataURL('image/jpeg') || '';
    
    if (!imageData) {
      console.error('[VISION] Failed to capture image data');
      this.isScanning = false;
      return;
    }
    
    this.robot.inspectVision(imageData).subscribe({
      next: (result) => {
        this.zone.run(() => this.handleInspectionResult(result));
      },
      error: (err) => {
        this.zone.run(() => {
          this.isScanning = false;
          this.showToast('❌ VISION API ERROR');
          console.error('Vision inspection failed:', err);
        });
      }
    });
  }

  private handleInspectionResult(result: { isDefect: boolean; confidence: number; defectType?: string }): void {
    // Parse real API response
    const isDefect   = result.isDefect;
    const confidence = result.confidence;
    const defectType = result.defectType;

    this.currentResult     = isDefect ? 'DEFECT' : 'OK';
    this.currentConfidence = confidence;
    this.isScanning        = false;
    this.totalScanned++;

    // Randomise bounding box per scan for realism
    this.detectBox = {
      x: 60  + Math.random() * 120,
      y: 40  + Math.random() * 100,
      w: 140 + Math.random() * 100,
      h: 100 + Math.random() * 100,
    };

    if (isDefect) {
      this.totalDefects++;
      this.triggerPickSignal(defectType!);
    }

    this.logEvent(isDefect ? 'DEFECT' : 'OK', confidence, defectType);
  }

  // ── Robot pick signal ──────────────────────────────────────────────────────
  private triggerPickSignal(defectType: string): void {
    this.pickStatus = 'PICKING';
    this.showToast(`🚨 DEFECT: ${defectType} — ARM DISPATCHED`);

    // Send pick command to robot arm (PICK preset angles)
    this.robot.sendCommand({
      userId:       this.userId ? parseInt(this.userId, 10) : null,
      baseAngle:    90,
      shoulderAngle: 45,
      elbowAngle:   45,
      gripperAngle: 90,
      commandName:  'AUTO-PICK',
    }).subscribe({
      next: res => {
        this.pickStatus = res.success ? 'PICKED' : 'ERROR';
        if (res.success) {
          this.totalPicks++;
          this.showToast('✓ PICK COMPLETE — DEFECT REMOVED');
          // Log pick status into last event
          if (this.eventLog.length) {
            this.eventLog[0] = { ...this.eventLog[0], pickStatus: 'PICKED' };
          }
          // Return arm home after 1.5 s
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
      }
    });
  }

  // ── Log ────────────────────────────────────────────────────────────────────
  private logEvent(result: InspectionResult, confidence: number, defectType?: string): void {
    this.eventIdCounter++;
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
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

  // ── Navigation & UI helpers ────────────────────────────────────────────────
  goToDashboard(): void { this.router.navigate(['/dashboard']); }
  logout():        void { this.auth.logout(); this.router.navigate(['/']); }

  private showToast(msg: string, isError = false): void {
    this.toastMsg     = msg;
    this.toastError   = isError;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 2800);
  }
}
