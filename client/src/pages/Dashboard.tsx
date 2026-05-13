import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: status, isLoading: statusLoading } = trpc.organism.getStatus.useQuery();
  const { data: omegaStats, isLoading: statsLoading } = trpc.omegaGate.getStatistics.useQuery();

  const isLoading = statusLoading || statsLoading;

  return (
    <div className="blueprint-grid min-h-screen bg-white">
      <div className="container mx-auto py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black mb-2 text-foreground">Helena-E</h1>
          <p className="text-lg text-muted-foreground formula-text">
            Organismo Digital de Integridade Semântica
          </p>
        </div>

        {/* Status Cards Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-accent-cyan" />
          </div>
        ) : (
          <>
            {/* Organism Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Total Artifacts */}
              <Card className="wireframe-accent p-6">
                <div className="metric-label">Artefatos Processados</div>
                <div className="metric-display text-3xl mt-2">{status?.totalArtifacts || 0}</div>
                <div className="text-xs text-muted-foreground mt-2">Total na base</div>
              </Card>

              {/* Ledger Size */}
              <Card className="wireframe-accent p-6">
                <div className="metric-label">Operações Registradas</div>
                <div className="metric-display text-3xl mt-2">{status?.ledgerSize || 0}</div>
                <div className="text-xs text-muted-foreground mt-2">Append-only ledger</div>
              </Card>

              {/* Integrity Score (Ψ) */}
              <Card className="wireframe-accent p-6">
                <div className="metric-label">Ψ (Psi) - Densidade</div>
                <div className="metric-display text-3xl mt-2">{(status?.integrityScore || 0).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-2">Coerência informacional</div>
              </Card>

              {/* System Energy (Θ) */}
              <Card className="wireframe-accent p-6">
                <div className="metric-label">Θ (Theta) - Energia</div>
                <div className="metric-display text-3xl mt-2">100%</div>
                <div className="text-xs text-muted-foreground mt-2">Disponibilidade do sistema</div>
              </Card>
            </div>

            {/* Ω-Gate Statistics */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Vereditos Ω-Gate</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* PASS */}
                <Card className="p-6 border-2 border-green-200 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-green-700">PASS</div>
                      <div className="text-3xl font-bold text-green-900 mt-1">
                        {omegaStats?.PASS || 0}
                      </div>
                    </div>
                    <div className="text-4xl text-green-200">✓</div>
                  </div>
                </Card>

                {/* HOLD */}
                <Card className="p-6 border-2 border-amber-200 bg-amber-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-amber-700">HOLD</div>
                      <div className="text-3xl font-bold text-amber-900 mt-1">
                        {omegaStats?.HOLD || 0}
                      </div>
                    </div>
                    <div className="text-4xl text-amber-200">⏸</div>
                  </div>
                </Card>

                {/* REVIEW */}
                <Card className="p-6 border-2 border-blue-200 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-blue-700">REVIEW</div>
                      <div className="text-3xl font-bold text-blue-900 mt-1">
                        {omegaStats?.REVIEW || 0}
                      </div>
                    </div>
                    <div className="text-4xl text-blue-200">👁</div>
                  </div>
                </Card>

                {/* BLOCK */}
                <Card className="p-6 border-2 border-red-200 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-red-700">BLOCK</div>
                      <div className="text-3xl font-bold text-red-900 mt-1">
                        {omegaStats?.BLOCK || 0}
                      </div>
                    </div>
                    <div className="text-4xl text-red-200">✕</div>
                  </div>
                </Card>
              </div>
            </div>

            {/* System Status */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Estado do Organismo</h2>
              <Card className="wireframe-accent p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <div className="formula-text mb-2">COERÊNCIA (Ω)</div>
                    <div className="text-4xl font-bold text-accent-cyan">0.95</div>
                    <div className="text-sm text-muted-foreground mt-2">Governança em equilíbrio</div>
                  </div>
                  <div>
                    <div className="formula-text mb-2">VIABILIDADE (I-SPI)</div>
                    <div className="text-4xl font-bold text-accent-cyan">VÁLIDO</div>
                    <div className="text-sm text-muted-foreground mt-2">Proveniência semântica íntegra</div>
                  </div>
                  <div>
                    <div className="formula-text mb-2">LEDGER (APPEND-ONLY)</div>
                    <div className="text-4xl font-bold text-accent-cyan">IMUTÁVEL</div>
                    <div className="text-sm text-muted-foreground mt-2">Todas as operações registradas</div>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
