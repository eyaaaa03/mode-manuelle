package com.robotarm.service;

import com.robotarm.dto.AuthResponse;
import com.robotarm.dto.LoginRequest;
import com.robotarm.dto.SignupRequest;
import com.robotarm.model.User;
import com.robotarm.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return new AuthResponse(false, "Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(false, "Email already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // In production: use BCrypt
        user.setFullName(request.getFullName());

        User saved = userRepository.save(user);
        return new AuthResponse(true, "Account created successfully", saved.getId(), saved.getUsername(), saved.getFullName());
    }

    public AuthResponse login(LoginRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .map(user -> {
                    if (user.getPassword().equals(request.getPassword())) {
                        return new AuthResponse(true, "Login successful", user.getId(), user.getUsername(), user.getFullName());
                    }
                    return new AuthResponse(false, "Invalid credentials");
                })
                .orElse(new AuthResponse(false, "User not found"));
    }
}