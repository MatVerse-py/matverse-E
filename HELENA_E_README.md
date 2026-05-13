# Helena-E: Organismo Digital de Integridade Semântica

**Versão:** 1.0.0  
**Status:** Produção  
**Última atualização:** Maio 2026

## Visão Geral

Helena-E é uma plataforma web técnica e científica que funciona como um **organismo digital auditável**, centralizando submissão de artefatos, análise semântica via LLM, decisão imunológica pelo **Ω-Gate** e registro imutável de todas as operações.

A plataforma implementa um sistema de **integridade semântica** baseado em três pilares:

1. **Ω-Gate**: Sistema imunológico que emite vereditos (PASS, HOLD, REVIEW, BLOCK)
2. **I-SPI**: Invariante de Proveniência Semântica que detecta lavagem semântica
3. **Ledger Imutável**: Registro append-only de todas as operações com hashes SHA-256

## Arquitetura

### Backend (tRPC + Express)

**Ω-Gate Decision Engine** (`server/omega_gate.ts`)
- Avalia artefatos contra regras configuráveis
- Classifica risco semântico (LOW, MEDIUM, HIGH, CRITICAL)
- Computa métricas de integridade (Ψ, Ω, Θ)
- Gera justificativas textuais para decisões

**I-SPI Validation** (`server/i_spi.ts`)
- Valida coerência semântica do conteúdo
- Detecta padrões de lavagem semântica
- Calcula entropia e contradições lógicas
- Gera provas de proveniência (hashes SHA-256)

**Artifact Processor** (`server/artifact_processor.ts`)
- Orquestra pipeline completo: I-SPI → LLM → Ω-Gate → Ledger
- Integração com LLM para análise automática
- Processamento com ou sem registro em ledger

**tRPC Routers** (`server/routers.ts`)
- `artifacts.submit`: Processa artefato com veredito
- `artifacts.evaluate`: Avalia sem processar
- `artifacts.getHistory`: Histórico de artefato
- `omegaGate.getStatistics`: Contadores de vereditos
- `omegaGate.getQueue`: Fila HOLD/REVIEW para admin
- `omegaGate.approve/block/release`: Ações administrativas
- `ledger.getAll`: Registro imutável
- `organism.getStatus`: Métricas do organismo

### Frontend (React + Tailwind)

**Estética Blueprint Matemático**
- Fundo branco com grid fino (50px × 50px)
- Tipografia: IBM Plex Sans (headlines bold) + IBM Plex Mono (labels técnicas)
- Cores: Cyan pastel (#00d9ff) + Rosa suave (#ff6b9d)
- Wireframes geométricos e fórmulas algébricas delicadas

**Páginas Principais**
- **Home**: Landing page com navegação e visão geral de funcionalidades
- **Dashboard**: Status em tempo real, contadores, métricas (Ψ, Ω, Θ)
- **SubmitArtifact**: Formulário de submissão com veredito instantâneo
- **Ledger**: Tabela append-only com histórico de operações
- **OmegaGatePanel**: Painel administrativo (regras, fila, aprovações)

### Banco de Dados (MySQL/Drizzle)

**Schema Principal**
- `users`: Autenticação Manus OAuth com role (admin/user)
- `artifacts`: Metadados de artefatos (id, content, trustScore, contentHash)
- `ledger`: Registro append-only com operationHash e previousHash
- `omega_gate_decisions`: Vereditos com reasoning e appliedRules
- `omega_gate_rules`: Regras ativas do sistema imunológico

## Fluxo de Processamento

```
1. Submissão de Artefato
   ↓
2. I-SPI Validation
   - Verifica encoding, conteúdo vazio, contradições
   - Detecta padrões de lavagem semântica
   ↓
3. LLM Analysis
   - Análise semântica automática
   - Classificação de risco (LOW/MEDIUM/HIGH/CRITICAL)
   ↓
4. Ω-Gate Decision
   - Aplica regras configuráveis
   - Emite veredito (PASS/HOLD/REVIEW/BLOCK)
   - Computa Ψ, Ω, Θ
   ↓
5. Ledger Entry
   - Registra operação com SHA-256
   - Mantém cadeia imutável
   ↓
6. Admin Review (se HOLD/REVIEW)
   - Owner aprova, libera ou bloqueia
   - Ação registrada no ledger
```

## Vereditos Ω-Gate

| Veredito | Significado | Ação |
|----------|-------------|------|
| **PASS** | Artefato válido, sem riscos | Aceito automaticamente |
| **HOLD** | Confiança baixa, requer review | Fila administrativo |
| **REVIEW** | Risco detectado, análise manual | Fila administrativo |
| **BLOCK** | Falha crítica (I-SPI, risco alto) | Rejeitado automaticamente |

## Métricas de Integridade

- **Ψ (Psi)**: Densidade informacional (0-1) baseada no tamanho do conteúdo
- **Ω (Omega)**: Fechamento de governança (0-1) baseado em trust score e I-SPI
- **Θ (Theta)**: Energia do sistema (0-1) inversamente proporcional ao risco

## Autenticação & Autorização

- **Manus OAuth**: Login obrigatório para operações sensíveis
- **Role-based Access**: `admin` para operações de controle, `user` para submissão
- **Protected Procedures**: tRPC procedures com `protectedProcedure` para autenticação
- **Admin-only Actions**: Aprovação/bloqueio exclusivo do owner

## Testes

**Cobertura Unitária** (15 testes passando)
- `ArtifactProcessor`: Avaliação, detecção de conteúdo vazio, trust score
- `OmegaGate`: Vereditos, métricas de integridade, hashes
- `ISPI`: Validação, detecção de encoding, provas de proveniência

**Executar testes:**
```bash
pnpm test
```

## Deployment

A plataforma está pronta para deploy via Manus. Clique em **Publish** no Management UI após criar checkpoint.

**Requisitos:**
- Node.js 22+
- MySQL/TiDB database
- Manus OAuth configurado
- LLM API disponível

## Próximos Passos

- [ ] Testes de integração E2E
- [ ] Auditoria de segurança (secret scan, compliance)
- [ ] Performance testing (ledger scalability)
- [ ] Ancoragem em blockchain (Sepolia testnet)
- [ ] Documentação de API (OpenAPI/Swagger)
- [ ] Zenodo DOI registration

## Nomes & Nomenclatura

Mantidos exatamente como especificados:
- **Ω-Gate**: Sistema imunológico semântico
- **I-SPI**: Invariante de Proveniência Semântica
- **Ψ, Ω, Θ**: Métricas de integridade
- **Helena-E**: Nome da plataforma
- **Manus OAuth**: Autenticação integrada

## Licença

MIT © 2026 MatVerse

---

**Construído com:** React 19 • Tailwind 4 • tRPC 11 • Express 4 • Drizzle ORM • LLM Integration
