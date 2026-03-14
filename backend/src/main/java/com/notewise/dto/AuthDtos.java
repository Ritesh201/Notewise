package com.notewise.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;

// ─── Auth ────────────────────────────────────────────────────────────────────

public class AuthDtos {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @Email(message = "Invalid email")
        @NotBlank(message = "Email is required")
        private String email;

        @Size(min = 6, message = "Password must be at least 6 characters")
        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private UserDto user;

        public AuthResponse(String token, UserDto user) {
            this.token = token;
            this.user = user;
        }
    }

    @Data
    public static class UserDto {
        private Long id;
        private String email;
        private String name;

        public UserDto(Long id, String email, String name) {
            this.id = id;
            this.email = email;
            this.name = name;
        }
    }
}
