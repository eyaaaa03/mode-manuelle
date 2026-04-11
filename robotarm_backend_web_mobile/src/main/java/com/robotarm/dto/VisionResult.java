package com.robotarm.dto;

public class VisionResult {
    private boolean isDefect;
    private int confidence;
    private String defectType;

    // Constructors
    public VisionResult() {}

    public VisionResult(boolean isDefect, int confidence, String defectType) {
        this.isDefect = isDefect;
        this.confidence = confidence;
        this.defectType = defectType;
    }

    // Getters and Setters
    public boolean isDefect() { return isDefect; }
    public void setDefect(boolean isDefect) { this.isDefect = isDefect; }

    public int getConfidence() { return confidence; }
    public void setConfidence(int confidence) { this.confidence = confidence; }

    public String getDefectType() { return defectType; }
    public void setDefectType(String defectType) { this.defectType = defectType; }
}
