package com.visera.backend.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.visera.backend.DTOs.BinAllocation;
import com.visera.backend.DTOs.PickingStatisticsDTO;
import com.visera.backend.DTOs.PutawayStatisticsDTO;
import com.visera.backend.Entity.Bin;
import com.visera.backend.Entity.InventoryStock;
import com.visera.backend.Entity.Shipment;
import com.visera.backend.Entity.ShipmentItem;
import com.visera.backend.Entity.Sku;
import com.visera.backend.Entity.Task;
import com.visera.backend.Repository.BinRepository;
import com.visera.backend.Repository.InventoryStockRepository;
import com.visera.backend.Repository.ShipmentItemRepository;
import com.visera.backend.Repository.ShipmentRepository;
import com.visera.backend.Repository.TaskRepository;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository repo;
    private final InventoryStockService inventoryStockService;
    private final InventoryStockRepository inventoryStockRepository;
    private final BinRepository binRepository;
    private final ShipmentItemService shipmentItemService;
    private final ShipmentItemRepository shipmentItemRepository;
    private final ShipmentRepository shipmentRepository;
    private final ObjectMapper objectMapper;

    public TaskServiceImpl(
            TaskRepository repo,
            InventoryStockService inventoryStockService,
            InventoryStockRepository inventoryStockRepository,
            BinRepository binRepository,
            ShipmentItemService shipmentItemService,
            ShipmentItemRepository shipmentItemRepository,
            ShipmentRepository shipmentRepository) {
        this.repo = repo;
        this.inventoryStockService = inventoryStockService;
        this.inventoryStockRepository = inventoryStockRepository;
        this.binRepository = binRepository;
        this.shipmentItemService = shipmentItemService;
        this.shipmentItemRepository = shipmentItemRepository;
        this.shipmentRepository = shipmentRepository;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public Task createTask(Task task) {
        return repo.save(task);
    }

    @Override
    public List<Task> getTasksByUser(int userId) {
        return repo.findByUserId((long) userId);
    }

    @Override
    public Task updateTaskStatus(int id, String status) {
        return repo.findById((long) id).map(task -> {
            task.setStatus(status);
            return repo.save(task);
        }).orElse(null);
    }

    @Override
    public List<Task> getPutawayTasksByUser(int userId) {
        // Only return PUTAWAY tasks for INBOUND shipments
        return repo.findPutawayTasksByUserForInbound((long) userId, "PUTAWAY", "COMPLETED");
    }

    @Override
    public Task startPutaway(Long taskId) {
        return repo.findById(taskId).map(task -> {
            task.setInProgress(true);
            task.setStatus("IN_PROGRESS");
            return repo.save(task);
        }).orElse(null);
    }

    @Override
    public List<Task> getCompletedPutawayTasksToday(int userId) {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        // Only return completed PUTAWAY tasks for INBOUND shipments
        return repo.findCompletedPutawayTasksTodayForInbound(
                (long) userId, "PUTAWAY", "COMPLETED", startOfDay);
    }

    @Override
    public PutawayStatisticsDTO getPutawayStatistics(int userId) {
        // Only count PUTAWAY tasks for INBOUND shipments
        long pendingCount = repo.countPutawayTasksByUserAndStatusForInbound((long) userId, "PUTAWAY", "PENDING");
        long inProgressCount = repo.countPutawayTasksByUserAndStatusForInbound((long) userId, "PUTAWAY", "IN_PROGRESS");
        
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        List<Task> completedToday = repo.findCompletedPutawayTasksTodayForInbound(
                (long) userId, "PUTAWAY", "COMPLETED", startOfDay);
        long completedTodayCount = completedToday.size();
        
        // Total = pending + in progress (exclude completed)
        long totalCount = pendingCount + inProgressCount;

        return PutawayStatisticsDTO.builder()
                .pendingCount((int) pendingCount)
                .inProgressCount((int) inProgressCount)
                .completedTodayCount((int) completedTodayCount)
                .totalItemsCount((int) totalCount)
                .build();
    }

    @Override
    @Transactional
    public Task completePutaway(Long taskId, Long binId, Integer quantity) {
        return repo.findById(taskId).map(task -> {
            Bin bin = binRepository.findById(binId)
                    .orElseThrow(() -> new RuntimeException("Bin not found"));
            Sku sku = task.getShipmentItem().getSku();

            // Add quantity to inventory stock (not replace)
            inventoryStockService.addStock(
                    sku.getId().intValue(),
                    binId.intValue(),
                    quantity
            );

            // Update task status
            task.setStatus("COMPLETED");
            task.setInProgress(false);
            task.setCompletedAt(LocalDateTime.now());
            Task savedTask = repo.save(task);

            // Update shipment item status
            ShipmentItem shipmentItem = task.getShipmentItem();
            shipmentItem.setStatus("RECEIVED");
            shipmentItemService.updateShipmentItem(shipmentItem.getId().intValue(), shipmentItem);
            
            // Check if all items in the shipment are received and update shipment status if complete
            updateShipmentStatusIfAllItemsReceived(shipmentItem.getShipment());
            
            return savedTask;
        }).orElse(null);
    }

    @Override
    @Transactional
    public Task completePutawayWithAllocation(Long taskId, List<BinAllocation> allocations) {
        return repo.findById(taskId).map(task -> {
            Sku sku = task.getShipmentItem().getSku();

            // Add quantity to inventory stock for each bin allocation (not replace)
            for (BinAllocation allocation : allocations) {
                inventoryStockService.addStock(
                        sku.getId().intValue(),
                        allocation.getBinId().intValue(),
                        allocation.getQuantity()
                );
            }

            // Update task status
            task.setStatus("COMPLETED");
            task.setInProgress(false);
            task.setCompletedAt(LocalDateTime.now());
            Task savedTask = repo.save(task);

            // Update shipment item status
            ShipmentItem shipmentItem = task.getShipmentItem();
            shipmentItem.setStatus("RECEIVED");
            shipmentItemService.updateShipmentItem(shipmentItem.getId().intValue(), shipmentItem);
            
            // Check if all items in the shipment are received and update shipment status if complete
            updateShipmentStatusIfAllItemsReceived(shipmentItem.getShipment());
            
            return savedTask;
        }).orElse(null);
    }

    /**
     * Helper method to check if all shipment items are received
     * @param shipment The shipment to check
     * @return true if all items have status "RECEIVED", false otherwise
     */
    private boolean areAllItemsReceived(Shipment shipment) {
        if (shipment == null) {
            return false;
        }
        
        // Get all shipment items for this shipment
        List<ShipmentItem> allItems = shipmentItemRepository.findByShipmentId(shipment.getId());
        
        // If no items exist, consider it not complete (edge case)
        if (allItems == null || allItems.isEmpty()) {
            return false;
        }
        
        // Check if all items have status "RECEIVED"
        return allItems.stream()
                .allMatch(item -> "RECEIVED".equals(item.getStatus()));
    }

    /**
     * Updates shipment status to COMPLETED if all items are received
     * Only updates for INBOUND shipments
     * @param shipment The shipment to check and update
     */
    private void updateShipmentStatusIfAllItemsReceived(Shipment shipment) {
        if (shipment == null) {
            return;
        }
        
        // Only process INBOUND shipments
        if (!"INBOUND".equals(shipment.getShipmentType())) {
            return;
        }
        
        // Check if shipment is already completed
        if ("COMPLETED".equals(shipment.getStatus())) {
            return;
        }
        
        // Check if all items are received
        if (areAllItemsReceived(shipment)) {
            try {
                shipment.setStatus("COMPLETED");
                shipmentRepository.save(shipment);
                System.out.println("Shipment " + shipment.getId() + " automatically marked as COMPLETED - all items received");
            } catch (Exception e) {
                // Log error but don't fail the putaway operation
                System.err.println("Failed to update shipment status to COMPLETED: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    @Override
    public List<Task> getPickingTasksByUser(int userId) {
        // Only return PICKING tasks for OUTBOUND shipments assigned to this user
        return repo.findPickingTasksByUserForOutbound((long) userId, "PICKING", "COMPLETED");
    }

    @Override
    public List<Task> getAllPickingTasksForViewing(int userId) {
        // Get all PICKING tasks for OUTBOUND shipments (for viewing by all workers)
        return repo.findAllPickingTasksForOutbound("PICKING", "COMPLETED");
    }

    @Override
    public List<Task> getDispatchedPickingTasks(int userId) {
        // Get all completed (dispatched) PICKING tasks for OUTBOUND shipments
        return repo.findCompletedPickingTasksForOutbound("PICKING", "COMPLETED");
    }

    @Override
    public PickingStatisticsDTO getPickingStatistics(int userId) {
        // Get all pending/in-progress picking tasks for this user
        List<Task> pendingTasks = repo.findPickingTasksByUserForOutbound((long) userId, "PICKING", "COMPLETED");
        
        // Count items to pick (sum of quantities in pending/in-progress tasks)
        int itemsToPickCount = pendingTasks.stream()
                .mapToInt(t -> t.getShipmentItem().getQuantity())
                .sum();
        
        // Count active pick lists (unique shipments with pending picking tasks)
        long activePickListsCount = pendingTasks.stream()
                .map(t -> t.getShipmentItem().getShipment().getId())
                .distinct()
                .count();
        
        // Count picked today
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        List<Task> completedToday = repo.findCompletedPickingTasksTodayForOutbound(
                (long) userId, "PICKING", "COMPLETED", startOfDay);
        long pickedTodayCount = completedToday.stream()
                .mapToInt(t -> t.getShipmentItem().getQuantity())
                .sum();
        
        // Count ready to ship (shipment items with DISPATCHED status for OUTBOUND shipments)
        List<ShipmentItem> dispatchedItems = shipmentItemRepository.findByStatus("DISPATCHED");
        int readyToShipCount = (int) dispatchedItems.stream()
                .filter(item -> "OUTBOUND".equals(item.getShipment().getShipmentType()))
                .count();

        return PickingStatisticsDTO.builder()
                .activePickListsCount((int) activePickListsCount)
                .itemsToPickCount(itemsToPickCount)
                .pickedTodayCount((int) pickedTodayCount)
                .readyToShipCount(readyToShipCount)
                .build();
    }

    @Override
    @Transactional
    public Task completePicking(Long taskId, int userId) {
        return repo.findById(taskId).map(task -> {
            // Validate: Ensure task is assigned to the requesting user
            if (task.getUser() == null || !task.getUser().getId().equals((long) userId)) {
                throw new RuntimeException("Task is not assigned to this user");
            }

            // Validate: Ensure it's a PICKING task
            if (!"PICKING".equals(task.getTaskType())) {
                throw new RuntimeException("Task is not a picking task");
            }

            ShipmentItem shipmentItem = task.getShipmentItem();
            Sku sku = shipmentItem.getSku();
            Bin suggestedBin = task.getSuggestedBin();

            if (suggestedBin == null) {
                throw new RuntimeException("No suggested bin found for picking task");
            }

            // Find inventory stock in the suggested bin
            InventoryStock stock = inventoryStockRepository.findBySkuIdAndBinId(
                    sku.getId(), suggestedBin.getId())
                    .orElseThrow(() -> new RuntimeException("No inventory stock found in suggested bin"));

            // Validate sufficient quantity exists
            int requiredQuantity = shipmentItem.getQuantity();
            if (stock.getQuantity() < requiredQuantity) {
                String errorMessage = String.format(
                    "Insufficient stock for %s (SKU: %s). Available: %d, Required: %d in location %s. " +
                    "Please check alternative locations or contact supervisor.",
                    sku.getProduct() != null ? sku.getProduct().getName() : "item",
                    sku.getSkuCode(),
                    stock.getQuantity(),
                    requiredQuantity,
                    task.getSuggestedLocation() != null ? task.getSuggestedLocation() : "suggested bin"
                );
                throw new RuntimeException(errorMessage);
            }

            // Deduct quantity from inventory stock
            int newQuantity = stock.getQuantity() - requiredQuantity;
            
            if (newQuantity == 0) {
                // Delete stock record if quantity becomes zero
                inventoryStockRepository.delete(stock);
            } else {
                // Update stock quantity
                stock.setQuantity(newQuantity);
                inventoryStockRepository.save(stock);
            }

            // Update task status
            task.setStatus("COMPLETED");
            task.setInProgress(false);
            task.setCompletedAt(LocalDateTime.now());
            Task savedTask = repo.save(task);

            // Update shipment item status to DISPATCHED
            shipmentItem.setStatus("DISPATCHED");
            shipmentItemService.updateShipmentItem(shipmentItem.getId().intValue(), shipmentItem);
            
            // Check if all items in the shipment are dispatched and update shipment status if complete
            updateShipmentStatusIfAllItemsDispatched(shipmentItem.getShipment());
            
            return savedTask;
        }).orElse(null);
    }

    /**
     * Helper method to check if all shipment items are dispatched
     * @param shipment The shipment to check
     * @return true if all items have status "DISPATCHED", false otherwise
     */
    private boolean areAllItemsDispatched(Shipment shipment) {
        if (shipment == null) {
            return false;
        }
        
        // Get all shipment items for this shipment
        List<ShipmentItem> allItems = shipmentItemRepository.findByShipmentId(shipment.getId());
        
        // If no items exist, consider it not complete (edge case)
        if (allItems == null || allItems.isEmpty()) {
            return false;
        }
        
        // Check if all items have status "DISPATCHED"
        return allItems.stream()
                .allMatch(item -> "DISPATCHED".equals(item.getStatus()));
    }

    /**
     * Updates shipment status to COMPLETED if all items are dispatched
     * Only updates for OUTBOUND shipments
     * @param shipment The shipment to check and update
     */
    private void updateShipmentStatusIfAllItemsDispatched(Shipment shipment) {
        if (shipment == null) {
            return;
        }
        
        // Only process OUTBOUND shipments
        if (!"OUTBOUND".equals(shipment.getShipmentType())) {
            return;
        }
        
        // Check if shipment is already completed
        if ("COMPLETED".equals(shipment.getStatus())) {
            return;
        }
        
        // Check if all items are dispatched
        if (areAllItemsDispatched(shipment)) {
            try {
                shipment.setStatus("COMPLETED");
                shipmentRepository.save(shipment);
                System.out.println("Shipment " + shipment.getId() + " automatically marked as COMPLETED - all items dispatched");
            } catch (Exception e) {
                // Log error but don't fail the picking operation
                System.err.println("Failed to update shipment status to COMPLETED: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
}
