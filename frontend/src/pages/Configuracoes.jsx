import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Configuracoes.css';

const Configuracoes = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    studio_name: '',
    phone: '',
    profile_image: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('perfil');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchUserData();
    // Carregar foto do localStorage
    const savedImage = localStorage.getItem('profile_image');
    if (savedImage) {
      setUserData(prev => ({ ...prev, profile_image: savedImage }));
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserData(prev => ({ ...response.data, profile_image: prev.profile_image }));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showMessage('Erro ao carregar dados do usuário', 'error');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar arquivo
    if (file.size > 2 * 1024 * 1024) {
      showMessage('Imagem muito grande! Máximo 2MB', 'error');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      showMessage('Formato inválido! Use JPG, PNG ou GIF', 'error');
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      // Salvar no localStorage temporariamente
      localStorage.setItem('profile_image', reader.result);
      setUserData({ ...userData, profile_image: reader.result });
      showMessage('Foto atualizada! (Salva localmente)', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Tentar atualizar no backend (se o endpoint existir)
      try {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/auth/profile`,
          {
            name: userData.name,
            studio_name: userData.studio_name,
            phone: userData.phone,
            profile_image: userData.profile_image
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showMessage('Dados atualizados com sucesso!', 'success');
      } catch (error) {
        // Se o endpoint não existir, salvar localmente
        if (error.response?.status === 404) {
          localStorage.setItem('user_name', userData.name);
          localStorage.setItem('user_studio', userData.studio_name);
          localStorage.setItem('user_phone', userData.phone);
          showMessage('Dados salvos localmente! (Backend em atualização)', 'success');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      showMessage('Erro ao atualizar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscription/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('Assinatura cancelada com sucesso', 'success');
      setShowCancelModal(false);
      
      // Redirecionar para página de login após 2 segundos
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      showMessage('Erro ao cancelar assinatura', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const getInitials = (name) => {
    if (!name) return 'M';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="configuracoes-container">
      <div className="configuracoes-header">
        <h1>⚙️ Configurações</h1>
        <p>Gerencie sua conta e preferências</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'perfil' ? 'active' : ''}`}
          onClick={() => setActiveTab('perfil')}
        >
          👤 Perfil
        </button>
        <button
          className={`tab ${activeTab === 'contato' ? 'active' : ''}`}
          onClick={() => setActiveTab('contato')}
        >
          📞 Contato & Suporte
        </button>
        <button
          className={`tab ${activeTab === 'assinatura' ? 'active' : ''}`}
          onClick={() => setActiveTab('assinatura')}
        >
          💳 Assinatura
        </button>
      </div>

      {/* Mensagem */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tab: Perfil */}
      {activeTab === 'perfil' && (
        <div className="settings-card">
          <h2>Foto de Perfil</h2>
          
          <div className="profile-photo-section">
            <div className="current-photo">
              {userData.profile_image ? (
                <img src={userData.profile_image} alt="Perfil" />
              ) : (
                <div className="photo-placeholder">
                  {getInitials(userData.name)}
                </div>
              )}
            </div>

            <div className="photo-actions">
              <label htmlFor="photo-upload" className="btn-upload">
                📸 Alterar Foto
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
              <p className="photo-hint">JPG, PNG ou GIF. Máximo 2MB.</p>
              <p className="photo-hint" style={{ color: '#856404', marginTop: '5px' }}>
                ⚠️ Foto salva localmente até backend ser atualizado
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="disabled-input"
              />
              <p className="input-hint">O email não pode ser alterado</p>
            </div>

            <div className="form-group">
              <label>Nome do Estúdio</label>
              <input
                type="text"
                value={userData.studio_name}
                onChange={(e) => setUserData({ ...userData, studio_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Telefone</label>
              <input
                type="tel"
                value={userData.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? '⏳ Salvando...' : '💾 Salvar Alterações'}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Contato */}
      {activeTab === 'contato' && (
        <div className="settings-card">
          <h2>📞 Contato & Suporte</h2>

          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">📧</div>
              <div className="contact-details">
                <h3>Email de Suporte</h3>
                <p>marcosvinhafotografia@gmail.com</p>
                <a href="mailto:marcosvinhafotografia@gmail.com" className="btn-contact">
                  Enviar Email
                </a>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">💬</div>
              <div className="contact-details">
                <h3>WhatsApp</h3>
                <p>(37) 99999-9999</p>
                <a
                  href="https://wa.me/5537999999999?text=Olá! Preciso de ajuda com o FOTIVA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-contact"
                >
                  Abrir WhatsApp
                </a>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">📚</div>
              <div className="contact-details">
                <h3>Central de Ajuda</h3>
                <p>Perguntas frequentes e tutoriais</p>
                <button className="btn-contact">
                  Acessar
                </button>
              </div>
            </div>
          </div>

          <div className="feedback-section">
            <h3>💡 Deixe seu Feedback</h3>
            <p>Sua opinião é muito importante para melhorarmos o FOTIVA!</p>
            <textarea
              placeholder="Conte-nos sua experiência, sugestões ou problemas..."
              rows="4"
              className="feedback-textarea"
            ></textarea>
            <button className="btn-send-feedback">
              📨 Enviar Feedback
            </button>
          </div>
        </div>
      )}

      {/* Tab: Assinatura */}
      {activeTab === 'assinatura' && (
        <div className="settings-card">
          <h2>💳 Assinatura</h2>

          <div className="subscription-info">
            <div className="plan-card">
              <div className="plan-header">
                <h3>Plano Profissional</h3>
                <span className="plan-badge active">Ativo</span>
              </div>
              <div className="plan-price">
                <span className="price">R$ 19,90</span>
                <span className="period">/mês</span>
              </div>
              <div className="plan-features">
                <div className="feature">✅ Eventos ilimitados</div>
                <div className="feature">✅ Contratos digitais</div>
                <div className="feature">✅ Galeria de fotos</div>
                <div className="feature">✅ Suporte prioritário</div>
              </div>
            </div>

            <div className="subscription-details">
              <div className="detail-item">
                <span className="detail-label">Próxima cobrança:</span>
                <span className="detail-value">10/03/2026</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Método de pagamento:</span>
                <span className="detail-value">Mercado Pago</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-active">✅ Ativa</span>
              </div>
            </div>
          </div>

          <div className="danger-zone">
            <h3>⚠️ Zona de Perigo</h3>
            <p>Ao cancelar sua assinatura, você perderá acesso a todos os recursos do FOTIVA.</p>
            <button
              className="btn-cancel-subscription"
              onClick={() => setShowCancelModal(true)}
            >
              ❌ Cancelar Assinatura
            </button>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Cancelar Assinatura?</h2>
            <p>Você tem certeza que deseja cancelar sua assinatura do FOTIVA?</p>
            
            <div className="cancel-consequences">
              <h4>Você perderá acesso a:</h4>
              <ul>
                <li>❌ Todos os seus eventos cadastrados</li>
                <li>❌ Contratos digitais</li>
                <li>❌ Galeria de fotos</li>
                <li>❌ Dashboard e relatórios</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button
                className="btn-keep"
                onClick={() => setShowCancelModal(false)}
              >
                ✅ Manter Assinatura
              </button>
              <button
                className="btn-confirm-cancel"
                onClick={handleCancelSubscription}
                disabled={loading}
              >
                {loading ? '⏳ Cancelando...' : '❌ Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracoes;
