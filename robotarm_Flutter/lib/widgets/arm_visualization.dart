import 'package:flutter/material.dart';
import '../models/robot_state.dart';

class ArmVisualization extends StatelessWidget {
  final RobotState robotState;

  const ArmVisualization({super.key, required this.robotState});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          _buildPanelTitle('// ARM VISUALIZATION'),
          const SizedBox(height: 20),
          Expanded(
            child: CustomPaint(
              painter: ArmPainter(
                baseAngle: robotState.base,
                shoulderAngle: robotState.shoulder,
                elbowAngle: robotState.elbow,
                gripperAngle: robotState.gripper,
              ),
              size: Size.infinite,
            ),
          ),
          const SizedBox(height: 16),
          _buildStatusRow(),
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
            color: Color(0xFF1E40AF),
          ),
        ),
        Expanded(
          child: Container(
            height: 1,
            margin: const EdgeInsets.only(left: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF1E40AF).withOpacity(0.3),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusRow() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF1E40AF).withOpacity(0.12)),
      ),
      child: Row(
        children: [
          _buildStatusItem('BASE', '${robotState.base}°'),
          _buildStatusItem('SHOULDER', '${robotState.shoulder}°'),
          _buildStatusItem('ELBOW', '${robotState.elbow}°'),
          _buildStatusItem('GRIPPER', '${robotState.gripper}°', color: const Color(0xFFDC2626)),
        ],
      ),
    );
  }

  Widget _buildStatusItem(String label, String value, {Color color = const Color(0xFF1E40AF)}) {
    return Expanded(
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              letterSpacing: 2,
              color: Color(0x991F2937),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Share Tech Mono',
              fontSize: 14,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class ArmPainter extends CustomPainter {
  final int baseAngle;
  final int shoulderAngle;
  final int elbowAngle;
  final int gripperAngle;

  ArmPainter({
    required this.baseAngle,
    required this.shoulderAngle,
    required this.elbowAngle,
    required this.gripperAngle,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height - 60;

    // Base
    final basePaint = Paint()
      ..color = const Color(0xFF1E40AF).withOpacity(0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawCircle(Offset(centerX, centerY), 20, basePaint);
    canvas.drawCircle(Offset(centerX, centerY), 8, Paint()..color = const Color(0xFF1E40AF).withOpacity(0.3));

    // Calculate arm positions based on angles
    final baseRad = (baseAngle - 90) * 3.14159 / 180;
    final shoulderRad = (shoulderAngle - 90) * 3.14159 / 180;
    final elbowRad = (elbowAngle - 90) * 3.14159 / 180;

    // Shoulder point
    final shoulderX = centerX + 40 * baseRad;
    final shoulderY = centerY - 60;

    // Elbow point
    final elbowX = shoulderX + 50 * shoulderRad;
    final elbowY = shoulderY - 50;

    // Wrist point
    final wristX = elbowX + 40 * elbowRad;
    final wristY = elbowY - 40;

    // Draw arm segments
    final armPaint = Paint()
      ..color = const Color(0xFF1E40AF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;

    canvas.drawLine(Offset(centerX, centerY), Offset(shoulderX, shoulderY), armPaint);
    canvas.drawLine(Offset(shoulderX, shoulderY), Offset(elbowX, elbowY), armPaint);
    canvas.drawLine(Offset(elbowX, elbowY), Offset(wristX, wristY), armPaint);

    // Draw joints
    final jointPaint = Paint()..color = const Color(0xFF1E40AF);
    canvas.drawCircle(Offset(shoulderX, shoulderY), 8, jointPaint);
    canvas.drawCircle(Offset(elbowX, elbowY), 6, jointPaint);
    canvas.drawCircle(Offset(wristX, wristY), 5, jointPaint);

    // Draw gripper
    final gripperRad = gripperAngle * 3.14159 / 180;
    final gripOffset = (gripperAngle / 90) * 8;

    final gripPaint = Paint()..color = const Color(0xFFDC2626);
    canvas.drawLine(Offset(wristX - 8 + gripOffset, wristY + 10), Offset(wristX, wristY + 20), gripPaint);
    canvas.drawLine(Offset(wristX + 8 - gripOffset, wristY + 10), Offset(wristX, wristY + 20), gripPaint);
  }

  @override
  bool shouldRepaint(covariant ArmPainter oldDelegate) {
    return oldDelegate.baseAngle != baseAngle ||
        oldDelegate.shoulderAngle != shoulderAngle ||
        oldDelegate.elbowAngle != elbowAngle ||
        oldDelegate.gripperAngle != gripperAngle;
  }
}