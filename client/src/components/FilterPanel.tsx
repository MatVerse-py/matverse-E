import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { X, Filter, RotateCcw } from "lucide-react";

export interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
  availableDecisions?: string[];
  availableRiskLevels?: string[];
  scoreRanges?: {
    semantic: { min: number; max: number };
    bias: { min: number; max: number };
    temporal: { min: number; max: number };
  };
  dateRange?: { min: Date; max: Date };
}

export function FilterPanel({
  onFilterChange,
  availableDecisions = ["PASS", "HOLD", "REVIEW", "BLOCK"],
  availableRiskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  scoreRanges = {
    semantic: { min: 0, max: 1 },
    bias: { min: 0, max: 1 },
    temporal: { min: 0, max: 1 },
  },
  dateRange = { min: new Date(2026, 0, 1), max: new Date() },
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedDecisions, setSelectedDecisions] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [semanticMin, setSemanticMin] = useState<number>(0);
  const [semanticMax, setSemanticMax] = useState<number>(1);
  const [biasMin, setBiasMin] = useState<number>(0);
  const [biasMax, setBiasMax] = useState<number>(1);
  const [temporalMin, setTemporalMin] = useState<number>(0);
  const [temporalMax, setTemporalMax] = useState<number>(1);
  const [searchText, setSearchText] = useState<string>("");

  const handleApplyFilters = () => {
    const filters = {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      decisions: selectedDecisions.length > 0 ? selectedDecisions : undefined,
      riskLevels: selectedRisks.length > 0 ? selectedRisks : undefined,
      semanticScoreMin: semanticMin > 0 ? semanticMin : undefined,
      semanticScoreMax: semanticMax < 1 ? semanticMax : undefined,
      biasScoreMin: biasMin > 0 ? biasMin : undefined,
      biasScoreMax: biasMax < 1 ? biasMax : undefined,
      temporalCoherenceMin: temporalMin > 0 ? temporalMin : undefined,
      temporalCoherenceMax: temporalMax < 1 ? temporalMax : undefined,
      searchText: searchText || undefined,
    };

    onFilterChange(filters);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedDecisions([]);
    setSelectedRisks([]);
    setSemanticMin(0);
    setSemanticMax(1);
    setBiasMin(0);
    setBiasMax(1);
    setTemporalMin(0);
    setTemporalMax(1);
    setSearchText("");
    onFilterChange({});
  };

  const toggleDecision = (decision: string) => {
    setSelectedDecisions((prev) =>
      prev.includes(decision) ? prev.filter((d) => d !== decision) : [...prev, decision]
    );
  };

  const toggleRisk = (risk: string) => {
    setSelectedRisks((prev) => (prev.includes(risk) ? prev.filter((r) => r !== risk) : [...prev, risk]));
  };

  const activeFilterCount =
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    selectedDecisions.length +
    selectedRisks.length +
    (semanticMin > 0 ? 1 : 0) +
    (semanticMax < 1 ? 1 : 0) +
    (biasMin > 0 ? 1 : 0) +
    (biasMax < 1 ? 1 : 0) +
    (temporalMin > 0 ? 1 : 0) +
    (temporalMax < 1 ? 1 : 0) +
    (searchText ? 1 : 0);

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="gap-2"
      >
        <Filter className="h-4 w-4" />
        Filtros {activeFilterCount > 0 && <span className="ml-1 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">{activeFilterCount}</span>}
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 right-0 w-96 p-6 z-50 shadow-lg border border-gray-200">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Buscar</label>
              <Input
                type="text"
                placeholder="ID ou conteúdo..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Período</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Decisions */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Decisões Ω-Gate</label>
              <div className="flex flex-wrap gap-2">
                {availableDecisions.map((decision) => (
                  <button
                    key={decision}
                    onClick={() => toggleDecision(decision)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedDecisions.includes(decision)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {decision}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Levels */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Nível de Risco</label>
              <div className="flex flex-wrap gap-2">
                {availableRiskLevels.map((risk) => (
                  <button
                    key={risk}
                    onClick={() => toggleRisk(risk)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedRisks.includes(risk)
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            </div>

            {/* Semantic Score */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Pontuação Semântica: {semanticMin.toFixed(2)} - {semanticMax.toFixed(2)}
              </label>
              <div className="flex gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={semanticMin}
                  onChange={(e) => setSemanticMin(Math.min(parseFloat(e.target.value), semanticMax))}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={semanticMax}
                  onChange={(e) => setSemanticMax(Math.max(parseFloat(e.target.value), semanticMin))}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Bias Score */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Pontuação de Viés: {biasMin.toFixed(2)} - {biasMax.toFixed(2)}
              </label>
              <div className="flex gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={biasMin}
                  onChange={(e) => setBiasMin(Math.min(parseFloat(e.target.value), biasMax))}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={biasMax}
                  onChange={(e) => setBiasMax(Math.max(parseFloat(e.target.value), biasMin))}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Temporal Coherence */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Coerência Temporal: {temporalMin.toFixed(2)} - {temporalMax.toFixed(2)}
              </label>
              <div className="flex gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={temporalMin}
                  onChange={(e) => setTemporalMin(Math.min(parseFloat(e.target.value), temporalMax))}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={temporalMax}
                  onChange={(e) => setTemporalMax(Math.max(parseFloat(e.target.value), temporalMin))}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleApplyFilters} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Aplicar Filtros
              </Button>
              <Button onClick={handleResetFilters} variant="outline" className="flex-1 gap-2">
                <RotateCcw className="h-4 w-4" />
                Limpar
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                className="px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
