package com.robotarm.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vision_presets")
public class VisionPreset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "user_id")
    private Long userId;

    // Store image as base64 string in TEXT column
    @Column(name = "image_data", columnDefinition = "TEXT")
    private String imageData;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────
    public Long getId()                    { return id; }
    public void setId(Long id)             { this.id = id; }

    public String getName()                { return name; }
    public void setName(String name)       { this.name = name; }

    public LocalDateTime getCreatedAt()    { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getUserId()                { return userId; }
    public void setUserId(Long userId)     { this.userId = userId; }

    public String getImageData()           { return imageData; }
    public void setImageData(String imageData) { this.imageData = imageData; }
}