import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function OmegaGatePanel() {
  const { user } = useAuth();
  const { data: queue, isLoading: queueLoading, refetch: refetchQueue } = trpc.omegaGate.getQueue.useQuery({ status: "PENDING" });
  const { data: rules, isLoading: rulesLoading } = trpc.omegaGate.getRules.useQuery();

  const approveMutation = trpc.omegaGate.approve.useMutation();
  const blockMutation = trpc.omegaGate.block.useMutation();
  const releaseMutation = trpc.omegaGate.release.useMutation();

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="blueprint-grid min-h-screen bg-white">
        <div className="container mx-auto py-24 flex items-center justify-center">
          <Card className="wireframe-accent p-12 text-center max-w-md">
            <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-foreground">Acesso Restrito</h1>
            <p className="text-muted-foreground">
              Apenas administradores podem acessar o painel de controle do Ω-Gate.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const handleApprove = async (decisionId: number) => {
    try {
      await approveMutation.mutateAsync({ decisionId });
      toast.success("Decisão aprovada");
      refetchQueue();
    } catch (error) {
      toast.error("Erro ao aprovar decisão");
    }
  };

  const handleBlock = async (decisionId: number) => {
    try {
      await blockMutation.mutateAsync({ decisionId });
      toast.success("Decisão bloqueada");
      refetchQueue();
    } catch (error) {
      toast.error("Erro ao bloquear decisão");
    }
  };

  const handleRelease = async (decisionId: number) => {
    try {
      await releaseMutation.mutateAsync({ decisionId });
      toast.success("Decisão liberada");
      refetchQueue();
    } catch (error) {
      toast.error("Erro ao liberar decisão");
    }
  };

  return (
    <div className="blueprint-grid min-h-screen bg-white">
      <div className="container mx-auto py-12">
        <h1 className="text-5xl font-black mb-2 text-foreground">Painel Ω-Gate</h1>
        <p className="text-lg text-muted-foreground formula-text mb-12">
          Controle imunológico do organismo | Operações administrativas
        </p>

        {/* Rules Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Regras Ativas</h2>
          {rulesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6 text-accent-cyan" />
            </div>
          ) : rules && rules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="wireframe-accent p-4">
                  <div className="font-semibold text-foreground mb-2">{rule.ruleName}</div>
                  <p className="text-sm text-muted-foreground mb-3">{rule.condition}</p>
                  <Badge variant="outline" className="text-xs">
                    {rule.decision}
                  </Badge>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="wireframe-accent p-6 text-center">
              <p className="text-muted-foreground">Nenhuma regra ativa</p>
            </Card>
          )}
        </div>

        {/* Queue Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Fila de Decisões Pendentes</h2>
          {queueLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6 text-accent-cyan" />
            </div>
          ) : queue && queue.length > 0 ? (
            <div className="space-y-4">
              {queue.map((decision) => (
                <Card key={decision.id} className="wireframe-accent p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start mb-4">
                    <div>
                      <div className="formula-text text-xs mb-1">ARTEFATO</div>
                      <div className="font-mono text-sm text-muted-foreground truncate">
                        {decision.artifactId}
                      </div>
                    </div>
                    <div>
                      <div className="formula-text text-xs mb-1">DECISÃO</div>
                      <Badge className="text-xs">
                        {decision.decision}
                      </Badge>
                    </div>
                    <div>
                      <div className="formula-text text-xs mb-1">STATUS</div>
                      <Badge variant="outline" className="text-xs">
                        {decision.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="formula-text text-xs mb-1">CRIADO</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(decision.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>

                  {decision.reasoning && (
                    <div className="mb-4 pt-4 border-t border-cyan-200">
                      <div className="formula-text text-xs mb-2">JUSTIFICATIVA</div>
                      <p className="text-sm text-foreground">{decision.reasoning}</p>
                    </div>
                  )}

                  {decision.status === "PENDING" && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-cyan-200">
                      <Button
                        onClick={() => handleApprove(decision.id)}
                        disabled={approveMutation.isPending}
                        className="btn-primary text-sm"
                      >
                        {approveMutation.isPending ? "..." : "Aprovar"}
                      </Button>
                      <Button
                        onClick={() => handleRelease(decision.id)}
                        disabled={releaseMutation.isPending}
                        className="btn-secondary text-sm"
                      >
                        {releaseMutation.isPending ? "..." : "Liberar"}
                      </Button>
                      <Button
                        onClick={() => handleBlock(decision.id)}
                        disabled={blockMutation.isPending}
                        className="text-sm px-4 py-2 border-2 border-red-400 text-red-600 rounded font-semibold hover:bg-red-50 transition-colors"
                      >
                        {blockMutation.isPending ? "..." : "Bloquear"}
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="wireframe-accent p-12 text-center">
              <div className="text-4xl mb-4">✓</div>
              <p className="text-muted-foreground">Nenhuma decisão pendente</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
