import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _errorMessage;
  String? _successMessage;
  int _passwordStrength = 0;

  // Email validation flags
  bool _isEmailValid = false;
  String? _emailError;

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  // Email validation function
  bool _validateEmail(String email) {
    if (email.isEmpty) {
      _emailError = null;
      return false;
    }

    // Check if email contains @
    if (!email.contains('@')) {
      _emailError = 'Email must contain @ symbol';
      return false;
    }

    // Check if email has something before @
    final parts = email.split('@');
    if (parts.length != 2) {
      _emailError = 'Invalid email format';
      return false;
    }

    if (parts[0].isEmpty) {
      _emailError = 'Email must have text before @';
      return false;
    }

    if (parts[1].isEmpty) {
      _emailError = 'Email must have domain after @';
      return false;
    }

    // Check if domain has . and something after it
    if (!parts[1].contains('.')) {
      _emailError = 'Email domain must contain . (e.g., gmail.com)';
      return false;
    }

    final domainParts = parts[1].split('.');
    if (domainParts.length < 2) {
      _emailError = 'Invalid domain format';
      return false;
    }

    if (domainParts.last.isEmpty) {
      _emailError = 'Invalid domain extension';
      return false;
    }

    // Check for spaces
    if (email.contains(' ')) {
      _emailError = 'Email cannot contain spaces';
      return false;
    }

    // Check for invalid characters
    final RegExp emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );

    if (!emailRegex.hasMatch(email)) {
      _emailError = 'Invalid email format (e.g., user@example.com)';
      return false;
    }

    _emailError = null;
    return true;
  }

  void _onEmailChanged(String value) {
    setState(() {
      _isEmailValid = _validateEmail(value);
    });
  }

  void _checkPasswordStrength(String password) {
    int score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (RegExp(r'[A-Z]').hasMatch(password)) score++;
    if (RegExp(r'[0-9]').hasMatch(password)) score++;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(password)) score++;
    setState(() => _passwordStrength = score);
  }

  Future<void> _handleSignup() async {
    // Validate all fields
    if (_fullNameController.text.isEmpty ||
        _usernameController.text.isEmpty ||
        _emailController.text.isEmpty ||
        _passwordController.text.isEmpty) {
      setState(() => _errorMessage = 'All fields are required');
      return;
    }

    // Validate email format
    if (!_validateEmail(_emailController.text)) {
      setState(() => _errorMessage = _emailError ?? 'Invalid email format');
      return;
    }

    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _errorMessage = 'Passwords do not match');
      return;
    }

    if (_passwordController.text.length < 6) {
      setState(() => _errorMessage = 'Password must be at least 6 characters');
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.signup(
      _fullNameController.text.trim(),
      _usernameController.text.trim(),
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (success) {
      setState(() => _successMessage = 'Account created! Redirecting...');
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) Navigator.pop(context);
      });
    } else {
      setState(() => _errorMessage = 'Signup failed');
    }
  }

  Color _getStrengthColor() {
    if (_passwordStrength <= 1) return Colors.red;
    if (_passwordStrength == 2) return Colors.orange;
    if (_passwordStrength == 3) return Colors.yellow;
    if (_passwordStrength == 4) return Colors.lightGreen;
    return Colors.green;
  }

  String _getStrengthText() {
    if (_passwordStrength <= 1) return 'WEAK';
    if (_passwordStrength == 2) return 'FAIR';
    if (_passwordStrength == 3) return 'MODERATE';
    if (_passwordStrength == 4) return 'STRONG';
    return 'EXCELLENT';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFEBF3FC),
              Color(0xFFEBF3FC),
              Color(0xFFEBF3FC),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFF1E40AF).withOpacity(0.15)),
                  color: Colors.white.withOpacity(0.9),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Robot Arm ',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E40AF),
                        letterSpacing: 3,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'REQUEST ACCESS',
                      style: TextStyle(
                        fontSize: 16,
                        color: Color(0x991F2937),
                      ),
                    ),
                    const SizedBox(height: 10),

                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 20),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.red.withOpacity(0.5)),
                          color: Colors.red.withOpacity(0.08),
                        ),
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Color(0xFFFF8080), fontSize: 12),
                        ),
                      ),

                    if (_successMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 20),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.green.withOpacity(0.5)),
                          color: Colors.green.withOpacity(0.08),
                        ),
                        child: Text(
                          _successMessage!,
                          style: const TextStyle(color: Color(0xFF00FF96), fontSize: 12),
                        ),
                      ),

                    // Name row
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _fullNameController,
                            label: 'Full Name',
                            icon: '◈',
                            placeholder: 'Full_name',
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: _usernameController,
                            label: 'Username',
                            icon: '@',
                            placeholder: 'Username',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Email field with validation
                    _buildEmailField(),
                    const SizedBox(height: 20),

                    // Password
                    _buildTextField(
                      controller: _passwordController,
                      label: 'CREATE PASSWORD',
                      icon: '🔐',
                      placeholder: 'Min 6 characters',
                      obscureText: _obscurePassword,
                      onChanged: _checkPasswordStrength,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off : Icons.visibility,
                          color: const Color(0xFF1E40AF).withOpacity(0.5),
                          size: 20,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),

                    // Password strength
                    if (_passwordController.text.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Column(
                          children: [
                            LinearProgressIndicator(
                              value: _passwordStrength / 5,
                              backgroundColor: Colors.grey.withOpacity(0.2),
                              valueColor: AlwaysStoppedAnimation<Color>(_getStrengthColor()),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _getStrengthText(),
                              style: TextStyle(
                                fontSize: 10,
                                color: _getStrengthColor(),
                                letterSpacing: 2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 20),

                    // Confirm password
                    _buildTextField(
                      controller: _confirmPasswordController,
                      label: 'Confirm PASSWORD',
                      icon: '🔐',
                      placeholder: 'Repeat access code',
                      obscureText: _obscureConfirm,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirm ? Icons.visibility_off : Icons.visibility,
                          color: const Color(0xFF1E40AF).withOpacity(0.5),
                          size: 20,
                        ),
                        onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                      ),
                    ),
                    const SizedBox(height: 30),

                    // Signup button
                    Consumer<AuthProvider>(
                      builder: (context, authProvider, child) {
                        return SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: authProvider.isLoading ? null : _handleSignup,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              backgroundColor: const Color(0xFFDC2626), //aham whda
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            child: authProvider.isLoading
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : const Text(
                                    'REGISTER USER',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 2,
                                    ),
                                  ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 20),

                    // Footer
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Already have access?',
                          style: TextStyle(color: Color(0x991F2937), fontSize: 12),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text(
                            'LOGIN HERE',
                            style: TextStyle(color: Color(0xFF1E40AF), fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Custom email field with @ validation
  Widget _buildEmailField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'EMAIL ADDRESS',
              style: TextStyle(
                fontSize: 10,
                letterSpacing: 3,
                color: Color(0xFF1E40AF),
              ),
            ),
            const SizedBox(width: 8),
            if (_emailController.text.isNotEmpty)
              Text(
                _isEmailValid ? '✓ Valid' : '✗ Invalid',
                style: TextStyle(
                  fontSize: 9,
                  color: _isEmailValid ? Colors.green : Colors.red,
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: _emailError != null
                  ? Colors.red
                  : (_isEmailValid && _emailController.text.isNotEmpty
                      ? Colors.green
                      : const Color(0xFF1E40AF).withOpacity(0.2)),
            ),
          ),
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: const Text('✉', style: TextStyle(color: Color(0xFF1E40AF))),
              ),
              Expanded(
                child: TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: Color(0x991F2937)),
                  onChanged: (value) {
                    _onEmailChanged(value);
                    // You can also trigger signup button validation here
                  },
                  decoration: InputDecoration(
                    hintText: 'operator@domain.com',
                    hintStyle: TextStyle(color: const Color(0x991F2937).withOpacity(0.3)),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    suffixIcon: _emailController.text.isNotEmpty
                        ? Icon(
                            _isEmailValid ? Icons.check_circle : Icons.error,
                            color: _isEmailValid ? Colors.green : Colors.red,
                            size: 20,
                          )
                        : null,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (_emailError != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              _emailError!,
              style: const TextStyle(
                fontSize: 10,
                color: Colors.red,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String icon,
    required String placeholder,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
    Function(String)? onChanged,
    Widget? suffixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 10,
            letterSpacing: 3,
            color: Color(0xFF1E40AF),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF1E40AF).withOpacity(0.2)),
          ),
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(icon, style: const TextStyle(color: Color(0xFF1E40AF))),
              ),
              Expanded(
                child: TextField(
                  controller: controller,
                  obscureText: obscureText,
                  keyboardType: keyboardType,
                  onChanged: onChanged,
                  style: const TextStyle(color: Color(0x991F2937)),
                  decoration: InputDecoration(
                    hintText: placeholder,
                    hintStyle: TextStyle(color: const Color(0x991F2937).withOpacity(0.3)),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    suffixIcon: suffixIcon,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}