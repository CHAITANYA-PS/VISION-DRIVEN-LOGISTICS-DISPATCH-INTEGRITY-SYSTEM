/**
 * Calculate priority based on deadline
 * Returns "High" if deadline is today or overdue, "Medium" otherwise
 */
export const calculatePriority = (deadline) => {
  if (!deadline) return "Medium";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return "High";
  }
  return "Medium";
};

/**
 * Format pick list ID as PL-{year}-{shipmentId}
 */
export const formatPickListId = (shipmentId, year = null) => {
  if (!year) {
    year = new Date().getFullYear();
  }
  return `PL-${year}-${String(shipmentId).padStart(3, '0')}`;
};

/**
 * Format deadline date as time string (e.g., "3:00 PM")
 */
export const formatDeadlineTime = (deadline) => {
  if (!deadline) return "N/A";
  
  const date = new Date(deadline);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

/**
 * Group picking tasks by shipment
 */
export const groupTasksByShipment = (tasks) => {
  const grouped = {};
  
  tasks.forEach(task => {
    const shipmentId = task.shipmentId;
    if (!grouped[shipmentId]) {
      grouped[shipmentId] = {
        shipmentId,
        shipmentDeadline: task.shipmentDeadline,
        orderNumber: task.orderNumber,
        destination: task.destination,
        tasks: []
      };
    }
    grouped[shipmentId].tasks.push(task);
  });
  
  return Object.values(grouped);
};

/**
 * Calculate progress for a shipment (picked items / total items)
 */
export const calculateProgress = (shipmentGroup) => {
  const totalItems = shipmentGroup.tasks.length;
  const pickedItems = shipmentGroup.tasks.filter(
    task => task.status === 'COMPLETED' || task.status === 'DISPATCHED'
  ).length;
  
  return {
    picked: pickedItems,
    total: totalItems,
    percentage: totalItems > 0 ? Math.round((pickedItems / totalItems) * 100) : 0
  };
};




















