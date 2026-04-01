"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PDFList;
const react_1 = require("react");
const clipVars_1 = require("../lib/clipVars");
const lucide_react_1 = require("lucide-react");
const Chair_1 = __importDefault(require("./Chair"));
function PDFList() {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [chairs, setChairs] = (0, react_1.useState)({});
    const [error, setError] = (0, react_1.useState)(null);
    const handleChairs = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!window.electron || !window.electron.ipcRenderer) {
                throw new Error('Electron IPC not available');
            }
            const sessionId = localStorage.getItem('clipSessionId');
            if (!sessionId) {
                setError('Not authenticated. Please log in again.');
                setLoading(false);
                return;
            }
            const res = await window.electron.ipcRenderer.invoke('get-chairs', { sessionId });
            if (res.success) {
                setChairs(res.chairs || {});
            }
            else {
                setError(res.error || 'Failed to fetch chairs');
            }
        }
        catch (err) {
            console.error('Error fetching chairs:', err);
            setError('Erro ao carregar ficheiros recentes. Por favor, tente novamente mais tarde.');
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        handleChairs();
    }, []);
    const getPeriodName = (periodKey) => {
        if (periodKey === clipVars_1.PeriodType.S + '1')
            return '1º Semestre';
        if (periodKey === clipVars_1.PeriodType.S + '2')
            return '2º Semestre';
        if (periodKey === clipVars_1.PeriodType.T + '1')
            return '1º Trimestre';
        if (periodKey === clipVars_1.PeriodType.T + '2')
            return '2º Trimestre';
        return periodKey;
    };
    const hasAnyChairs = Object.values(chairs).some(cs => cs.length > 0);
    return (<div className="bg-white rounded-xl shadow p-4" id="pdfs">
      <div className="flex items-center space-x-2 mb-2">
        <lucide_react_1.FolderOpen className="w-5 h-5 text-slate-600"/>
        <h3 className="text-lg font-bold text-slate-900">Ficheiros Recentes</h3>
      </div>

      {/* Refresh button */}
      <button onClick={handleChairs} disabled={loading} className="text-xs text-gray-500 hover:text-gray-700 mb-2 flex items-center">
        <svg className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        {loading ? 'Carregando...' : 'Atualizar'}
      </button>

      <ul className="space-y-2 text-sm">
        {loading ? (
        // Enhanced loading skeleton
        <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (<div key={i} className="flex items-center">
                <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                <div className="h-4 bg-gray-200 rounded" style={{ width: `${Math.floor(Math.random() * 30) + 60}%` }}></div>
              </div>))}
          </div>) : error ? (
        // Error state
        <div className="text-red-500 py-2">
            <p>{error}</p>
            <button onClick={handleChairs} className="text-blue-500 hover:underline mt-1">
              Tentar novamente
            </button>
          </div>) : hasAnyChairs ? (<div className="space-y-4">
            {Object.entries(chairs).map(([periodKey, cs]) => cs.length > 0 ? (<div key={periodKey}>
                  <h4 className="font-medium text-gray-700 mb-2">{getPeriodName(periodKey)}</h4>
                  <ul className="space-y-2 pl-2">
                    {cs.map((chair, idx) => (<Chair_1.default key={idx} chair={chair} idx={idx}/>))}
                  </ul>
                </div>) : null)}
          </div>) : (
        // Empty state
        <div className="text-gray-500 py-6 text-center">
            <p>Não foram encontrados ficheiros recentes.</p>
            <p className="text-sm mt-1">Por favor, verifique se está autenticado.</p>
          </div>)}
      </ul>
    </div>);
}
