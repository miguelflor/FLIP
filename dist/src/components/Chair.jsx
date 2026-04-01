"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Chair;
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const Notification_1 = __importDefault(require("./Notification"));
const clipVars_1 = require("../lib/clipVars");
function Chair({ chair, idx }) {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [notification, setNotification] = (0, react_1.useState)(null);
    const handleDownload = async () => {
        setLoading(true);
        try {
            if (!window.electron || !window.electron.ipcRenderer) {
                throw new Error('Electron IPC not available');
            }
            const sessionId = localStorage.getItem('clipSessionId');
            if (!sessionId) {
                setNotification({
                    type: 'error',
                    message: 'Not authenticated. Please log in again.'
                });
                setLoading(false);
                return;
            }
            // Parse params from the href
            const parseHrefParams = (href) => {
                const params = {};
                const queryStart = href.indexOf('?');
                if (queryStart === -1)
                    return params;
                const query = href.substring(queryStart + 1);
                const pairs = query.split('&');
                for (const pair of pairs) {
                    const [key, value] = pair.split('=');
                    if (key && value !== undefined) {
                        params[key] = decodeURIComponent(value);
                    }
                }
                return params;
            };
            const hrefParams = parseHrefParams(chair.href);
            const res = await window.electron.ipcRenderer.invoke('get-file', {
                sessionId,
                period: hrefParams[clipVars_1.PERIOD_N],
                unitId: hrefParams[clipVars_1.UNIDADE],
                type: 'all',
                name: chair.text,
                year: hrefParams[clipVars_1.YEAR],
                type_period: hrefParams[clipVars_1.PERIOD_TYPE]
            });
            if (!res.success || !res.data) {
                setNotification({
                    type: 'error',
                    message: res.error || 'Failed to download file'
                });
            }
            else {
                // Convert base64 back to blob and download
                const byteCharacters = atob(res.data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/zip' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = res.filename || 'download.zip';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                setNotification({
                    type: 'success',
                    message: 'File downloaded successfully!'
                });
            }
        }
        catch (err) {
            console.error('Error downloading chair:', err);
            setNotification({
                type: 'error',
                message: 'Error downloading file.'
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (<>
            <li key={idx} className="transition-all duration-200 hover:translate-x-1">
                <span className="flex items-center">
                    <span className="mr-2 flex items-center justify-center h-5 w-5">
                        {loading ? (<span className="animate-spin inline-block rounded-full border-4 h-5 w-5 border-slate-600 border-t-transparent align-[-0.125em]"></span>) : (<button onClick={() => handleDownload()} className="text-slate-600 hover:text-slate-800 cursor-pointer flex items-center justify-center" disabled={loading} type="button" style={{ minWidth: 20, minHeight: 20 }}>
                                <lucide_react_1.FolderDown className="h-5 w-5"/>
                            </button>)}
                    </span>
                    <span className="truncate">{chair.text}</span>
                </span>
            </li>
            {notification && (<Notification_1.default type={notification.type} message={notification.message} onClose={() => setNotification(null)}/>)}
        </>);
}
