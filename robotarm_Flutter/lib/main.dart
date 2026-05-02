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
        title: 'ROBOT ARM CONTROL',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.light,
          primaryColor: const Color(0xFF1E40AF),
          scaffoldBackgroundColor: const Color(0xFFEBF3FC),
          textTheme: const TextTheme(
            bodyLarge: TextStyle(color: Color(0x991F2937)),
            bodyMedium: TextStyle(color: Color(0x991F2937)),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              foregroundColor: const Color(0xFFEBF3FC),
              backgroundColor: const Color(0xFF1E40AF),
              textStyle: const TextStyle(
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
          ),
          outlinedButtonTheme: OutlinedButtonThemeData(
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF1E40AF)),
              foregroundColor: const Color(0xFF1E40AF),
            ),
          ),
        ),
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