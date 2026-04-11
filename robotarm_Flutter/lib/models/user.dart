class User {
  final int? id;
  final String username;
  final String fullName;
  final String email;

  User({
    this.id,
    required this.username,
    required this.fullName,
    required this.email,
  });

  Map<String, dynamic> toJson() => {
    'username': username,
    'fullName': fullName,
    'email': email,
  };

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['userId'] ?? json['id'],
      username: json['username'],
      fullName: json['fullName'] ?? json['username'],
      email: json['email'] ?? '',
    );
  }
}