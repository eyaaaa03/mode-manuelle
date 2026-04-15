import 'package:flutter/material.dart';
import '../models/command_history.dart';

class CommandHistoryPanel extends StatelessWidget {
  final List<CommandHistory> history;

  const CommandHistoryPanel({super.key, required this.history});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: const Color(0xFF1E40AF).withOpacity(0.12)),
          left: BorderSide(color: const Color(0xFF1E40AF).withOpacity(0.12)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildPanelTitle('// HISTORY'),
          const SizedBox(height: 16),
          Expanded(
            child: history.isEmpty
                ? Center(
              child: Text(
                'NO COMMANDS YET',
                style: TextStyle(
                  fontSize: 12,
                  letterSpacing: 2,
                  color: const Color(0x991F2937).withOpacity(0.3),
                ),
              ),
            )
                : ListView.builder(
              itemCount: history.length,
              itemBuilder: (context, index) {
                return _buildHistoryItem(history[index]);
              },
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

  Widget _buildHistoryItem(CommandHistory command) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: const Color(0xFF1E40AF).withOpacity(0.06)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              command.commandName,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0x991F2937),
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              'B:${command.base}° S:${command.shoulder}° E:${command.elbow}° G:${command.gripper}°',
              style: const TextStyle(
                fontFamily: 'Share Tech Mono',
                fontSize: 10,
                color: Color(0xFF1E40AF),
              ),
            ),
          ),
          Text(
            command.formattedTime,
            style: TextStyle(
              fontSize: 10,
              color: const Color(0x991F2937).withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }
}