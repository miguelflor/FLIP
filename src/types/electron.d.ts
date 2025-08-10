declare global {
    interface Window {
        electron?: {
            ipcRenderer: {
                invoke: (...args: any[]) => Promise<any>;
                on: (...args: any[]) => void;
            };
        };
    }
}
export { };