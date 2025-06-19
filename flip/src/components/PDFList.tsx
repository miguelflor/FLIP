"use client";

import { useState, useEffect} from 'react';
import { Chair } from '@/lib/scrappers/types';

export default function PDFList() {

  const [loading, setLoading] = useState(false);
  const [chairs, setChairs] = useState<Chair[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleChairs = async () => {
      setLoading(true);
      setError(null);
      try{
      const res = await fetch('/api/scrape/chairs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok) {
        console.log('Chairs:', data.chairs);
        setChairs(data.chairs);
      } else {
        alert(data.error || 'Failed to fetch chairs');
      }
    } catch (err) {
      console.error('Error fetching chairs:', err);
      setError('Erro ao carregar ficheiros recentes. Por favor, tente novamente mais tarde.');
    }finally{
      setLoading(false);
    }

  };
  useEffect(() => {
    handleChairs();
  }, []);


  return (
    <div className="bg-white rounded-xl shadow p-4" id="pdfs">
      <h3 className="text-lg font-bold mb-2">📁 Ficheiros Recentes</h3>
      
      {/* Refresh button */}
      <button 
        onClick={handleChairs}
        disabled={loading}
        className="text-xs text-gray-500 hover:text-gray-700 mb-2 flex items-center"
      >
        <svg className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {loading ? 'Carregando...' : 'Atualizar'}
      </button>
      
      <ul className="space-y-2 text-sm">
        {loading ? (
          // Enhanced loading skeleton
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                <div className="h-4 bg-gray-200 rounded" style={{width: `${Math.floor(Math.random() * 30) + 60}%`}}></div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="text-red-500 py-2">
            <p>{error}</p>
            <button 
              onClick={handleChairs} 
              className="text-blue-500 hover:underline mt-1"
            >
              Tentar novamente
            </button>
          </div>
        ) : chairs.length > 0 ? (
          // Display chairs
          chairs.map((chair, idx) => (
            <li key={idx} className="transition-all duration-200 hover:translate-x-1">
              <a 
                href={chair.href} 
                className="flex items-center text-blue-600 hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="mr-2">📄</span>
                <span className="truncate">{chair.text}</span>
              </a>
            </li>
          ))
        ) : (
          // Empty state
          <div className="text-gray-500 py-6 text-center">
            <p>Não foram encontrados ficheiros recentes.</p>
            <p className="text-sm mt-1">Por favor, verifique se está autenticado.</p>
          </div>
        )}
      </ul>
    </div>
  );
}