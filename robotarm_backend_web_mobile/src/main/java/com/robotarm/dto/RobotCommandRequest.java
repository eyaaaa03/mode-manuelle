package com.robotarm.dto;

public class RobotCommandRequest {
    private Long userId;
    private int baseAngle;
    private int shoulderAngle;
    private int elbowAngle;
    private int gripperAngle;
    private String commandName;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public int getBaseAngle() { return baseAngle; }
    public void setBaseAngle(int baseAngle) { this.baseAngle = baseAngle; }
    public int getShoulderAngle() { return shoulderAngle; }
    public void setShoulderAngle(int shoulderAngle) { this.shoulderAngle = shoulderAngle; }
    public int getElbowAngle() { return elbowAngle; }
    public void setElbowAngle(int elbowAngle) { this.elbowAngle = elbowAngle; }
    public int getGripperAngle() { return gripperAngle; }
    public void setGripperAngle(int gripperAngle) { this.gripperAngle = gripperAngle; }
    public String getCommandName() { return commandName; }
    public void setCommandName(String commandName) { this.commandName = commandName; }
}
