import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VoiceChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', text: '👋 Olá! Sou seu assistente FOTIVA. Pressione e SEGURE o botão do microfone para falar!' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventDraft, setEventDraft] = useState(null);
  const [fullTranscript, setFullTranscript] = useState('');
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const isPressedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Configurar reconhecimento de voz
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      addMessage('bot', '❌ Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true; // Continuar ouvindo
    recognition.interimResults = true; // Mostrar resultados parciais
    recognition.lang = 'pt-BR';

    recognition.onstart = () => {
      setIsListening(true);
      setFullTranscript('');
      console.log('🎤 Voice recognition started');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Atualizar transcrição completa
      if (finalTranscript) {
        setFullTranscript(prev => prev + finalTranscript);
      }
      
      // Mostrar transcrição atual (final + interim)
      setTranscript(fullTranscript + finalTranscript + interimTranscript);
    };

    recognition.onend = () => {
      console.log('🛑 Voice recognition ended');
      setIsListening(false);
      
      // Se ainda está pressionado, reiniciar
      if (isPressedRef.current) {
        console.log('🔄 Restarting recognition (still pressed)');
        try {
          recognition.start();
        } catch (error) {
          console.error('Error restarting recognition:', error);
        }
      } else {
        // Processar comando ao soltar
        if (fullTranscript.trim()) {
          processCommand(fullTranscript.trim());
          setFullTranscript('');
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Ignorar erro "no-speech" se ainda está pressionado
      if (event.error === 'no-speech' && isPressedRef.current) {
        return;
      }
      
      if (event.error !== 'aborted') {
        setIsListening(false);
        addMessage('bot', '❌ Erro no reconhecimento de voz. Tente novamente.');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [fullTranscript]);

  const handleMouseDown = () => {
    if (!isProcessing && recognitionRef.current) {
      console.log('👇 Mouse down - Starting listening');
      isPressedRef.current = true;
      setTranscript('');
      setFullTranscript('');
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const handleMouseUp = () => {
    console.log('👆 Mouse up - Stopping listening');
    isPressedRef.current = false;
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    handleMouseDown();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  const addMessage = (type, text, icon = null) => {
    setMessages(prev => [...prev, { type, text, icon }]);
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  };

  const createClient = async (clientName, phone = null, email = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/clients`,
        { name: clientName, phone, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  };

  const createEvent = async (eventData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/events`,
        eventData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  };

  const processCommand = async (command) => {
    const lowerCommand = command.toLowerCase();
    addMessage('user', command);
    setIsProcessing(true);

    try {
      // ========== CRIAR EVENTO ==========
      if (lowerCommand.includes('criar evento') || lowerCommand.includes('novo evento') || lowerCommand.includes('agendar')) {
        const eventData = extractEventData(command);
        
        const missingFields = [];
        if (!eventData.eventName) missingFields.push('nome do evento');
        if (!eventData.clientName) missingFields.push('nome do cliente');
        if (!eventData.date) missingFields.push('data');
        if (!eventData.time) missingFields.push('horário');
        if (!eventData.location) missingFields.push('local');
        if (!eventData.value) missingFields.push('valor');

        if (missingFields.length > 0) {
          const response = `📝 Ok! Para criar o evento, preciso que você me informe: ${missingFields.join(', ')}.`;
          addMessage('bot', response);
          speak(response);
          setEventDraft(eventData);
        } else {
          addMessage('bot', '⏳ Criando evento... aguarde um momento.');
          speak('Criando evento');

          const clients = await fetchClients();
          let client = clients.find(c => 
            c.name.toLowerCase().includes(eventData.clientName.toLowerCase()) ||
            eventData.clientName.toLowerCase().includes(c.name.toLowerCase())
          );

          if (!client) {
            addMessage('bot', `👤 Cliente "${eventData.clientName}" não encontrado. Criando novo cliente...`);
            client = await createClient(eventData.clientName, eventData.phone, eventData.email);
          }

          const newEvent = await createEvent({
            client_id: client.id,
            client_name: client.name,
            name: eventData.eventName,
            date: eventData.date,
            time: eventData.time,
            location: eventData.location,
            total_value: parseFloat(eventData.value),
            status: 'confirmado'
          });

          const successMsg = `✅ Evento "${eventData.eventName}" criado com sucesso!\n\n📋 Detalhes:\n• Cliente: ${client.name}\n• Data: ${formatDate(eventData.date)} às ${eventData.time}\n• Local: ${eventData.location}\n• Valor: R$ ${parseFloat(eventData.value).toFixed(2)}`;
          addMessage('bot', successMsg, <CheckCircle className="text-green-500" />);
          speak(`Evento ${eventData.eventName} criado com sucesso para ${client.name}`);
          
          setEventDraft(null);
        }
      }
      
      // ========== COMPLETAR INFORMAÇÕES DO EVENTO ==========
      else if (eventDraft && (
        lowerCommand.includes('o evento') || 
        lowerCommand.includes('o cliente') ||
        lowerCommand.includes('no dia') ||
        lowerCommand.includes('às') ||
        lowerCommand.includes('no local') ||
        lowerCommand.includes('no valor')
      )) {
        const updatedData = { ...eventDraft, ...extractEventData(command) };
        
        const missingFields = [];
        if (!updatedData.eventName) missingFields.push('nome do evento');
        if (!updatedData.clientName) missingFields.push('nome do cliente');
        if (!updatedData.date) missingFields.push('data');
        if (!updatedData.time) missingFields.push('horário');
        if (!updatedData.location) missingFields.push('local');
        if (!updatedData.value) missingFields.push('valor');

        if (missingFields.length > 0) {
          const response = `📝 Ainda preciso de: ${missingFields.join(', ')}.`;
          addMessage('bot', response);
          speak(response);
          setEventDraft(updatedData);
        } else {
          addMessage('bot', '⏳ Criando evento... aguarde.');
          speak('Criando evento');

          const clients = await fetchClients();
          let client = clients.find(c => 
            c.name.toLowerCase().includes(updatedData.clientName.toLowerCase())
          );

          if (!client) {
            client = await createClient(updatedData.clientName);
          }

          await createEvent({
            client_id: client.id,
            client_name: client.name,
            name: updatedData.eventName,
            date: updatedData.date,
            time: updatedData.time,
            location: updatedData.location,
            total_value: parseFloat(updatedData.value),
            status: 'confirmado'
          });

          const successMsg = `✅ Evento criado com sucesso!`;
          addMessage('bot', successMsg, <CheckCircle className="text-green-500" />);
          speak(successMsg);
          setEventDraft(null);
        }
      }
      
      // ========== VER EVENTOS ==========
      else if (lowerCommand.includes('ver eventos') || lowerCommand.includes('mostrar eventos') || lowerCommand.includes('listar eventos') || lowerCommand.includes('meus eventos')) {
        const response = '📅 Ok! Redirecionando para a página de eventos.';
        addMessage('bot', response);
        speak(response);
        setTimeout(() => navigate('/eventos'), 1500);
      }
      
      // ========== PAGAMENTOS ==========
      else if (lowerCommand.includes('pagamento') || lowerCommand.includes('financeiro') || lowerCommand.includes('contas')) {
        const response = '💰 Abrindo a página de pagamentos.';
        addMessage('bot', response);
        speak(response);
        setTimeout(() => navigate('/pagamentos'), 1500);
      }
      
      // ========== GALERIA ==========
      else if (lowerCommand.includes('galeria') || lowerCommand.includes('fotos') || lowerCommand.includes('álbum')) {
        const response = '📸 Abrindo a galeria de fotos.';
        addMessage('bot', response);
        speak(response);
        setTimeout(() => navigate('/galeria'), 1500);
      }
      
      // ========== DASHBOARD ==========
      else if (lowerCommand.includes('dashboard') || lowerCommand.includes('início') || lowerCommand.includes('home') || lowerCommand.includes('voltar')) {
        const response = '🏠 Voltando para o dashboard.';
        addMessage('bot', response);
        speak(response);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
      
      // ========== AJUDA ==========
      else if (lowerCommand.includes('ajuda') || lowerCommand.includes('o que você pode fazer') || lowerCommand.includes('comandos')) {
        const helpMsg = `🤖 Posso te ajudar com:

• 📅 Criar eventos
  Exemplo: "Criar evento casamento da Maria no dia 15 de fevereiro às 14h no salão eventos no valor de 3000 reais"

• 📋 Ver seus eventos
• 💰 Acessar pagamentos
• 📸 Abrir a galeria
• 🏠 Voltar ao dashboard

💡 Dica: Pressione e SEGURE o microfone para falar tudo de uma vez!`;
        addMessage('bot', helpMsg);
        speak('Posso criar eventos, ver agendamentos, acessar pagamentos e galeria. Pressione e segure o microfone para falar');
      }
      
      // ========== CANCELAR ==========
      else if (lowerCommand.includes('cancelar') || lowerCommand.includes('esquecer')) {
        setEventDraft(null);
        const response = '❌ Ok, operação cancelada.';
        addMessage('bot', response);
        speak(response);
      }
      
      // ========== COMANDO NÃO RECONHECIDO ==========
      else {
        const response = '🤔 Desculpe, não entendi esse comando. Você pode pedir para criar evento, ver eventos, abrir pagamentos, galeria ou dashboard. Diga "ajuda" para ver todos os comandos.';
        addMessage('bot', response);
        speak('Não entendi. Diga ajuda para ver os comandos disponíveis');
      }
      
    } catch (error) {
      console.error('Erro:', error);
      const errorMsg = `❌ Ops! Ocorreu um erro: ${error.response?.data?.detail || error.message || 'Erro desconhecido'}`;
      addMessage('bot', errorMsg, <AlertCircle className="text-red-500" />);
      speak('Ocorreu um erro. Tente novamente');
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const extractEventData = (command) => {
    const data = {
      eventName: '',
      clientName: '',
      date: '',
      time: '',
      location: '',
      value: '',
      phone: '',
      email: ''
    };

    // Extrair nome do evento
    const eventMatch = command.match(/evento\s+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+da?|\s+do?|\s+no|\s+às|\s+em|\s+dia|$)/i);
    if (eventMatch) {
      data.eventName = eventMatch[1].trim();
    }

    // Extrair nome do cliente
    const clientMatch = command.match(/(?:da?|do?|cliente)\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+no|\s+dia|\s+em|\s+às|$)/i);
    if (clientMatch) {
      data.clientName = clientMatch[1].trim();
    }

    // Extrair valor
    const valueMatch = command.match(/(?:valor de|por|no valor)\s*(?:R\$\s*)?(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:reais)?/i);
    if (valueMatch) {
      data.value = valueMatch[1].replace(/\./g, '').replace(',', '.');
    }

    // Extrair data
    const dateMatch = command.match(/(?:dia|em|no dia)\s*(\d{1,2})(?:\s+de\s+(\w+))?(?:\s+de\s+(\d{4}))?/i);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2] ? getMonthNumber(dateMatch[2]) : new Date().getMonth() + 1;
      const year = dateMatch[3] || new Date().getFullYear();
      data.date = `${year}-${month.toString().padStart(2, '0')}-${day}`;
    }

    // Extrair hora
    const timeMatch = command.match(/(?:às|as|hora)\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|horas)?/i);
    if (timeMatch) {
      const hour = timeMatch[1].padStart(2, '0');
      const minute = timeMatch[2] || '00';
      data.time = `${hour}:${minute}`;
    }

    // Extrair local
    const locationMatch = command.match(/(?:no|na|local)\s+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+no valor|\s+às|\s+valor|$)/i);
    if (locationMatch) {
      data.location = locationMatch[1].trim();
    }

    // Extrair telefone
    const phoneMatch = command.match(/(?:telefone|celular|fone)\s*(\d{10,11})/i);
    if (phoneMatch) {
      data.phone = phoneMatch[1];
    }

    // Extrair email
    const emailMatch = command.match(/(?:email|e-mail)\s+([\w.-]+@[\w.-]+\.\w+)/i);
    if (emailMatch) {
      data.email = emailMatch[1];
    }

    return data;
  };

  const getMonthNumber = (monthName) => {
    const months = {
      'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
      'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
      'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
    };
    return months[monthName.toLowerCase()] || new Date().getMonth() + 1;
  };

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleSendMessage = () => {
    if (transcript.trim()) {
      processCommand(transcript);
      setTranscript('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-[#4A9B6E] hover:bg-[#3d8259]'
        } text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110`}
        aria-label="Abrir assistente de voz"
      >
        {isOpen ? <X size={24} /> : <Mic size={24} />}
      </button>

      {/* Janela do Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4A9B6E] to-[#3d8259] text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-300'}`} />
              <div>
                <h3 className="font-semibold">Assistente FOTIVA</h3>
                <p className="text-xs opacity-90">{isListening ? '🎤 Gravando...' : 'Online'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.type === 'user'
                      ? 'bg-[#4A9B6E] text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-md rounded-bl-sm border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white p-3 rounded-2xl shadow-md flex items-center gap-2 border border-gray-100">
                  <Loader className="animate-spin text-[#4A9B6E]" size={16} />
                  <span className="text-sm text-gray-600">Processando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            {/* Mostrar transcrição em tempo real */}
            {isListening && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 font-medium mb-1">🔴 Gravando:</p>
                <p className="text-sm text-gray-700">{transcript || 'Fale agora...'}</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite ou segure o microfone..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A9B6E] focus:border-transparent text-sm"
                disabled={isListening}
              />
              <button
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`p-2.5 rounded-xl transition-all select-none ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse scale-110'
                    : 'bg-[#4A9B6E] hover:bg-[#3d8259] text-white'
                }`}
                disabled={isProcessing}
                title="Pressione e SEGURE para falar"
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                onClick={handleSendMessage}
                className="p-2.5 bg-[#4A9B6E] hover:bg-[#3d8259] text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!transcript.trim() || isProcessing || isListening}
                title="Enviar mensagem"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {isListening ? '🔴 Gravando... Solte para processar' : '💡 Pressione e SEGURE o microfone 🎤'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceChatbot;
