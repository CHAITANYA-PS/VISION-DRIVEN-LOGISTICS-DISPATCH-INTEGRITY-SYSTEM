package com.visera.backend.Service;


import com.visera.backend.Entity.User;

import java.util.List;

public interface UserService {
    User createUser(User user);
    User getUserById(int id);
    List<User> getAllUsers();
    List<User> getUsersByRole(String role);
    User updateUser(int id, User user);
    void deleteUser(int id);
}

