package com.robotarm.mqtt;

import com.robotarm.config.Mqttgateway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service that wraps MqttGateway for easy MQTT publishing
 * from anywhere in the application (controllers, services, etc.)
 */
@Service
public class Mqttpublishservice {

    @Autowired
    private Mqttgateway mqttGateway;

    @Value("${mqtt.topic.status}")
    private String statusTopic;

    @Value("${mqtt.topic.angles}")
    private String anglesTopic;

    /**
     * Publish current arm angles to robot/arm/angles
     */
    public void publishAngles(int base, int shoulder, int elbow, int gripper) {
        String payload = String.format(
                "{\"base\":%d,\"shoulder\":%d,\"elbow\":%d,\"gripper\":%d,\"timestamp\":%d}",
                base, shoulder, elbow, gripper, System.currentTimeMillis()
        );
        publish(anglesTopic, payload);
    }

    /**
     * Publish a status message to robot/arm/status
     */
    public void publishStatus(String status, String message) {
        String payload = String.format(
                "{\"status\":\"%s\",\"message\":\"%s\",\"timestamp\":%d}",
                status, message, System.currentTimeMillis()
        );
        publish(statusTopic, payload);
    }

    /**
     * Publish to any custom topic
     */
    public void publish(String topic, String payload) {
        try {
            mqttGateway.publish(topic, payload);
            System.out.println("[MQTT] → PUB | " + topic + " | " + payload);
        } catch (Exception e) {
            System.err.println("[MQTT] Publish failed on topic [" + topic + "]: " + e.getMessage());
        }
    }
}