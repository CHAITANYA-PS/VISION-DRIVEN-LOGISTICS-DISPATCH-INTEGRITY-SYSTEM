package com.visera.backend.Service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.visera.backend.Entity.Shipment;
import com.visera.backend.Entity.User;
import com.visera.backend.Repository.ShipmentRepository;
import com.visera.backend.Repository.ShipmentWorkerRepository;
import com.visera.backend.Repository.ShipmentItemRepository;
import com.visera.backend.Repository.UserRepository;
import com.visera.backend.Repository.IssueRepository;

@Service
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository repo;
    private final UserRepository userRepository;
    private final ShipmentWorkerRepository shipmentWorkerRepository;
    private final ShipmentItemRepository shipmentItemRepository;
    private final IssueRepository issueRepository;

    public ShipmentServiceImpl(
            ShipmentRepository repo, 
            UserRepository userRepository,
            ShipmentWorkerRepository shipmentWorkerRepository,
            ShipmentItemRepository shipmentItemRepository,
            IssueRepository issueRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.shipmentWorkerRepository = shipmentWorkerRepository;
        this.shipmentItemRepository = shipmentItemRepository;
        this.issueRepository = issueRepository;
    }

    @Override
    public Shipment createShipment(Shipment shipment) {
        // Ensure createdBy user is properly loaded from database
        if (shipment.getCreatedBy() != null && shipment.getCreatedBy().getId() != null) {
            User user = userRepository.findById(shipment.getCreatedBy().getId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + shipment.getCreatedBy().getId()));
            shipment.setCreatedBy(user);
        }
        return repo.save(shipment);
    }

    @Override
    public Shipment getShipmentById(int id) {
        return repo.findById((long) id).orElse(null);
    }

    @Override
    public List<Shipment> getAllShipments() {
        return repo.findAll();
    }

    @Override
    @Transactional
    public Shipment updateShipment(int id, Shipment updated) {
        return repo.findById((long) id).map(shipment -> {
            // Update shipment type
            if (updated.getShipmentType() != null) {
                shipment.setShipmentType(updated.getShipmentType());
            }
            
            // Update status
            if (updated.getStatus() != null) {
                shipment.setStatus(updated.getStatus());
            }
            
            // DO NOT update createdBy - it should never change after creation
            // The existing createdBy from the database is preserved
            
            // Only update assignedTo if it's provided in the payload
            if (updated.getAssignedTo() != null && updated.getAssignedTo().getId() != null) {
                User assignedUser = userRepository.findById(updated.getAssignedTo().getId())
                        .orElseThrow(() -> new RuntimeException("User not found with id: " + updated.getAssignedTo().getId()));
                shipment.setAssignedTo(assignedUser);
            }
            
            // Update deadline if provided
            if (updated.getDeadline() != null) {
                shipment.setDeadline(updated.getDeadline());
            }
            
            return repo.save(shipment);
        }).orElse(null);
    }

    @Override
    @Transactional
    public void deleteShipment(int id) {
        Shipment shipment = repo.findById((long) id)
                .orElseThrow(() -> new RuntimeException("Shipment not found with id: " + id));
        
        // Delete related issues first
        List<com.visera.backend.Entity.Issue> issues = issueRepository.findByShipmentId((long) id);
        if (!issues.isEmpty()) {
            issueRepository.deleteAll(issues);
        }
        
        // Delete related shipment items
        shipmentItemRepository.findByShipmentId((long) id).forEach(item -> {
            shipmentItemRepository.deleteById(item.getId());
        });
        
        // Delete the shipment (cascade will handle shipment_workers)
        repo.deleteById((long) id);
    }

    @Override
    public Shipment assignShipment(int shipmentId, int userId) {
        Shipment shipment = repo.findById((long) shipmentId).orElse(null);
        if (shipment == null) {
            return null;
        }
        
        User user = userRepository.findById((long) userId).orElse(null);
        if (user == null) {
            return null;
        }
        
        shipment.setAssignedTo(user);
        return repo.save(shipment);
    }

    @Override
    public List<Shipment> getShipmentsByAssignedWorker(Long workerId) {
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found with id: " + workerId));
        
        // Get all shipments assigned to this worker via ShipmentWorker
        List<com.visera.backend.Entity.ShipmentWorker> assignments = shipmentWorkerRepository.findByWorker(worker);
        
        // Extract shipments from assignments
        return assignments.stream()
                .map(com.visera.backend.Entity.ShipmentWorker::getShipment)
                .filter(shipment -> shipment != null)
                .collect(java.util.stream.Collectors.toList());
    }
}

