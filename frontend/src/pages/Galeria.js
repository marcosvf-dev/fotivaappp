import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Galeria = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    thumbnail: ''
  });

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      const response = await axios.get(`${API_URL}/galleries`);
      setGalleries(response.data);
    } catch (error) {
      toast.error('Erro ao carregar galerias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/galleries`, formData);
      toast.success('Álbum criado com sucesso!');
      setShowDialog(false);
      setFormData({ name: '', date: '', thumbnail: '' });
      fetchGalleries();
    } catch (error) {
      toast.error('Erro ao criar álbum');
    }
  };

  const sampleImages = [
    'https://images.unsplash.com/photo-1765292783735-9ec7213b1df1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcGhvdG9ncmFwaHklMjBldmVudCUyMGhhcHB5JTIwY291cGxlfGVufDB8fHx8MTc2OTcyNTczOHww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1758810413611-a318fcd14873?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHx3ZWRkaW5nJTIwcGhvdG9ncmFwaHklMjBldmVudCUyMGhhcHB5JTIwY291cGxlfGVufDB8fHx8MTc2OTcyNTczOHww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1686129613717-64df933aa48f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHw0fHx3ZWRkaW5nJTIwcGhvdG9ncmFwaHklMjBldmVudCUyMGhhcHB5JTIwY291cGxlfGVufDB8fHx8MTc2OTcyNTczOHww&ixlib=rb-4.1.0&q=85'
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4A9B6E] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando galerias...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#111827]" style={{ fontFamily: 'Work Sans, sans-serif' }}>
              Galeria
            </h1>
            <p className="mt-1 text-[#6B7280]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Organize e compartilhe suas fotos
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <button 
                data-testid="create-gallery-button"
                className="bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-2.5 font-medium transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
              >
                <Plus size={20} />
                Novo Álbum
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Álbum</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Nome do Álbum</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                    placeholder="Casamento Maria & João"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Data</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">URL da Capa (opcional)</label>
                  <input
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                    placeholder="https://..."
                  />
                </div>
                <button
                  type="submit"
                  data-testid="submit-gallery-button"
                  className="w-full bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-3 font-medium transition-all"
                >
                  Criar Álbum
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {galleries.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleries.map((gallery, index) => (
              <div 
                key={gallery.id}
                data-testid={`gallery-card-${gallery.id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer group"
              >
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img 
                    src={gallery.thumbnail || sampleImages[index % sampleImages.length]}
                    alt={gallery.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-[#111827] truncate">{gallery.name}</h3>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {new Date(gallery.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-2">
                    {gallery.photo_count} fotos
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <ImageIcon size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#111827] mb-2">Nenhum álbum criado</h3>
            <p className="text-[#6B7280] mb-6">Comece organizando suas fotos em álbuns</p>
            <button 
              onClick={() => setShowDialog(true)}
              className="bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-2.5 font-medium transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Criar Primeiro Álbum
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Galeria;