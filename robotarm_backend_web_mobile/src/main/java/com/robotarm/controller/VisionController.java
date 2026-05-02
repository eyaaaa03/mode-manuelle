
package com.robotarm.controller;
import jakarta.servlet.http.HttpServletResponse;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.robotarm.dto.VisionResult;
import com.robotarm.model.VisionPreset;
import com.robotarm.repository.VisionPresetRepository;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * VisionController
 * ─────────────────
 * Delegates all vision work to the Python FastAPI service at localhost:5050.
 * No more subprocess / ProcessBuilder — cleaner, faster, no Windows path issues.
 *
 * Python service must be running:
 *   uvicorn vision_bridge_fastapi:app --host 0.0.0.0 --port 5050
 */
@RestController
@RequestMapping("/api/robot/vision")
@CrossOrigin(origins = "http://localhost:4200")
public class VisionController {

    // ── Python FastAPI base URL ──────────────────────────────────────────────
    private static final String PYTHON_BASE = "http://localhost:5050";

    private final VisionPresetRepository presetRepo;
    private final RestTemplate           restTemplate = new RestTemplate();
    private final ObjectMapper           mapper       = new ObjectMapper();

    public VisionController(VisionPresetRepository presetRepo) {
        this.presetRepo = presetRepo;
    }

    // ── 1. START CAMERA ──────────────────────────────────────────────────────
    // POST /api/robot/vision/camera/start
    @PostMapping("/camera/start")
    public ResponseEntity<?> startCamera() {
        try {
            ResponseEntity<String> resp = restTemplate.postForEntity(
                    PYTHON_BASE + "/camera/start", null, String.class);
            System.out.println("[VISION] Camera start → " + resp.getBody());
            return ResponseEntity.ok(resp.getBody());
        } catch (Exception e) {
            System.err.println("[VISION] Camera start error: " + e.getMessage());
            return ResponseEntity.status(503)
                    .body("Python vision service unavailable. Start it with: " +
                            "uvicorn vision_bridge_fastapi:app --port 5050");
        }
    }

    // ── 2. STOP CAMERA ───────────────────────────────────────────────────────
    // POST /api/robot/vision/camera/stop
    @PostMapping("/camera/stop")
    public ResponseEntity<?> stopCamera() {
        try {
            ResponseEntity<String> resp = restTemplate.postForEntity(
                    PYTHON_BASE + "/camera/stop", null, String.class);
            return ResponseEntity.ok(resp.getBody());
        } catch (Exception e) {
            System.err.println("[VISION] Camera stop error: " + e.getMessage());
            return ResponseEntity.ok(Map.of("status", "stopped")); // best-effort
        }
    }


    // ── 3. INSPECT (SCAN NOW) ────────────────────────────────────────────────
    // POST /api/robot/vision/inspect
    // Body: { "image": "<base64>" }
    @PostMapping("/inspect")
    public ResponseEntity<?> inspectImage(@RequestBody VisionInspectRequest request) {
        try {
            // Forward the base64 image to the Python FastAPI /inspect endpoint
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("image", request.getImage());
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<VisionResult> response = restTemplate.exchange(
                    PYTHON_BASE + "/inspect",
                    HttpMethod.POST,
                    entity,
                    VisionResult.class
            );

            VisionResult result = response.getBody();
            if (result == null) {
                throw new RuntimeException("Empty response from Python service");
            }

            System.out.printf("[VISION] Inspect → %s | conf=%.1f%% | %s%n",
                    result.isDefect() ? "DEFECT" : "OK",
                    result.getConfidence(),
                    result.getDefectType() != null ? result.getDefectType() : "-");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("[VISION] Inspect error: " + e.getMessage());

            // Return a safe error result — never crash the Angular dashboard
            VisionResult err = new VisionResult(false, 0, "SERVICE_UNAVAILABLE");
            return ResponseEntity.ok(err);
        }
    }

    // ── 4. SAVE PRESET ───────────────────────────────────────────────────────
    // POST /api/robot/vision/preset
    // Body: { "image": "<base64>", "name": "Preset 1", "userId": 1 }
    @PostMapping("/preset")
    public ResponseEntity<?> savePreset(@RequestBody SavePresetRequest req) {
        try {
            VisionPreset preset = new VisionPreset();
            preset.setName(req.getName() != null ? req.getName() : "Preset");
            preset.setUserId(req.getUserId());
            preset.setImageData(req.getImage());

            VisionPreset saved = presetRepo.save(preset);

            System.out.println("[VISION] Preset saved — ID: " + saved.getId()
                    + " | Name: " + saved.getName());

            Map<String, Object> resp = new HashMap<>();
            resp.put("presetId",  saved.getId());
            resp.put("name",      saved.getName());
            resp.put("createdAt", saved.getCreatedAt().toString());
            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            System.err.println("[VISION] Save preset error: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body("Failed to save preset: " + e.getMessage());
        }
    }

    // ── 5. GET PRESETS ───────────────────────────────────────────────────────
    // GET /api/robot/vision/presets?userId=1
    @GetMapping("/presets")
    public ResponseEntity<?> getPresets(@RequestParam Long userId) {
        List<VisionPreset> presets =
                presetRepo.findByUserIdOrderByCreatedAtDesc(userId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (VisionPreset p : presets) {
            Map<String, Object> item = new HashMap<>();
            item.put("presetId",  p.getId());
            item.put("name",      p.getName());
            item.put("createdAt", p.getCreatedAt().toString());
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    // ── 6. HEALTH CHECK (proxy to Python) ───────────────────────────────────
    // GET /api/robot/vision/health
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        try {
            ResponseEntity<String> resp = restTemplate.getForEntity(
                    PYTHON_BASE + "/health", String.class);
            return ResponseEntity.ok(resp.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(503)
                    .body(Map.of("status", "unavailable", "error", e.getMessage()));
        }
    }
    // ── 7. MJPEG STREAM PROXY ────────────────────────────────────────────────────
// GET /api/robot/vision/stream
    @GetMapping("/stream")
    public void proxyStream(HttpServletResponse response) {
        response.setContentType("multipart/x-mixed-replace; boundary=frame");
        response.setHeader("Cache-Control", "no-cache, no-store");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Connection", "keep-alive");

        try {
            URL url = new URL(PYTHON_BASE + "/stream");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(0);  // no timeout — stream runs indefinitely
            conn.connect();

            InputStream  in  = conn.getInputStream();
            OutputStream out = response.getOutputStream();
            byte[] buf = new byte[4096];
            int    len;
            while ((len = in.read(buf)) != -1) {
                out.write(buf, 0, len);
                out.flush();
            }
        } catch (Exception e) {
            System.err.println("[VISION] Stream proxy closed: " + e.getMessage());
        }
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────
    public static class VisionInspectRequest {
        private String image;
        public String getImage()           { return image; }
        public void   setImage(String img) { this.image = img; }
    }

    public static class SavePresetRequest {
        private String image;
        private String name;
        private Long   userId;
        public String getImage()             { return image; }
        public void   setImage(String image) { this.image = image; }
        public String getName()              { return name; }
        public void   setName(String name)   { this.name = name; }
        public Long   getUserId()            { return userId; }
        public void   setUserId(Long userId) { this.userId = userId; }
    }
}