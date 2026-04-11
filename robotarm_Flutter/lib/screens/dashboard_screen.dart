import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../providers/auth_provider.dart';
import '../providers/robot_provider.dart';
import '../models/robot_state.dart';
import '../models/command_history.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _currentTime = '';
  Timer? _debounceTimer;
  bool _isSliding = false;

  @override
  void initState() {
    super.initState();
    _updateTime();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<RobotProvider>(context, listen: false).loadState();
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _updateTime() {
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        setState(() {
          final now = DateTime.now();
          _currentTime = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
        });
        _updateTime();
      }
    });
  }

  Future<void> _handleLogout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  // Real-time slider control method
  void _onSliderChanged(RobotProvider robotProvider, String joint, int value, AuthProvider authProvider) {
    // Update UI immediately
    robotProvider.updateServo(joint, value);

    // Show sliding indicator
    setState(() {
      _isSliding = true;
    });

    // Cancel previous timer
    _debounceTimer?.cancel();

    // Send command after user stops sliding (150ms delay for smooth control)
    _debounceTimer = Timer(const Duration(milliseconds: 150), () {
      robotProvider.sendCommand(authProvider.currentUser?.id);
      setState(() {
        _isSliding = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final robotProvider = Provider.of<RobotProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF020812),
      body: Column(
        children: [
          // Navigation Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF020812).withOpacity(0.95),
              border: Border(
                bottom: BorderSide(
                  color: const Color(0xFF00FFE7).withOpacity(0.3),
                  width: 1,
                ),
              ),
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                // For very small screens (width < 500)
                if (constraints.maxWidth < 500) {
                  return Row(
                    children: [
                      const Text(
                        'ROBOT ARM',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00FFE7),
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => Navigator.pushNamed(context, '/vision'),
                        icon: const Icon(Icons.visibility, color: Color(0xFF00FFE7)),
                        tooltip: 'Vision Mode',
                      ),
                      IconButton(
                        onPressed: _handleLogout,
                        icon: const Icon(Icons.logout, color: Color(0xFFFF4444)),
                      ),
                    ],
                  );
                }

                // For large screens (700+)
                return Row(
                  children: [
                    const Text(
                      'ROBOT ARM CONTROL',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00FFE7),
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.4)),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF00FFE7),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'SYSTEM ONLINE',
                            style: TextStyle(
                              fontSize: 10,
                              color: Color(0xFF00FFE7),
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    OutlinedButton.icon(
                      onPressed: () => Navigator.pushNamed(context, '/vision'),
                      icon: const Icon(Icons.visibility, size: 16),
                      label: const Text('VISION MODE'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF00FFE7),
                        side: const BorderSide(color: Color(0xFF00FFE7)),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      _currentTime,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFFC8E6E3),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.2)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Color(0xFF00FFE7), Color(0xFFFF6B35)],
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                authProvider.currentUser?.fullName[0].toUpperCase() ?? 'OP',
                                style: const TextStyle(
                                  color: Color(0xFF020812),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            authProvider.currentUser?.fullName.toUpperCase() ?? 'OPERATOR',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFFC8E6E3),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton(
                      onPressed: _handleLogout,
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFFF4444), width: 1),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      ),
                      child: const Text(
                        'LOGOUT',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFFFF4444),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          // Main Content
          Expanded(
            child: robotProvider.isLoading
                ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00FFE7)),
              ),
            )
                : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
              child: Column(
                children: [
                  // First Row: Servo Controls and Arm Visual
                  LayoutBuilder(
                    builder: (context, constraints) {
                      if (constraints.maxWidth < 800) {
                        return Column(
                          children: [
                            _buildServoControls(robotProvider, authProvider),
                            const SizedBox(height: 16),
                            _buildArmVisualization(robotProvider.state),
                          ],
                        );
                      }
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 2,
                            child: _buildServoControls(robotProvider, authProvider),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            flex: 3,
                            child: _buildArmVisualization(robotProvider.state),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Second Row: Telemetry and Commands
                  LayoutBuilder(
                    builder: (context, constraints) {
                      if (constraints.maxWidth < 800) {
                        return Column(
                          children: [
                            _buildTelemetry(robotProvider.state),
                            const SizedBox(height: 16),
                            _buildQuickCommands(robotProvider, authProvider),
                            const SizedBox(height: 16),
                            _buildCommandHistory(robotProvider.history),
                          ],
                        );
                      }
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 2,
                            child: _buildTelemetry(robotProvider.state),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            flex: 3,
                            child: Column(
                              children: [
                                _buildQuickCommands(robotProvider, authProvider),
                                const SizedBox(height: 16),
                                _buildCommandHistory(robotProvider.history),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServoControls(RobotProvider robotProvider, AuthProvider authProvider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'JOINT CONTROL',
                style: TextStyle(
                  fontSize: 12,
                  letterSpacing: 2,
                  color: Color(0xFF00FFE7),
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (_isSliding)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00FFE7).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'MOVING...',
                    style: TextStyle(
                      fontSize: 10,
                      color: Color(0xFF00FFE7),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSliderControl(
            name: 'BASE',
            icon: '⬤',
            value: robotProvider.state.base,
            min: 0,
            max: 180,
            color: const Color(0xFF00FFE7),
            robotProvider: robotProvider,
            authProvider: authProvider,
          ),
          const SizedBox(height: 16),
          _buildSliderControl(
            name: 'SHOULDER',
            icon: '◉',
            value: robotProvider.state.shoulder,
            min: 0,
            max: 180,
            color: const Color(0xFF00FFE7),
            robotProvider: robotProvider,
            authProvider: authProvider,
          ),
          const SizedBox(height: 16),
          _buildSliderControl(
            name: 'ELBOW',
            icon: '◈',
            value: robotProvider.state.elbow,
            min: 0,
            max: 180,
            color: const Color(0xFF00FFE7),
            robotProvider: robotProvider,
            authProvider: authProvider,
          ),
          const SizedBox(height: 16),
          _buildSliderControl(
            name: 'GRIPPER',
            icon: '✊',
            value: robotProvider.state.gripper,
            min: 0,
            max: 90,
            color: const Color(0xFFFF6B35),
            robotProvider: robotProvider,
            authProvider: authProvider,
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: robotProvider.isSending
                  ? null
                  : () => robotProvider.sendCommand(authProvider.currentUser?.id),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                side: const BorderSide(color: Color(0xFF00FFE7)),
              ),
              child: robotProvider.isSending
                  ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
                  : const Text(
                'SEND MANUAL COMMAND',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF00FFE7),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliderControl({
    required String name,
    required String icon,
    required int value,
    required int min,
    required int max,
    required Color color,
    required RobotProvider robotProvider,
    required AuthProvider authProvider,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Text(
                  icon,
                  style: TextStyle(fontSize: 14, color: color),
                ),
                const SizedBox(width: 6),
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            Text(
              '${value.toString().padLeft(3, '0')}°',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Slider(
          value: value.toDouble(),
          min: min.toDouble(),
          max: max.toDouble(),
          activeColor: color,
          inactiveColor: color.withOpacity(0.2),
          onChanged: (val) {
            String joint = name.toLowerCase();
            _onSliderChanged(robotProvider, joint, val.toInt(), authProvider);
          },
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('$min°', style: const TextStyle(fontSize: 9, color: Color(0xFFC8E6E3))),
            Text('${(min + max) ~/ 2}°', style: const TextStyle(fontSize: 9, color: Color(0xFFC8E6E3))),
            Text('$max°', style: const TextStyle(fontSize: 9, color: Color(0xFFC8E6E3))),
          ],
        ),
      ],
    );
  }

  Widget _buildArmVisualization(RobotState state) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          const Text(
            'ARM VISUALIZATION',
            style: TextStyle(
              fontSize: 12,
              letterSpacing: 2,
              color: Color(0xFF00FFE7),
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: Center(
              child: CustomPaint(
                painter: ArmPainter(
                  baseAngle: state.base,
                  shoulderAngle: state.shoulder,
                  elbowAngle: state.elbow,
                  gripperAngle: state.gripper,
                ),
                size: const Size(280, 180),
              ),
            ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              return Wrap(
                spacing: 12,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: [
                  _buildMiniStatus('BASE', '${state.base}°', const Color(0xFF00FFE7)),
                  _buildMiniStatus('SHOULDER', '${state.shoulder}°', const Color(0xFF00FFE7)),
                  _buildMiniStatus('ELBOW', '${state.elbow}°', const Color(0xFF00FFE7)),
                  _buildMiniStatus('GRIPPER', '${state.gripper}°', const Color(0xFFFF6B35)),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStatus(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: Color(0xFFC8E6E3)),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetry(RobotState state) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'TELEMETRY',
            style: TextStyle(
              fontSize: 12,
              letterSpacing: 2,
              color: Color(0xFF00FFE7),
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _buildTelemetryItem('BASE', state.base, 180, const Color(0xFF00FFE7)),
          const SizedBox(height: 12),
          _buildTelemetryItem('SHOULDER', state.shoulder, 180, const Color(0xFF00FFE7)),
          const SizedBox(height: 12),
          _buildTelemetryItem('ELBOW', state.elbow, 180, const Color(0xFF00FFE7)),
          const SizedBox(height: 12),
          _buildTelemetryItem('GRIPPER', state.gripper, 90, const Color(0xFFFF6B35)),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFFF6B35).withOpacity(0.3)),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF00FFE7),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'READY',
                  style: TextStyle(
                    fontSize: 10,
                    color: Color(0xFF00FFE7),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryItem(String label, int value, int max, Color color) {
    final percentage = (value / max) * 100;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFFC8E6E3))),
            Text(
              '${value.toString().padLeft(3, '0')}°',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
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
    );
  }

  Widget _buildQuickCommands(RobotProvider robotProvider, AuthProvider authProvider) {
    final presets = [
      {'name': '🏠 HOME', 'base': 90, 'shoulder': 90, 'elbow': 90, 'gripper': 0},
      {'name': '← LEFT', 'base': 0, 'shoulder': 90, 'elbow': 90, 'gripper': 0},
      {'name': '→ RIGHT', 'base': 180, 'shoulder': 90, 'elbow': 90, 'gripper': 0},
      {'name': '🤏 PICK', 'base': 90, 'shoulder': 45, 'elbow': 45, 'gripper': 90},
      {'name': '⬆ HIGH', 'base': 90, 'shoulder': 135, 'elbow': 135, 'gripper': 0},
      {'name': '⬇ LOW', 'base': 90, 'shoulder': 30, 'elbow': 90, 'gripper': 0},
      {'name': '✊ GRIP', 'base': 90, 'shoulder': 90, 'elbow': 90, 'gripper': 90},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'QUICK COMMANDS',
            style: TextStyle(
              fontSize: 12,
              letterSpacing: 2,
              color: Color(0xFF00FFE7),
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: presets.map((preset) {
              return OutlinedButton(
                onPressed: () {
                  robotProvider.loadPreset(
                    preset['base'] as int,
                    preset['shoulder'] as int,
                    preset['elbow'] as int,
                    preset['gripper'] as int,
                    preset['name'] as String,
                  );
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Loaded: ${preset['name']}'),
                      backgroundColor: const Color(0xFF00FFE7),
                      duration: const Duration(seconds: 1),
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  preset['name'] as String,
                  style: const TextStyle(fontSize: 11),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: robotProvider.isSending
                  ? null
                  : () => robotProvider.sendCommand(authProvider.currentUser?.id),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 10),
                backgroundColor: const Color(0xFF00FFE7),
                foregroundColor: const Color(0xFF020812),
              ),
              child: robotProvider.isSending
                  ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
                  : const Text(
                'APPLY CURRENT',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommandHistory(List<CommandHistory> history) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'HISTORY',
            style: TextStyle(
              fontSize: 12,
              letterSpacing: 2,
              color: Color(0xFF00FFE7),
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 120,
            child: history.isEmpty
                ? Center(
              child: Text(
                'No commands',
                style: TextStyle(
                  color: const Color(0xFFC8E6E3).withOpacity(0.5),
                  fontSize: 11,
                ),
              ),
            )
                : ListView.builder(
              itemCount: history.length > 5 ? 5 : history.length,
              itemBuilder: (context, index) {
                final cmd = history[index];
                return Container(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: const Color(0xFF00FFE7).withOpacity(0.1)),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: Text(
                          cmd.commandName,
                          style: const TextStyle(fontSize: 10, color: Color(0xFFC8E6E3)),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          'B:${cmd.base} S:${cmd.shoulder} E:${cmd.elbow} G:${cmd.gripper}',
                          style: const TextStyle(
                            fontSize: 9,
                            color: Color(0xFF00FFE7),
                          ),
                        ),
                      ),
                      Text(
                        cmd.formattedTime.substring(0, 5),
                        style: TextStyle(
                          fontSize: 8,
                          color: const Color(0xFFC8E6E3).withOpacity(0.5),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// Arm Painter Class
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
    final centerY = size.height - 30;

    final basePaint = Paint()
      ..color = const Color(0xFF00FFE7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawCircle(Offset(centerX, centerY), 12, basePaint);
    canvas.drawCircle(Offset(centerX, centerY), 5, Paint()..color = const Color(0xFF00FFE7).withOpacity(0.3));

    final baseRad = (baseAngle - 90) * 3.14159 / 180;
    final shoulderRad = (shoulderAngle - 90) * 3.14159 / 180;
    final elbowRad = (elbowAngle - 90) * 3.14159 / 180;

    final shoulderX = centerX + 25 * baseRad;
    final shoulderY = centerY - 40;
    final elbowX = shoulderX + 35 * shoulderRad;
    final elbowY = shoulderY - 35;
    final wristX = elbowX + 30 * elbowRad;
    final wristY = elbowY - 30;

    final armPaint = Paint()
      ..color = const Color(0xFF00FFE7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;

    canvas.drawLine(Offset(centerX, centerY), Offset(shoulderX, shoulderY), armPaint);
    canvas.drawLine(Offset(shoulderX, shoulderY), Offset(elbowX, elbowY), armPaint);
    canvas.drawLine(Offset(elbowX, elbowY), Offset(wristX, wristY), armPaint);

    final jointPaint = Paint()..color = const Color(0xFF00FFE7);
    canvas.drawCircle(Offset(shoulderX, shoulderY), 5, jointPaint);
    canvas.drawCircle(Offset(elbowX, elbowY), 4, jointPaint);
    canvas.drawCircle(Offset(wristX, wristY), 3, jointPaint);

    final gripPaint = Paint()..color = const Color(0xFFFF6B35);
    final gripOffset = (gripperAngle / 90) * 5;
    canvas.drawLine(Offset(wristX - 5 + gripOffset, wristY + 6), Offset(wristX, wristY + 12), gripPaint);
    canvas.drawLine(Offset(wristX + 5 - gripOffset, wristY + 6), Offset(wristX, wristY + 12), gripPaint);
  }

  @override
  bool shouldRepaint(covariant ArmPainter oldDelegate) {
    return oldDelegate.baseAngle != baseAngle ||
        oldDelegate.shoulderAngle != shoulderAngle ||
        oldDelegate.elbowAngle != elbowAngle ||
        oldDelegate.gripperAngle != gripperAngle;
  }
}