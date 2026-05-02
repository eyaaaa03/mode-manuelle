package com.robotarm.repository;

import com.robotarm.model.VisionPreset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VisionPresetRepository extends JpaRepository<VisionPreset, Long> {
    List<VisionPreset> findByUserIdOrderByCreatedAtDesc(Long userId);
}