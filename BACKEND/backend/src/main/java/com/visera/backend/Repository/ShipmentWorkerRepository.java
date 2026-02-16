package com.visera.backend.Repository;

import com.visera.backend.Entity.Shipment;
import com.visera.backend.Entity.ShipmentWorker;
import com.visera.backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ShipmentWorkerRepository extends JpaRepository<ShipmentWorker, Long> {

    List<ShipmentWorker> findByShipment(Shipment shipment);

    List<ShipmentWorker> findByWorker(User worker);

//    @Modifying
//    @Transactional
//    void deleteByShipmentAndWorker(Shipment shipment, User worker);
//
//    @Modifying
//    @Transactional
//    void deleteByShipment(Shipment shipment);
}

