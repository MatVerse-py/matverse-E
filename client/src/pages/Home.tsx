import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { ArrowRight, Shield, Database, Brain, Lock } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="blueprint-grid min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-border bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-black text-foreground">Helena-E</div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setLocation("/dashboard")}
                  className="text-sm font-semibold text-foreground hover:text-accent-cyan transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setLocation("/submit")}
                  className="text-sm font-semibold text-foreground hover:text-accent-cyan transition"
                >
                  Submeter
                </button>
                <button
                  onClick={() => setLocation("/ledger")}
                  className="text-sm font-semibold text-foreground hover:text-accent-cyan transition"
                >
                  Ledger
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => setLocation("/omega-gate")}
                    className="text-sm font-semibold text-accent-cyan hover:text-accent transition"
                  >
                    Ω-Gate
                  </button>
                )}
                <div className="text-sm text-muted-foreground">
                  {user?.name || user?.email}
                </div>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-primary">Entrar</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-3xl">
          <h1 className="text-6xl md:text-7xl font-black mb-6 text-foreground leading-tight">
            Helena-E
          </h1>
          <p className="text-2xl text-muted-foreground mb-8 leading-relaxed">
            Organismo digital auditável para integridade semântica, análise via LLM e decisão imunológica pelo Ω-Gate
          </p>
          <div className="flex flex-wrap gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => setLocation("/submit")}
                  className="btn-primary text-lg px-8 py-6"
                >
                  Submeter Artefato
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  onClick={() => setLocation("/dashboard")}
                  className="btn-secondary text-lg px-8 py-6"
                >
                  Ver Dashboard
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-primary text-lg px-8 py-6">
                  Começar Agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-card border-t border-border py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-16 text-foreground">Funcionalidades</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Ω-Gate */}
            <Card className="wireframe-accent p-8">
              <Shield className="w-12 h-12 text-accent-cyan mb-4" />
              <h3 className="text-2xl font-bold mb-3 text-foreground">Ω-Gate</h3>
              <p className="text-muted-foreground mb-4">
                Sistema imunológico semântico que emite vereditos (PASS, HOLD, REVIEW, BLOCK) baseado em análise de confiança, I-SPI e risco detectado por LLM.
              </p>
              <div className="formula-text text-xs">Decisão automática em tempo real</div>
            </Card>

            {/* Feature 2: I-SPI */}
            <Card className="wireframe-accent p-8">
              <Brain className="w-12 h-12 text-accent-cyan mb-4" />
              <h3 className="text-2xl font-bold mb-3 text-foreground">I-SPI</h3>
              <p className="text-muted-foreground mb-4">
                Invariante de Proveniência Semântica que detecta lavagem semântica, contradições e corrupção de integridade em artefatos.
              </p>
              <div className="formula-text text-xs">Validação de coerência semântica</div>
            </Card>

            {/* Feature 3: Ledger */}
            <Card className="wireframe-accent p-8">
              <Database className="w-12 h-12 text-accent-cyan mb-4" />
              <h3 className="text-2xl font-bold mb-3 text-foreground">Ledger Imutável</h3>
              <p className="text-muted-foreground mb-4">
                Registro append-only de todas as operações com hashes SHA-256, timestamps e vereditos do Ω-Gate para auditoria completa.
              </p>
              <div className="formula-text text-xs">Prova de existência e integridade</div>
            </Card>

            {/* Feature 4: LLM Analysis */}
            <Card className="wireframe-accent p-8">
              <Lock className="w-12 h-12 text-accent-cyan mb-4" />
              <h3 className="text-2xl font-bold mb-3 text-foreground">Análise LLM</h3>
              <p className="text-muted-foreground mb-4">
                Integração com LLM para análise semântica automática, classificação de risco e geração de justificativas para decisões.
              </p>
              <div className="formula-text text-xs">Inteligência semântica integrada</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="container mx-auto py-24 px-4">
        <h2 className="text-4xl font-bold mb-16 text-foreground">Integridade do Organismo</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="wireframe-accent p-8 text-center">
            <div className="metric-label mb-2">Ψ (Psi)</div>
            <div className="metric-display text-5xl mb-2">0.92</div>
            <p className="text-sm text-muted-foreground">Densidade Informacional</p>
          </Card>

          <Card className="wireframe-accent p-8 text-center">
            <div className="metric-label mb-2">Ω (Omega)</div>
            <div className="metric-display text-5xl mb-2">0.95</div>
            <p className="text-sm text-muted-foreground">Fechamento de Governança</p>
          </Card>

          <Card className="wireframe-accent p-8 text-center">
            <div className="metric-label mb-2">Θ (Theta)</div>
            <div className="metric-display text-5xl mb-2">1.00</div>
            <p className="text-sm text-muted-foreground">Energia do Sistema</p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-card border-t border-border py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Pronto para auditar sua integridade semântica?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Helena-E oferece análise profunda, vereditos automáticos e registro imutável para máxima confiabilidade.
          </p>
          {isAuthenticated ? (
            <Button
              onClick={() => setLocation("/submit")}
              className="btn-primary text-lg px-8 py-6"
            >
              Começar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          ) : (
            <a href={getLoginUrl()}>
              <Button className="btn-primary text-lg px-8 py-6">
                Entrar com Manus OAuth
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Helena-E © 2026 | Organismo Digital de Integridade Semântica</p>
          <p className="mt-2 formula-text">
            Ω-Gate • I-SPI • Ledger Imutável • Análise LLM
          </p>
        </div>
      </footer>
    </div>
  );
}
