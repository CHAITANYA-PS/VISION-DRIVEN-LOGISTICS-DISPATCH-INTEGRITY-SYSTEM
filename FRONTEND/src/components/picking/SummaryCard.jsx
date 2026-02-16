import { Card, CardContent } from '../common/Card';

export default function SummaryCard({ title, value, icon: Icon, color = "blue" }) {
  const colorClasses = {
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          </div>
          {Icon && (
            <div className={`p-3 rounded-lg ${colors.bg}`}>
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}




















