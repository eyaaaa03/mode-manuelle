package com.robotarm.service;

import com.robotarm.dto.RobotCommandRequest;
import com.robotarm.model.RobotCommand;
import com.robotarm.mqtt.Mqttpublishservice;
import com.robotarm.repository.RobotCommandRepository;
import com.robotarm.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RobotService {

    @Autowired
    private RobotCommandRepository commandRepository;

    @Autowired
    private UserRepository userRepository;

    // @Lazy avoids circular dependency between RobotService <-> MqttPublishService
    @Autowired
    @Lazy
    private Mqttpublishservice mqttPublishService;

    // In-memory current arm state
    private int currentBase     = 0




































































            ;
    private int currentShoulder = 90;
    private int currentElbow    = 90;
    private int currentGripper  = 0;

    public Map<String, Object> getCurrentState() {
        Map<String, Object> state = new HashMap<>();
        state.put("base",     currentBase);
        state.put("shoulder", currentShoulder);
        state.put("elbow",    currentElbow);
        state.put("gripper",  currentGripper);
        state.put("status",   "READY");
        return state;
    }

    public Map<String, Object> executeCommand(RobotCommandRequest request) {
        int base     = clamp(request.getBaseAngle(),     0, 180);
        int shoulder = clamp(request.getShoulderAngle(), 0, 180);
        int elbow    = clamp(request.getElbowAngle(),    0, 180);
        int gripper  = clamp(request.getGripperAngle(),  0, 90);

        currentBase = base; currentShoulder = shoulder;
        currentElbow = elbow; currentGripper = gripper;

        if (request.getUserId() != null) {
            userRepository.findById(request.getUserId()).ifPresent(user -> {
                RobotCommand cmd = new RobotCommand();
                cmd.setUser(user);
                cmd.setBaseAngle(base);
                cmd.setShoulderAngle(shoulder);
                cmd.setElbowAngle(elbow);
                cmd.setGripperAngle(gripper);
                cmd.setCommandName(request.getCommandName() != null ? request.getCommandName() : "Manual Command");
                commandRepository.save(cmd);
            });
        }

        // Publish to MQTT so physical robot receives angles
        tryPublishAngles(base, shoulder, elbow, gripper);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("base", base); result.put("shoulder", shoulder);
        result.put("elbow", elbow); result.put("gripper", gripper);
        result.put("message", "Command executed successfully");
        return result;
    }

    public Map<String, Object> resetPosition() {
        currentBase = 90; currentShoulder = 90;
        currentElbow = 90; currentGripper = 0;

        tryPublishAngles(90, 90, 90, 0);
        tryPublishStatus("RESET", "Arm reset to home position");

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Robot arm reset to home position");
        result.put("base", 90); result.put("shoulder", 90);
        result.put("elbow", 90); result.put("gripper", 0);
        return result;
    }

    public List<RobotCommand> getCommandHistory(Long userId) {
        return commandRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId);
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private void tryPublishAngles(int base, int shoulder, int elbow, int gripper) {
        try { mqttPublishService.publishAngles(base, shoulder, elbow, gripper); }
        catch (Exception e) { System.err.println("[RobotService] MQTT skipped: " + e.getMessage()); }
    }

    private void tryPublishStatus(String status, String message) {
        try { mqttPublishService.publishStatus(status, message); }
        catch (Exception e) { System.err.println("[RobotService] MQTT status skipped: " + e.getMessage()); }
    }
}