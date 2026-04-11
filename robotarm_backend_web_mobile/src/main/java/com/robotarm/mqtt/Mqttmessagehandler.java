package com.robotarm.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.robotarm.config.Mqttgateway;
import com.robotarm.dto.RobotCommandRequest;
import com.robotarm.service.RobotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Handles all incoming MQTT messages.
 *
 * Subscribes to:
 *   robot/arm/command  — move the arm to given angles
 *   robot/arm/reset    — reset arm to home position
 *
 * Publishes back to:
 *   robot/arm/status   — result / ack after processing
 *   robot/arm/angles   — current joint angles
 */
@Component
public class Mqttmessagehandler {

    @Autowired
    private RobotService robotService;

    @Autowired
    private Mqttgateway mqttGateway;

    @Value("${mqtt.topic.command}")
    private String commandTopic;

    @Value("${mqtt.topic.reset}")
    private String resetTopic;

    @Value("${mqtt.topic.status}")
    private String statusTopic;

    @Value("${mqtt.topic.angles}")
    private String anglesTopic;

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Entry point for all inbound MQTT messages.
     * Routed from mqttInboundChannel by MqttConfig.
     */
    @ServiceActivator(inputChannel = "mqttInboundChannel")
    public void handleMessage(Message<?> message) {
        String topic   = (String) message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC);
        String payload = message.getPayload().toString();

        System.out.println("[MQTT] ← RECV | Topic: " + topic + " | Payload: " + payload);

        try {
            if (commandTopic.equals(topic)) {
                handleCommandMessage(payload);
            } else if (resetTopic.equals(topic)) {
                handleResetMessage();
            } else {
                System.out.println("[MQTT] Unknown topic: " + topic);
            }
        } catch (Exception e) {
            System.err.println("[MQTT] Error processing message: " + e.getMessage());
            publishStatus("ERROR", e.getMessage(), null);
        }
    }

    // ─────────────────────────────────────────────────────────
    // Handle: robot/arm/command
    //
    // Expected JSON payload:
    // {
    //   "base": 90,
    //   "shoulder": 45,
    //   "elbow": 120,
    //   "gripper": 60,
    //   "commandName": "PICK",   // optional
    //   "userId": 1              // optional
    // }
    // ─────────────────────────────────────────────────────────
    private void handleCommandMessage(String payload) throws Exception {
        JsonNode json = mapper.readTree(payload);

        RobotCommandRequest req = new RobotCommandRequest();
        req.setBaseAngle(    getInt(json, "base",     90));
        req.setShoulderAngle(getInt(json, "shoulder", 90));
        req.setElbowAngle(   getInt(json, "elbow",    90));
        req.setGripperAngle( getInt(json, "gripper",   0));
        req.setCommandName(  json.has("commandName") ? json.get("commandName").asText() : "MQTT Command");

        if (json.has("userId") && !json.get("userId").isNull()) {
            req.setUserId(json.get("userId").asLong());
        }

        Map<String, Object> result = robotService.executeCommand(req);

        // Publish ACK status back
        publishStatus("OK", "Command executed", result);

        // Publish current angles
        publishAngles(
                req.getBaseAngle(),
                req.getShoulderAngle(),
                req.getElbowAngle(),
                req.getGripperAngle()
        );

        System.out.printf("[MQTT] ✓ Command executed → B:%d° S:%d° E:%d° G:%d°%n",
                req.getBaseAngle(), req.getShoulderAngle(),
                req.getElbowAngle(), req.getGripperAngle());
    }

    // ─────────────────────────────────────────────────────────
    // Handle: robot/arm/reset
    // Any payload (or empty) triggers a reset to home
    // ─────────────────────────────────────────────────────────
    private void handleResetMessage() {
        robotService.resetPosition();
        publishStatus("OK", "Arm reset to home position", null);
        publishAngles(90, 90, 90, 0);
        System.out.println("[MQTT] ✓ Arm reset to home");
    }

    // ─────────────────────────────────────────────────────────
    // Publish helpers
    // ─────────────────────────────────────────────────────────

    private void publishStatus(String status, String message, Map<String, Object> extra) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"status\":\"").append(status).append("\"");
            sb.append(",\"message\":\"").append(message).append("\"");
            sb.append(",\"timestamp\":").append(System.currentTimeMillis());
            if (extra != null) {
                extra.forEach((k, v) -> {
                    if (!k.equals("success") && !k.equals("message")) {
                        sb.append(",\"").append(k).append("\":").append(v);
                    }
                });
            }
            sb.append("}");
            mqttGateway.publish(statusTopic, sb.toString());
            System.out.println("[MQTT] → PUB | Topic: " + statusTopic + " | " + sb);
        } catch (Exception e) {
            System.err.println("[MQTT] Failed to publish status: " + e.getMessage());
        }
    }

    private void publishAngles(int base, int shoulder, int elbow, int gripper) {
        try {
            String json = String.format(
                    "{\"base\":%d,\"shoulder\":%d,\"elbow\":%d,\"gripper\":%d,\"timestamp\":%d}",
                    base, shoulder, elbow, gripper, System.currentTimeMillis()
            );
            mqttGateway.publish(anglesTopic, json);
            System.out.println("[MQTT] → PUB | Topic: " + anglesTopic + " | " + json);
        } catch (Exception e) {
            System.err.println("[MQTT] Failed to publish angles: " + e.getMessage());
        }
    }

    private int getInt(JsonNode node, String field, int defaultVal) {
        return node.has(field) ? node.get(field).asInt() : defaultVal;
    }
}