import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/welcome_screen.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/vision_inspection_screen.dart';
import 'providers/auth_provider.dart';
import 'providers/robot_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final isLoggedIn = prefs.getBool('isLoggedIn') ?? false;

  runApp(MyApp(isLoggedIn: isLoggedIn));
}

class MyApp extends StatelessWidget {
  final bool isLoggedIn;

  const MyApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => RobotProvider()),
      ],
      child: MaterialApp(
        title: 'MECHAARM',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          primaryColor: const Color(0xFF00FFE7),
          scaffoldBackgroundColor: const Color(0xFF020812),
          textTheme: const TextTheme(
            bodyLarge: TextStyle(color: Color(0xFFC8E6E3)),
            bodyMedium: TextStyle(color: Color(0xFFC8E6E3)),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              foregroundColor: const Color(0xFF020812),
              backgroundColor: const Color(0xFF00FFE7),
              textStyle: const TextStyle(
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
          ),
          outlinedButtonTheme: OutlinedButtonThemeData(
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF00FFE7)),
              foregroundColor: const Color(0xFF00FFE7),
            ),
          ),
        ),
        // Show Welcome Screen first, then check login status
        home: const WelcomeScreen(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/signup': (context) => const SignupScreen(),
          '/dashboard': (context) => const DashboardScreen(),
          '/vision': (context) => const VisionInspectionScreen(),
        },
      ),
    );
  }
}