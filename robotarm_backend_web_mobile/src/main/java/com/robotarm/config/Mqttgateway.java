package com.robotarm.config;

import org.springframework.integration.annotation.MessagingGateway;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.handler.annotation.Header;

/**
 * Gateway interface for publishing MQTT messages from Spring beans.
 *
 * Usage:
 *   mqttGateway.publish("robot/arm/status", "{\"status\":\"READY\"}");
 *   mqttGateway.publish("robot/arm/angles", jsonPayload);
 */
@MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
public interface Mqttgateway {

    /**
     * Publish a message to a specific MQTT topic.
     *
     * @param topic   the MQTT topic to publish to
     * @param payload the message payload (String / JSON)
     */
    void publish(
            @Header(MqttHeaders.TOPIC) String topic,
            String payload
    );
}