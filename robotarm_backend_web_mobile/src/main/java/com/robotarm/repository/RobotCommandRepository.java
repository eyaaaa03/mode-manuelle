package com.robotarm.repository;

import com.robotarm.model.RobotCommand;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RobotCommandRepository extends JpaRepository<RobotCommand, Long> {
    List<RobotCommand> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<RobotCommand> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
}
