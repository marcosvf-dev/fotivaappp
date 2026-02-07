import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Eye, EyeOff, Calendar, Users, Percent, DollarSign, Gift } from 'lucide-react';

const CouponsAdmin = () => {
  const [coupons, setCoupons] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    max_uses: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/coupons/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      
      const couponData = {
        code: newCoupon.code.toUpperCase(),
        discount_type: newCoupon.discount_type,
        discount_value: parseFloat(newCoupon.discount_value),
        max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
        valid_from: new Date(newCoupon.valid_from).toISOString(),
        valid_until: newCoupon.valid_until ? new Date(newCoupon.valid_until).toISOString() : null
      };

      const response = await fetch('http://localhost:8000/api/coupons/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(couponData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Cupom criado com sucesso!');
        setShowCreateForm(false);
        setNewCoupon({
          code: '',
          discount_type: 'percentage',
          discount_value: '',
          max_uses: '',
          valid_from: new Date().toISOString().split('T')[0],
          valid_until: ''
        });
        fetchCoupons();
      }
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      alert('Erro ao criar cupom');
    }
  };

  const handleDeactivateCoupon = async (code) => {
    if (!confirm(`Deseja realmente desativar o cupom ${code}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/coupons/${code}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Cupom desativado!');
        fetchCoupons();
      }
    } catch (error) {
      console.error('Erro ao desativar cupom:', error);
    }
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === 'fixed') {
      return `R$ ${coupon.discount_value.toFixed(2)} OFF`;
    } else if (coupon.discount_type === 'free_months') {
      return `${coupon.discount_value} ${coupon.discount_value === 1 ? 'mês' : 'meses'} grátis`;
    }
  };

  const getDiscountIcon = (type) => {
    if (type === 'percentage') return <Percent className="w-5 h-5" />;
    if (type === 'fixed') return <DollarSign className="w-5 h-5" />;
    if (type === 'free_months') return <Gift className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cupons de Desconto</h1>
            <p className="text-gray-600">Gerencie cupons promocionais para seus clientes</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Criar Cupom
          </button>
        </div>

        {/* Form de Criar Cupom */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Novo Cupom</h2>
            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                  placeholder="Ex: BEMVINDO"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Desconto *
                </label>
                <select
                  value={newCoupon.discount_type}
                  onChange={(e) => setNewCoupon({...newCoupon, discount_type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                  <option value="free_months">Meses Grátis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor do Desconto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newCoupon.discount_value}
                  onChange={(e) => setNewCoupon({...newCoupon, discount_value: e.target.value})}
                  placeholder={newCoupon.discount_type === 'percentage' ? '50' : '10.00'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newCoupon.discount_type === 'percentage' && 'Digite apenas o número (ex: 50 para 50%)'}
                  {newCoupon.discount_type === 'fixed' && 'Digite o valor em reais (ex: 10.00)'}
                  {newCoupon.discount_type === 'free_months' && 'Número de meses grátis (ex: 3)'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Usos
                </label>
                <input
                  type="number"
                  value={newCoupon.max_uses}
                  onChange={(e) => setNewCoupon({...newCoupon, max_uses: e.target.value})}
                  placeholder="Ilimitado"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Válido Desde *
                </label>
                <input
                  type="date"
                  value={newCoupon.valid_from}
                  onChange={(e) => setNewCoupon({...newCoupon, valid_from: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Válido Até
                </label>
                <input
                  type="date"
                  value={newCoupon.valid_until}
                  onChange={(e) => setNewCoupon({...newCoupon, valid_until: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  Criar Cupom
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Cupons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.code}
              className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                coupon.is_active ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    coupon.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {getDiscountIcon(coupon.discount_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{coupon.code}</h3>
                    <p className="text-sm text-gray-600">{getDiscountDisplay(coupon)}</p>
                  </div>
                </div>
                {coupon.is_active ? (
                  <Eye className="w-5 h-5 text-green-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    {coupon.current_uses} / {coupon.max_uses || '∞'} usos
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Até {coupon.valid_until 
                      ? new Date(coupon.valid_until).toLocaleDateString('pt-BR')
                      : 'Sem data limite'
                    }
                  </span>
                </div>
              </div>

              {coupon.is_active && (
                <button
                  onClick={() => handleDeactivateCoupon(coupon.code)}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                  Desativar
                </button>
              )}
            </div>
          ))}
        </div>

        {coupons.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nenhum cupom criado ainda</p>
            <p className="text-gray-500 text-sm mt-2">
              Clique em "Criar Cupom" para começar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponsAdmin;
