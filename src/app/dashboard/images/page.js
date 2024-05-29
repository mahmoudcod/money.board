'use client'
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/auth';

const FileTable = () => {
    const { getToken } = useAuth();
    const token = getToken();

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch('https://api.ektesad.com/api/file', {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch files');
                }

                const data = await response.json();
                setFiles(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [token]);

    const formatArabicDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ar', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            timeZone: 'UTC',
        });
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">الملفات: {files.length}</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>اسم الملف</th>
                                <th>رابط الملف</th>
                                <th>تاريخ الإضافة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map(file => (
                                <tr key={file.id}>
                                    <td>{file.name}</td>
                                    <td><a href={file.url} target="_blank" rel="noopener noreferrer">{file.url}</a></td>
                                    <td>{formatArabicDate(file.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </>
    );
};

export default FileTable;
