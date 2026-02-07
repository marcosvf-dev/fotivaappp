import React, { useState } from 'react';
import { CreditCard, Tag, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('plan'); // plan, payment, success
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [processing, setProcessing] = useState(false);

  const planPrice = 19.90;
  const [finalPrice, setFinalPrice] = useState(planPrice);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: couponCode })
      });

      const data = await response.json();
      
      if (data.valid) {
        setCouponValidation({ success: true, message: data.message });
        setFinalPrice(data.final_price);
      } else {
        setCouponValidation({ success: false, message: data.message });
        setFinalPrice(planPrice);
      }
    } catch (error) {
      setCouponValidation({ success: false, message: 'Erro ao validar cupom' });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessing(true);

    try {
      // Aqui você integraria com o Mercado Pago
      // Por enquanto, vamos simular o processo
      
      const token = localStorage.getItem('token');
      
      // 1. Criar preferência de pagamento no Mercado Pago
      // const mp = new MercadoPago('YOUR_PUBLIC_KEY');
      // const preference = await createPreference(finalPrice, couponCode);
      
      // 2. Redirecionar para checkout do Mercado Pago
      // window.location.href = preference.init_point;
      
      // SIMULAÇÃO - Remover em produção
      setTimeout(() => {
        setStep('success');
        setProcessing(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao processar assinatura:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
      setProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Assinatura Ativada!
          </h2>
          <p className="text-gray-600 mb-6">
            Bem-vindo ao Fotiva! Sua assinatura foi ativada com sucesso.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Plano */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Fotiva Premium</h1>
            <p className="text-green-100">
              Gerencie seus eventos de fotografia profissionalmente
            </p>
          </div>

          <div className="p-8">
            {/* Preço */}
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                R$ {finalPrice.toFixed(2)}
                <span className="text-xl text-gray-500 font-normal">/mês</span>
              </div>
              {couponValidation?.success && finalPrice < planPrice && (
                <div className="text-green-600 font-medium">
                  <span className="line-through text-gray-400 mr-2">
                    R$ {planPrice.toFixed(2)}
                  </span>
                  Desconto aplicado!
                </div>
              )}
              <p className="text-gray-600 mt-2">30 dias grátis para testar</p>
            </div>

            {/* Cupom */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Tem um cupom de desconto?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponValidation(null);
                  }}
                  placeholder="Digite o código"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                  disabled={validatingCoupon}
                />
                <button
                  onClick={validateCoupon}
                  disabled={!couponCode.trim() || validatingCoupon}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatingCoupon ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Aplicar'
                  )}
                </button>
              </div>
              {couponValidation && (
                <p className={`mt-2 text-sm ${couponValidation.success ? 'text-green-600' : 'text-red-600'}`}>
                  {couponValidation.message}
                </p>
              )}
            </div>

            {/* Recursos */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">O que está incluído:</h3>
              <ul className="space-y-3">
                {[
                  'Eventos e clientes ilimitados',
                  'Gerenciamento financeiro completo',
                  'Notificações automáticas (Push + WhatsApp)',
                  'Galeria de fotos',
                  'Controle de pagamentos e parcelas',
                  'Suporte prioritário'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botão */}
            <button
              onClick={handleSubscribe}
              disabled={processing}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Assinar Agora
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Cancele quando quiser. Sem taxas de cancelamento.
            </p>
          </div>
        </div>

        {/* Garantia */}
        <div className="mt-6 text-center text-gray-600 text-sm">
          <p>🔒 Pagamento 100% seguro via Mercado Pago</p>
          <p className="mt-2">💚 30 dias de garantia. Não gostou? Devolvemos seu dinheiro.</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
