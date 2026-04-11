import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();

    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic),
    );

    _animationController.forward();

    // REMOVED: _autoNavigate() - No more automatic navigation
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
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
              Color(0xFF020812),
              Color(0xFF0A1A2A),
              Color(0xFF020812),
            ],
          ),
        ),
        child: Stack(
          children: [
            // Animated grid background
            _buildGridBackground(),

            // Glowing orbs
            _buildGlowingOrbs(),

            // Scanline effect
            _buildScanline(),

            // Main content
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // System Status Badge
                        FadeTransition(
                          opacity: _fadeAnimation,
                          child: SlideTransition(
                            position: _slideAnimation,
                            child: _buildSystemStatus(),
                          ),
                        ),
                        const SizedBox(height: 40),

                        // Main Title
                        FadeTransition(
                          opacity: _fadeAnimation,
                          child: SlideTransition(
                            position: _slideAnimation,
                            child: _buildMainTitle(),
                          ),
                        ),
                        const SizedBox(height: 30),

                        // Description
                        FadeTransition(
                          opacity: _fadeAnimation,
                          child: SlideTransition(
                            position: _slideAnimation,
                            child: _buildDescription(),
                          ),
                        ),
                        const SizedBox(height: 50),

                        // Buttons
                        FadeTransition(
                          opacity: _fadeAnimation,
                          child: SlideTransition(
                            position: _slideAnimation,
                            child: _buildButtons(),
                          ),
                        ),
                        const SizedBox(height: 40),

                        // Footer
                        FadeTransition(
                          opacity: _fadeAnimation,
                          child: _buildFooter(),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGridBackground() {
    return CustomPaint(
      painter: GridPainter(),
      size: Size.infinite,
    );
  }

  Widget _buildGlowingOrbs() {
    return Stack(
      children: [
        // Orb 1 - Top left
        TweenAnimationBuilder(
          tween: Tween<double>(begin: 0, end: 1),
          duration: const Duration(seconds: 8),
          builder: (context, value, child) {
            return Positioned(
              top: -100 + (50 * value),
              left: -100 + (30 * value),
              child: Container(
                width: 400,
                height: 400,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF00FFE7).withValues(alpha: 0.08),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            );
          },
        ),

        // Orb 2 - Bottom right
        TweenAnimationBuilder(
          tween: Tween<double>(begin: 0, end: 1),
          duration: const Duration(seconds: 12),
          builder: (context, value, child) {
            return Positioned(
              bottom: -100 + (50 * value),
              right: -100 + (30 * value),
              child: Container(
                width: 350,
                height: 350,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFFF6B35).withValues(alpha: 0.08),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildScanline() {
    return TweenAnimationBuilder(
      tween: Tween<double>(begin: -0.1, end: 1.1),
      duration: const Duration(seconds: 8),
      builder: (context, value, child) {
        return Positioned(
          top: MediaQuery.of(context).size.height * value,
          left: 0,
          right: 0,
          child: Container(
            height: 2,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  const Color(0xFF00FFE7).withValues(alpha: 0.4),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSystemStatus() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00FFE7).withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(20),
        color: const Color(0xFF00FFE7).withValues(alpha: 0.05),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 8,
            height: 8,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: Color(0xFF00FFE7),
                shape: BoxShape.circle,
              ),
            ),
          ),
          SizedBox(width: 8),
          Text(
            'SYSTEM ONLINE',
            style: TextStyle(
              fontSize: 10,
              letterSpacing: 2,
              color: Color(0xFF00FFE7),
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainTitle() {
    return const Column(
      children: [
        Text(
          'CONTROLL',
          style: TextStyle(
            fontSize: 48,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 4,
          ),
        ),
        SizedBox(height: 8),
        Text(
          'ROBOT ARM',
          style: TextStyle(
            fontSize: 52,
            fontWeight: FontWeight.bold,
            color: Color(0xFF00FFE7),
            letterSpacing: 6,
          ),
        ),
        SizedBox(height: 16),
        SizedBox(
          child: DecoratedBox(
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Color(0xFF00FFE7), width: 0.5),
                top: BorderSide(color: Color(0xFF00FFE7), width: 0.5),
                left: BorderSide(color: Color(0xFF00FFE7), width: 0.5),
                right: BorderSide(color: Color(0xFF00FFE7), width: 0.5),
              ),
            ),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                'CONTROL INTERFACE FOR ROBOT ARM',
                style: TextStyle(
                  fontSize: 12,
                  letterSpacing: 3,
                  color: Color(0xFFC8E6E3),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDescription() {
    return Container(
      constraints: const BoxConstraints(maxWidth: 500),
      child: const Text(
        'Advanced 4-degree-of-freedom robotic arm control system with precision servo control',
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 14,
          height: 1.6,
          color: Color(0xFFC8E6E3),
        ),
      ),
    );
  }

  Widget _buildButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // For mobile screens, use Column layout
          LayoutBuilder(
            builder: (context, constraints) {
              // If screen width is less than 500px, stack buttons vertically
              if (constraints.maxWidth < 500) {
                return Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pushReplacementNamed(context, '/signup');
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00FFE7),
                          foregroundColor: const Color(0xFF020812),
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                          textStyle: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        child: const Text('REGISTER USER'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.pushReplacementNamed(context, '/login');
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFF00FFE7)),
                          foregroundColor: const Color(0xFF00FFE7),
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                          textStyle: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        child: const Text('ACCESS USER'),
                      ),
                    ),
                  ],
                );
              }
              // For wider screens, use Row layout
              return Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pushReplacementNamed(context, '/signup');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00FFE7),
                        foregroundColor: const Color(0xFF020812),
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                        textStyle: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      child: const Text('INITIALIZE SYSTEM'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pushReplacementNamed(context, '/login');
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF00FFE7)),
                        foregroundColor: const Color(0xFF00FFE7),
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                        textStyle: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      child: const Text('ACCESS PANEL'),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return const Column(
      children: [
        Divider(
          color: Color(0xFF00FFE7),
          height: 1,
          thickness: 0.5,
        ),
        SizedBox(height: 20),
        Text(
          'ROBOT ARM CONTROL SYSTEM',
          style: TextStyle(
            fontSize: 10,
            letterSpacing: 2,
            color: Color(0xFFC8E6E3),
          ),
        ),
        SizedBox(height: 8),
        Text(
          '4DOF ROBOT ARM INTERFACE',
          style: TextStyle(
            fontSize: 10,
            letterSpacing: 2,
            color: Color(0xFFC8E6E3),
          ),
        ),
      ],
    );
  }
}

// Custom painter for grid background
class GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF00FFE7).withValues(alpha: 0.03)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    const gridSize = 50.0;

    // Draw vertical lines
    for (double x = 0; x < size.width; x += gridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    // Draw horizontal lines
    for (double y = 0; y < size.height; y += gridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}