package com.visera.backend.Service;

import com.visera.backend.Entity.User;
import com.visera.backend.Repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository repo, PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User createUser(User user) {
        // Normalize role and encode password when creating users from admin UI
        if (user.getRole() != null) {
            user.setRole(user.getRole().toUpperCase());
        }
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return repo.save(user);
    }

    @Override
    public User getUserById(int id) {
        return repo.findById((long) id).orElse(null);
    }

    @Override
    public List<User> getAllUsers() {
        return repo.findAll();
    }

    @Override
    public List<User> getUsersByRole(String role) {
        return repo.findByRole(role.toUpperCase());
    }

    @Override
    public User updateUser(int id, User updatedUser) {
        return repo.findById((long) id).map(user -> {
            user.setName(updatedUser.getName());
            user.setEmail(updatedUser.getEmail());

            // Only update password if a new one is provided
            if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
            }

            if (updatedUser.getRole() != null) {
                user.setRole(updatedUser.getRole().toUpperCase());
            }

            return repo.save(user);
        }).orElse(null);
    }

    @Override
    public void deleteUser(int id) {
        repo.deleteById((long) id);
    }
}
