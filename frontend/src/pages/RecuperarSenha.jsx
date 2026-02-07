import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RecuperarSenha.css';

const RecuperarSenha = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Código, 3: Nova senha
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'https://fotivaappp.onrender.com';

  // Etapa 1: Solicitar código
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSuccess(response.data.message || 'Código enviado para seu email!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar código. Verifique o email.');
    } finally {
      setLoading(false);
    }
  };

  // Etapa 2: Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/verify-reset-code`, {
        email,
        code,
      });
      setSuccess(response.data.message || 'Código verificado! Crie sua nova senha.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  // Etapa 3: Resetar senha
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres!');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        code,
        new_password: newPassword,
      });
      setSuccess(response.data.message || 'Senha alterada com sucesso!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recuperar-senha-container">
      <div className="recuperar-senha-box">
        <div className="logo-section">
          <h1>FOTIVA</h1>
          <p>Recuperação de Senha</p>
        </div>

        {/* Indicador de Etapas */}
        <div className="steps-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Email</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Código</span>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Nova Senha</span>
          </div>
        </div>

        {/* Mensagens */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Etapa 1: Digite o Email */}
        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>
        )}

        {/* Etapa 2: Digite o Código */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label>Código de Verificação</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digite o código de 6 dígitos"
                maxLength={6}
                required
                disabled={loading}
              />
              <small>Verifique seu email (pode estar no spam)</small>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Voltar
            </button>
          </form>
        )}

        {/* Etapa 3: Nova Senha */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Redefinir Senha'}
            </button>
          </form>
        )}

        {/* Link para Login */}
        <div className="footer-links">
          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/login')}
          >
            Voltar para Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecuperarSenha;
