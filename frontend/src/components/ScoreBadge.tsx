import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Progress } from "./ui/progress";

interface ScoreBadgeProps {
  popularity_score?: number;
  novelty_score?: number;
  personalization_score?: number;
  total_score?: number;
}

export function ScoreBadge({
  popularity_score,
  novelty_score,
  personalization_score,
  total_score,
}: ScoreBadgeProps) {
  if (total_score === undefined) return null;

  const percentage = Math.round(total_score * 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <div className="flex-1 min-w-[100px]">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-muted-foreground">Совпадение</span>
                <Info className="h-3 w-3 text-muted-foreground" />
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
            <span className="text-xs font-medium">{percentage}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-64">
          <div className="space-y-2">
            <p className="font-medium">Детали рекомендации</p>
            <div className="space-y-1 text-xs">
              {popularity_score !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Популярность:</span>
                  <span>{Math.round(popularity_score * 100)}%</span>
                </div>
              )}
              {novelty_score !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Новизна:</span>
                  <span>{Math.round(novelty_score * 100)}%</span>
                </div>
              )}
              {personalization_score !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Персонализация:</span>
                  <span>{Math.round(personalization_score * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
