package com.robotarm.controller;

import com.robotarm.dto.VisionResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Base64;

@RestController
@RequestMapping("/api/robot/vision")
@CrossOrigin(origins = "http://localhost:4200")
public class VisionController {

    /**
     * Receive image from Angular frontend for defect inspection
     * Frontend sends: { image: "<base64-jpeg>" }
     * Returns: { isDefect: boolean, confidence: 0-100, defectType: string }
     */
    @PostMapping("/inspect")
    public ResponseEntity<?> inspectImage(@RequestBody VisionInspectRequest request) {
        try {
            String base64Image = request.getImage();

            // Decode base64 to bytes
            byte[] imageBytes = Base64.getDecoder().decode(base64Image.split(",")[1]);

            // TODO: Pass imageBytes to your AI/ML vision service
            // For now, return a mock result
            VisionResult result = processImage(imageBytes);

            System.out.println("[VISION] Inspection result: " + (result.isDefect() ? "DEFECT" : "OK")
                    + " - Confidence: " + result.getConfidence() + "%");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("[VISION] Error processing image: " + e.getMessage());
            return ResponseEntity.badRequest().body(new VisionResult(false, 0, null));
        }
    }

    /**
     * Mock vision processing - replace with your actual AI model
     */
    private VisionResult processImage(byte[] imageBytes) {
        // TODO: Replace this with actual vision inspection logic

        // Mock example:
        boolean hasDefect = Math.random() > 0.7;  // 30% defect rate
        int confidence = 80 + (int)(Math.random() * 20);  // 80-100%

        String[] defectTypes = {"SCRATCH", "CRACK", "DENT", "MISALIGNMENT", "CORROSION"};
        String defectType = hasDefect ? defectTypes[(int)(Math.random() * defectTypes.length)] : null;

        return new VisionResult(hasDefect, confidence, defectType);
    }

    /**
     * Request DTO for receiving images from frontend
     */
    public static class VisionInspectRequest {
        private String image;  // base64 encoded image

        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }
    }
}
