"use client";
import { ChairType } from '@/lib/scrappers/types';
import { FolderDown} from 'lucide-react';
import {useState} from 'react';
import Notification from './Notification';
import { PERIOD_N } from '@/lib/clipVars';
import { getCurrentAcademicYear } from '@/lib/academic';


interface ChairProps {
    chair: ChairType;
    idx: number;
}


export default function Chair({chair, idx}: ChairProps) {
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);


    const handleDownload = async () => {
        setLoading(true);
                
        const queryStart = chair.href.indexOf('?');
        let finalHref = '';
        
        if (queryStart !== -1) {
            const existingQuery = chair.href.substring(queryStart + 1);
            const encodedName = encodeURIComponent(chair.text);
            finalHref = `${existingQuery}&name=${encodedName}&type=all`;
        } else {
            const encodedName = encodeURIComponent(chair.text);
            finalHref = `name=${encodedName}&type=all`;
        }
        
        try {
            const res = await fetch("/api/scrape/file?"+finalHref, {
                method: 'GET',
                headers: {'Content-Type': 'application/zip'},
            });

            if (!res.ok) {
                let errorMessage = 'Failed to download file';
                
                // Check if response is JSON before trying to parse
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch (parseError) {
                        console.error('Failed to parse error response as JSON:', parseError);
                    }
                } else {
                    // If it's not JSON, try to get the text content
                    try {
                        const errorText = await res.text();
                        console.log('Non-JSON error response:', errorText);
                        errorMessage = `Server error (${res.status})`;
                    } catch (textError) {
                        console.error('Failed to read error response:', textError);
                    }
                }
                
                setNotification({
                    type: 'error',
                    message: errorMessage
                });
            }else{
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = chair.href.split('=')[1] || 'download.zip'; // Extract filename
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                setLoading(false);
                setNotification({
                    type: 'success',
                    message: 'File downloaded successfully!'
                });
            }

            
        }catch (err: any) {
            console.error('Error downloading chair:', err);
            setNotification({
                type: 'error',
                message: 'Error downloading file.'
            });
            return;
        }finally {
            setLoading(false);
        }
    }

    return (
        <>
            <li key={idx} className="transition-all duration-200 hover:translate-x-1">
                <span className="flex items-center">
                    <span className="mr-2 flex items-center justify-center h-5 w-5">
                        {loading ? (
                            <span className="animate-spin inline-block rounded-full border-4 h-5 w-5 border-slate-600 border-t-transparent align-[-0.125em]"></span>
                        ) : (
                            <button
                                onClick={() => handleDownload()}
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
            {notification && (
                <Notification 
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                />
            )}
        </>
    );
}