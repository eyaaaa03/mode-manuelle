import 'package:flutter/material.dart';
import '../providers/robot_provider.dart';
import 'quick_presets.dart';

class ServoControlPanel extends StatelessWidget {
  final RobotProvider robotProvider;
  final VoidCallback onSendCommand;

  const ServoControlPanel({
    super.key,
    required this.robotProvider,
    required this.onSendCommand,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        border: Border(
          right: BorderSide(color: const Color(0xFF00FFE7).withOpacity(0.12)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildPanelTitle('// JOINT CONTROL'),
          const SizedBox(height: 20),
          _buildServoControl(
            name: '⬤ BASE',
            subtitle: 'HORIZONTAL ROTATION',
            value: robotProvider.state.base,
            min: 0,
            max: 180,
            onChanged: (val) => robotProvider.updateServo('base', val),
            color: const Color(0xFF00FFE7),
          ),
          const SizedBox(height: 24),
          _buildServoControl(
            name: '◉ SHOULDER',
            subtitle: 'UPPER ARM ELEVATION',
            value: robotProvider.state.shoulder,
            min: 0,
            max: 180,
            onChanged: (val) => robotProvider.updateServo('shoulder', val),
            color: const Color(0xFF00FFE7),
          ),
          const SizedBox(height: 24),
          _buildServoControl(
            name: '◈ ELBOW',
            subtitle: 'LOWER ARM FLEX',
            value: robotProvider.state.elbow,
            min: 0,
            max: 180,
            onChanged: (val) => robotProvider.updateServo('elbow', val),
            color: const Color(0xFF00FFE7),
          ),
          const SizedBox(height: 24),
          _buildServoControl(
            name: '✊ GRIPPER',
            subtitle: 'END EFFECTOR',
            value: robotProvider.state.gripper,
            min: 0,
            max: 90,
            onChanged: (val) => robotProvider.updateServo('gripper', val),
            color: const Color(0xFFFF6B35),
          ),
          const SizedBox(height: 30),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: robotProvider.isSending ? null : onSendCommand,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: const Color(0xFF00FFE7),
                foregroundColor: const Color(0xFF020812),
              ),
              child: robotProvider.isSending
                  ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
                  : const Text(
                '▶ EXECUTE COMMAND',
                style: TextStyle(
                  fontFamily: 'Orbitron',
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: robotProvider.resetArm,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: const Color(0xFFFF6B35)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text(
                    '↺ RESET HOME',
                    style: TextStyle(
                      color: Color(0xFFFF6B35),
                      fontSize: 11,
                      letterSpacing: 2,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _showPresetDialog(context, robotProvider),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: const Color(0xFFA855F7)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text(
                    '💾 SAVE PRESET',
                    style: TextStyle(
                      color: Color(0xFFA855F7),
                      fontSize: 11,
                      letterSpacing: 2,
                    ),
                  ),
                ),
              ),
            ],
          ),
          // Add this after the Row with reset and save buttons in the build method
          const SizedBox(height: 24),
          QuickPresets(robotProvider: robotProvider),
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
            fontSize: 10,
            letterSpacing: 3,
            color: Color(0xFF00FFE7),
            fontWeight: FontWeight.bold,
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

  Widget _buildServoControl({
    required String name,
    required String subtitle,
    required int value,
    required int min,
    required int max,
    required ValueChanged<int> onChanged,
    required Color color,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontFamily: 'Orbitron',
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFFC8E6E3),
                  ),
                ),
              ],
            ),
            Text(
              '${value.toString().padLeft(3, '0')}°',
              style: TextStyle(
                fontSize: 24,
                color: color,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Slider(
          value: value.toDouble(),
          min: min.toDouble(),
          max: max.toDouble(),
          activeColor: color,
          inactiveColor: color.withOpacity(0.2),
          onChanged: (val) => onChanged(val.toInt()),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('${min}°', style: const TextStyle(fontSize: 10, color: Color(0xFFC8E6E3))),
            Text('${(min + max) ~/ 2}°', style: const TextStyle(fontSize: 10, color: Color(0xFFC8E6E3))),
            Text('${max}°', style: const TextStyle(fontSize: 10, color: Color(0xFFC8E6E3))),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildQuickButton('${min}°', () => onChanged(min)),
            _buildQuickButton('${(min + max) ~/ 4}°', () => onChanged((min + max) ~/ 4)),
            _buildQuickButton('${(min + max) ~/ 2}°', () => onChanged((min + max) ~/ 2)),
            _buildQuickButton('${(3 * (min + max) ~/ 4)}°', () => onChanged(3 * (min + max) ~/ 4)),
            _buildQuickButton('${max}°', () => onChanged(max)),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickButton(String label, VoidCallback onPressed) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: TextButton(
          onPressed: onPressed,
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 6),
            backgroundColor: const Color(0xFF00FFE7).withOpacity(0.05),
            shape: RoundedRectangleBorder(
              side: BorderSide(color: const Color(0xFF00FFE7).withOpacity(0.15)),
            ),
          ),
          child: Text(
            label,
            style: const TextStyle(fontSize: 10, color: Color(0xFFC8E6E3)),
          ),
        ),
      ),
    );
  }

  void _showPresetDialog(BuildContext context, RobotProvider provider) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF020812),
        title: const Text('Save Preset', style: TextStyle(color: Color(0xFF00FFE7))),
        content: TextField(
          controller: controller,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Enter preset name',
            hintStyle: TextStyle(color: Color(0xFFC8E6E3)),
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFFC8E6E3))),
          ),
          ElevatedButton(
            onPressed: () {
              // Save preset logic
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}