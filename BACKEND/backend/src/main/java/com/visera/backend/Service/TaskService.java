package com.visera.backend.Service;
import com.visera.backend.DTOs.BinAllocation;
import com.visera.backend.DTOs.PickingStatisticsDTO;
import com.visera.backend.DTOs.PutawayStatisticsDTO;
import com.visera.backend.DTOs.RecentCompletionDTO;
import com.visera.backend.Entity.Task;
import java.util.List;

public interface TaskService {
    Task createTask(Task task);
    List<Task> getTasksByUser(int userId);
    Task updateTaskStatus(int id, String status);
    List<Task> getPutawayTasksByUser(int userId);
    Task startPutaway(Long taskId);
    List<Task> getCompletedPutawayTasksToday(int userId);
    PutawayStatisticsDTO getPutawayStatistics(int userId);
    Task completePutaway(Long taskId, Long binId, Integer quantity);
    Task completePutawayWithAllocation(Long taskId, List<BinAllocation> allocations);
    
    // Picking operations
    List<Task> getPickingTasksByUser(int userId);
    List<Task> getAllPickingTasksForViewing(int userId);
    List<Task> getDispatchedPickingTasks(int userId);
    PickingStatisticsDTO getPickingStatistics(int userId);
    Task completePicking(Long taskId, int userId);
}
