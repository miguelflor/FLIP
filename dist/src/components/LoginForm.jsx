"use strict";
// src/components/LoginForm.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginForm;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
function LoginForm() {
    const [username, setUsername] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const router = (0, navigation_1.useRouter)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // @ts-ignore
            const { ipcRenderer } = window.require ? window.require('electron') : {};
            if (!ipcRenderer)
                throw new Error('Electron IPC not available');
            const res = await ipcRenderer.invoke('login', { username, password });
            if (res.success) {
                // Optionally store session info if needed
                router.push('/dashboard');
            }
            else {
                alert(res.error || 'Login failed');
            }
        }
        catch (err) {
            alert(err.message || 'Login failed');
        }
        setLoading(false);
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" placeholder="Número de estudante" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 border rounded" required/>
      <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" required/>
      <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition" disabled={loading}>
        {loading ? 'A entrar...' : 'Entrar'}
      </button>
    </form>);
}
