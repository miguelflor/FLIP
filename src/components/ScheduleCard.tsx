// src/components/ScheduleCard.tsx
"use client";
import { Calendar, Clock, MapPin, Download, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ScheduleItem {
  dia: string;
  hora: string;
  aula: string;
  sala?: string;
  tipo?: 'teorica' | 'pratica' | 'laboratorio';
}

export default function ScheduleCard() {
  const schedule: ScheduleItem[] = [
    { dia: 'Segunda', hora: '10:00 - 12:00', aula: 'Cálculo II', sala: 'A101', tipo: 'teorica' },
    { dia: 'Terça', hora: '14:00 - 16:00', aula: 'EDA', sala: 'Lab2', tipo: 'pratica' },
    { dia: 'Quarta', hora: '09:00 - 11:00', aula: 'Física I', sala: 'B205', tipo: 'teorica' },
    { dia: 'Quinta', hora: '16:00 - 18:00', aula: 'Programação', sala: 'Lab1', tipo: 'laboratorio' },
    { dia: 'Sexta', hora: '11:00 - 13:00', aula: 'Álgebra Linear', sala: 'A203', tipo: 'teorica' },
  ];

  const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const today = new Date();
  const currentDayName = today.toLocaleDateString('pt-PT', { weekday: 'long' });
  
  const getTypeColor = (tipo?: string) => {
    switch (tipo) {
      case 'teorica': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pratica': return 'bg-green-100 text-green-800 border-green-200';
      case 'laboratorio': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isToday = (dayName: string) => {
    const dayMap: { [key: string]: string } = {
      'segunda-feira': 'Segunda',
      'terça-feira': 'Terça',
      'quarta-feira': 'Quarta',
      'quinta-feira': 'Quinta',
      'sexta-feira': 'Sexta'
    };
    return dayMap[currentDayName.toLowerCase()] === dayName;
  };

  const getScheduleForDay = (dayName: string) => {
    return schedule.filter(item => item.dia === dayName);
  };

  // Google Calendar export functions
  const getDayOfWeek = (dayName: string) => {
    const dayMap: { [key: string]: number } = {
      'Segunda': 1, // Monday
      'Terça': 2,   // Tuesday
      'Quarta': 3,  // Wednesday
      'Quinta': 4,  // Thursday
      'Sexta': 5    // Friday
    };
    return dayMap[dayName];
  };

  const getNextOccurrence = (dayOfWeek: number, timeString: string) => {
    const today = new Date();
    const [startTime] = timeString.split(' - ');
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Get the next occurrence of this day
    const nextDate = new Date(today);
    const todayDayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday from 0 to 7
    const daysUntil = dayOfWeek - todayDayOfWeek;
    const daysToAdd = daysUntil >= 0 ? daysUntil : daysUntil + 7;
    
    nextDate.setDate(today.getDate() + daysToAdd);
    nextDate.setHours(hours, minutes, 0, 0);
    
    return nextDate;
  };

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const exportToGoogleCalendar = (item: ScheduleItem) => {
    const dayOfWeek = getDayOfWeek(item.dia);
    const [startTime, endTime] = item.hora.split(' - ');
    
    const startDate = getNextOccurrence(dayOfWeek, item.hora);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const endDate = new Date(startDate);
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    const title = encodeURIComponent(item.aula);
    const details = encodeURIComponent(`Tipo: ${item.tipo}\nSala: ${item.sala || 'N/A'}`);
    const location = encodeURIComponent(item.sala || '');
    
    const startDateStr = formatDateForGoogle(startDate);
    const endDateStr = formatDateForGoogle(endDate);
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}&location=${location}&recur=RRULE:FREQ=WEEKLY`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const exportAllToGoogleCalendar = () => {
    // For multiple events, we'll create them one by one
    schedule.forEach((item, index) => {
      setTimeout(() => {
        exportToGoogleCalendar(item);
      }, index * 1000); // Delay each export by 1 second to avoid overwhelming
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-slate-600" />
          <div>
            <h3 className="text-xl font-bold text-slate-900">Horário Semanal</h3>
            <p className="text-sm text-slate-500">
              Segunda a Sexta
            </p>
          </div>
        </div>
        
        {/* Export button - Official Google style */}
        <button
          onClick={exportAllToGoogleCalendar}
          className="flex items-center space-x-3 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:shadow-md transition-all duration-200 text-sm font-medium shadow-sm hover:bg-gray-50"
        >
          <img src="/google-logo.svg" alt="Google" className="w-5 h-5" />
          <span className="text-gray-600 font-medium">Exportar</span>
        </button>
      </div>

      {/* Calendar Grid - Only weekdays */}
      <div className="grid grid-cols-5 gap-3">
        {weekDays.map((day, index) => {
          const daySchedule = getScheduleForDay(day);
          const isCurrentDay = isToday(day);
          
          return (
            <div key={day} className="min-h-[140px]">
              {/* Day header */}
              <div className={`text-center p-3 rounded-t-lg border-b ${
                isCurrentDay 
                  ? 'bg-blue-50 border-blue-200 text-blue-900' 
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className={`text-sm font-bold ${
                  isCurrentDay ? 'text-blue-600' : 'text-slate-900'
                }`}>
                  {day}
                </div>
              </div>
              
              {/* Day content */}
              <div className="p-3 border-l border-r border-b border-slate-200 rounded-b-lg bg-white min-h-[100px]">
                <div className="space-y-2">
                  {daySchedule.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-md border text-xs ${getTypeColor(item.tipo)} relative group`}
                    >
                      {/* Export button for individual class - Google style */}
                      <button
                        onClick={() => exportToGoogleCalendar(item)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/70 rounded-full bg-white/50 backdrop-blur-sm"
                        title="Exportar para Google Calendar"
                      >
                        <img src="/google-logo.svg" alt="Google" className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="flex items-center space-x-1 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{item.hora}</span>
                      </div>
                      <div className="font-semibold truncate mb-1 pr-6">{item.aula}</div>
                      {item.sala && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{item.sala}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {daySchedule.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      Sem aulas
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-slate-600">Teórica</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-slate-600">Prática</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
            <span className="text-slate-600">Laboratório</span>
          </div>
        </div>
      </div>
    </div>
  );
}
