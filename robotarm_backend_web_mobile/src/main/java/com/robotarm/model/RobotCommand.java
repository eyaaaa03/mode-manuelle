package com.robotarm.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "robot_commands")
public class RobotCommand {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "base_angle")
    private int baseAngle = 90;

    @Column(name = "shoulder_angle")
    private int shoulderAngle = 90;

    @Column(name = "elbow_angle")
    private int elbowAngle = 90;

    @Column(name = "gripper_angle")
    private int gripperAngle = 0;

    @Column(name = "command_name")
    private String commandName;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
