import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class ApiService {
  static const String baseUrl = AppConfig.baseUrl;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Helper to get headers with auth token
  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Login
  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'username': username,
          'password': password,
        }),
      );

      print('Login response status: ${response.statusCode}');
      print('Login response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        // Store token if your backend returns one
        if (data['token'] != null) {
          await _storage.write(key: 'token', value: data['token']);
        }
        if (data['userId'] != null) {
          await _storage.write(key: 'userId', value: data['userId'].toString());
        }
        return data;
      } else {
        return {'success': false, 'message': 'Login failed: ${response.statusCode}'};
      }
    } catch (e) {
      print('Login error: $e');
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Signup
  Future<Map<String, dynamic>> signup(String fullName, String username, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/signup'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'fullName': fullName,
          'username': username,
          'email': email,
          'password': password,
        }),
      );

      print('Signup response status: ${response.statusCode}');
      print('Signup response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        return {'success': false, 'message': 'Signup failed: ${response.statusCode}'};
      }
    } catch (e) {
      print('Signup error: $e');
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Send robot command
  Future<Map<String, dynamic>> sendCommand({
    int? userId,
    required int baseAngle,
    required int shoulderAngle,
    required int elbowAngle,
    required int gripperAngle,
    required String commandName,
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/robot/command'),
        headers: headers,
        body: json.encode({
          'userId': userId,
          'baseAngle': baseAngle,
          'shoulderAngle': shoulderAngle,
          'elbowAngle': elbowAngle,
          'gripperAngle': gripperAngle,
          'commandName': commandName,
        }),
      );

      print('Send command response: ${response.statusCode}');
      print('Send command body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        return {'success': false, 'message': 'Command failed'};
      }
    } catch (e) {
      print('Send command error: $e');
      return {'success': false, 'message': 'Connection error'};
    }
  }

  // Get robot state
  Future<Map<String, dynamic>> getRobotState() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/robot/state'),
        headers: headers,
      );

      print('Get state response: ${response.statusCode}');
      print('Get state body: ${response.body}');

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        return {'base': 90, 'shoulder': 90, 'elbow': 90, 'gripper': 0};
      }
    } catch (e) {
      print('Get state error: $e');
      return {'base': 90, 'shoulder': 90, 'elbow': 90, 'gripper': 0};
    }
  }

  // Get command history
  Future<List<dynamic>> getCommandHistory(int userId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/robot/history/$userId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return [];
    } catch (e) {
      print('Get history error: $e');
      return [];
    }
  }

  // Reset robot
  Future<Map<String, dynamic>> resetRobot() async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/robot/reset'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return {'success': false};
    } catch (e) {
      print('Reset error: $e');
      return {'success': false};
    }
  }

  // Logout
  Future<void> logout() async {
    await _storage.delete(key: 'token');
    await _storage.delete(key: 'userId');
  }
}