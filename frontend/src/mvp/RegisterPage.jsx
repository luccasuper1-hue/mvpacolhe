import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ShieldCheck } from "lucide-react";
import BrandMark from "../components/BrandMark";
import { useMvpAuth } from "./AuthMvp";
import { apiError } from "./api";

export default function RegisterPage() {
  const { signUp } = useMvpAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", institution_code: "", age_band: "", guardian_name: "", guardian_email: "" });
  const [consent, setConsent] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await signUp({ ...form, institution_code: form.institution_code.toUpperCase().trim(), consent, terms_accepted: consent, privacy_accepted: privacyAccepted });
      navigate("/aluno", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mvp-auth">
      <section className="mvp-auth-card" data-testid="mvp-register-card">
        <BrandMark size={30} />
        <div className="section-kicker" style={{ marginTop: 14 }}>Estudante · piloto</div>
        <h1>Criar sua <em>conta.</em></h1>
        <p>O acesso ao Acolhe é disponibilizado pela sua instituição — use o código que ela informou.</p>
        <form className="mvp-form" onSubmit={submit}>
          <label>Nome
            <input required minLength={2} value={form.name} onChange={set("name")} data-testid="register-name-input" />
          </label>
          <label>E-mail
            <input type="email" required value={form.email} onChange={set("email")} data-testid="register-email-input" />
          </label>
          <label>Senha (mínimo 8 caracteres)
            <input type="password" required minLength={8} value={form.password} onChange={set("password")} data-testid="register-password-input" />
          </label>
          <label>Código da instituição
            <input required value={form.institution_code} onChange={set("institution_code")} placeholder="Ex.: PILOTO2026" data-testid="register-code-input" />
          </label>
          <label>Faixa etária
            <select required value={form.age_band} onChange={set("age_band")} data-testid="register-age-band-select">
              <option value="">Selecione</option>
              <option value="adult">18 anos ou mais</option>
              <option value="minor">Menor de 18 anos</option>
            </select>
          </label>
          {form.age_band === "minor" && <div className="mvp-consent" data-testid="register-guardian-box">
            <p><strong>Cadastro com responsável.</strong> A instituição deve confirmar as regras do piloto antes do uso. Informe o responsável legal para registrar o aceite.</p>
            <label>Nome do responsável<input required value={form.guardian_name} onChange={set("guardian_name")} data-testid="register-guardian-name-input" /></label>
            <label>E-mail do responsável<input type="email" required value={form.guardian_email} onChange={set("guardian_email")} data-testid="register-guardian-email-input" /></label>
            <label className="mvp-check"><input type="checkbox" checked={guardianConsent} onChange={e => setGuardianConsent(e.target.checked)} data-testid="register-guardian-checkbox" /><span>O responsável autorizou a participação no piloto e leu os termos.</span></label>
          </div>}
          <div className="mvp-consent" data-testid="register-consent-box">
            <p>
              <ShieldCheck size={14} /> Adultos e menores podem participar em fluxos diferentes. Menores exigem responsável identificado,
              aceite específico e acompanhamento da instituição. O Acolhe não realiza diagnóstico automático.
            </p>
            <label className="mvp-check">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} data-testid="register-consent-checkbox" />
              <span>Li e aceito os <Link to="/termos">termos do piloto</Link> e participar nas condições combinadas com a minha instituição.</span>
            </label>
            <label className="mvp-check">
              <input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} data-testid="register-privacy-checkbox" />
              <span>Li a <Link to="/privacidade">política de privacidade</Link> e entendi quais dados são tratados.</span>
            </label>
          </div>
          {error && <div className="mvp-error" data-testid="register-error">{error}</div>}
          <button className="button primary full" disabled={busy || !consent || !privacyAccepted || !form.age_band || (form.age_band === "minor" && (!guardianConsent || !form.guardian_name || !form.guardian_email))} data-testid="register-submit-button">
            {busy ? "Criando…" : "Criar conta"} <ArrowRight size={16} />
          </button>
        </form>
        <div className="mvp-auth-foot">
          <Link to="/entrar" data-testid="register-to-login">Já tenho conta</Link>
          <Link to="/" className="back-link" data-testid="register-back-home"><ChevronLeft size={15} /> Voltar para a Home</Link>
        </div>
      </section>
    </div>
  );
}
