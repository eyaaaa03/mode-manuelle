// lib/screens/vision_inspection_screen.dart
import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/robot_provider.dart';

enum InspectionResult { ok, defect, pending, scanning }
enum PickStatus { idle, picking, picked, error }

class VisionInspectionScreen extends StatefulWidget {
  const VisionInspectionScreen({super.key});

  @override
  State<VisionInspectionScreen> createState() => _VisionInspectionScreenState();
}

class _VisionInspectionScreenState extends State<VisionInspectionScreen>
    with WidgetsBindingObserver {
  // Camera
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _camActive = false;
  Timer? _autoScanTimer;
  bool _autoMode = false;
  bool _isScanning = false;

  // Inspection state
  InspectionResult _currentResult = InspectionResult.pending;
  double _currentConfidence = 0.0;
  PickStatus _pickStatus = PickStatus.idle;
  int _totalScanned = 0;
  int _totalDefects = 0;
  int _totalPicks = 0;
  final List<InspectionEvent> _eventLog = [];

  // Bounding box for visual feedback
  Rect _detectBox = const Rect.fromLTWH(80, 60, 200, 180);
  String _currentDefectType = '';

  // UI
  String _currentTime = '';
  Timer? _clockTimer;
  String _userName = 'OPERATOR';
  String _userInitial = 'O';
  String _toastMsg = '';
  bool _toastVisible = false;
  bool _toastError = false;
  Timer? _toastTimer;

  // Random generator for demo bounding box movement
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initUser();
    _updateClock();
    // Delay camera initialization to avoid setState during build
    Future.delayed(Duration.zero, () {
      if (mounted) _initCamera();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _autoScanTimer?.cancel();
    _clockTimer?.cancel();
    _toastTimer?.cancel();
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }
    if (state == AppLifecycleState.inactive) {
      _stopCamera();
    } else if (state == AppLifecycleState.resumed) {
      _initCamera();
    }
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  void _initUser() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.currentUser;
    _userName = (user?.fullName ?? 'OPERATOR').toUpperCase();
    _userInitial = _userName.isNotEmpty ? _userName[0] : 'O';
  }

  void _updateClock() {
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        final now = DateTime.now();
        setState(() {
          _currentTime =
              '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')} UTC';
        });
      }
    });
  }

  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) return;
      _cameraController = CameraController(
        _cameras![0],
        ResolutionPreset.medium,
        enableAudio: false,
      );
      await _cameraController!.initialize();
      if (mounted) {
        setState(() {
          _camActive = true;
        });
        _showToast('📷 CAMERA INITIALIZED');
      }
    } catch (e) {
      _showToast('✗ CAMERA ACCESS DENIED', true);
    }
  }

  void _stopCamera() {
    if (_cameraController != null) {
      _cameraController!.dispose();
      _cameraController = null;
    }
    _stopAutoMode();
    if (mounted) {
      setState(() {
        _camActive = false;
        _currentResult = InspectionResult.pending;
        _currentConfidence = 0;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Inspection Logic
  // ---------------------------------------------------------------------------
  Future<void> _runInspection() async {
    if (!_camActive || _isScanning || _cameraController == null) return;

    setState(() {
      _isScanning = true;
      _currentResult = InspectionResult.scanning;
    });

    try {
      // Capture frame
      final XFile file = await _cameraController!.takePicture();
      final bytes = await file.readAsBytes();
      final base64Image = base64Encode(bytes);

      // Call backend vision API
      final robotProvider =
          Provider.of<RobotProvider>(context, listen: false);
      final result = await robotProvider.inspectVision(base64Image);

      // Update UI with result
      if (mounted) {
        setState(() {
          _isScanning = false;
          _totalScanned++;
          _currentConfidence = result.confidence;
          _currentResult =
              result.isDefect ? InspectionResult.defect : InspectionResult.ok;
          if (result.isDefect) {
            _totalDefects++;
            _currentDefectType = result.defectType ?? 'SURFACE DEFECT';
          }
          // Simulate bounding box movement (for visual effect)
          _detectBox = Rect.fromLTWH(
            60 + _random.nextDouble() * 120,
            40 + _random.nextDouble() * 100,
            140 + _random.nextDouble() * 100,
            100 + _random.nextDouble() * 100,
          );
        });

        _addLogEntry(result.isDefect, result.confidence, result.defectType);

        if (result.isDefect) {
          _triggerPickSignal(result.defectType!);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isScanning = false;
          _currentResult = InspectionResult.pending;
        });
        _showToast('❌ VISION API ERROR', true);
      }
    }
  }

  Future<void> _triggerPickSignal(String defectType) async {
    setState(() {
      _pickStatus = PickStatus.picking;
    });
    _showToast('🚨 DEFECT: $defectType — ARM DISPATCHED');

    final robotProvider = Provider.of<RobotProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    try {
      final success = await robotProvider.sendPickCommand(
        userId: authProvider.currentUser?.id,
      );
      if (success) {
        setState(() {
          _pickStatus = PickStatus.picked;
          _totalPicks++;
        });
        _showToast('✓ PICK COMPLETE — DEFECT REMOVED');
        // Update the latest log entry's pick status
        if (_eventLog.isNotEmpty) {
          _eventLog.first.pickStatus = PickStatus.picked;
        }
        // Return arm home after 1.5 seconds
        Future.delayed(const Duration(milliseconds: 1500), () {
          if (mounted) {
            robotProvider.returnHome(authProvider.currentUser?.id);
            setState(() {
              _pickStatus = PickStatus.idle;
            });
          }
        });
      } else {
        setState(() {
          _pickStatus = PickStatus.error;
        });
        _showToast('✗ PICK COMMAND FAILED', true);
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) setState(() => _pickStatus = PickStatus.idle);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _pickStatus = PickStatus.error;
        });
        _showToast('✗ PICK COMMAND FAILED', true);
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) setState(() => _pickStatus = PickStatus.idle);
        });
      }
    }
  }

  void _addLogEntry(bool isDefect, double confidence, String? defectType) {
    final event = InspectionEvent(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      time: _formatTime(DateTime.now()),
      result: isDefect ? InspectionResult.defect : InspectionResult.ok,
      confidence: confidence,
      defectType: defectType,
      pickStatus: isDefect ? PickStatus.picking : PickStatus.idle,
    );
    setState(() {
      _eventLog.insert(0, event);
      if (_eventLog.length > 50) _eventLog.removeLast();
    });
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}:${dt.second.toString().padLeft(2, '0')}';
  }

  // ---------------------------------------------------------------------------
  // Auto Mode
  // ---------------------------------------------------------------------------
  void _toggleAutoMode() {
    if (!_camActive) return;
    setState(() {
      _autoMode = !_autoMode;
    });
    if (_autoMode) {
      _autoScanTimer = Timer.periodic(const Duration(seconds: 3), (_) {
        _runInspection();
      });
      _showToast('⚡ AUTO-INSPECT ARMED — 3s INTERVAL');
    } else {
      _stopAutoMode();
      _showToast('⚡ AUTO-INSPECT DISARMED');
    }
  }

  void _stopAutoMode() {
    _autoMode = false;
    _autoScanTimer?.cancel();
    _autoScanTimer = null;
  }

  // ---------------------------------------------------------------------------
  // UI Helpers
  // ---------------------------------------------------------------------------
  void _showToast(String msg, [bool isError = false]) {
    if (!mounted) return;
    setState(() {
      _toastMsg = msg;
      _toastError = isError;
      _toastVisible = true;
    });
    _toastTimer?.cancel();
    _toastTimer = Timer(const Duration(milliseconds: 2800), () {
      if (mounted) setState(() => _toastVisible = false);
    });
  }

  String _resultText(InspectionResult r) {
    switch (r) {
      case InspectionResult.ok:
        return 'OK';
      case InspectionResult.defect:
        return 'DEFECT — PICK SIGNAL SENT';
      case InspectionResult.scanning:
        return 'SCANNING';
      default:
        return 'PENDING';
    }
  }

  Color _resultColor(InspectionResult r) {
    switch (r) {
      case InspectionResult.ok:
        return const Color(0xFF00FFE7);
      case InspectionResult.defect:
        return const Color(0xFFFF4444);
      default:
        return Colors.white38;
    }
  }

  double get _defectRate =>
      _totalScanned == 0 ? 0 : (_totalDefects / _totalScanned) * 100;

  Color _gaugeColor(double rate) {
    if (rate >= 50) return const Color(0xFFFF4444);
    if (rate >= 20) return const Color(0xFFF0A500);
    return const Color(0xFF00FFE7);
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020812),
      body: Stack(
        children: [
          Column(
            children: [
              _buildNavigationBar(),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    if (constraints.maxWidth < 900) {
                      return SingleChildScrollView(
                        child: Column(
                          children: [
                            _buildCameraPanel(),
                            _buildStatsPanel(),
                            // Give log panel a fixed height on mobile to avoid layout errors with Expanded/ListView
                            SizedBox(
                              height: 400,
                              child: _buildLogPanel(),
                            ),
                          ],
                        ),
                      );
                    } else {
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(flex: 2, child: _buildCameraPanel()),
                          SizedBox(
                            width: 280,
                            child: Column(
                              children: [
                                _buildStatsPanel(),
                                const SizedBox(height: 1),
                                Expanded(child: _buildLogPanel()),
                              ],
                            ),
                          ),
                        ],
                      );
                    }
                  },
                ),
              ),
            ],
          ),
          if (_toastVisible)
            Positioned(
              bottom: 30,
              right: 20,
              child: AnimatedOpacity(
                opacity: _toastVisible ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 300),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF020812).withOpacity(0.95),
                    border: Border.all(
                      color: _toastError
                          ? const Color(0xFFFF4444)
                          : const Color(0xFF00FFE7),
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    _toastMsg,
                    style: TextStyle(
                      fontFamily: 'Orbitron',
                      fontSize: 12,
                      letterSpacing: 2,
                      color: _toastError
                          ? const Color(0xFFFF4444)
                          : const Color(0xFF00FFE7),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Navigation Bar (mirrors dashboard style)
  // ---------------------------------------------------------------------------
  Widget _buildNavigationBar() {
    return Container(
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
          if (constraints.maxWidth < 500) {
            return Row(
              children: [
                const Text('ROBOT ARM',
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00FFE7))),
                const SizedBox(width: 8),
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _camActive
                        ? (_isScanning
                            ? const Color(0xFFA855F7)
                            : const Color(0xFF00FFE7))
                        : const Color(0xFFFF4444),
                    shape: BoxShape.circle,
                  ),
                ),
                const Spacer(),
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                        colors: [Color(0xFF00FFE7), Color(0xFFA855F7)]),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(_userInitial,
                        style: const TextStyle(
                            color: Color(0xFF020812),
                            fontWeight: FontWeight.bold)),
                  ),
                ),
                IconButton(
                  onPressed: () => _logout(),
                  icon: const Icon(Icons.logout, color: Color(0xFFFF4444)),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            );
          }
          if (constraints.maxWidth < 700) {
            return Row(
              children: [
                const Text('MECHAARM',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00FFE7))),
                const SizedBox(width: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    border: Border.all(
                        color: const Color(0xFF00FFE7).withOpacity(0.4)),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: _camActive
                              ? (_isScanning
                                  ? const Color(0xFFA855F7)
                                  : const Color(0xFF00FFE7))
                              : const Color(0xFFFF4444),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _camActive
                            ? (_isScanning ? 'SCANNING' : 'CAM LIVE')
                            : 'OFFLINE',
                        style: const TextStyle(
                            fontSize: 9, color: Color(0xFF00FFE7)),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Text(_currentTime.substring(0, 5),
                    style:
                        const TextStyle(fontSize: 11, color: Color(0xFFC8E6E3))),
                const SizedBox(width: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    border: Border.all(
                        color: const Color(0xFF00FFE7).withOpacity(0.2)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                              colors: [Color(0xFF00FFE7), Color(0xFFA855F7)]),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(_userInitial,
                              style: const TextStyle(
                                  color: Color(0xFF020812),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10)),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(_userName.split(' ').first,
                          style: const TextStyle(
                              fontSize: 10, color: Color(0xFFC8E6E3))),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: _logout,
                  child: const Text('LOG',
                      style: TextStyle(fontSize: 10, color: Color(0xFFFF4444))),
                ),
              ],
            );
          }
          // Full navigation
          return Row(
            children: [
              const Text('ROBOT ARM CONTROL',
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00FFE7),
                      letterSpacing: 2)),
              const SizedBox(width: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  border: Border.all(
                      color: const Color(0xFF00FFE7).withOpacity(0.4)),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _camActive
                            ? (_isScanning
                                ? const Color(0xFFA855F7)
                                : const Color(0xFF00FFE7))
                            : const Color(0xFFFF4444),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _camActive
                          ? (_isScanning ? 'SCANNING' : 'CAM LIVE')
                          : 'CAM OFFLINE',
                      style: const TextStyle(
                          fontSize: 10,
                          color: Color(0xFF00FFE7),
                          letterSpacing: 1),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Text(_currentTime,
                  style:
                      const TextStyle(fontSize: 12, color: Color(0xFFC8E6E3))),
              const SizedBox(width: 16),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  border: Border.all(
                      color: const Color(0xFF00FFE7).withOpacity(0.2)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                            colors: [Color(0xFF00FFE7), Color(0xFFFF6B35)]),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(_userInitial,
                            style: const TextStyle(
                                color: Color(0xFF020812),
                                fontWeight: FontWeight.bold,
                                fontSize: 14)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(_userName,
                        style: const TextStyle(
                            fontSize: 11, color: Color(0xFFC8E6E3))),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton(
                onPressed: _logout,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFFF4444), width: 1),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: const Text('LOGOUT',
                    style: TextStyle(fontSize: 11, color: Color(0xFFFF4444))),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _logout() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    await auth.logout();
    if (mounted) Navigator.pushReplacementNamed(context, '/login');
  }

  // ---------------------------------------------------------------------------
  // Camera Panel with Overlay
  // ---------------------------------------------------------------------------
  Widget _buildCameraPanel() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('// VISION FEED — REAL-TIME INSPECTION',
              style: TextStyle(
                  fontSize: 12,
                  letterSpacing: 3,
                  color: Color(0xFF00FFE7),
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          // Camera preview with overlay
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(
                    color: const Color(0xFF00FFE7).withOpacity(0.2)),
              ),
              child: Stack(
                children: [
                  if (_camActive && _cameraController != null)
                    CameraPreview(_cameraController!)
                  else
                    Container(
                      color: const Color(0xFF010A0E),
                      child: const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.videocam_off,
                                size: 48, color: Colors.white24),
                            SizedBox(height: 8),
                            Text('NO CAMERA SIGNAL',
                                style: TextStyle(
                                    color: Colors.white24,
                                    fontFamily: 'ShareTechMono')),
                          ],
                        ),
                      ),
                    ),
                  // Scan sweep animation
                  if (_isScanning)
                    Positioned.fill(
                      child: IgnorePointer(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                const Color(0xFF00FFE7).withOpacity(0.1),
                                Colors.transparent,
                              ],
                              stops: const [0.0, 0.5, 1.0],
                            ),
                          ),
                          child: const AnimatedScanSweep(),
                        ),
                      ),
                    ),
                  // Corner brackets
                  ..._buildCornerBrackets(),
                  // Detection bounding box
                  if (_camActive &&
                      _currentResult != InspectionResult.pending &&
                      _currentResult != InspectionResult.scanning)
                    Positioned.fromRect(
                      rect: _detectBox,
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: _currentResult == InspectionResult.ok
                                ? const Color(0xFF00FFE7)
                                : const Color(0xFFFF4444),
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: (_currentResult == InspectionResult.ok
                                      ? const Color(0xFF00FFE7)
                                      : const Color(0xFFFF4444))
                                  .withOpacity(0.4),
                              blurRadius: 14,
                            ),
                          ],
                        ),
                        child: Align(
                          alignment: Alignment.topLeft,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            margin: const EdgeInsets.only(top: -22, left: -1),
                            decoration: BoxDecoration(
                              color: _currentResult == InspectionResult.ok
                                  ? const Color(0xFF00FFE7)
                                  : const Color(0xFFFF4444),
                            ),
                            child: Text(
                              _currentResult == InspectionResult.ok
                                  ? '✓ OK'
                                  : '⚠ DEFECT — PICK',
                              style: TextStyle(
                                fontSize: 10,
                                fontFamily: 'ShareTechMono',
                                color: _currentResult == InspectionResult.ok
                                    ? const Color(0xFF020812)
                                    : Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Result badge
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.2)),
              color: const Color(0xFF00FFE7).withOpacity(0.03),
            ),
            child: Row(
              children: [
                Icon(
                  _currentResult == InspectionResult.ok
                      ? Icons.check_circle
                      : _currentResult == InspectionResult.defect
                          ? Icons.warning_amber_rounded
                          : Icons.timelapse,
                  color: _resultColor(_currentResult),
                  size: 32,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('LAST INSPECTION RESULT',
                          style: TextStyle(
                              fontSize: 10,
                              letterSpacing: 2,
                              color: Colors.white38)),
                      Text(_resultText(_currentResult),
                          style: TextStyle(
                              fontSize: 20,
                              fontFamily: 'ShareTechMono',
                              color: _resultColor(_currentResult),
                              shadows: [
                                Shadow(
                                    color: _resultColor(_currentResult),
                                    blurRadius: 12)
                              ])),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('CONF ${_currentConfidence.toInt()}%',
                        style: const TextStyle(
                            fontSize: 12,
                            fontFamily: 'ShareTechMono',
                            color: Colors.white38)),
                    const SizedBox(height: 4),
                    Container(
                      width: 80,
                      height: 3,
                      decoration: BoxDecoration(
                        color: const Color(0xFF00FFE7).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: FractionallySizedBox(
                        widthFactor: _currentConfidence / 100,
                        child: Container(
                          decoration: BoxDecoration(
                            color: _resultColor(_currentResult),
                            borderRadius: BorderRadius.circular(2),
                            boxShadow: [
                              BoxShadow(
                                  color: _resultColor(_currentResult),
                                  blurRadius: 6)
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Controls
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ElevatedButton.icon(
                onPressed: _camActive ? null : _initCamera,
                icon: const Icon(Icons.play_arrow, size: 16),
                label: const Text('START CAMERA'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00FFE7),
                  foregroundColor: const Color(0xFF020812),
                ),
              ),
              OutlinedButton.icon(
                onPressed: _camActive ? _stopCamera : null,
                icon: const Icon(Icons.stop, size: 16),
                label: const Text('STOP'),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFFF4444)),
                  foregroundColor: const Color(0xFFFF4444),
                ),
              ),
              OutlinedButton.icon(
                onPressed: (_camActive && !_isScanning) ? _runInspection : null,
                icon: const Icon(Icons.camera_alt, size: 16),
                label: const Text('SCAN NOW'),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFA855F7)),
                  foregroundColor: const Color(0xFFA855F7),
                ),
              ),
              OutlinedButton.icon(
                onPressed: _camActive ? _toggleAutoMode : null,
                icon: Icon(
                    _autoMode ? Icons.flash_on : Icons.flash_off, size: 16),
                label: Text(_autoMode ? 'AUTO-ON' : 'AUTO'),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                      color: _autoMode
                          ? const Color(0xFFFF6B35)
                          : const Color(0xFF00FFE7).withOpacity(0.3)),
                  foregroundColor: _autoMode
                      ? const Color(0xFFFF6B35)
                      : const Color(0xFFC8E6E3),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _buildCornerBrackets() {
    const style = TextStyle(color: Color(0xFF00FFE7), fontSize: 20);
    return const [
      Positioned(top: 8, left: 8, child: Text('┌', style: style)),
      Positioned(top: 8, right: 8, child: Text('┐', style: style)),
      Positioned(bottom: 8, left: 8, child: Text('└', style: style)),
      Positioned(bottom: 8, right: 8, child: Text('┘', style: style)),
    ];
  }

  // ---------------------------------------------------------------------------
  // Stats Panel
  // ---------------------------------------------------------------------------
  Widget _buildStatsPanel() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('// INSPECTION STATS',
              style: TextStyle(
                  fontSize: 12,
                  letterSpacing: 3,
                  color: Color(0xFF00FFE7),
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 1,
            mainAxisSpacing: 1,
            childAspectRatio: 1.5,
            children: [
              _statCell('Total Scanned', '$_totalScanned'),
              _statCell('Defects Found', '$_totalDefects',
                  textColor: const Color(0xFFFF4444)),
              _statCell('Parts OK', '${_totalScanned - _totalDefects}'),
              _statCell('Picks Executed', '$_totalPicks',
                  textColor: const Color(0xFFA855F7)),
            ],
          ),
          const SizedBox(height: 16),
          // Defect rate gauge
          const Text('DEFECT RATE',
              style: TextStyle(
                  fontSize: 10, letterSpacing: 2, color: Colors.white38)),
          const SizedBox(height: 8),
          Container(
            height: 8,
            decoration: BoxDecoration(
              color: const Color(0xFF00FFE7).withOpacity(0.08),
              borderRadius: BorderRadius.circular(4),
            ),
            child: FractionallySizedBox(
              widthFactor: _defectRate / 100,
              child: Container(
                decoration: BoxDecoration(
                  color: _gaugeColor(_defectRate),
                  borderRadius: BorderRadius.circular(4),
                  boxShadow: [
                    BoxShadow(color: _gaugeColor(_defectRate), blurRadius: 6)
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text('${_defectRate.toStringAsFixed(1)}%',
              style: TextStyle(
                  fontSize: 12,
                  fontFamily: 'ShareTechMono',
                  color: _gaugeColor(_defectRate))),
          const SizedBox(height: 16),
          // Arm pick status
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border.all(
                  color: _pickStatus == PickStatus.picking
                      ? const Color(0xFFFF6B35)
                      : _pickStatus == PickStatus.error
                          ? const Color(0xFFFF4444)
                          : const Color(0xFF00FFE7).withOpacity(0.3)),
              color: _pickStatus == PickStatus.picking
                  ? const Color(0xFFFF6B35).withOpacity(0.06)
                  : _pickStatus == PickStatus.error
                      ? const Color(0xFFFF4444).withOpacity(0.06)
                      : Colors.transparent,
            ),
            child: Row(
              children: [
                const Icon(Icons.hardware, size: 32, color: Colors.white70),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ROBOT ARM — PICK STATUS',
                          style: TextStyle(
                              fontSize: 9,
                              letterSpacing: 2,
                              color: Colors.white38)),
                      Text(
                        _pickStatus == PickStatus.idle
                            ? '— IDLE / STANDBY'
                            : _pickStatus == PickStatus.picking
                                ? '▶ PICKING DEFECT...'
                                : _pickStatus == PickStatus.picked
                                    ? '✓ DEFECT REMOVED'
                                    : '✗ PICK ERROR',
                        style: TextStyle(
                          fontSize: 14,
                          fontFamily: 'ShareTechMono',
                          color: _pickStatus == PickStatus.picking
                              ? const Color(0xFFFF6B35)
                              : _pickStatus == PickStatus.picked
                                  ? const Color(0xFF00FFE7)
                                  : _pickStatus == PickStatus.error
                                      ? const Color(0xFFFF4444)
                                      : Colors.white38,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCell(String label, String value, {Color? textColor}) {
    return Container(
      padding: const EdgeInsets.all(12),
      color: const Color(0xFF020812),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 9, letterSpacing: 2, color: Colors.white38)),
          const SizedBox(height: 4),
          Text(value,
              style: TextStyle(
                  fontSize: 24,
                  fontFamily: 'ShareTechMono',
                  color: textColor ?? const Color(0xFF00FFE7),
                  shadows: [
                    Shadow(
                        color: textColor ?? const Color(0xFF00FFE7),
                        blurRadius: 8)
                  ])),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Log Panel
  // ---------------------------------------------------------------------------
  Widget _buildLogPanel() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00FFE7).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('// INSPECTION LOG',
              style: TextStyle(
                  fontSize: 12,
                  letterSpacing: 3,
                  color: Color(0xFF00FFE7),
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Expanded(
            child: _eventLog.isEmpty
                ? const Center(
                    child: Text('NO EVENTS YET',
                        style: TextStyle(
                            fontSize: 12,
                            letterSpacing: 2,
                            color: Colors.white24)),
                  )
                : ListView.separated(
                    itemCount: _eventLog.length,
                    separatorBuilder: (_, __) => Divider(
                        height: 1,
                        color: const Color(0xFF00FFE7).withOpacity(0.1)),
                    itemBuilder: (context, index) {
                      final e = _eventLog[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                border: Border.all(
                                    color: e.result == InspectionResult.ok
                                        ? const Color(0xFF00FFE7)
                                            .withOpacity(0.5)
                                        : const Color(0xFFFF4444)
                                            .withOpacity(0.5)),
                                borderRadius: BorderRadius.circular(2),
                              ),
                              child: Text(e.result == InspectionResult.ok
                                      ? 'OK'
                                      : 'DEFECT',
                                  style: TextStyle(
                                      fontSize: 10,
                                      fontFamily: 'ShareTechMono',
                                      color: e.result == InspectionResult.ok
                                          ? const Color(0xFF00FFE7)
                                          : const Color(0xFFFF4444))),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                      e.result == InspectionResult.ok
                                          ? 'PART OK'
                                          : (e.defectType ??
                                              'SURFACE DEFECT'),
                                      style: const TextStyle(
                                          fontSize: 11,
                                          color: Color(0xFFC8E6E3))),
                                  Text('${e.confidence.toInt()}%',
                                      style: const TextStyle(
                                          fontSize: 9,
                                          color: Colors.white38)),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                if (e.pickStatus == PickStatus.picked)
                                  const Icon(Icons.gesture,
                                      size: 14, color: Color(0xFFFF6B35)),
                                Text(e.time,
                                    style: const TextStyle(
                                        fontSize: 9, color: Colors.white24)),
                              ],
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

// Helper widget for scan sweep animation
class AnimatedScanSweep extends StatefulWidget {
  const AnimatedScanSweep({super.key});

  @override
  State<AnimatedScanSweep> createState() => _AnimatedScanSweepState();
}

class _AnimatedScanSweepState extends State<AnimatedScanSweep>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: ScanSweepPainter(_controller.value),
          size: Size.infinite,
        );
      },
    );
  }
}

class ScanSweepPainter extends CustomPainter {
  final double progress;
  ScanSweepPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Colors.transparent, Color(0xFF00FFE7), Colors.transparent],
        stops: [0.0, 0.5, 1.0],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(
      Rect.fromLTWH(0, size.height * progress, size.width, 2),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant ScanSweepPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

// Data model for inspection events
class InspectionEvent {
  final String id;
  final String time;
  final InspectionResult result;
  final double confidence;
  final String? defectType;
  PickStatus pickStatus;

  InspectionEvent({
    required this.id,
    required this.time,
    required this.result,
    required this.confidence,
    this.defectType,
    required this.pickStatus,
  });
}
