package com.visera.backend.Service;

import com.visera.backend.DTOs.UserDTO;
import com.visera.backend.Entity.User;

import java.util.List;

public interface ShipmentWorkerService {
    void assignWorkers(int shipmentId, List<Integer> workerIds);
    void removeWorker(int shipmentId, int workerId);
    List<UserDTO> getAssignedWorkers(int shipmentId);
}







