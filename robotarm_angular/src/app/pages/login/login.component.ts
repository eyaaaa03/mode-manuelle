import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
    :host { display:flex; align-items:center; justify-content:center; min-height:100vh; overflow:hidden; }

    .back-link { position:fixed; top:1.5rem; left:1.5rem; font-size:0.8rem; letter-spacing:2px; text-transform:uppercase; color:rgba(200,230,227,0.4); text-decoration:none; z-index:100; transition:color 0.2s; display:flex; align-items:center; gap:0.5rem; }
    .back-link:hover { color:var(--neon); }

    .login-wrapper { position:relative; z-index:10; display:flex; width:900px; max-width:95vw; min-height:560px; border:1px solid var(--border); background:rgba(2,8,18,0.9); backdrop-filter:blur(20px); box-shadow:0 0 60px rgba(0,255,231,0.08),inset 0 0 60px rgba(0,255,231,0.02); animation:slideIn 0.6s ease both; }
    .corner { position:absolute; width:20px; height:20px; border-color:var(--neon); border-style:solid; opacity:0.5; }
    .corner-tl { top:0; left:0;  border-width:2px 0 0 2px; }
    .corner-tr { top:0; right:0; border-width:2px 2px 0 0; }
    .corner-bl { bottom:0; left:0;  border-width:0 0 2px 2px; }
    .corner-br { bottom:0; right:0; border-width:0 2px 2px 0; }

    .login-visual { flex:1; background:linear-gradient(135deg,rgba(0,255,231,0.05) 0%,rgba(0,255,231,0.02) 100%); border-right:1px solid var(--border); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem; position:relative; overflow:hidden; }
    .login-visual::before { content:'ROBOT'; font-family:'Orbitron',monospace; font-size:8rem; font-weight:900; color:rgba(0,255,231,0.04); position:absolute; writing-mode:vertical-rl; top:50%; left:50%; transform:translate(-50%,-50%); letter-spacing:-10px; }
    .vis-title { font-family:'Orbitron',monospace; font-size:1.5rem; font-weight:900; color:var(--neon); text-shadow:0 0 20px var(--neon); letter-spacing:4px; margin-bottom:0.5rem; }
    .vis-subtitle { font-size:0.75rem; letter-spacing:4px; text-transform:uppercase; color:rgba(200,230,227,0.4); margin-bottom:2.5rem; }
    .j { animation:jp 2s ease-in-out infinite; }
    .j:nth-child(2){animation-delay:.4s} .j:nth-child(3){animation-delay:.8s}
    @keyframes jp{0%,100%{filter:drop-shadow(0 0 4px #00ffe7)}50%{filter:drop-shadow(0 0 12px #00ffe7)}}
    .vis-info { margin-top:2rem; text-align:center; font-size:0.8rem; color:rgba(200,230,227,0.3); letter-spacing:2px; }

    .login-form-side { flex:1; padding:3.5rem; display:flex; flex-direction:column; justify-content:center; }
    .form-logo { font-family:'Orbitron',monospace; font-size:1.2rem; font-weight:900; color:var(--neon); letter-spacing:3px; margin-bottom:0.5rem; }
    .form-logo span { color:var(--neon2); }
    .form-header { margin-bottom:2.5rem; }
    .form-header h2 { font-family:'Orbitron',monospace; font-size:1.4rem; color:#fff; margin-bottom:0.5rem; }
    .form-header p { font-size:0.85rem; color:rgba(200,230,227,0.4); letter-spacing:1px; }

    .form-group { margin-bottom:1.5rem; }
    .form-group label { display:block; font-size:0.7rem; letter-spacing:3px; text-transform:uppercase; color:var(--neon); margin-bottom:0.6rem; opacity:0.8; }
    .input-wrap { position:relative; display:flex; align-items:center; }
    .input-wrap input { width:100%; background:rgba(0,255,231,0.03); border:1px solid rgba(0,255,231,0.2); color:#fff; padding:0.85rem 1rem 0.85rem 2.8rem; font-family:'Rajdhani',sans-serif; font-size:1rem; letter-spacing:1px; outline:none; transition:all 0.3s; border-radius:2px; }
    .input-wrap input:focus { border-color:var(--neon); background:rgba(0,255,231,0.06); box-shadow:0 0 20px rgba(0,255,231,0.1); }
    .input-wrap input::placeholder { color:rgba(200,230,227,0.25); }
    .input-icon { position:absolute; left:0.9rem; color:rgba(0,255,231,0.4); font-size:1rem; pointer-events:none; }

    .status-indicator { display:flex; align-items:center; gap:0.5rem; font-size:0.7rem; letter-spacing:2px; text-transform:uppercase; color:rgba(0,255,231,0.5); margin-bottom:2rem; }
    .status-dot { width:6px; height:6px; background:var(--neon); border-radius:50%; animation:blink 1.5s ease-in-out infinite; box-shadow:0 0 8px var(--neon); }

    .btn-submit { width:100%; padding:1rem; background:var(--neon); border:none; color:var(--bg); font-family:'Orbitron',monospace; font-size:0.85rem; font-weight:700; letter-spacing:3px; cursor:pointer; transition:all 0.3s; border-radius:2px; position:relative; overflow:hidden; margin-top:0.5rem; }
    .btn-submit:hover { box-shadow:0 0 30px rgba(0,255,231,0.5); }
    .btn-submit:active { transform:scale(0.98); }
    .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }

    .form-footer { text-align:center; margin-top:1.5rem; font-size:0.85rem; color:rgba(200,230,227,0.4); }
    .form-footer a { color:var(--neon); }
    .form-footer a:hover { opacity:0.7; }

    @media(max-width:640px) { .login-visual { display:none; } .login-wrapper { width:95vw; } }
  `],
  template: `
    <div class="scanline"></div>
    <div class="orb orb1"></div>
    <div class="orb orb2"></div>

    <a routerLink="/" class="back-link">← BACK</a>

    <div class="login-wrapper">
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>

      <div class="login-visual">
        <div class="vis-title">ROBOT ARM</div>
        <div class="vis-subtitle">Control Interface</div>
        <svg width="160" height="200" viewBox="0 0 160 200" style="overflow:visible">
          <defs>
            <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   style="stop-color:#00ffe7;stop-opacity:0.8"/>
              <stop offset="100%" style="stop-color:#006b5e;stop-opacity:0.3"/>
            </linearGradient>
          </defs>
          <rect x="50" y="175" width="60" height="12" rx="3" fill="#0a2a26" stroke="#00ffe7" stroke-width="1.5"/>
          <rect x="65" y="163" width="30" height="14" rx="2" fill="#0d332e" stroke="#00ffe7" stroke-width="1"/>
          <circle class="j" cx="80" cy="160" r="10" fill="#041a17" stroke="#00ffe7" stroke-width="1.5"/>
          <circle cx="80" cy="160" r="5" fill="#00ffe7" opacity="0.4"/>
          <rect x="74" y="95" width="12" height="68" rx="4" fill="url(#g2)" stroke="#00ffe7" stroke-width="1.2"/>
          <circle class="j" cx="80" cy="100" r="9" fill="#041a17" stroke="#00ffe7" stroke-width="1.5"/>
          <circle cx="80" cy="100" r="4" fill="#00ffe7" opacity="0.4"/>
          <rect x="75" y="45" width="10" height="58" rx="4" fill="url(#g2)" stroke="#00ffe7" stroke-width="1"/>
          <circle class="j" cx="80" cy="50" r="8" fill="#041a17" stroke="#00ffe7" stroke-width="1.5"/>
          <circle cx="80" cy="50" r="3" fill="#00ffe7" opacity="0.4"/>
          <rect x="76" y="25" width="8" height="28" rx="3" fill="#0d332e" stroke="#00ffe7" stroke-width="1"/>
          <rect x="70" y="14" width="8" height="18" rx="2" fill="#00ffe7" opacity="0.5"/>
          <rect x="82" y="14" width="8" height="18" rx="2" fill="#00ffe7" opacity="0.5"/>
          <rect x="75" y="10" width="10" height="10" rx="2" fill="#041a17" stroke="#ff6b35" stroke-width="1.2"/>
        </svg>
        <div class="vis-info">4DOF ROBOTIC SYSTEM<br></div>
      </div>

      <div class="login-form-side">
        <div class="form-logo">ROBOT<span>ARM</span></div>
        <div class="form-header">
          <h2>OPERATOR LOGIN</h2>
        </div>
        <div class="status-indicator">
          <div class="status-dot"></div>
          SYSTEM READY
        </div>

        @if (alertMsg) {
          <div class="alert" [class.alert-error]="alertType==='error'" [class.alert-success]="alertType==='success'">
            {{ alertMsg }}
          </div>
        }

        <div class="form-group">
          <label>Username</label>
          <div class="input-wrap">
            <span class="input-icon">◈</span>
            <input type="text" [(ngModel)]="username" placeholder="Enter operator ID" autocomplete="off" (keydown.enter)="handleLogin()">
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-wrap">
            <span class="input-icon">🔑</span>
            <input type="password" [(ngModel)]="password" placeholder="Enter access code" (keydown.enter)="handleLogin()">
          </div>
        </div>

        <button class="btn-submit" [disabled]="loading" (click)="handleLogin()">
          {{ loading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION' }}
        </button>

        <div class="form-footer">
          No operator account? <a routerLink="/signup">REQUEST ACCESS</a>
          &nbsp;·&nbsp; <a routerLink="/">HOME</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  loading  = false;
  alertMsg = '';
  alertType: 'error' | 'success' = 'error';

  constructor(private auth: AuthService, private router: Router) {}

  handleLogin(): void {
    if (!this.username || !this.password) {
      this.showAlert('⚠ All fields required'); return;
    }
    this.loading = true;
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: res => {
        if (res.success) {
          this.auth.saveSession(res);
          this.showAlert('✓ Authentication successful. Loading...', 'success');
          setTimeout(() => this.router.navigate(['/dashboard']), 1000);
        } else {
          this.showAlert('✗ ' + res.message);
          this.loading = false;
        }
      },
      error: () => {
        // Demo mode fallback
        sessionStorage.setItem('userId',   '1');
        sessionStorage.setItem('username', this.username);
        sessionStorage.setItem('fullName', this.username.toUpperCase());
        this.showAlert('✓ Demo mode — loading dashboard...', 'success');
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      }
    });
  }

  private showAlert(msg: string, type: 'error'|'success' = 'error'): void {
    this.alertMsg  = msg;
    this.alertType = type;
    if (type === 'error') setTimeout(() => this.alertMsg = '', 4000);
  }
}
