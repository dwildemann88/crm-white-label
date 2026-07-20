import {
  KanbanSquare,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Webhook,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useCrm } from "../app/CrmContext";
import { demoCredentials } from "../data/seed";

export function LoginPage() {
  const { login, busy, error, clearError } = useCrm();
  const [email, setEmail] = useState("admin@projem.com.br");
  const [password, setPassword] = useState("projem123");
  return (
    <div className="login-screen">
      <div className="login-glow glow-one" />
      <div className="login-glow glow-two" />
      <section className="login-intro">
        <div className="login-brand">
          <div className="brand-mark">
            <Zap size={24} />
          </div>
          <div>
            <strong>PROJEM FLOW</strong>
            <span>CRM COMERCIAL</span>
          </div>
        </div>
        <div className="login-copy">
          <span className="eyebrow">
            <Sparkles size={15} /> BASE OPERACIONAL
          </span>
          <h1>
            Do lead recebido
            <br />
            ao contrato fechado.
          </h1>
          <p>
            Produto estruturado para autenticação real, banco, integrações e
            atendimento compartilhado sem reconstruir a interface.
          </p>
        </div>
        <div className="login-feature-grid">
          <div>
            <Webhook size={20} />
            <strong>Captação integrada</strong>
            <span>Meta, Google e páginas externas.</span>
          </div>
          <div>
            <KanbanSquare size={20} />
            <strong>Funis personalizados</strong>
            <span>Por equipe, usuário e operação.</span>
          </div>
          <div>
            <MessageCircle size={20} />
            <strong>WhatsApp compartilhado</strong>
            <span>Um número, responsáveis identificados.</span>
          </div>
          <div>
            <ShieldCheck size={20} />
            <strong>Acesso controlado</strong>
            <span>Permissões aplicadas por serviço.</span>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <form
          className="login-card"
          onSubmit={async (event) => {
            event.preventDefault();
            clearError();
            try {
              await login(email, password);
            } catch {
              /* exibido pelo contexto */
            }
          }}
        >
          <div className="login-card-heading">
            <span>ACESSO IDENTIFICADO</span>
            <h2>Entrar no CRM</h2>
            <p>O perfil é definido automaticamente pelas credenciais.</p>
          </div>
          {error && <div className="form-error">{error}</div>}
          <label className="field-label">
            E-mail
            <div className="input-icon">
              <LockKeyhole size={17} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
              />
            </div>
          </label>
          <label className="field-label">
            Senha
            <div className="input-icon">
              <LockKeyhole size={17} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
          </label>
          <button className="primary-button login-submit" disabled={busy}>
            {busy ? "Identificando usuário..." : "Acessar plataforma"}
          </button>
          <div className="demo-accounts">
            <small>Credenciais locais para avaliação</small>
            {demoCredentials.map((item) => (
              <button
                type="button"
                key={item.email}
                onClick={() => {
                  setEmail(item.email);
                  setPassword(item.password);
                }}
              >
                <strong>{item.label}</strong>
                <span>{item.email}</span>
              </button>
            ))}
          </div>
          <p className="security-note">
            <ShieldCheck size={15} /> No modo real, a sessão será emitida pelo
            backend ou Supabase Auth.
          </p>
        </form>
      </section>
    </div>
  );
}
