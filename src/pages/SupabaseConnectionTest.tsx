import { useEffect, useState } from "react";
import {
  getCurrentAccess,
  signInWithPassword,
  signOut,
  type AuthenticatedAccess,
} from "../infrastructure/supabase/auth";
import {
  getCrmBootstrap,
  type CrmBootstrap,
} from "../infrastructure/supabase/bootstrap";
export function SupabaseConnectionTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [access, setAccess] = useState<AuthenticatedAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
    const [bootstrap, setBootstrap] = useState<CrmBootstrap | null>(null);
  async function loadAccess() {
    setLoading(true);
    setError("");

    try {
      const currentAccess = await getCurrentAccess();
      setAccess(currentAccess);
      if (currentAccess) {
        const crmContext = await getCrmBootstrap();
        setBootstrap(crmContext);
        } else {
        setBootstrap(null);
        }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível consultar o acesso.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAccess();
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithPassword(email, password);
      await loadAccess();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível entrar.",
      );
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);

    try {
      await signOut();
      setAccess(null);
      setBootstrap(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível sair.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <main style={{ padding: 40 }}>Verificando conexão...</main>;
  }

  if (access) {
    const membership = bootstrap?.memberships[0];
    return (
      <main
        style={{
          maxWidth: 680,
          margin: "60px auto",
          padding: 32,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <h1>Conexão confirmada</h1>
{membership && (
  <>
    <p>
      <strong>Nome do CRM:</strong>{" "}
      {membership.branding.crm_name}
    </p>

    <p>
      <strong>Cor principal:</strong>{" "}
      {membership.branding.primary_color}
    </p>

    <p>
      <strong>Cor secundária:</strong>{" "}
      {membership.branding.secondary_color}
    </p>

    <p>
      <strong>Total de permissões:</strong>{" "}
      {membership.permissions.length}
    </p>

    <details>
      <summary>Visualizar permissões</summary>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          marginTop: 16,
        }}
      >
        {membership.permissions.join("\n")}
      </pre>
    </details>
  </>
)}
        <p>
          <strong>Usuário:</strong> {access.fullName}
        </p>

        <p>
          <strong>E-mail:</strong> {access.email}
        </p>

        <p>
          <strong>Empresa:</strong> {access.organizationName}
        </p>

        <p>
          <strong>Slug:</strong> {access.organizationSlug}
        </p>

        <p>
          <strong>Cargo:</strong> {access.roleName}
        </p>

        <p>
          <strong>Código do cargo:</strong> {access.roleCode}
        </p>

        <p>
          <strong>Administrador da plataforma:</strong>{" "}
          {access.isPlatformAdmin ? "Sim" : "Não"}
        </p>

        <button type="button" onClick={handleLogout}>
          Encerrar sessão de teste
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 32,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1>Acesso técnico temporário</h1>

      <p>
        Esta página serve apenas para validar a conexão com o Supabase.
      </p>

      {error && (
        <p style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleLogin}>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{
              display: "block",
              width: "100%",
              margin: "8px 0 20px",
              padding: 10,
            }}
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{
              display: "block",
              width: "100%",
              margin: "8px 0 20px",
              padding: 10,
            }}
          />
        </label>

        <button type="submit">Validar acesso</button>
      </form>
    </main>
  );
}