import 'package:flutter/material.dart';

class StatusIndicator extends StatelessWidget {
  final bool isOnline;
  final String label;

  const StatusIndicator({
    super.key,
    this.isOnline = true,
    this.label = 'SYSTEM ONLINE',
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: isOnline ? const Color(0xFF1E40AF) : const Color(0xFFFF4444),
            shape: BoxShape.circle,
            boxShadow: isOnline
                ? [
              BoxShadow(
                color: const Color(0xFF1E40AF).withOpacity(0.5),
                blurRadius: 8,
              ),
            ]
                : null,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            letterSpacing: 2,
            color: isOnline ? const Color(0xFF1E40AF) : const Color(0xFFFF4444),
          ),
        ),
      ],
    );
  }
}