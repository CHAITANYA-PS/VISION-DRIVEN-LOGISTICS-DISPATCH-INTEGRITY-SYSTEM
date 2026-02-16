import { Card, CardContent } from './Card';

export default function MetricCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  trend,
  iconBgColor,
  iconColor,
}) {
  // Use provided colors or fallback to color prop
  const bgColor = iconBgColor || {
    blue: "bg-blue-50",
    green: "bg-green-50",
    orange: "bg-orange-50",
    purple: "bg-purple-50",
    red: "bg-red-50",
  }[color] || "bg-blue-50";

  const textColor = iconColor || {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
    red: "text-red-600",
  }[color] || "text-blue-600";

  // Handle trend - can be number or object
  const trendValue = typeof trend === 'object' ? trend : trend !== undefined ? { value: `${trend > 0 ? '+' : ''}${trend}%`, isPositive: trend > 0 } : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 mb-1">{title}</p>
            <h3 className="text-gray-900">{value}</h3>
            {trendValue && (
              <p className={`text-sm mt-1 ${trendValue.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trendValue.isPositive ? '↑' : '↓'} {trendValue.value}
              </p>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-lg ${bgColor}`}>
              <Icon className={`w-6 h-6 ${textColor}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
