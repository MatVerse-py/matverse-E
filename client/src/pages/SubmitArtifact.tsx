import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function SubmitArtifact() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [trustScore, setTrustScore] = useState(0.7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const submitMutation = trpc.artifacts.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("O conteúdo do artefato não pode estar vazio");
      return;
    }

    if (!user) {
      toast.error("Você precisa estar autenticado para submeter artefatos");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitMutation.mutateAsync({
        content,
        trustScore,
      });
      setResult(response);
      setContent("");
      setTrustScore(0.7);
      toast.success("Artefato processado com sucesso!");
    } catch (error) {
      toast.error("Erro ao processar artefato");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="blueprint-grid min-h-screen bg-white">
      <div className="container mx-auto py-12">
        <h1 className="text-5xl font-black mb-2 text-foreground">Submeter Artefato</h1>
        <p className="text-lg text-muted-foreground formula-text mb-12">
          Envie conteúdo para análise semântica e veredito do Ω-Gate
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submission Form */}
          <div className="lg:col-span-2">
            <Card className="wireframe-accent p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Content Input */}
                <div>
                  <Label htmlFor="content" className="text-sm font-semibold mb-2 block">
                    Conteúdo do Artefato
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Cole o conteúdo aqui para análise..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="input-blueprint min-h-48"
                    disabled={isSubmitting}
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    {content.length} caracteres
                  </div>
                </div>

                {/* Trust Score */}
                <div>
                  <Label htmlFor="trustScore" className="text-sm font-semibold mb-2 block">
                    Confiança (0.0 - 1.0)
                  </Label>
                  <Input
                    id="trustScore"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={trustScore}
                    onChange={(e) => setTrustScore(parseFloat(e.target.value))}
                    className="input-blueprint"
                    disabled={isSubmitting}
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    Indicador de confiabilidade da fonte
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="w-full btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Submeter para Análise"
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Result Panel */}
          <div>
            {result ? (
              <Card className="wireframe-accent p-6 sticky top-8">
                <h3 className="text-lg font-bold mb-4 text-foreground">Veredito Ω-Gate</h3>

                {/* Decision Badge */}
                <div className="mb-6">
                  <div className={`inline-block ${getDecisionBadgeClass(result.decision)}`}>
                    {result.decision}
                  </div>
                </div>

                {/* Reasoning */}
                <div className="mb-6">
                  <div className="formula-text text-xs mb-2">JUSTIFICATIVA</div>
                  <p className="text-sm text-foreground leading-relaxed">{result.reasoning}</p>
                </div>

                {/* Risk Level */}
                <div className="mb-6">
                  <div className="formula-text text-xs mb-2">NÍVEL DE RISCO</div>
                  <div className="text-sm font-semibold text-foreground">{result.riskLevel}</div>
                </div>

                {/* I-SPI Status */}
                <div className="mb-6">
                  <div className="formula-text text-xs mb-2">I-SPI (PROVENIÊNCIA)</div>
                  <div className="flex items-center gap-2">
                    {result.iSpiValid ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm font-semibold">
                      {result.iSpiValid ? "Válido" : "Inválido"}
                    </span>
                  </div>
                  {result.iSpiIssues.length > 0 && (
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      {result.iSpiIssues.map((issue: string, i: number) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Integrity Metrics */}
                <div className="border-t border-border pt-4">
                  <div className="formula-text text-xs mb-3">MÉTRICAS</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ψ (Densidade):</span>
                      <span className="font-mono">{result.integrityMetrics.psi.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ω (Governança):</span>
                      <span className="font-mono">{result.integrityMetrics.omega.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Θ (Energia):</span>
                      <span className="font-mono">{result.integrityMetrics.theta.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                {/* Artifact ID */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="formula-text text-xs mb-2">ID DO ARTEFATO</div>
                  <div className="text-xs font-mono text-muted-foreground break-all">
                    {result.artifactId}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="wireframe-accent p-6 sticky top-8">
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-sm text-muted-foreground">
                    Submeta um artefato para ver o veredito do Ω-Gate aqui
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
