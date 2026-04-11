import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/robot_state.dart';
import '../models/command_history.dart';
import '../services/api_service.dart';

class RobotProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  RobotState _state = RobotState.initial();
  List<CommandHistory> _history = [];
  int _commandCount = 0;
  bool _isSending = false;
  bool _isLoading = true;
  String? _errorMessage;

  RobotState get state => _state;
  List<CommandHistory> get history => _history;
  int get commandCount => _commandCount;
  bool get isSending => _isSending;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  RobotProvider() {
    loadState();
  }

  Future<void> loadState() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      print('🔄 Loading robot state...');
      final data = await _apiService.getRobotState();
      print('📦 Robot state response: $data');

      _state = RobotState(
        base: data['base'] ?? 90,
        shoulder: data['shoulder'] ?? 90,
        elbow: data['elbow'] ?? 90,
        gripper: data['gripper'] ?? 0,
      );
      print('✅ Robot state loaded: base=${_state.base}');
    } catch (e) {
      print('❌ Error loading state: $e');
      _errorMessage = 'Failed to load robot state';
      _state = RobotState.initial();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void updateServo(String joint, int value) {
    switch (joint) {
      case 'base':
        _state = _state.copyWith(base: value);
        break;
      case 'shoulder':
        _state = _state.copyWith(shoulder: value);
        break;
      case 'elbow':
        _state = _state.copyWith(elbow: value);
        break;
      case 'gripper':
        _state = _state.copyWith(gripper: value);
        break;
    }
    notifyListeners();
  }

  Future<bool> sendCommand(int? userId, {String? customName}) async {
    _isSending = true;
    _errorMessage = null;
    notifyListeners();

    _commandCount++;
    final commandName = customName ?? 'CMD-${_commandCount.toString().padLeft(3, '0')}';

    try {
      final result = await _apiService.sendCommand(
        userId: userId,
        baseAngle: _state.base,
        shoulderAngle: _state.shoulder,
        elbowAngle: _state.elbow,
        gripperAngle: _state.gripper,
        commandName: commandName,
      );

      if (result['success'] == true) {
        _addToHistory(commandName);
        _isSending = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = result['message'] ?? 'Command failed';
        _isSending = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      print('❌ Send command error: $e');
      _errorMessage = 'Connection error: $e';
      _isSending = false;
      notifyListeners();
      return false;
    }
  }

  void loadPreset(int base, int shoulder, int elbow, int gripper, String name) {
    print('📌 Loading preset: $name');
    print('   Base: $base°, Shoulder: $shoulder°, Elbow: $elbow°, Gripper: $gripper°');

    _state = RobotState(
      base: base,
      shoulder: shoulder,
      elbow: elbow,
      gripper: gripper,
    );
    notifyListeners();
  }

  Future<void> resetArm() async {
    _isSending = true;
    notifyListeners();

    try {
      await _apiService.resetRobot();
      _state = RobotState.initial();
      _addToHistory('RESET');
    } catch (e) {
      print('❌ Reset error: $e');
      _errorMessage = 'Reset failed';
    } finally {
      _isSending = false;
      notifyListeners();
    }
  }

  void _addToHistory(String commandName) {
    _history.insert(0, CommandHistory(
      commandName: commandName,
      base: _state.base,
      shoulder: _state.shoulder,
      elbow: _state.elbow,
      gripper: _state.gripper,
      timestamp: DateTime.now(),
    ));

    if (_history.length > 20) {
      _history.removeLast();
    }
    notifyListeners();
  }

  void clearHistory() {
    _history.clear();
    notifyListeners();
  }

  // Vision Inspection Methods
  Future<VisionResult> inspectVision(String base64Image) async {
    final response = await http.post(
      Uri.parse('${ApiService.baseUrl}/api/vision/inspect'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'image': base64Image}),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return VisionResult(
        isDefect: data['isDefect'] ?? false,
        confidence: (data['confidence'] ?? 0.0).toDouble(),
        defectType: data['defectType'],
      );
    } else {
      throw Exception('Vision API error');
    }
  }

  Future<bool> sendPickCommand({int? userId}) async {
    return sendCommand(
      userId,
      customName: 'AUTO-PICK',
    );
  }

  Future<void> returnHome(int? userId) async {
    _state = RobotState.initial();
    await sendCommand(
      userId,
      customName: 'RETURN-HOME',
    );
  }
}

// Data class
class VisionResult {
  final bool isDefect;
  final double confidence;
  final String? defectType;
  VisionResult({required this.isDefect, required this.confidence, this.defectType});
}
