// src/components/ScheduleCard.tsx
export default function ScheduleCard() {
  const schedule = [
    { dia: 'Segunda', hora: '10:00 - 12:00', aula: 'Cálculo II' },
    { dia: 'Terça', hora: '14:00 - 16:00', aula: 'EDA' },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-bold mb-2">🗓️ Horário</h3>
      <ul className="space-y-1">
        {schedule.map((item, idx) => (
          <li key={idx} className="text-sm">
            <strong>{item.dia}</strong> - {item.hora} ({item.aula})
          </li>
        ))}
      </ul>
    </div>
  );
}
