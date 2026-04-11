# MECHAARM — Angular 17+ Frontend

Converted from vanilla HTML/CSS/JS to a fully standalone Angular 17+ application.

---

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/index.ts          ← All TypeScript interfaces (AuthResponse, RobotState, etc.)
│   │   ├── services/
│   │   │   ├── auth.service.ts      ← Login, Signup, Session management
│   │   │   └── robot.service.ts     ← Robot state, commands, history
│   │   └── guards/
│   │       └── auth.guard.ts        ← Protects /dashboard route
│   ├── pages/
│   │   ├── home/
│   │   │   └── home.component.ts    ← Landing page (index.html)
│   │   ├── login/
│   │   │   └── login.component.ts   ← Login page
│   │   ├── signup/
│   │   │   └── signup.component.ts  ← Registration page
│   │   └── dashboard/
│   │       └── dashboard.component.ts ← Robot control dashboard
│   ├── app.component.ts             ← Root component (router-outlet)
│   ├── app.config.ts                ← Bootstrap config (HttpClient, Router)
│   └── app.routes.ts                ← Lazy-loaded routes
├── environments/
│   ├── environment.ts               ← Dev  (http://localhost:8080/api)
│   └── environment.prod.ts          ← Prod (update URL before deploying)
├── styles.css                       ← Global CSS variables & shared styles
├── index.html                       ← Root HTML (loads Google Fonts)
└── main.ts                          ← Bootstrap entry point
```

---

## Angular 17+ Features Used

| Feature | Where |
|---|---|
| Standalone Components | All 4 page components — no NgModule |
| `@if` / `@for` blocks | New control flow syntax throughout |
| `signal()` / `computed()` | Signup progress bar |
| Lazy-loaded routes | `loadComponent` in app.routes.ts |
| Functional guard | `authGuard` in core/guards |
| `provideHttpClient()` | app.config.ts |
| `provideRouter()` | app.config.ts |

---

## API Mapping (Spring Boot → Angular)

| Endpoint | Angular Service Method |
|---|---|
| `POST /api/auth/login` | `AuthService.login()` |
| `POST /api/auth/signup` | `AuthService.signup()` |
| `GET  /api/robot/state` | `RobotService.getState()` |
| `POST /api/robot/command` | `RobotService.sendCommand()` |
| `POST /api/robot/reset` | `RobotService.reset()` |
| `GET  /api/robot/history/:userId` | `RobotService.getHistory()` |

---

## Quick Start

### 1 — Install dependencies
```bash
npm install
```

### 2 — Start dev server
```bash
npm start
# → http://localhost:4200
```

### 3 — Make sure Spring Boot is running
```bash
# In your Spring Boot project:
./mvnw spring-boot:run
# → http://localhost:8080
```

### 4 — Build for production
```bash
npm run build
# Output: dist/mechaarm-angular/
```

---

## Change API URL

Edit `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://YOUR_SERVER:8080/api'   // ← change this
};
```

Or update directly in the services if you prefer:
- `src/app/core/services/auth.service.ts`  → `private api = '...'`
- `src/app/core/services/robot.service.ts` → `private api = '...'`

---

## Demo / Offline Mode

If the Spring Boot backend is unreachable, both Login and Signup fall back
to **demo mode** automatically — they store a fake session and navigate to
the dashboard. The dashboard will still render with the full UI and local
state tracking; only the API calls (command send, reset) will silently fail.

---

## CORS

Your Spring Boot controllers already have `@CrossOrigin(origins = "*")` on
both `AuthController` and `RobotController`, so no extra config is needed
during development.

For production, tighten this to your actual Angular origin:
```java
@CrossOrigin(origins = "http://your-angular-domain.com")
```
