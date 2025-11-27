import { Slider } from "./ui/slider";
import { Label } from "./ui/label";

interface FilterPanelProps {
  popularityWeight: number[];
  onPopularityWeightChange: (value: number[]) => void;
  minRating: number[];
  onMinRatingChange: (value: number[]) => void;
  yearRange: number[];
  onYearRangeChange: (value: number[]) => void;
}

export function FilterPanel({
  popularityWeight,
  onPopularityWeightChange,
  minRating,
  onMinRatingChange,
  yearRange,
  onYearRangeChange,
}: FilterPanelProps) {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6 bg-muted/30 rounded-lg">
      <h3 className="text-muted-foreground">Фильтры</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Фильтр популярности */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Популярность</Label>
            <span className="text-sm text-muted-foreground">
              {popularityWeight[0] < 30 ? "Популярные" : popularityWeight[0] > 70 ? "Нишевые" : "Средние"}
            </span>
          </div>
          <Slider
            value={popularityWeight}
            onValueChange={onPopularityWeightChange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Популярные</span>
            <span>Нишевые</span>
          </div>
        </div>

        {/* Фильтр минимального рейтинга */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Минимальный рейтинг</Label>
            <span className="text-sm text-muted-foreground">
              {minRating[0].toFixed(1)}+
            </span>
          </div>
          <Slider
            value={minRating}
            onValueChange={onMinRatingChange}
            min={0}
            max={10}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.0</span>
            <span>10.0</span>
          </div>
        </div>

        {/* Фильтр по году */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Период выпуска</Label>
            <span className="text-sm text-muted-foreground">
              {yearRange[0] === 1900 ? "Любые" : `${yearRange[0]}+`}
            </span>
          </div>
          <Slider
            value={yearRange}
            onValueChange={onYearRangeChange}
            min={1900}
            max={2025}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Старые</span>
            <span>Новые</span>
          </div>
        </div>
      </div>
    </div>
  );
}
