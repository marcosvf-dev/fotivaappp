import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const VoiceChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Olá! Como posso ajudar? Você pode falar comandos como "criar evento" ou "novo evento".' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Scroll automático para a última mensagem
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
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Voice recognition started');
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

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript.trim()) {
        processCommand(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      addMessage('bot', 'Desculpe, não consegui entender. Tente novamente.');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const addMessage = (type, text) => {
    setMessages(prev => [...prev, { type, text }]);
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const processCommand = async (command) => {
    const lowerCommand = command.toLowerCase();
    addMessage('user', command);
    setIsProcessing(true);

    try {
      // Comando: Criar evento
      if (lowerCommand.includes('criar evento') || lowerCommand.includes('novo evento')) {
        const response = 'Ótimo! Vou te ajudar a criar um evento. Por favor, me diga: o nome do evento, nome do cliente, data, hora, local e valor.';
        addMessage('bot', response);
        speak(response);
        
        // Extrair informações do comando se possível
        const eventData = extractEventData(command);
        if (eventData.hasAllInfo) {
          setTimeout(() => {
            navigate('/eventos', { state: { autoFillData: eventData } });
            const successMsg = 'Redirecionando para criar o evento...';
            addMessage('bot', successMsg);
            speak(successMsg);
          }, 2000);
        }
      }
      // Comando: Ver eventos
      else if (lowerCommand.includes('ver eventos') || lowerCommand.includes('mostrar eventos') || lowerCommand.includes('listar eventos')) {
        const response = 'Ok! Redirecionando para a página de eventos.';
        addMessage('bot', response);
        speak(response);
        setTimeout(() => navigate('/eventos'), 1500);
      }
      // Comando: Ver pagamentos
      else if (lowerCommand.includes('pagamento') || lowerCommand.includes('financeiro')) {
        const response = 'Abrindo a página de pagamentos.';
        addMessage('bot', response);
        speak(response);
        setTimeout(() => navigate('/pagamentos'), 1500);
      }
      // Comando: Ver galeria
      else if (lowerCommand.includes('galeria') || lowerCommand.includes('fotos')) {
        const response = 'Abrindo a galeria de fotos.';
        addMessage('bot', response);
        speak(response);
        setTimeout(() => navigate('/galeria'), 1500);
      }
      // Comando: Dashboard
      else if (lowerCommand.includes('dashboard') || lowerCommand.includes('início') || lowerCommand.includes('home')) {
        const response = 'Voltando para o dashboard.';
        addMessage('bot', response);
        speak(response);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
      // Comando não reconhecido
      else {
        const response = 'Desculpe, não entendi esse comando. Você pode pedir para criar evento, ver eventos, abrir pagamentos, galeria ou dashboard.';
        addMessage('bot', response);
        speak(response);
      }
    } catch (error) {
      const errorMsg = 'Ocorreu um erro ao processar seu comando. Tente novamente.';
      addMessage('bot', errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  // Função para extrair dados do evento do comando de voz
  const extractEventData = (command) => {
    const data = {
      name: '',
      clientName: '',
      date: '',
      time: '',
      location: '',
      value: '',
      hasAllInfo: false
    };

    // Extrair valor (ex: "no valor de 3000" ou "3000 reais")
    const valueMatch = command.match(/(?:valor de|por)\s*(\d+(?:[.,]\d+)?)\s*(?:reais)?/i);
    if (valueMatch) {
      data.value = valueMatch[1].replace(',', '.');
    }

    // Extrair data (ex: "dia 15", "15 de fevereiro", "15/02")
    const dateMatch = command.match(/(?:dia|em)\s*(\d{1,2})(?:\s*de\s*(\w+))?(?:\s*de\s*(\d{4}))?/i);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2] ? getMonthNumber(dateMatch[2]) : new Date().getMonth() + 1;
      const year = dateMatch[3] || new Date().getFullYear();
      data.date = `${year}-${month.toString().padStart(2, '0')}-${day}`;
    }

    // Extrair hora (ex: "às 14h", "14 horas", "14:00")
    const timeMatch = command.match(/(?:às|as)\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|horas)?/i);
    if (timeMatch) {
      const hour = timeMatch[1].padStart(2, '0');
      const minute = timeMatch[2] || '00';
      data.time = `${hour}:${minute}`;
    }

    // Verificar se tem todas as informações
    data.hasAllInfo = !!(data.value && data.date && data.time);

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

  const handleSendMessage = () => {
    if (transcript.trim()) {
      processCommand(transcript);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#4A9B6E] hover:bg-[#3d8259] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="Abrir assistente de voz"
      >
        {isOpen ? <X size={24} /> : <Mic size={24} />}
      </button>

      {/* Janela do Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-[#4A9B6E] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic size={20} />
              <h3 className="font-semibold">Assistente FOTIVA</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-[#3d8259] p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-[#4A9B6E] text-white'
                      : 'bg-white text-gray-800 shadow'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-lg shadow flex items-center gap-2">
                  <Loader className="animate-spin" size={16} />
                  <span className="text-sm text-gray-600">Processando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListening ? "Ouvindo..." : "Digite ou fale seu comando..."}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9B6E]"
                disabled={isListening}
              />
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-[#4A9B6E] hover:bg-[#3d8259] text-white'
                }`}
                disabled={isProcessing}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                onClick={handleSendMessage}
                className="p-2 bg-[#4A9B6E] hover:bg-[#3d8259] text-white rounded-lg transition-colors"
                disabled={!transcript.trim() || isProcessing}
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {isListening ? '🎤 Ouvindo...' : 'Clique no microfone para falar'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceChatbot;
