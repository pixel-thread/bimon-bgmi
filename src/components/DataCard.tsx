// components/DataCard.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";

interface DataCardProps {
  title: string;
  subtitle: string;
  description: string;
  status?: string;
  statusColor?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function DataCard({
  title,
  subtitle,
  description,
  status,
  statusColor,
  actions,
  className,
}: DataCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">
              {title}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
          </div>
          {status && (
            <span className={cn("text-sm font-medium", statusColor)}>
              {status}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">{description}</p>
        {actions && (
          <div className="mt-3 flex flex-col sm:flex-row gap-2">{actions}</div>
        )}
      </CardContent>
    </Card>
  );
}
