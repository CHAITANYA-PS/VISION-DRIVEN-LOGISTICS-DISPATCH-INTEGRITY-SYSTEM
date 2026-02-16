package com.visera.backend.Controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.visera.backend.DTOs.UserDTO;
import com.visera.backend.Entity.User;
import com.visera.backend.Repository.UserRepository;
import com.visera.backend.Service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    // Create user → ADMIN only
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    // Get user by id → ADMIN & SUPERVISOR
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable int id) {
        User user = userService.getUserById(id);
        return (user != null) ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    // Update user → ADMIN & SUPERVISOR (supervisors can only update workers)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable int id, @RequestBody User updated) {
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();
        
        // Check if current user is supervisor
        boolean isSupervisor = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(auth -> auth.equals("ROLE_SUPERVISOR"));
        
        // Get the user being updated
        User existingUser = userService.getUserById(id);
        if (existingUser == null) {
            return ResponseEntity.notFound().build();
        }
        
        // If supervisor, ensure they can only update workers
        if (isSupervisor && !"WORKER".equalsIgnoreCase(existingUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Supervisors can only update workers.");
        }
        
        // If supervisor, prevent role changes
        if (isSupervisor && updated.getRole() != null && 
            !updated.getRole().equalsIgnoreCase(existingUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Supervisors cannot change user roles.");
        }
        
        // Update the user
        User user = userService.updateUser(id, updated);
        return (user != null) ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    // Delete user → ADMIN only
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable int id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // Get all users DTO → ADMIN only
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/getallusersDTOs")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(
                userService.getAllUsers().stream().map(this::mapToDTO).toList()
        );
    }

    // Get workers (users with WORKER role) → ADMIN & SUPERVISOR
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @GetMapping("/workers")
    public ResponseEntity<List<UserDTO>> getWorkers() {
        return ResponseEntity.ok(
                userService.getUsersByRole("WORKER").stream().map(this::mapToDTO).toList()
        );
    }

    private UserDTO mapToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        return dto;
    }
}
