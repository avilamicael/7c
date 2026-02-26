import { useState } from 'react'
import api from '../api/client'
import logoAuth from '/logoAuth.png'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin }) {
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [erro, setErro]           = useState('')
  const [showSenha, setShowSenha] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login/', { email, password: senha })
      sessionStorage.setItem('access', data.access)
      sessionStorage.setItem('refresh', data.refresh)
      const { data: usuario } = await api.get('/usuarios/me/')
      sessionStorage.setItem('usuario', JSON.stringify(usuario))
      onLogin(usuario)
    } catch (err) {
      const status = err.response?.status
      if (status === 401 || status === 400) setErro('E-mail ou senha incorretos.')
      else if (status === 429) setErro('Muitas tentativas. Aguarde 1 minuto.')
      else setErro('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        .login-root {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Outfit', sans-serif;
          background: #0e0f0d;
        }

        @media (max-width: 1024px) {
          .login-root {
            grid-template-columns: 1fr;
            height: 100svh;
          }
          .login-left { display: none; }
          .login-right {
            height: 100svh;
            padding: 24px;
            justify-content: center;
          }
          .login-box {
            gap: 24px;
          }
        }

        /* ── LADO ESQUERDO ── */
        .login-left {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 64px;
          text-align: center;
          background: linear-gradient(135deg, #3d6e1a 0%, #0a6b5e 100%);
        }

        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 15% 15%, rgba(255,255,255,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 85% 85%, rgba(0,0,0,0.35) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Círculos decorativos */
        .login-left::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.12);
          top: -120px;
          right: -120px;
          pointer-events: none;
        }

        .login-left-circle {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          bottom: -80px;
          left: -80px;
          pointer-events: none;
        }

        .login-left-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .login-logo {
          width: 110px;
          height: auto;
          margin-bottom: 32px;
          filter: drop-shadow(0 8px 32px rgba(0,0,0,0.2));
        }

        .login-left h1 {
          font-size: 38px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1.1;
          margin-bottom: 14px;
          text-shadow: 0 2px 16px rgba(0,0,0,0.15);
        }

        .login-left p {
          font-size: 15px;
          color: rgba(255,255,255,0.82);
          line-height: 1.65;
          max-width: 300px;
          margin-bottom: 44px;
        }

        .login-features {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          max-width: 300px;
          text-align: left;
        }

        .login-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fff;
          font-size: 13.5px;
          font-weight: 500;
        }

        .login-feature-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fff;
          opacity: 0.9;
          flex-shrink: 0;
        }

        /* ── LADO DIREITO ── */
        .login-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: #0e0f0d;
          position: relative;
        }

        .login-right::before {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(12,175,153,0.06) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .login-box {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* Cabeçalho */
        .login-header {
          text-align: center;
        }

        .login-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }

        .login-header p {
          font-size: 14px;
          color: rgba(255,255,255,0.38);
        }

        /* Barra decorativa */
        .login-accent-bar {
          width: 40px;
          height: 3px;
          border-radius: 99px;
          background: linear-gradient(90deg, #8fd34a, #0caf99);
          margin: 10px auto 0;
        }

        /* Formulário */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .login-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input {
          width: 100%;
          background: #1a1c19;
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          color: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .login-input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        .login-input:focus {
          border-color: #0caf99;
          box-shadow: 0 0 0 3px rgba(12,175,153,0.12);
        }

        .login-input.has-toggle {
          padding-right: 44px;
        }

        .login-eye {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          display: flex;
          transition: color 0.15s;
          padding: 0;
        }

        .login-eye:hover { color: rgba(255,255,255,0.6); }

        /* Linha senha + link */
        .login-password-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .login-password-row label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .login-forgot {
          font-size: 12px;
          color: #0caf99;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          opacity: 0.8;
          transition: opacity 0.15s;
        }

        .login-forgot:hover { opacity: 1; }

        /* Erro */
        .login-error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #f87171;
          text-align: center;
        }

        /* Botão submit */
        .login-btn {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(90deg, #8fd34a 0%, #0caf99 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(12,175,153,0.3);
          margin-top: 4px;
        }

        .login-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(12,175,153,0.4);
        }

        .login-btn:active:not(:disabled) { transform: translateY(0); }

        .login-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Footer */
        .login-footer {
          text-align: center;
          font-size: 11.5px;
          color: rgba(255,255,255,0.18);
          letter-spacing: 0.03em;
        }
      `}</style>

      <div className="login-root">

        {/* ── Esquerda ── */}
        <div className="login-left">
          <div className="login-left-circle" />
          <div className="login-left-content">
            <img src={logoAuth} alt="7C Turismo" className="login-logo" />
            <h1>Sistema de<br />Gestão</h1>
            <p>Plataforma completa para agências de viagens gerenciarem clientes, cotações e operações.</p>
            <div className="login-features">
              {['Gestão completa de clientes', 'Cotações e reservas aéreas', 'Controle financeiro integrado', 'Calendário e compromissos'].map(f => (
                <div key={f} className="login-feature">
                  <div className="login-feature-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Direita ── */}
        <div className="login-right">
          <div className="login-box">

            <div className="login-header">
              <h2>Bem-vindo de volta</h2>
              <p>Entre com suas credenciais para acessar o sistema</p>
              <div className="login-accent-bar" />
            </div>

            <form onSubmit={handleSubmit} noValidate className="login-form">
              {erro && <div className="login-error">{erro}</div>}

              <div className="login-field">
                <label htmlFor="email">Email</label>
                <div className="login-input-wrap">
                  <input
                    id="email"
                    type="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="login-input"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <div className="login-password-row">
                  <label htmlFor="password">Senha</label>
                  <button type="button" className="login-forgot">Esqueceu a senha?</button>
                </div>
                <div className="login-input-wrap">
                  <input
                    id="password"
                    type={showSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    autoComplete="current-password"
                    className={cn('login-input', 'has-toggle')}
                    required
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowSenha(v => !v)}
                    tabIndex={-1}
                  >
                    {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Autenticando…' : 'Entrar no Sistema'}
              </button>
            </form>

            <p className="login-footer">
              © {new Date().getFullYear()} 7C Sistemas · Todos os direitos reservados
            </p>
          </div>
        </div>

      </div>
    </>
  )
}