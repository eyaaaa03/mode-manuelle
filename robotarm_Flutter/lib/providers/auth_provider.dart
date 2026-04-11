import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _currentUser;
  bool _isLoading = false;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    notifyListeners();

    final result = await _apiService.login(username, password);

    _isLoading = false;
    if (result['success']) {
      _currentUser = User(
        id: result['userId'],
        username: result['username'],
        fullName: result['fullName'] ?? result['username'],
        email: result['email'] ?? '',
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isLoggedIn', true);
      await prefs.setString('username', _currentUser!.username);
      await prefs.setString('fullName', _currentUser!.fullName);

      notifyListeners();
      return true;
    }
    notifyListeners();
    return false;
  }

  Future<bool> signup(String fullName, String username, String email, String password) async {
    _isLoading = true;
    notifyListeners();

    final result = await _apiService.signup(fullName, username, email, password);

    _isLoading = false;
    notifyListeners();
    return result['success'];
  }

  Future<void> logout() async {
    await _apiService.logout();
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    _currentUser = null;
    notifyListeners();
  }
}