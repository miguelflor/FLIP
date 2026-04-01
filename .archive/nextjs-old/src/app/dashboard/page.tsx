// src/app/dashboard/page.tsx
import React from 'react';
import ScheduleCard from '../../components/ScheduleCard';
import PDFList from '../../components/PDFList';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ScheduleCard />
      <PDFList />
      {/* Outros blocos podem ser adicionados aqui */}
    </div>
  );
}
