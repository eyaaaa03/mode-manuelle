class CommandHistory {
  final String commandName;
  final int base;
  final int shoulder;
  final int elbow;
  final int gripper;
  final DateTime timestamp;

  CommandHistory({
    required this.commandName,
    required this.base,
    required this.shoulder,
    required this.elbow,
    required this.gripper,
    required this.timestamp,
  });

  String get formattedTime {
    return '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}:${timestamp.second.toString().padLeft(2, '0')}';
  }
}