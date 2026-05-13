import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ArrowUpDown, X } from "lucide-react";

export interface SortOption {
  field: string;
  direction: "asc" | "desc";
  priority: number;
}

export interface SortControlsProps {
  onSortChange: (sorts: SortOption[]) => void;
  availableFields?: { label: string; value: string }[];
}

const DEFAULT_FIELDS = [
  { label: "Data de Criação", value: "createdAt" },
  { label: "Pontuação Semântica", value: "semanticScore" },
  { label: "Pontuação de Viés", value: "biasScore" },
  { label: "Coerência Temporal", value: "temporalCoherence" },
  { label: "Decisão Ω-Gate", value: "omegaGateDecision" },
  { label: "Nível de Risco", value: "semanticRiskLevel" },
  { label: "ID do Artefato", value: "id" },
  { label: "Pontuação de Confiança", value: "trustScore" },
];

export function SortControls({
  onSortChange,
  availableFields = DEFAULT_FIELDS,
}: SortControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sorts, setSorts] = useState<SortOption[]>([
    { field: "createdAt", direction: "desc", priority: 1 },
  ]);

  const handleAddSort = () => {
    const newSort: SortOption = {
      field: availableFields[0]?.value || "createdAt",
      direction: "asc",
      priority: Math.max(...sorts.map((s) => s.priority), 0) + 1,
    };
    const updatedSorts = [...sorts, newSort];
    setSorts(updatedSorts);
    onSortChange(updatedSorts);
  };

  const handleRemoveSort = (priority: number) => {
    const updatedSorts = sorts
      .filter((s) => s.priority !== priority)
      .map((s) => ({
        ...s,
        priority: s.priority > priority ? s.priority - 1 : s.priority,
      }));
    setSorts(updatedSorts);
    onSortChange(updatedSorts);
  };

  const handleFieldChange = (priority: number, newField: string) => {
    const updatedSorts = sorts.map((s) =>
      s.priority === priority ? { ...s, field: newField } : s
    );
    setSorts(updatedSorts);
    onSortChange(updatedSorts);
  };

  const handleDirectionChange = (priority: number, newDirection: "asc" | "desc") => {
    const updatedSorts = sorts.map((s) =>
      s.priority === priority ? { ...s, direction: newDirection } : s
    );
    setSorts(updatedSorts);
    onSortChange(updatedSorts);
  };

  const handleReset = () => {
    const defaultSort: SortOption[] = [
      { field: "createdAt", direction: "desc", priority: 1 },
    ];
    setSorts(defaultSort);
    onSortChange(defaultSort);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="gap-2"
      >
        <ArrowUpDown className="h-4 w-4" />
        Ordenar ({sorts.length})
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 right-0 w-96 p-6 z-50 shadow-lg border border-gray-200">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Critérios de Ordenação</h3>

            {sorts.map((sort) => (
              <div key={sort.priority} className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Prioridade {sort.priority}
                  </label>
                  <Select
                    value={sort.field}
                    onValueChange={(value) => handleFieldChange(sort.priority, value)}
                  >
                    {availableFields.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Direção
                  </label>
                  <Select
                    value={sort.direction}
                    onValueChange={(value) =>
                      handleDirectionChange(sort.priority, value as "asc" | "desc")
                    }
                  >
                    <option value="asc">Crescente ↑</option>
                    <option value="desc">Decrescente ↓</option>
                  </Select>
                </div>

                {sorts.length > 1 && (
                  <Button
                    onClick={() => handleRemoveSort(sort.priority)}
                    variant="ghost"
                    size="sm"
                    className="px-2 h-10"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}

            {sorts.length < 3 && (
              <Button
                onClick={handleAddSort}
                variant="outline"
                className="w-full"
              >
                + Adicionar Critério
              </Button>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => setIsOpen(false)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Aplicar
              </Button>
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Padrão
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
