import 'package:flutter/material.dart';
import '../providers/robot_provider.dart';

class QuickPresets extends StatelessWidget {
  final RobotProvider robotProvider;

  const QuickPresets({super.key, required this.robotProvider});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPanelTitle('// QUICK PRESETS'),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildPresetButton('🏠 HOME', () => robotProvider.loadPreset(90, 90, 90, 0, 'HOME')),
            _buildPresetButton('← LEFT', () => robotProvider.loadPreset(0, 90, 90, 0, 'LEFT SWEEP')),
            _buildPresetButton('→ RIGHT', () => robotProvider.loadPreset(180, 90, 90, 0, 'RIGHT SWEEP')),
            _buildPresetButton('🤏 PICK', () => robotProvider.loadPreset(90, 45, 45, 90, 'PICK UP')),
            _buildPresetButton('⬆ HIGH', () => robotProvider.loadPreset(90, 135, 135, 0, 'REACH HIGH')),
            _buildPresetButton('⬇ LOW', () => robotProvider.loadPreset(90, 30, 90, 0, 'REACH LOW')),
            _buildPresetButton('📦 PLACE', () => robotProvider.loadPreset(45, 60, 120, 60, 'PLACE OBJ')),
            _buildPresetButton('✊ GRIP', () => robotProvider.loadPreset(90, 90, 90, 90, 'GRIP ALL')),
          ],
        ),
      ],
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

  Widget _buildPresetButton(String label, VoidCallback onPressed) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        side: BorderSide(color: const Color(0xFF1E40AF).withOpacity(0.3)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(2)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          color: Color(0x991F2937),
        ),
      ),
    );
  }
}