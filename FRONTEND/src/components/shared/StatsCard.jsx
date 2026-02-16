import { Card, CardContent } from "../common/Card";

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  iconBgColor = "bg-blue-50",
  iconColor = "text-blue-600",
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 mb-1">{title}</p>
            <h3 className="text-gray-900">{value}</h3>
            {trend && (
              <p
                className={`text-sm mt-1 ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconBgColor}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}








