import { useState, useEffect } from 'react'
import api, { logout } from '../api/client'

// ─── Paleta e tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0f',
  surface: '#101018',
  border: '#1e1e2e',
  purple: '#6c63ff',
  purpleLight: '#a78bfa',
  text: '#e8e8f0',
  muted: '#6b6b8a',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
}

const S = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: C.bg,
    color: C.text,
  },

  // ── Sidebar ──
  sidebar: {
    width: 240,
    background: C.surface,
    borderRight: `1px solid ${C.border}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '28px 0',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 24px 28px',
    borderBottom: `1px solid ${C.border}`,
    marginBottom: 20,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: `linear-gradient(135deg, ${C.purple}, ${C.purpleLight})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 17,
    color: '#fff',
    flexShrink: 0,
    boxShadow: `0 0 20px rgba(108,99,255,0.3)`,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: C.text,
  },
  logoSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 1,
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    color: active ? C.text : C.muted,
    background: active ? 'rgba(108,99,255,0.1)' : 'transparent',
    borderLeft: active ? `3px solid ${C.purple}` : '3px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
    userSelect: 'none',
  }),
  sidebarFooter: {
    marginTop: 'auto',
    padding: '16px 24px',
    borderTop: `1px solid ${C.border}`,
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${C.purple}, ${C.purpleLight})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: C.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 110,
  },
  userEmail: {
    fontSize: 11,
    color: C.muted,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 110,
  },
  logoutBtn: {
    marginTop: 14,
    width: '100%',
    padding: '9px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: 'transparent',
    color: C.muted,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  },

  // ── Main ──
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  header: {
    padding: '28px 36px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: C.text,
  },
  pageDesc: {
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
  },
  content: {
    padding: '28px 36px 40px',
    flex: 1,
  },

  // ── Cards ──
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 18,
    marginBottom: 28,
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: '22px 24px',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: C.text,
  },
  cardSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 6,
  },
  cardIcon: (color) => ({
    width: 38,
    height: 38,
    borderRadius: 10,
    background: `${color}18`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    marginBottom: 14,
  }),

  // ── Barra de cota ──
  quotaCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: '24px',
    marginBottom: 28,
  },
  quotaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quotaTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: C.text,
  },
  quotaBadge: (pct) => ({
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
    color: pct >= 90 ? C.danger : pct >= 70 ? C.warning : C.success,
    background:
      pct >= 90
        ? 'rgba(248,113,113,0.1)'
        : pct >= 70
        ? 'rgba(251,191,36,0.1)'
        : 'rgba(52,211,153,0.1)',
  }),
  progressTrack: {
    height: 8,
    borderRadius: 4,
    background: '#1a1a2e',
    overflow: 'hidden',
  },
  progressBar: (pct) => ({
    height: '100%',
    borderRadius: 4,
    width: `${Math.min(pct, 100)}%`,
    background:
      pct >= 90
        ? `linear-gradient(90deg, ${C.danger}, #ff6b6b)`
        : pct >= 70
        ? `linear-gradient(90deg, ${C.warning}, #fde68a)`
        : `linear-gradient(90deg, ${C.purple}, ${C.purpleLight})`,
    transition: 'width 0.8s ease',
  }),
  quotaNumbers: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    fontSize: 12,
    color: C.muted,
  },

  // ── Empresa ──
  infoCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: '24px',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: C.text,
    marginBottom: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  infoRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  infoKey: {
    fontSize: 12,
    color: C.muted,
    minWidth: 110,
    flexShrink: 0,
    paddingTop: 1,
  },
  infoVal: {
    fontSize: 13,
    color: C.text,
    fontWeight: 500,
    wordBreak: 'break-all',
  },
  statusBadge: (status) => {
    const map = {
      ativo: { bg: 'rgba(52,211,153,0.1)', color: C.success },
      trial: { bg: 'rgba(251,191,36,0.1)', color: C.warning },
      pendente: { bg: 'rgba(251,191,36,0.1)', color: C.warning },
      inativo: { bg: 'rgba(107,107,138,0.15)', color: C.muted },
      suspenso: { bg: 'rgba(248,113,113,0.1)', color: C.danger },
      desativado: { bg: 'rgba(248,113,113,0.1)', color: C.danger },
    }
    const s = map[status] || map.inativo
    return {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
    }
  },

  // ── Loading/Erro ──
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'column',
    gap: 12,
    color: C.muted,
    fontSize: 14,
  },
  spinner: {
    width: 36,
    height: 36,
    border: `3px solid ${C.border}`,
    borderTop: `3px solid ${C.purple}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function inicial(nome = '') {
  return nome.trim().charAt(0).toUpperCase() || '?'
}

function formatarCNPJ(cnpj = '') {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Dashboard({ usuario, onLogout }) {
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [activeNav, setActiveNav] = useState('dashboard')

  useEffect(() => {
    async function carregarEmpresa() {
      try {
        const { data } = await api.get('/empresas/minha/')
        setEmpresa(data)
      } catch {
        setErro('Não foi possível carregar os dados da empresa.')
      } finally {
        setLoading(false)
      }
    }
    carregarEmpresa()
  }, [])

  const pctConsumo = empresa
    ? Math.round((empresa.consumo_mes / (empresa.cota_mensal || 1)) * 100)
    : 0

  const cotaDisponivel =
    empresa
      ? Math.max(0, empresa.cota_mensal - empresa.consumo_mes) + (empresa.creditos_extras || 0)
      : 0

  const navItems = [
    { id: 'dashboard', icon: '▦', label: 'Dashboard' },
    { id: 'usuarios', icon: '◎', label: 'Usuários' },
    { id: 'configuracoes', icon: '◈', label: 'Configurações' },
  ]

  return (
    <>
      {/* Keyframe de spin inline */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={S.layout}>
        {/* ── Sidebar ── */}
        <aside style={S.sidebar}>
          <div style={S.sidebarLogo}>
            <div style={S.logoMark}>{inicial(empresa?.razao_social || 'S')}</div>
            <div>
              <div style={S.logoText}>
                {empresa?.nome_fantasia || empresa?.razao_social || 'Sistema'}
              </div>
              <div style={S.logoSub}>Painel interno</div>
            </div>
          </div>

          <nav>
            {navItems.map((item) => (
              <div
                key={item.id}
                style={S.navItem(activeNav === item.id)}
                onClick={() => setActiveNav(item.id)}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>

          <div style={S.sidebarFooter}>
            <div style={S.userChip}>
              <div style={S.avatar}>{inicial(usuario?.nome)}</div>
              <div>
                <div style={S.userName}>{usuario?.nome || '—'}</div>
                <div style={S.userEmail}>{usuario?.email || '—'}</div>
              </div>
            </div>
            <button
              style={S.logoutBtn}
              onClick={onLogout}
              onMouseEnter={(e) => {
                e.target.style.color = C.danger
                e.target.style.borderColor = 'rgba(248,113,113,0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = C.muted
                e.target.style.borderColor = C.border
              }}
            >
              Sair da conta
            </button>
          </div>
        </aside>

        {/* ── Conteúdo principal ── */}
        <main style={S.main}>
          <div style={S.header}>
            <div>
              <h1 style={S.pageTitle}>Dashboard</h1>
              <p style={S.pageDesc}>
                Bem-vindo, {usuario?.nome?.split(' ')[0] || 'usuário'}.
              </p>
            </div>
          </div>

          <div style={S.content}>
            {loading ? (
              <div style={S.centered}>
                <div style={S.spinner} />
                <span>Carregando dados…</span>
              </div>
            ) : erro ? (
              <div style={S.centered}>
                <span style={{ fontSize: 32 }}>⚠</span>
                <span>{erro}</span>
              </div>
            ) : (
              <>
                {/* ── Cards ── */}
                <div style={S.grid}>
                  <div style={S.card}>
                    <div style={S.cardIcon(C.purple)}>📦</div>
                    <div style={S.cardLabel}>Cota disponível</div>
                    <div style={S.cardValue}>{cotaDisponivel.toLocaleString('pt-BR')}</div>
                    <div style={S.cardSub}>créditos restantes</div>
                  </div>

                  <div style={S.card}>
                    <div style={S.cardIcon(C.purpleLight)}>📊</div>
                    <div style={S.cardLabel}>Consumo do mês</div>
                    <div style={S.cardValue}>
                      {empresa.consumo_mes?.toLocaleString('pt-BR') ?? '0'}
                    </div>
                    <div style={S.cardSub}>de {empresa.cota_mensal?.toLocaleString('pt-BR')} da cota</div>
                  </div>

                  <div style={S.card}>
                    <div style={S.cardIcon(C.success)}>✦</div>
                    <div style={S.cardLabel}>Créditos extras</div>
                    <div style={S.cardValue}>
                      {empresa.creditos_extras?.toLocaleString('pt-BR') ?? '0'}
                    </div>
                    <div style={S.cardSub}>adicionados avulsos</div>
                  </div>
                </div>

                {/* ── Barra de cota ── */}
                <div style={S.quotaCard}>
                  <div style={S.quotaHeader}>
                    <span style={S.quotaTitle}>Utilização da cota mensal</span>
                    <span style={S.quotaBadge(pctConsumo)}>{pctConsumo}% utilizado</span>
                  </div>
                  <div style={S.progressTrack}>
                    <div style={S.progressBar(pctConsumo)} />
                  </div>
                  <div style={S.quotaNumbers}>
                    <span>{empresa.consumo_mes?.toLocaleString('pt-BR')} consumidos</span>
                    <span>{empresa.cota_mensal?.toLocaleString('pt-BR')} total</span>
                  </div>
                </div>

                {/* ── Info da empresa ── */}
                <div style={S.infoCard}>
                  <div style={S.infoTitle}>
                    <span>🏢</span> Dados da empresa
                  </div>

                  {[
                    { k: 'Razão social', v: empresa.razao_social },
                    { k: 'Nome fantasia', v: empresa.nome_fantasia || '—' },
                    { k: 'CNPJ', v: formatarCNPJ(empresa.cnpj) },
                    { k: 'E-mail', v: empresa.email || '—' },
                    { k: 'Telefone', v: empresa.telefone || '—' },
                    {
                      k: 'Status',
                      v: <span style={S.statusBadge(empresa.status)}>{empresa.status}</span>,
                    },
                  ].map(({ k, v }) => (
                    <div key={k} style={S.infoRow}>
                      <span style={S.infoKey}>{k}</span>
                      <span style={S.infoVal}>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}