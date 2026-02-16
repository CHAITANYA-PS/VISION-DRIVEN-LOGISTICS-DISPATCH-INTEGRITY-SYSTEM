package com.visera.backend.Service;
import com.visera.backend.Entity.ShipmentItem;
import java.util.List;

public interface ShipmentItemService {
    ShipmentItem createShipmentItem(ShipmentItem item);
    List<ShipmentItem> createBatchShipmentItems(List<ShipmentItem> items);
    ShipmentItem getShipmentItemById(int id);
    List<ShipmentItem> getItemsByShipment(int shipmentId);
    List<ShipmentItem> getItemsByAssignedWorker(Long workerId);
    ShipmentItem updateShipmentItem(int id, ShipmentItem item);
    void deleteShipmentItem(int id);
    ShipmentItem dispatchShipmentItem(Long shipmentItemId) throws RuntimeException;
}

