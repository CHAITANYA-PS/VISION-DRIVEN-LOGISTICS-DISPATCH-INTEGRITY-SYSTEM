package com.visera.backend.Controller;

import com.visera.backend.DTOs.BinAllocation;
import com.visera.backend.DTOs.PickingItemDTO;
import com.visera.backend.DTOs.PickingStatisticsDTO;
import com.visera.backend.DTOs.PutawayItemDTO;
import com.visera.backend.DTOs.PutawayStatisticsDTO;
import com.visera.backend.DTOs.RecentCompletionDTO;
import com.visera.backend.DTOs.TaskDTO;
import com.visera.backend.Entity.Task;
import com.visera.backend.Service.TaskService;
import com.visera.backend.mapper.EntityMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    EntityMapper mapper;

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // Create task (by supervisor)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/create")
    public ResponseEntity<Task> create(@RequestBody Task task) {
        return ResponseEntity.ok(taskService.createTask(task));
    }

//    // Get all tasks for a worker
//    @GetMapping("/user/{userId}")
//    public ResponseEntity<List<Task>> getTasksByUser(@PathVariable int userId) {
//        return ResponseEntity.ok(taskService.getTasksByUser(userId));
//    }

    // Update status (worker completes)
    @PreAuthorize("hasAnyRole('ADMIN', 'WORKER')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<Task> updateStatus(@PathVariable int id, @RequestParam String status) {
        Task t = taskService.updateTaskStatus(id, status);
        return (t != null) ? ResponseEntity.ok(t) : ResponseEntity.notFound().build();
    }

    //DTO
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TaskDTO>> getTasks(@PathVariable int userId) {
        return ResponseEntity.ok(
                taskService.getTasksByUser(userId).stream()
                        .map(mapper::toTaskDTO).collect(java.util.stream.Collectors.toList())
        );
    }

    // Putaway endpoints
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/putaway/user/{userId}")
    public ResponseEntity<List<PutawayItemDTO>> getPutawayItems(@PathVariable int userId) {
        List<Task> tasks = taskService.getPutawayTasksByUser(userId);
        List<PutawayItemDTO> items = tasks.stream()
                .map(mapper::toPutawayItemDTO)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/putaway/statistics/{userId}")
    public ResponseEntity<PutawayStatisticsDTO> getPutawayStatistics(@PathVariable int userId) {
        return ResponseEntity.ok(taskService.getPutawayStatistics(userId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/putaway/recent-completions/{userId}")
    public ResponseEntity<List<RecentCompletionDTO>> getRecentCompletions(@PathVariable int userId) {
        List<Task> tasks = taskService.getCompletedPutawayTasksToday(userId);
        List<RecentCompletionDTO> completions = tasks.stream()
                .map(mapper::toRecentCompletionDTO)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(completions);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'WORKER')")
    @PostMapping("/{id}/start-putaway")
    public ResponseEntity<Task> startPutaway(@PathVariable Long id) {
        Task task = taskService.startPutaway(id);
        return (task != null) ? ResponseEntity.ok(task) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'WORKER')")
    @PostMapping("/{id}/complete-putaway")
    public ResponseEntity<Task> completePutaway(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Task task = null;
        
        // Check if it's single bin or multi-bin allocation
        if (request.containsKey("allocations")) {
            // Multi-bin allocation
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> allocationsList = (List<Map<String, Object>>) request.get("allocations");
            List<BinAllocation> allocations = allocationsList.stream()
                    .map(map -> BinAllocation.builder()
                            .binId(Long.valueOf(map.get("binId").toString()))
                            .quantity(Integer.valueOf(map.get("quantity").toString()))
                            .build())
                    .collect(java.util.stream.Collectors.toList());
            task = taskService.completePutawayWithAllocation(id, allocations);
        } else if (request.containsKey("binId") && request.containsKey("quantity")) {
            // Single bin allocation
            Long binId = Long.valueOf(request.get("binId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            task = taskService.completePutaway(id, binId, quantity);
        } else {
            return ResponseEntity.badRequest().build();
        }
        
        return (task != null) ? ResponseEntity.ok(task) : ResponseEntity.notFound().build();
    }

    // Picking endpoints
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/picking/user/{userId}")
    public ResponseEntity<List<PickingItemDTO>> getPickingItems(@PathVariable int userId) {
        List<Task> tasks = taskService.getAllPickingTasksForViewing(userId);
        List<PickingItemDTO> items = tasks.stream()
                .map(task -> mapper.toPickingItemDTO(task, (long) userId))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/picking/assigned/{userId}")
    public ResponseEntity<List<PickingItemDTO>> getAssignedPickingItems(@PathVariable int userId) {
        List<Task> tasks = taskService.getPickingTasksByUser(userId);
        List<PickingItemDTO> items = tasks.stream()
                .map(task -> mapper.toPickingItemDTO(task, (long) userId))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/picking/statistics/{userId}")
    public ResponseEntity<PickingStatisticsDTO> getPickingStatistics(@PathVariable int userId) {
        return ResponseEntity.ok(taskService.getPickingStatistics(userId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/picking/dispatched/{userId}")
    public ResponseEntity<List<PickingItemDTO>> getDispatchedPickingItems(@PathVariable int userId) {
        List<Task> tasks = taskService.getDispatchedPickingTasks(userId);
        List<PickingItemDTO> items = tasks.stream()
                .map(task -> mapper.toPickingItemDTO(task, (long) userId))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'WORKER')")
    @PostMapping("/{id}/complete-picking")
    public ResponseEntity<?> completePicking(
            @PathVariable Long id,
            @RequestParam int userId) {
        try {
            Task task = taskService.completePicking(id, userId);
            if (task == null) {
                Map<String, String> errorResponse = new java.util.HashMap<>();
                errorResponse.put("message", "Task not found");
                errorResponse.put("error", "Task not found");
                return new ResponseEntity<>(errorResponse, org.springframework.http.HttpStatus.NOT_FOUND);
            }
            return ResponseEntity.ok(task);
        } catch (RuntimeException e) {
            // Log the error for debugging
            System.err.println("Error completing picking task " + id + " for user " + userId + ": " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Failed to complete picking");
            errorResponse.put("error", "Failed to complete picking");
            return new ResponseEntity<>(errorResponse, org.springframework.http.HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Unexpected error completing picking task " + id + " for user " + userId + ": " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "An unexpected error occurred");
            errorResponse.put("error", "Failed to complete picking");
            return new ResponseEntity<>(errorResponse, org.springframework.http.HttpStatus.BAD_REQUEST);
        }
    }

}
