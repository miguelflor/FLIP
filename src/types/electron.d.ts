declare global {
    interface Window {
        electron?: {
            ipcRenderer: {
                invoke: (...args: unknown[]) => Promise<unknown>;
                on: (...args: unknown[]) => void;
            };
        };
    }
}
export { };