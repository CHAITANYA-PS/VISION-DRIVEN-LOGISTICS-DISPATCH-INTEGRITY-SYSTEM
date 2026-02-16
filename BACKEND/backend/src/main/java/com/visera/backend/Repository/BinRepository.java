package com.visera.backend.Repository;
import com.visera.backend.Entity.Bin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BinRepository extends JpaRepository<Bin, Long> {

    List<Bin> findByRackId(Long rackId);

//    boolean existsByCode(String code);
    
    @Query("SELECT b FROM Bin b WHERE b.rack.zone.id = :zoneId")
    List<Bin> findByRackZoneId(@Param("zoneId") Long zoneId);
}

