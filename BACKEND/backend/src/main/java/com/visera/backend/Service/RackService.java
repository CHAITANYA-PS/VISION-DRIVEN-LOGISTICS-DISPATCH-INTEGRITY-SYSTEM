package com.visera.backend.Service;

import java.util.List;

import com.visera.backend.DTOs.RackCreateDTO;
import com.visera.backend.DTOs.RackUpdateDTO;
import com.visera.backend.DTOs.RackWithBinsDTO;
import com.visera.backend.Entity.Rack;

public interface RackService {
    Rack createRack(RackCreateDTO rackCreateDTO);
    Rack updateRack(Long rackId, RackUpdateDTO rackUpdateDTO);
    void deleteRack(Long rackId);
    List<Rack> getRacksByZone(Long zoneId);
    List<RackWithBinsDTO> getRacksWithBinsByZone(Long zoneId);
}

