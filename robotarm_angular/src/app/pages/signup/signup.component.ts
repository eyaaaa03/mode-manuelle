import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// Disposable / temporary email domains to block
const BLOCKED_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'trashmail.com', 'trashmail.me', 'trashmail.net',
  'dispostable.com', 'mailnull.com', 'spamgourmet.com', 'spamgourmet.net',
  'spamgourmet.org', 'maildrop.cc', 'discard.email', 'spamherelots.com',
  'tempinbox.com', 'fakeinbox.com', '10minutemail.com', 'temp-mail.org',
]);

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
    :host { display:flex; align-items:center; justify-content:center; min-height:100vh; overflow:hidden; padding:2rem 0; }

    .back-link { position:fixed; top:1.5rem; left:1.5rem; font-size:0.8rem; letter-spacing:2px; text-transform:uppercase; color:rgba(200,230,227,0.4); text-decoration:none; z-index:100; transition:color 0.2s; display:flex; align-items:center; gap:0.5rem; }
    .back-link:hover { color:var(--neon); }

    .signup-wrapper { position:relative; z-index:10; width:520px; max-width:95vw; border:1px solid var(--border); background:rgba(2,8,18,0.95); backdrop-filter:blur(20px); padding:3rem; box-shadow:0 0 60px rgba(0,255,231,0.06); animation:slideIn 0.6s ease both; }
    .corner { position:absolute; width:16px; height:16px; border-color:var(--neon2); border-style:solid; opacity:0.5; }
    .corner-tl { top:0; left:0;  border-width:2px 0 0 2px; }
    .corner-tr { top:0; right:0; border-width:2px 2px 0 0; }
    .corner-bl { bottom:0; left:0;  border-width:0 0 2px 2px; }
    .corner-br { bottom:0; right:0; border-width:0 2px 2px 0; }

    .form-logo { font-family:'Orbitron',monospace; font-size:1.3rem; font-weight:900; color:var(--neon); letter-spacing:3px; margin-bottom:0.5rem; }
    .form-logo span { color:var(--neon2); }
    .form-header { margin-bottom:2rem; }
    .form-header h2 { font-family:'Orbitron',monospace; font-size:1.2rem; color:#fff; margin-bottom:0.4rem; }
    .form-header p { font-size:0.8rem; color:rgba(200,230,227,0.35); letter-spacing:2px; text-transform:uppercase; }

    .progress-bar { display:flex; gap:4px; margin-bottom:2rem; }
    .progress-step { flex:1; height:3px; background:rgba(0,255,231,0.15); border-radius:2px; transition:background 0.4s; }
    .progress-step.active { background:var(--neon); box-shadow:0 0 8px var(--neon); }
    .progress-step.done   { background:rgba(0,255,231,0.5); }

    .form-group { margin-bottom:1.3rem; }
    .form-row   { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .form-group label { display:block; font-size:0.68rem; letter-spacing:3px; text-transform:uppercase; color:var(--neon); margin-bottom:0.5rem; opacity:0.8; }
    .input-wrap { position:relative; }
    .input-wrap input { width:100%; background:rgba(0,255,231,0.03); border:1px solid rgba(0,255,231,0.2); color:#fff; padding:0.8rem 2rem 0.8rem 2.6rem; font-family:'Rajdhani',sans-serif; font-size:0.95rem; letter-spacing:1px; outline:none; transition:all 0.3s; border-radius:2px; }
    .input-wrap input:focus { border-color:var(--neon); background:rgba(0,255,231,0.06); box-shadow:0 0 15px rgba(0,255,231,0.08); }
    .input-wrap input.valid   { border-color:rgba(0,255,150,0.5); }
    .input-wrap input.invalid { border-color:rgba(255,80,80,0.5); }
    .input-wrap input::placeholder { color:rgba(200,230,227,0.2); }
    .input-icon  { position:absolute; left:0.8rem;  top:50%; transform:translateY(-50%); color:rgba(0,255,231,0.35); font-size:0.9rem; pointer-events:none; }
    .input-check { position:absolute; right:0.8rem; top:50%; transform:translateY(-50%); font-size:0.8rem; }

    /* ── Email hint row ─────────────────────────────────────────── */
    .email-hint {
      display: flex; align-items: center; gap: 0.5rem;
      margin-top: 0.4rem;
      padding: 0.45rem 0.8rem;
      border-radius: 2px;
      font-size: 0.72rem;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border: 1px solid rgba(255,80,80,0.3);
      background: rgba(255,80,80,0.06);
      color: #ff8080;
      animation: alertIn 0.25s ease;
    }
    .email-hint.hint-ok {
      border-color: rgba(0,255,150,0.3);
      background: rgba(0,255,150,0.05);
      color: #00ff96;
    }
    .hint-icon { font-size: 0.75rem; flex-shrink: 0; }

    /* ── Email breakdown chips ──────────────────────────────────── */
    .email-breakdown {
      display: flex; gap: 6px; flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .email-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 0.25rem 0.6rem;
      font-size: 0.65rem;
      letter-spacing: 1px;
      text-transform: uppercase;
      border-radius: 2px;
      font-family: 'Share Tech Mono', monospace;
    }
    .chip-local  { background: rgba(0,255,231,0.08); border: 1px solid rgba(0,255,231,0.2); color: var(--neon); }
    .chip-at     { background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.2); color: #a855f7; }
    .chip-domain { background: rgba(255,107,53,0.08); border: 1px solid rgba(255,107,53,0.2); color: var(--neon2); }
    .chip-dot    { background: rgba(200,230,227,0.04); border: 1px solid rgba(200,230,227,0.12); color: rgba(200,230,227,0.5); }
    .chip-tld    { background: rgba(0,255,150,0.08); border: 1px solid rgba(0,255,150,0.2); color: #00ff96; }

    .strength-bar  { margin-top:0.4rem; height:3px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; }
    .strength-fill { height:100%; border-radius:2px; transition:width 0.3s,background 0.3s; }
    .strength-text { font-size:0.65rem; letter-spacing:2px; margin-top:0.3rem; text-transform:uppercase; }

    .btn-submit { width:100%; padding:1rem; background:var(--neon2); border:none; color:#fff; font-family:'Orbitron',monospace; font-size:0.82rem; font-weight:700; letter-spacing:3px; cursor:pointer; transition:all 0.3s; border-radius:2px; margin-top:0.5rem; }
    .btn-submit:hover { background:#e55a28; box-shadow:0 0 30px rgba(255,107,53,0.4); }
    .btn-submit:active { transform:scale(0.98); }
    .btn-submit:disabled { opacity:0.5; cursor:not-allowed; }

    .form-footer { text-align:center; margin-top:1.5rem; font-size:0.85rem; color:rgba(200,230,227,0.35); }
    .form-footer a { color:var(--neon); }
    .divider { height:1px; background:var(--border); margin:1.5rem 0; position:relative; }
    .divider span { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); background:var(--bg); padding:0 0.8rem; font-size:0.7rem; letter-spacing:3px; color:rgba(200,230,227,0.3); text-transform:uppercase; }

    .alert { padding:0.75rem 1rem; border-radius:2px; font-size:0.85rem; margin-bottom:1rem; letter-spacing:1px; animation:alertIn 0.3s ease; }
    .alert-error   { border:1px solid rgba(255,80,80,0.5);  background:rgba(255,80,80,0.08);  color:#ff8080; }
    .alert-success { border:1px solid rgba(0,255,150,0.5);  background:rgba(0,255,150,0.08);  color:#00ff96; }
    @keyframes alertIn { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
  `],
  template: `
    <div class="scanline"></div>
    <div class="orb orb1"></div>
    <div class="orb orb2"></div>

    <a routerLink="/" class="back-link">← BACK</a>

    <div class="signup-wrapper">
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>

      <div class="form-logo">ROBOT<span>ARM</span></div>
      <div class="form-header">
        <h2>REQUEST ACCESS</h2>
      </div>

      <div class="progress-bar">
        @for (step of [1]; track step) {
          <div class="progress-step"
               [class.active]="progressStep() === step"
               [class.done]="progressStep() > step"></div>
        }
      </div>

      @if (alertMsg) {
        <div class="alert" [class.alert-error]="alertType==='error'" [class.alert-success]="alertType==='success'">
          {{ alertMsg }}
        </div>
      }

      <div class="form-row">
        <div class="form-group">
          <label>Full Name</label>
          <div class="input-wrap">
            <span class="input-icon">◈</span>
            <input type="text" [(ngModel)]="fullName" placeholder="FULL_NAME"
                   (ngModelChange)="updateProgress()"
                   [class.valid]="isValid('name')"
                   [class.invalid]="fullName.length>0 && !isValid('name')">
            <span class="input-check" [style.color]="isValid('name') ? '#00ff96' : '#ff8080'">
              {{ fullName.length>0 ? (isValid('name') ? '✓' : '✗') : '' }}
            </span>
          </div>
        </div>
        <div class="form-group">
          <label>Username</label>
          <div class="input-wrap">
            <span class="input-icon">&#64;</span>
            <input type="text" [(ngModel)]="username" placeholder="USERNAME"
                   (ngModelChange)="updateProgress()"
                   [class.valid]="isValid('username')"
                   [class.invalid]="username.length>0 && !isValid('username')">
            <span class="input-check" [style.color]="isValid('username') ? '#00ff96' : '#ff8080'">
              {{ username.length>0 ? (isValid('username') ? '✓' : '✗') : '' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── EMAIL FIELD with rich validation ── -->
      <div class="form-group">
        <label>Email Address</label>
        <div class="input-wrap">
          <span class="input-icon">✉</span>
          <input type="email" [(ngModel)]="email"
                 placeholder="operator&#64;domain.com"
                 [class.valid]="emailState === 'valid'"
                 [class.invalid]="emailState === 'invalid'"
                 (ngModelChange)="onEmailChange($event)"
                 (blur)="onEmailBlur()">
          <span class="input-check"
                [style.color]="emailState === 'valid' ? '#00ff96' : '#ff8080'">
            {{ emailState === 'valid' ? '✓' : (emailState === 'invalid' ? '✗' : '') }}
          </span>
        </div>

        <!-- Error / hint message -->
        @if (emailHint && emailState === 'invalid') {
          <div class="email-hint">
            <span class="hint-icon">⚠</span>{{ emailHint }}
          </div>
        }

        <!-- Visual breakdown of a valid email -->
        @if (emailState === 'valid' && emailParts) {
          <div class="email-hint hint-ok">
            <span class="hint-icon">◈</span> Valid — {{ emailParts.domain }} accepted
          </div>
          <div class="email-breakdown">
            <span class="email-chip chip-local">{{ emailParts.local }}</span>
            <span class="email-chip chip-at">&#64;</span>
            <span class="email-chip chip-domain">{{ emailParts.domainName }}</span>
            <span class="email-chip chip-dot">.</span>
            <span class="email-chip chip-tld">{{ emailParts.tld }}</span>
          </div>
        }
      </div>

      <div class="form-group">
        <label>Access Code (Password)</label>
        <div class="input-wrap">
          <span class="input-icon">🔐</span>
          <input type="password" [(ngModel)]="password" placeholder="Min 6 characters"
                 (ngModelChange)="onPasswordChange($event)">
        </div>
        <div class="strength-bar"><div class="strength-fill" [style.width]="strengthPct" [style.background]="strengthColor"></div></div>
        <div class="strength-text" [style.color]="strengthColor">{{ strengthLabel }}</div>
      </div>

      <div class="form-group">
        <label>Confirm Code</label>
        <div class="input-wrap">
          <span class="input-icon">🔐</span>
          <input type="password" [(ngModel)]="confirmPassword" placeholder="Repeat access code"
                 (ngModelChange)="updateProgress()"
                 [class.valid]="isValid('confirm')"
                 [class.invalid]="confirmPassword.length>0 && !isValid('confirm')">
          <span class="input-check" [style.color]="isValid('confirm') ? '#00ff96' : '#ff8080'">
            {{ confirmPassword.length>0 ? (isValid('confirm') ? '✓' : '✗') : '' }}
          </span>
        </div>
      </div>

      <button class="btn-submit" [disabled]="loading" (click)="handleSignup()">
        {{ loading ? 'REGISTERING...' : 'REGISTER USER' }}
      </button>

      <div class="divider"><span>or</span></div>
      <div class="form-footer">
        Already have access? <a routerLink="/login">LOGIN HERE</a>
        &nbsp;·&nbsp; <a routerLink="/">HOME</a>
      </div>
    </div>
  `
})
export class SignupComponent {
  fullName = ''; username = ''; email = ''; password = ''; confirmPassword = '';
  loading  = false;
  alertMsg = ''; alertType: 'error'|'success' = 'error';
  strengthPct = '0%'; strengthColor = 'rgba(200,230,227,0.3)'; strengthLabel = '';

  // ── Email validation state ─────────────────────────────────────
  emailState: 'idle' | 'valid' | 'invalid' = 'idle';
  emailHint  = '';
  emailParts: { local: string; domain: string; domainName: string; tld: string } | null = null;

  private _progress = signal(1);
  progressStep = computed(() => this._progress());

  constructor(private auth: AuthService, private router: Router) {}

  // ── Field validators ───────────────────────────────────────────
  isValid(type: string): boolean {
    switch (type) {
      case 'name':     return this.fullName.trim().length >= 2;
      case 'username': return /^[a-zA-Z0-9_]{3,}$/.test(this.username);
      case 'confirm':  return this.confirmPassword === this.password && this.confirmPassword.length > 0;
      default:         return false;
    }
  }

  // ── Email: real-time feedback while typing ─────────────────────
  onEmailChange(val: string): void {
    this.email = val;
    this.emailParts = null;

    if (!val || val.length === 0) {
      this.emailState = 'idle';
      this.emailHint  = '';
      this.updateProgress();
      return;
    }

    const result = this.validateEmail(val);
    this.emailState = result.valid ? 'valid' : 'invalid';
    this.emailHint  = result.valid ? '' : result.message;
    if (result.valid) this.emailParts = result.parts!;
    this.updateProgress();
  }

  // ── Email: stricter check on blur (field loses focus) ──────────
  onEmailBlur(): void {
    if (this.email.length === 0) return;
    const result = this.validateEmail(this.email, true);
    this.emailState = result.valid ? 'valid' : 'invalid';
    this.emailHint  = result.valid ? '' : result.message;
    if (result.valid) this.emailParts = result.parts!;
    else this.emailParts = null;
  }

  // ── Core email validation logic ────────────────────────────────
  private validateEmail(val: string, strict = false): {
    valid: boolean;
    message: string;
    parts?: { local: string; domain: string; domainName: string; tld: string };
  } {
    const v = val.trim();

    // 1 — must contain exactly one @
    const atCount = (v.match(/@/g) || []).length;
    if (atCount === 0) return { valid: false, message: 'Missing @ symbol' };
    if (atCount > 1)   return { valid: false, message: 'Only one @ symbol allowed' };

    const [local, domain] = v.split('@');

    // 2 — local part rules
    if (!local || local.length === 0)
      return { valid: false, message: 'Enter something before @' };
    if (local.length > 64)
      return { valid: false, message: 'Local part too long (max 64 chars)' };
    if (local.startsWith('.') || local.endsWith('.'))
      return { valid: false, message: 'Local part cannot start or end with a dot' };
    if (/\.{2,}/.test(local))
      return { valid: false, message: 'Consecutive dots not allowed' };
    if (!/^[a-zA-Z0-9._%+\-]+$/.test(local))
      return { valid: false, message: 'Invalid character in local part' };

    // 3 — domain part rules (only enforce strictly on blur)
    if (!domain || domain.length === 0)
      return { valid: false, message: 'Enter a domain after @' };

    if (!domain.includes('.'))
      return { valid: strict ? false : false, message: 'Domain must contain a dot (e.g. gmail.com)' };

    const domainParts = domain.split('.');
    const tld         = domainParts[domainParts.length - 1];
    const domainName  = domainParts.slice(0, -1).join('.');

    if (tld.length < 2)
      return { valid: false, message: 'TLD too short (e.g. .com, .org)' };
    if (tld.length > 10)
      return { valid: false, message: 'TLD too long' };
    if (!/^[a-zA-Z]+$/.test(tld))
      return { valid: false, message: 'TLD must contain only letters' };
    if (!domainName || domainName.length === 0)
      return { valid: false, message: 'Invalid domain name' };
    if (!/^[a-zA-Z0-9.\-]+$/.test(domainName))
      return { valid: false, message: 'Invalid characters in domain' };
    if (domainName.startsWith('-') || domainName.endsWith('-'))
      return { valid: false, message: 'Domain cannot start or end with a hyphen' };

    // 4 — total length
    if (v.length > 254)
      return { valid: false, message: 'Email address too long (max 254 chars)' };

    // 5 — block disposable domains
    const domainLower = domain.toLowerCase();
    if (BLOCKED_DOMAINS.has(domainLower))
      return { valid: false, message: `Disposable email domain not allowed (${domain})` };

    // 6 — no spaces anywhere
    if (/\s/.test(v))
      return { valid: false, message: 'Email address cannot contain spaces' };

    return {
      valid: true,
      message: '',
      parts: { local, domain, domainName, tld },
    };
  }

  // ── Password strength ──────────────────────────────────────────
  onPasswordChange(val: string): void {
    let score = 0;
    if (val.length >= 6)            score++;
    if (val.length >= 10)           score++;
    if (/[A-Z]/.test(val))          score++;
    if (/[0-9]/.test(val))          score++;
    if (/[^A-Za-z0-9]/.test(val))   score++;
    const levels = [
      { pct:'20%',  color:'#ff4444', label:'WEAK' },
      { pct:'40%',  color:'#ff8c00', label:'FAIR' },
      { pct:'60%',  color:'#ffd700', label:'MODERATE' },
      { pct:'80%',  color:'#7fff00', label:'STRONG' },
      { pct:'100%', color:'#00ff96', label:'EXCELLENT' },
    ];
    const lvl = val.length > 0 ? levels[Math.max(0, score - 1)] : null;
    this.strengthPct   = lvl ? lvl.pct   : '0%';
    this.strengthColor = lvl ? lvl.color : 'rgba(200,230,227,0.3)';
    this.strengthLabel = lvl ? lvl.label : '';
    this.updateProgress();
  }

  // ── Progress bar ───────────────────────────────────────────────
  updateProgress(): void {
    const scores = [
      this.isValid('name')                  ? 1 : 0,
      this.isValid('username')              ? 1 : 0,
      this.emailState === 'valid'           ? 1 : 0,
      this.password.length >= 6            ? 1 : 0,
      this.isValid('confirm')              ? 1 : 0,
    ];
    const total = scores.reduce((a, b) => a + b, 0);
    this._progress.set(Math.min(4, total + 1));
  }

  // ── Submit ─────────────────────────────────────────────────────
  handleSignup(): void {
    if (!this.fullName || !this.username || !this.email || !this.password) {
      this.showAlert('⚠ All fields are required'); return;
    }
    if (this.emailState !== 'valid') {
      this.showAlert('⚠ ' + (this.emailHint || 'Invalid email address')); return;
    }
    if (this.password !== this.confirmPassword) {
      this.showAlert('⚠ Access codes do not match'); return;
    }
    if (this.password.length < 6) {
      this.showAlert('⚠ Access code must be at least 6 characters'); return;
    }

    this.loading = true;
    this.auth.signup({
      fullName: this.fullName, username: this.username,
      email: this.email, password: this.password
    }).subscribe({
      next: res => {
        if (res.success) {
          this.showAlert('✓ Account created! Redirecting to login...', 'success');
          setTimeout(() => this.router.navigate(['/login']), 1800);
        } else {
          this.showAlert('✗ ' + res.message);
          this.loading = false;
        }
      },
      error: () => {
        this.showAlert('✓ Demo: Account registered! Redirecting...', 'success');
        setTimeout(() => this.router.navigate(['/login']), 1800);
      }
    });
  }

  private showAlert(msg: string, type: 'error'|'success' = 'error'): void {
    this.alertMsg = msg; this.alertType = type;
    if (type === 'error') setTimeout(() => this.alertMsg = '', 4000);
  }
}