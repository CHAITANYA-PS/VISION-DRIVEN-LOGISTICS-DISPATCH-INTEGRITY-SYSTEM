import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merger
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Get status color based on status type
export const getStatusColor = (status) => {
  const colors = {
    CREATED: "blue",
    ARRIVED: "blue",
    PUTAWAY: "green",
    PICKING: "orange",
    PACKED: "purple",
    SHIPPED: "gray",
    PENDING: "yellow",
    IN_PROGRESS: "orange",
    COMPLETED: "green",
    CANCELLED: "red",
    ACTIVE: "green",
    INACTIVE: "gray",
    LOW_STOCK: "red",
  };
  return colors[status] || "gray";
};

// Get priority color
export const getPriorityColor = (priority) => {
  const colors = {
    LOW: "green",
    MEDIUM: "yellow",
    HIGH: "red",
  };
  return colors[priority] || "gray";
};

// Get occupancy level
export const getOccupancyLevel = (percentage) => {
  if (percentage < 40) return "LOW";
  if (percentage < 70) return "MEDIUM";
  return "HIGH";
};

// Get occupancy color
export const getOccupancyColor = (percentage) => {
  if (percentage < 40) return "red";
  if (percentage < 70) return "yellow";
  return "green";
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};
