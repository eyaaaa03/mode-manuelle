class RobotState {
  int base;
  int shoulder;
  int elbow;
  int gripper;

  RobotState({
    required this.base,
    required this.shoulder,
    required this.elbow,
    required this.gripper,
  });

  RobotState copyWith({
    int? base,
    int? shoulder,
    int? elbow,
    int? gripper,
  }) {
    return RobotState(
      base: base ?? this.base,
      shoulder: shoulder ?? this.shoulder,
      elbow: elbow ?? this.elbow,
      gripper: gripper ?? this.gripper,
    );
  }

  factory RobotState.initial() => RobotState(
    base: 90,
    shoulder: 90,
    elbow: 90,
    gripper: 0,
  );

  Map<String, dynamic> toJson() => {
    'baseAngle': base,
    'shoulderAngle': shoulder,
    'elbowAngle': elbow,
    'gripperAngle': gripper,
  };
}