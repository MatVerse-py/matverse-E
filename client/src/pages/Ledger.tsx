import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Ledger() {
  const { data: entries, isLoading } = trpc.ledger.getAll.useQuery({ limit: 100, offset: 0 });
  const { data: countData } = trpc.ledger.getCount.useQuery();

  const getDecisionBadgeClass = (decision: string) => {
    switch (decision) {
      case "PASS":
        return "badge-pass";
      case "HOLD":
        return "badge-hold";
      case "REVIEW":
        return "badge-review";
      case "BLOCK":
        return "badge-block";
      default:
        return "";
    }
  };

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "CRITICAL":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "";
    }
  };

  return (
    <div className="blueprint-grid min-h-screen bg-white">
      <div className="container mx-auto py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-black mb-2 text-foreground">Ledger Imutável</h1>
          <p className="text-lg text-muted-foreground formula-text">
            Registro append-only de todas as operações do organismo
          </p>
        </div>

        {/* Ledger Statistics */}
        <div className="mb-8">
          <Card className="wireframe-accent p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="formula-text text-xs mb-2">TOTAL DE OPERAÇÕES</div>
                <div className="metric-display text-4xl">{countData?.count || 0}</div>
              </div>
              <div className="text-right">
                <div className="formula-text text-xs mb-2">INTEGRIDADE</div>
                <div className="metric-display text-2xl">100%</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Ledger Entries */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-accent-cyan" />
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <Card key={entry.id} className="ledger-entry">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                  {/* Sequence */}
                  <div>
                    <div className="formula-text text-xs mb-1">SEQ</div>
                    <div className="font-mono text-sm font-semibold text-foreground">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Artifact ID */}
                  <div>
                    <div className="formula-text text-xs mb-1">ARTEFATO</div>
                    <div className="font-mono text-xs text-muted-foreground truncate">
                      {entry.artifactId}
                    </div>
                  </div>

                  {/* Operation Type */}
                  <div>
                    <div className="formula-text text-xs mb-1">OPERAÇÃO</div>
                    <Badge variant="outline" className="text-xs">
                      {entry.operationType}
                    </Badge>
                  </div>

                  {/* Ω-Gate Decision */}
                  <div>
                    <div className="formula-text text-xs mb-1">VEREDITO</div>
                    <div className={`inline-block ${getDecisionBadgeClass(entry.omegaGateDecision)}`}>
                      {entry.omegaGateDecision}
                    </div>
                  </div>

                  {/* Risk Level */}
                  <div>
                    <div className="formula-text text-xs mb-1">RISCO</div>
                    {entry.semanticRiskLevel ? (
                      <Badge className={`text-xs ${getRiskBadgeClass(entry.semanticRiskLevel)}`}>
                        {entry.semanticRiskLevel}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div>
                    <div className="formula-text text-xs mb-1">TIMESTAMP</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {entry.llmJustification && (
                  <div className="mt-4 pt-4 border-t border-cyan-200">
                    <div className="formula-text text-xs mb-2">JUSTIFICATIVA LLM</div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {entry.llmJustification}
                    </p>
                  </div>
                )}

                {/* Operation Hash */}
                <div className="mt-4 pt-4 border-t border-cyan-200">
                  <div className="formula-text text-xs mb-2">HASHES</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Operação:</span>
                      <div className="font-mono text-xs text-muted-foreground truncate mt-1">
                        {entry.operationHash}
                      </div>
                    </div>
                    {entry.previousHash && (
                      <div>
                        <span className="text-muted-foreground">Anterior:</span>
                        <div className="font-mono text-xs text-muted-foreground truncate mt-1">
                          {entry.previousHash}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="wireframe-accent p-12 text-center">
            <div className="text-4xl mb-4">📜</div>
            <p className="text-muted-foreground">Nenhuma operação registrada ainda</p>
          </Card>
        )}
      </div>
    </div>
  );
}
