import { format, formatDistanceToNow } from "date-fns";

export const formatDate = (date, formatStr = "MM/dd/yyyy") => {
  if (!date) return "";
  return format(new Date(date), formatStr);
};

export const formatDateTime = (date) => {
  if (!date) return "";
  return format(new Date(date), "MM/dd/yyyy HH:mm");
};

export const formatRelativeTime = (date) => {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatNumber = (number) => {
  if (number === null || number === undefined) return "0";
  return Number(number).toLocaleString();
};

export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return "0%";
  return `${Number(value).toFixed(decimals)}%`;
};

export const formatStatus = (status) => {
  if (!status) return "";
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase().replace(/_/g, " ")
  );
};

export const formatRole = (role) => {
  const roleMap = {
    ADMIN: "Administrator",
    SUPERVISOR: "Supervisor",
    WORKER: "Worker",
  };
  return roleMap[role] || role;
};
