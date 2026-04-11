package com.robotarm.controller;

import com.robotarm.dto.RobotCommandRequest;
import com.robotarm.model.RobotCommand;
import com.robotarm.service.RobotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/robot")
@CrossOrigin(originPatterns = "*")
public class RobotController {

    @Autowired
    private RobotService robotService;

    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getCurrentState() {
        return ResponseEntity.ok(robotService.getCurrentState());
    }

    @PostMapping("/command")
    public ResponseEntity<Map<String, Object>> executeCommand(@RequestBody RobotCommandRequest request) {
        return ResponseEntity.ok(robotService.executeCommand(request));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        return ResponseEntity.ok(robotService.resetPosition());
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<RobotCommand>> getHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(robotService.getCommandHistory(userId));
    }
}
