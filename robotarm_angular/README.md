# ROBOTARM — Angular 17+ Robot Arm Control System

A modern Angular 17+ frontend for controlling an automated robot arm with vision inspection capabilities. Built as a fully standalone application with TypeScript, RxJS, and MQTT support.

**Status:** Production-ready | **Architecture:** Standalone Components | **Version:** 1.0.0

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Project Structure](#project-structure)
3. [Component Architecture](#component-architecture)
4. [Service Layer](#service-layer)
5. [Data Flow](#data-flow)
6. [API Integration](#api-integration)
7. [Authentication & Security](#authentication--security)
8. [Technology Stack](#technology-stack)
9. [Quick Start](#quick-start)
10. [Configuration](#configuration)
11. [Deployment](#deployment)

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Angular 17+ Frontend                          │
│                  (robotarm_angular)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Presentation Layer (Page Components)             │   │
│  │  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐    │   │
│  │  │  Home Page  │  │ Dashboard│  │ Vision Inspector│    │   │
│  │  └─────────────┘  │ (Control)│  │   (Camera Feed) │    │   │
│  │                   └──────────┘  └──────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓              ↓              ↓                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Service Layer (Business Logic)                    │   │
│  │  ┌─────────────────────┐  ┌───────────────────────────┐ │   │
│  │  │  AuthService        │  │  RobotService             │ │   │
│  │  │ ·login()            │  │ ·getState()               │ │   │
│  │  │ ·signup()           │  │ ·sendCommand()            │ │   │
│  │  │ ·getSession()       │  │ ·reset()                  │ │   │
│  │  │ ·logout()           │  │ ·startVisionCamera()      │ │   │
│  │  │ ·isLoggedIn()       │  │ ·stopVisionCamera()       │ │   │
│  │  │                     │  │ ·inspectVision()          │ │   │
│  │  │                     │  │ ·visionHealth()           │ │   │
│  │  └─────────────────────┘  └───────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓              ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         HTTP & Routing Layer                              │   │
│  │  ┌─────────────────────┐  ┌───────────────────────────┐ │   │
│  │  │  authGuard          │  │  Lazy Routing             │ │   │
│  │  │ (Route Protection)  │  │ (Code Splitting)          │ │   │
│  │  └─────────────────────┘  └───────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         ↓                                        │
├─────────────────────────────────────────────────────────────────┤
│              HTTP Clients & External Services                    │
│                                                                   │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │  Spring Boot Backend     │  │ Python Vision Service        │ │
│  │  (Robot Arm Control)     │  │ (FastAPI - MJPEG Stream)     │ │
│  │  http://localhost:8080   │  │ http://localhost:5050        │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
│                                                                   │
│  APIs:                          APIs:                            │
│  • /api/auth/login              • /stream (MJPEG)               │
│  • /api/auth/signup             • /api/robot/vision/inspect     │
│  • /api/robot/state             • /api/robot/vision/camera/*    │
│  • /api/robot/command           • /api/robot/vision/health      │
│  • /api/robot/reset                                              │
│  • /api/robot/history/:userId                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Layers

| Layer | Responsibility | Technologies |
|-------|---|---|
| **Presentation** | User interface, page routing | Angular Components, Standalone APIs, @if/@for |
| **Service** | Business logic, state management, API calls | RxJS, Observable streams, HttpClient |
| **Routing** | Route protection, lazy loading | Angular Router, Functional Guards |
| **Integration** | Backend communication | HttpClient, environment configs |

---

## Project Structure

```
src/
├── app/
│   ├── core/                                    ← Singleton services & guards
│   │   ├── models/
│   │   │   └── index.ts                        ← All TypeScript interfaces (DTOs)
│   │   │       • AuthResponse, LoginRequest, SignupRequest
│   │   │       • RobotState, RobotCommand, CommandResult
│   │   │       • RobotCommandRequest
│   │   │
│   │   ├── services/                           ← Application services
│   │   │   ├── auth.service.ts                 ← Authentication & session
│   │   │   └── robot.service.ts                ← Robot arm & vision control
│   │   │
│   │   └── guards/
│   │       └── auth.guard.ts                   ← Functional route guard
│   │
│   ├── pages/                                  ← Feature/page components
│   │   ├── home/
│   │   │   └── home.component.ts               ← Landing page
│   │   │
│   │   ├── login/
│   │   │   └── login.component.ts              ← User authentication
│   │   │
│   │   ├── signup/
│   │   │   └── signup.component.ts             ← User registration
│   │   │
│   │   ├── dashboard/
│   │   │   └── dashboard.component.ts          ← Robot arm control interface
│   │   │
│   │   └── vision/
│   │       └── vision-inspection.component.ts  ← Camera & vision inspection
│   │
│   ├── shared/                                 ← Reusable components
│   │   ├── components/
│   │   │   ├── navbar/                         ← Navigation header
│   │   │   └── pipes/                          ← Custom pipes
│   │   │
│   ├── app.component.ts                        ← Root component
│   ├── app.config.ts                           ← Bootstrap configuration
│   └── app.routes.ts                           ← Route definitions
│
├── environments/                               ← Environment-specific configs
│   ├── environment.ts                          ← Development
│   └── environment.prod.ts                     ← Production
│
├── assets/                                     ← Static assets
│   └── icons/
│
├── styles.css                                  ← Global styles & CSS variables
├── index.html                                  ← Root HTML
├── main.ts                                     ← Bootstrap entry point
├── angular.json                                ← Angular CLI config
├── tsconfig.json                               ← TypeScript configuration
└── package.json                                ← Dependencies & scripts
```

---

## Component Architecture

### Component Hierarchy

```
AppComponent (root)
└── RouterOutlet
    ├── HomeComponent          (route: /)
    ├── LoginComponent         (route: /login)
    ├── SignupComponent        (route: /signup)
    ├── DashboardComponent     (route: /dashboard, guarded)
    └── VisionInspectionComponent (route: /vision, guarded)
```

### Component Responsibilities

| Component | Route | Purpose | Auth Required |
|---|---|---|---|
| **HomeComponent** | `/` | Landing page, intro, links | ❌ |
| **LoginComponent** | `/login` | User authentication | ❌ |
| **SignupComponent** | `/signup` | User registration | ❌ |
| **DashboardComponent** | `/dashboard` | Robot arm control interface | ✅ |
| **VisionInspectionComponent** | `/vision` | Camera feed & defect inspection | ✅ |

### Standalone Component Pattern

All page components are **standalone** (Angular 17+ feature):
- No `NgModule` needed
- Self-contained imports
- Lazy-loaded via `loadComponent` in routes
- Improved tree-shaking and bundle size

---

## Service Layer

### AuthService

**File:** `src/app/core/services/auth.service.ts`

```typescript
public login(req: LoginRequest): Observable<AuthResponse>
public signup(req: SignupRequest): Observable<AuthResponse>
public saveSession(res: AuthResponse): void
public getSession(): { userId, username, fullName }
public isLoggedIn(): boolean
public logout(): void
```

**Responsibilities:**
- HTTP calls to `/api/auth/login` and `/api/auth/signup`
- Session storage management (userId, username, fullName)
- Login state queries
- Session cleanup on logout

**Storage:** Uses `sessionStorage` (cleared on browser close)

---

### RobotService

**File:** `src/app/core/services/robot.service.ts`

```typescript
// ── Robot Arm Control ──
public getState(): Observable<RobotState>
public sendCommand(req: RobotCommandRequest): Observable<CommandResult>
public reset(): Observable<CommandResult>
public getHistory(userId: number): Observable<RobotCommand[]>

// ── Vision Camera Control ──
public startVisionCamera(): Observable<any>
public stopVisionCamera(): Observable<any>

// ── Vision Inspection ──
public inspectVision(imageData: string): Observable<VisionResult>
public visionHealth(): Observable<VisionHealthResponse>
```

**Live Stream URL:**
```typescript
readonly streamUrl = 'http://localhost:5050/stream'
// Use directly: <img [src]="robot.streamUrl" />
// MJPEG stream served by Python FastAPI, not Spring Boot (lower latency)
```

**Responsibilities:**
- Robot arm state queries and command execution
- Vision camera lifecycle management
- Defect inspection image processing
- Health checks for vision service

---

### authGuard (Functional Guard)

**File:** `src/app/core/guards/auth.guard.ts`

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  return authService.isLoggedIn() ? true : router.navigate(['/login']);
}
```

- Protects routes: `/dashboard`, `/vision`
- Redirects to `/login` if not authenticated
- Functional (not class-based) — Angular 17+ pattern

---

## Data Flow

### Authentication Flow

```
User Input (Login Form)
    ↓
LoginComponent.login()
    ↓
AuthService.login(credentials)
    ↓
HTTP POST /api/auth/login (Spring Boot)
    ↓
AuthService.saveSession(response)
    ↓
sessionStorage updated
    ↓
Router.navigate(['/dashboard'])
    ↓
authGuard checks isLoggedIn() → true
    ↓
DashboardComponent loaded
```

### Robot Control Flow

```
User clicks "Move" button
    ↓
DashboardComponent.sendCommand()
    ↓
RobotService.sendCommand(request)
    ↓
HTTP POST /api/robot/command (Spring Boot)
    ↓
Spring Boot → Robot hardware (via serial/network)
    ↓
CommandResult response
    ↓
Component displays status/feedback
```

### Vision Inspection Flow

```
User clicks "Capture & Inspect"
    ↓
VisionInspectionComponent captures frame from <img> (MJPEG stream)
    ↓
Converts to Base64 JPEG
    ↓
RobotService.inspectVision(imageData)
    ↓
HTTP POST /api/robot/vision/inspect (Spring Boot)
    ↓
Spring Boot → Python FastAPI (vision model)
    ↓
VisionResult { isDefect, confidence, defectType }
    ↓
Component displays result
```

---

## API Integration

### Spring Boot Backend

**Base URL:** `http://localhost:8080`

| Endpoint | Method | Service Method | Purpose |
|---|---|---|---|
| `/api/auth/login` | POST | `AuthService.login()` | User authentication |
| `/api/auth/signup` | POST | `AuthService.signup()` | User registration |
| `/api/robot/state` | GET | `RobotService.getState()` | Current robot arm state |
| `/api/robot/command` | POST | `RobotService.sendCommand()` | Execute robot command |
| `/api/robot/reset` | POST | `RobotService.reset()` | Reset robot to home position |
| `/api/robot/history/:userId` | GET | `RobotService.getHistory()` | Command history |
| `/api/robot/vision/camera/start` | POST | `RobotService.startVisionCamera()` | Open USB camera |
| `/api/robot/vision/camera/stop` | POST | `RobotService.stopVisionCamera()` | Release USB camera |
| `/api/robot/vision/health` | GET | `RobotService.visionHealth()` | Vision service status |
| `/api/robot/vision/inspect` | POST | `RobotService.inspectVision()` | Run defect detection |

### Python FastAPI Backend

**Base URL:** `http://localhost:5050`

| Endpoint | Type | Purpose |
|---|---|---|
| `/stream` | MJPEG | Live camera feed (embedded in `<img>` tag) |
| `/api/robot/vision/inspect` | REST | Defect detection inference |
| `/api/robot/vision/camera/start` | REST | Camera initialization |
| `/api/robot/vision/camera/stop` | REST | Camera cleanup |
| `/api/robot/vision/health` | REST | Service health check |

**Direct Integration:** The MJPEG stream is served directly from Python (not through Spring Boot) for minimal latency.

### Request/Response Models

See `src/app/core/models/index.ts` for all DTOs:

```typescript
interface AuthResponse {
  userId: number;
  username: string;
  fullName: string;
}

interface RobotState {
  x: number; y: number; z: number;
  status: string;
  lastCommand: string;
}

interface VisionResult {
  isDefect: boolean;
  confidence: number;
  defectType?: string;
}
```

---

## Authentication & Security

### Session Management

- **Storage:** `sessionStorage` (cleared on browser close)
- **Data Stored:**
  - `userId` — unique user identifier
  - `username` — user account name
  - `fullName` — display name

### Route Protection

- All protected routes (`/dashboard`, `/vision`) use `authGuard`
- Functional guard checks `isLoggedIn()` before rendering
- Unauthorized access redirects to `/login`

### API Security

- All API calls require backend authentication (Spring Boot handles JWT/session validation)
- Frontend verifies session before making protected requests
- CORS configured on backend

---

## Technology Stack

```json
{
  "framework": "Angular 17.3.0",
  "language": "TypeScript 5.4.2",
  "runtime": "Zone.js 0.14.3",
  "http": "HttpClient (Angular)",
  "routing": "Angular Router with lazy loading",
  "state_management": "RxJS 7.8.0 (Observables)",
  "real_time": "MQTT 4.3.7 (optional), ngx-mqtt 17.0.0",
  "styling": "CSS 3 with CSS variables",
  "bundler": "esbuild (via @angular-devkit)",
  "build_system": "Angular CLI 17.3.0"
}
```

### Angular 17+ Features Used

| Feature | Purpose | Location |
|---|---|---|
| **Standalone Components** | No NgModule boilerplate | All page components |
| **@if / @for blocks** | Modern control flow syntax | Templates |
| **Signal() / computed()** | Reactive state management | Components (optional) |
| **Lazy-loaded routes** | Code splitting | `app.routes.ts` |
| **Functional guards** | Route protection | `auth.guard.ts` |
| **provideHttpClient()** | DI for HTTP | `app.config.ts` |
| **provideRouter()** | DI for routing | `app.config.ts` |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ & npm 9+
- **Angular CLI** 17+
- **Spring Boot** running on `http://localhost:8080`
- **Python FastAPI** running on `http://localhost:5050` (for vision)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm start
# → http://localhost:4200

# 3. Ensure backends are running
# Spring Boot: http://localhost:8080
# Python Vision: http://localhost:5050
```

### Available Commands

```bash
npm start          # Development server (ng serve)
npm run build      # Production build
npm run watch      # Watch mode (ng build --watch)
ng generate component path/name  # Generate component
ng generate service path/name    # Generate service
```

---

## Configuration

### Development Environment

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  visionApiUrl: 'http://localhost:5050/api',
  visionStreamUrl: 'http://localhost:5050/stream'
};
```

### Production Environment

Edit `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api',
  visionApiUrl: 'https://your-domain.com/vision/api',
  visionStreamUrl: 'https://your-domain.com/vision/stream'
};
```

### Build with Environment

```bash
# Development (default)
npm start

# Production
npm run build
# Output: dist/robotarm_angular/

# Custom environment
ng build --configuration production
```

---

## Deployment

### Docker Build

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist /app/dist
RUN npm install -g serve
EXPOSE 4200
CMD ["serve", "-s", "dist/robotarm_angular", "-l", "4200"]
```

### Deploy Steps

1. Update API URLs in `environment.prod.ts`
2. Build: `npm run build`
3. Deploy `dist/robotarm_angular/` to your server
4. Ensure Spring Boot & Python backends are accessible from production URLs
5. Configure CORS on backends if necessary

---

## Directory Conventions

- **core/** — Singletons, guards, models (loaded once)
- **pages/** — Route components (lazy-loaded)
- **shared/** — Reusable components & pipes
- **assets/** — Static files (icons, images, etc.)
- **environments/** — Environment-specific configs

---

## Common Tasks

### Adding a New Page

1. Create component: `ng generate component pages/mypage`
2. Add route in `app.routes.ts`:
   ```typescript
   { path: 'mypage', loadComponent: () => import('./pages/mypage/mypage.component').then(m => m.MypageComponent) }
   ```
3. Add navigation in navbar

### Adding a New Service

1. Create service: `ng generate service core/services/myservice`
2. Use `@Injectable({ providedIn: 'root' })` for singleton
3. Import in components

### Protecting a Route

Add `canActivate: [authGuard]` to the route definition:
```typescript
{ path: 'protected', canActivate: [authGuard], loadComponent: ... }
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| **404 on API calls** | Verify Spring Boot is running on `http://localhost:8080` |
| **Vision stream not loading** | Check Python FastAPI on `http://localhost:5050/stream` |
| **Guards not protecting routes** | Ensure `authGuard` is applied to route and `isLoggedIn()` works |
| **Module not found errors** | Run `npm install` and restart dev server |
| **CORS errors** | Configure CORS on Spring Boot backend |

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
