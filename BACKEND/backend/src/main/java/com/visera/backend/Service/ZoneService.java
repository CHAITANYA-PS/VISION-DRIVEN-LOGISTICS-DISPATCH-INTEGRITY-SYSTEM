package com.visera.backend.Service;
import com.visera.backend.Entity.Zone;
import com.visera.backend.DTOs.ZoneStatisticsDTO;
import com.visera.backend.DTOs.ZoneUpdateDTO;
import com.visera.backend.DTOs.ZoneProductAllocationDTO;
import java.util.List;

public interface ZoneService {
    Zone createZone(Zone zone);
    List<Zone> getAllZones();
    Zone getZoneById(Long zoneId);
    Zone updateZone(Long zoneId, ZoneUpdateDTO zoneUpdateDTO);
    void deleteZone(Long zoneId);
    List<ZoneStatisticsDTO> getAllZoneStatistics();
    List<ZoneProductAllocationDTO> getProductAllocationByZone(Long zoneId);
}
