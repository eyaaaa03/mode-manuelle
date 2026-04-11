import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RobotCommandRequest, RobotState, CommandResult, RobotCommand } from '../models';

interface VisionResult {
  isDefect: boolean;
  confidence: number;
  defectType?: string;
}

@Injectable({ providedIn: 'root' })
export class RobotService {
  private api = 'http://localhost:8080/api/robot';

  constructor(private http: HttpClient) {}

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

  inspectVision(imageData: string): Observable<VisionResult> {
    return this.http.post<VisionResult>(`${this.api}/vision/inspect`, { image: imageData });
  }

}
