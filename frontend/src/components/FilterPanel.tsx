import { useState, useEffect } from "react";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Filter, RotateCcw } from "lucide-react";
import { Badge } from "./ui/badge";
import { GenreFilter } from "./GenreFilter";

interface FilterPanelProps {
  popularityWeight: number[];
  onPopularityWeightChange: (value: number[]) => void;
  minRating: number[];
  onMinRatingChange: (value: number[]) => void;
  yearRange: number[];
  onYearRangeChange: (value: number[]) => void;
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  allGenres: string[];
  favoriteGenres?: string[];
}

export function FilterPanel({
  popularityWeight,
  onPopularityWeightChange,
  minRating,
  onMinRatingChange,
  yearRange,
  onYearRangeChange,
  selectedGenres,
  onGenresChange,
  allGenres,
  favoriteGenres = [],
}: FilterPanelProps) {
  // Локальное состояние для draft-значений
  const [draftPopularity, setDraftPopularity] = useState<number[]>(popularityWeight);
  const [draftRating, setDraftRating] = useState<number[]>(minRating);
  const [draftYear, setDraftYear] = useState<number[]>(yearRange);

  // Синхронизируем локальное состояние с props при их изменении извне
  useEffect(() => {
    setDraftPopularity(popularityWeight);
  }, [popularityWeight]);

  useEffect(() => {
    setDraftRating(minRating);
  }, [minRating]);

  useEffect(() => {
    setDraftYear(yearRange);
  }, [yearRange]);

  // Проверяем, есть ли неприменённые изменения
  const hasChanges = 
    draftPopularity[0] !== popularityWeight[0] ||
    draftRating[0] !== minRating[0] ||
    draftYear[0] !== yearRange[0];

  // Применяем фильтры
  const handleApplyFilters = () => {
    onPopularityWeightChange(draftPopularity);
    onMinRatingChange(draftRating);
    onYearRangeChange(draftYear);
  };

  // Сброс к начальным значениям
  const handleReset = () => {
    const defaultValues = {
      popularity: [50],
      rating: [0],
      year: [1900]
    };
    setDraftPopularity(defaultValues.popularity);
    setDraftRating(defaultValues.rating);
    setDraftYear(defaultValues.year);
    onPopularityWeightChange(defaultValues.popularity);
    onMinRatingChange(defaultValues.rating);
    onYearRangeChange(defaultValues.year);
    onGenresChange([]);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-muted-foreground">Фильтры</h3>
          {hasChanges && (
            <Badge variant="secondary" className="text-xs">
              Есть изменения
            </Badge>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <GenreFilter
            allGenres={allGenres}
            selectedGenres={selectedGenres}
            onGenresChange={onGenresChange}
            favoriteGenres={favoriteGenres}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Сбросить
          </Button>
          <Button
            onClick={handleApplyFilters}
            disabled={!hasChanges}
            className="gap-2"
            size="sm"
          >
            <Filter className="h-4 w-4" />
            Применить фильтры
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Фильтр популярности */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Популярность</Label>
            <span className="text-sm text-muted-foreground">
              {draftPopularity[0] < 30 ? "Популярные" : draftPopularity[0] > 70 ? "Нишевые" : "Средние"}
            </span>
          </div>
          <Slider
            value={draftPopularity}
            onValueChange={setDraftPopularity}
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

        {/* Фильтр веса персонализации */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Вес персонализации</Label>
            <span className="text-sm text-muted-foreground">
              {draftRating[0].toFixed(0)}%
            </span>
          </div>
          <Slider
            value={draftRating}
            onValueChange={setDraftRating}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Фильтр по году */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Период выпуска</Label>
            <span className="text-sm text-muted-foreground">
              {draftYear[0] === 1900 ? "Любые" : `${draftYear[0]}+`}
            </span>
          </div>
          <Slider
            value={draftYear}
            onValueChange={setDraftYear}
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
