"use client";
import { ChairType } from '@/lib/scrappers/types';
import { FolderDown } from 'lucide-react';
import {useState} from 'react';


interface ChairProps {
    chair: ChairType;
    idx: number;
}


export default function Chair({chair, idx}: ChairProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const handleDownload = async (href: string) => {
        setLoading(true);
        setError(null);
        const urlParams = new URLSearchParams(href);
        const finalHref = urlParams.toString();
        console.log(finalHref);
        try {
            const res = await fetch(`/api/scrape/file?${finalHref}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/zip'},
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to download file');
                setError('Failed to download file');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = href.split('=')[1] || 'download.zip'; // Extract filename
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setLoading(false);
            setError(null);
        }catch (err: any) {
            console.error('Error downloading chair:', err);
            setError('Erro ao descarregar ficheiro. Por favor, tente novamente mais tarde.');
            return;
        }finally {
            setLoading(false);
        }

            
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
    }

    return (
        <li key={idx} className="transition-all duration-200 hover:translate-x-1">
            <span className="flex items-center">
                <span className="mr-2 flex items-center justify-center h-5 w-5">
                    {loading ? (
                        <span className="animate-spin inline-block rounded-full border-4 h-5 w-5 border-slate-600 border-t-transparent align-[-0.125em]"></span>
                    ) : (
                        <button
                            onClick={() => handleDownload(chair.href)}
                            className="text-slate-600 hover:text-slate-800 cursor-pointer flex items-center justify-center"
                            disabled={loading}
                            type="button"
                            style={{ minWidth: 20, minHeight: 20 }}
                        >
                            <FolderDown className="h-5 w-5" />
                        </button>
                    )}
                </span>
                <span className="truncate">{chair.text}</span>
            </span>
        </li>
    )
    ;
}