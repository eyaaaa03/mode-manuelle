import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RobotCommandRequest, RobotState, CommandResult, RobotCommand } from '../models';

// ── DTOs ─────────────────────────────────────────────────────────────────────
export interface VisionResult {
  isDefect:    boolean;
  confidence:  number;
  defectType?: string;
}

export interface SavePresetResponse {
  presetId:  number;
  name:      string;
  createdAt: string;
}

export interface PresetInfo {
  presetId:  number;
  name:      string;
  createdAt: string;
}

export interface VisionHealthResponse {
  status:      string;
  camera_open: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class RobotService {

  private api       = 'http://localhost:8080/api/robot';
  private visionApi = 'http://localhost:8080/api/robot/vision';

  /**
   * Direct MJPEG stream URL from the Python FastAPI service.
   * Use this as the [src] of an <img> tag — the browser handles the stream
   * natively without going through Spring Boot, eliminating extra latency.
   *
   * Usage in template:
   *   <img [src]="robot.streamUrl" />
   */
  readonly streamUrl = 'http://localhost:5050/stream';

  constructor(private http: HttpClient) {}

  // ── Robot arm ──────────────────────────────────────────────────────────────
  getState(): Observable<RobotState> {
    return this.http.get<RobotState>(`${this.api}/state`);
  }

  sendCommand(req: RobotCommandRequest): Observable<CommandResult> {
    return this.http.post<CommandResult>(`${this.api}/command`, req);
  }

  reset(): Observable<CommandResult> {
    return this.http.post<CommandResult>(`${this.api}/reset`, {});
  }

  getHistory(userId: number): Observable<RobotCommand[]> {
    return this.http.get<RobotCommand[]>(`${this.api}/history/${userId}`);
  }

  // ── Vision — camera lifecycle ──────────────────────────────────────────────

  /**
   * Tell Spring Boot (→ Python) to open the USB camera.
   * Call this when the user clicks "START CAMERA".
   */
  startVisionCamera(): Observable<any> {
    return this.http.post<any>(`${this.visionApi}/camera/start`, {});
  }

  /**
   * Tell Spring Boot (→ Python) to release the USB camera.
   * Call this when the user clicks "STOP".
   */
  stopVisionCamera(): Observable<any> {
    return this.http.post<any>(`${this.visionApi}/camera/stop`, {});
  }

  /** Check Python vision service health */
  visionHealth(): Observable<VisionHealthResponse> {
    return this.http.get<VisionHealthResponse>(`${this.visionApi}/health`);
  }

  // ── Vision — inspection ───────────────────────────────────────────────────

  /**
   * Send a captured JPEG frame (base64) to Spring Boot → Python for inspection.
   * Returns { isDefect, confidence, defectType }.
   */
  inspectVision(imageData: string): Observable<VisionResult> {
    return this.http.post<VisionResult>(
      `${this.visionApi}/inspect`,
      { image: imageData }
    );
  }

  // ── Vision — presets ──────────────────────────────────────────────────────

  /** Save current camera frame as a named preset in the DB */
  savePreset(imageData: string, name: string, userId: number): Observable<SavePresetResponse> {
    return this.http.post<SavePresetResponse>(`${this.visionApi}/preset`, {
      image:  imageData,
      name,
      userId,
    });
  }

  /** List all presets saved by this user */
  getPresets(userId: number): Observable<PresetInfo[]> {
    return this.http.get<PresetInfo[]>(`${this.visionApi}/presets`, {
      params: { userId: userId.toString() },
    });
  }
}