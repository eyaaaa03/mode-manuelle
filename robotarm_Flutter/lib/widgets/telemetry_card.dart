import 'package:flutter/material.dart';
import '../models/robot_state.dart';

class TelemetryPanel extends StatelessWidget {
  final RobotState robotState;

  const TelemetryPanel({super.key, required this.robotState});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(color: const Color(0xFF00FFE7).withOpacity(0.12)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildPanelTitle('// TELEMETRY'),
          const SizedBox(height: 20),
          Expanded(
            child: ListView(
              children: [
                _buildTelemetryCard(
                  label: 'BASE ANGLE',
                  value: robotState.base,
                  unit: 'DEG',
                  maxValue: 180,
                  color: const Color(0xFF00FFE7),
                ),
                const SizedBox(height: 16),
                _buildTelemetryCard(
                  label: 'SHOULDER ANGLE',
                  value: robotState.shoulder,
                  unit: 'DEG',
                  maxValue: 180,
                  color: const Color(0xFF00FFE7),
                ),
                const SizedBox(height: 16),
                _buildTelemetryCard(
                  label: 'ELBOW ANGLE',
                  value: robotState.elbow,
                  unit: 'DEG',
                  maxValue: 180,
                  color: const Color(0xFF00FFE7),
                ),
                const SizedBox(height: 16),
                _buildTelemetryCard(
                  label: 'GRIPPER POSITION',
                  value: robotState.gripper,
                  unit: 'DEG',
                  maxValue: 90,
                  color: const Color(0xFFFF6B35),
                ),
                const SizedBox(height: 24),
                _buildStatusCard(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPanelTitle(String title) {
    return Row(
      children: [
        Text(
          title,
          style: const TextStyle(
            fontFamily: 'Orbitron',
            fontSize: 10,
            letterSpacing: 3,
            color: Color(0xFF00FFE7),
          ),
        ),
        Expanded(
          child: Container(
            height: 1,
            margin: const EdgeInsets.only(left: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF00FFE7).withOpacity(0.3),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTelemetryCard({
    required String label,
    required int value,
    required String unit,
    required int maxValue,
    required Color color,
  }) {
    final percentage = (value / maxValue) * 100;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: color.withOpacity(0.2)),
        color: color.withOpacity(0.03),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              letterSpacing: 3,
              color: Color(0xFFC8E6E3),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                value.toString().padLeft(3, '0'),
                style: TextStyle(
                  fontFamily: 'Share Tech Mono',
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: color,
                  shadows: [Shadow(color: color.withOpacity(0.5), blurRadius: 10)],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                unit,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFFC8E6E3),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: percentage / 100,
              backgroundColor: color.withOpacity(0.1),
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFFF6B35).withOpacity(0.2)),
        color: const Color(0xFFFF6B35).withOpacity(0.03),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'SYSTEM STATUS',
            style: TextStyle(
              fontSize: 10,
              letterSpacing: 3,
              color: Color(0xFFC8E6E3),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: Color(0xFF00FFE7),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'READY',
                style: TextStyle(
                  fontFamily: 'Share Tech Mono',
                  fontSize: 14,
                  color: Color(0xFF00FFE7),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}