package com.visera.backend.Service;
import com.visera.backend.Entity.Shipment;
import java.util.List;

public interface ShipmentService {
    Shipment createShipment(Shipment shipment);
    Shipment getShipmentById(int id);
    List<Shipment> getAllShipments();
    Shipment updateShipment(int id, Shipment shipment);
    void deleteShipment(int id);

    // Assign a shipment to a user
    Shipment assignShipment(int shipmentId, int userId);
    
    // Get shipments assigned to a worker
    List<Shipment> getShipmentsByAssignedWorker(Long workerId);
}
