// auth.model.ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  userId?: number;
  username?: string;
  fullName?: string;
}

// robot.model.ts
export interface RobotCommandRequest {
  userId: number | null;
  baseAngle: number;
  shoulderAngle: number;
  elbowAngle: number;
  gripperAngle: number;
  commandName: string;
}

export interface RobotState {
  base: number;
  shoulder: number;
  elbow: number;
  gripper: number;
  status: string;
}

export interface RobotCommand {
  id: number;
  baseAngle: number;
  shoulderAngle: number;
  elbowAngle: number;
  gripperAngle: number;
  commandName: string;
  createdAt: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  base: number;
  shoulder: number;
  elbow: number;
  gripper: number;
}

export interface HistoryEntry {
  name: string;
  time: string;
  base: number;
  shoulder: number;
  elbow: number;
  gripper: number;
}
