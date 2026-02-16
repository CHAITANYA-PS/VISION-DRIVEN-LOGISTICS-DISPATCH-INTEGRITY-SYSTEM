package com.visera.backend.Repository;

import com.visera.backend.Entity.ShipmentItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShipmentItemRepository extends JpaRepository<ShipmentItem, Long> {

    List<ShipmentItem> findByShipmentId(Long shipmentId);

    List<ShipmentItem> findByStatus(String status);

    List<ShipmentItem> findBySkuIdIn(List<Long> skuIds);

//    List<ShipmentItem> findBySkuId(Long skuId);
}
