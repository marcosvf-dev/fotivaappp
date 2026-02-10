import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Agenda.css';

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/events`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEvents(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Gerar dias do calendário
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dias do mês anterior (em branco)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Verificar se uma data tem evento
  const hasEvent = (date) => {
    if (!date) return false;
    return events.some(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Pegar eventos de uma data específica
  const getEventsForDate = (date) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navegar pelos meses
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
  };

  // Formatar data
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const monthYear = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(currentDate);

  const days = getDaysInMonth(currentDate);
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="agenda-container">
      <div className="agenda-header">
        <h1>📅 Agenda</h1>
        <p>Visualize suas datas ocupadas e disponíveis</p>
      </div>

      <div className="calendar-card">
        {/* Navegação do calendário */}
        <div className="calendar-navigation">
          <button onClick={previousMonth} className="nav-button">
            ◀ Anterior
          </button>
          <h2>{monthYear}</h2>
          <button onClick={nextMonth} className="nav-button">
            Próximo ▶
          </button>
        </div>

        {/* Legendas */}
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-color available"></span>
            <span>Disponível</span>
          </div>
          <div className="legend-item">
            <span className="legend-color occupied"></span>
            <span>Ocupado</span>
          </div>
          <div className="legend-item">
            <span className="legend-color selected"></span>
            <span>Selecionado</span>
          </div>
        </div>

        {/* Calendário */}
        <div className="calendar-grid">
          {/* Nomes dos dias */}
          {dayNames.map(day => (
            <div key={day} className="calendar-day-name">
              {day}
            </div>
          ))}

          {/* Dias do mês */}
          {loading ? (
            <div className="calendar-loading">Carregando...</div>
          ) : (
            days.map((date, index) => {
              const isOccupied = hasEvent(date);
              const isSelected = selectedDate && date && 
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth();
              const isToday = date && 
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={`calendar-day ${!date ? 'empty' : ''} ${
                    isOccupied ? 'occupied' : 'available'
                  } ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => date && setSelectedDate(date)}
                >
                  {date && (
                    <>
                      <span className="day-number">{date.getDate()}</span>
                      {isOccupied && <span className="event-indicator">●</span>}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detalhes da data selecionada */}
      {selectedDate && (
        <div className="date-details">
          <h3>📆 {formatDate(selectedDate)}</h3>
          
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="events-list">
              <p className="status occupied-status">
                ❌ Data Ocupada - {getEventsForDate(selectedDate).length} evento(s)
              </p>
              {getEventsForDate(selectedDate).map((event, index) => (
                <div key={index} className="event-item">
                  <div className="event-info">
                    <h4>{event.event_type}</h4>
                    <p><strong>Cliente:</strong> {event.client_name}</p>
                    <p><strong>Local:</strong> {event.location}</p>
                    <p><strong>Horário:</strong> {formatTime(event.date)}</p>
                    <p><strong>Valor:</strong> R$ {event.total_value?.toFixed(2) || '0.00'}</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`status-badge ${event.status}`}>
                        {event.status === 'confirmed' ? '✅ Confirmado' :
                         event.status === 'pending' ? '⏳ Pendente' :
                         '❌ Cancelado'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-events">
              <p className="status available-status">
                ✅ Data Disponível
              </p>
              <p>Nenhum evento agendado para esta data.</p>
              <button className="btn-create-event">
                ➕ Criar Evento
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resumo do mês */}
      <div className="month-summary">
        <h3>📊 Resumo do Mês</h3>
        <div className="summary-stats">
          <div className="stat-card">
            <span className="stat-number">{events.filter(e => {
              const eventDate = new Date(e.date);
              return eventDate.getMonth() === currentDate.getMonth() &&
                     eventDate.getFullYear() === currentDate.getFullYear();
            }).length}</span>
            <span className="stat-label">Eventos no Mês</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() - 
               events.filter(e => {
                 const eventDate = new Date(e.date);
                 return eventDate.getMonth() === currentDate.getMonth() &&
                        eventDate.getFullYear() === currentDate.getFullYear();
               }).length}
            </span>
            <span className="stat-label">Dias Disponíveis</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              R$ {events
                .filter(e => {
                  const eventDate = new Date(e.date);
                  return eventDate.getMonth() === currentDate.getMonth() &&
                         eventDate.getFullYear() === currentDate.getFullYear();
                })
                .reduce((sum, e) => sum + (e.total_value || 0), 0)
                .toFixed(2)}
            </span>
            <span className="stat-label">Faturamento Previsto</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;
