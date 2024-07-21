
'use client'
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';
import Link from 'next/link';

const GET_UPLOADED_FILES = gql`
  query GetUploadedFiles($start: Int!, $limit: Int!) {
    uploadFiles(pagination: { start: $start, limit: $limit }, sort: ["createdAt:desc"]) {
      data {
        id
        attributes {
          name
          url
          createdAt
        }
      }
      meta {
        pagination {
          total
        }
      }
    }
  }
`;

const DELETE_FILE = gql`
  mutation DeleteFile($id: ID!) {
    deleteUploadFile(id: $id) {
      data {
        id
      }
    }
  }
`;

export default function UploadedFilesPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [token, setToken] = useState(null);
    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const pageSize = 10;
    const { getToken, refreshToken } = useAuth();

    useEffect(() => {
        const fetchToken = async () => {
            setIsTokenLoading(true);
            try {
                let currentToken = getToken();
                if (!currentToken) {
                    currentToken = await refreshToken();
                }
                setToken(currentToken);
            } catch (error) {
                console.error("Error fetching token:", error);
                setErrorMessage("Error fetching authentication token. Please try logging in again.");
            } finally {
                setIsTokenLoading(false);
            }
        };

        fetchToken();
    }, [getToken, refreshToken]);

    const { loading, error, data, refetch } = useQuery(GET_UPLOADED_FILES, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limit: pageSize,
        },
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
        skip: !token || isTokenLoading,
    });

    const [deleteFileMutation] = useMutation(DELETE_FILE, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    const handleDeleteFile = async (fileId) => {
        const confirmDelete = window.confirm("هل أنت متأكد أنك تريد حذف هذا الملف؟");
        if (confirmDelete) {
            try {
                await deleteFileMutation({
                    variables: { id: fileId },
                });
                refetch();
            } catch (error) {
                console.error("Error deleting file:", error.message);
                setErrorMessage("خطأ أثناء حذف الملف: " + error.message);
            }
        }
    };

    const formatArabicDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ar', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            timeZone: 'UTC'
        });
    };

    if (isTokenLoading) null;
    if (!token) return <div>لم يتم العثور على رمز المصادقة. يرجى تسجيل الدخول مرة أخرى.</div>;
    if (loading) return <div class="loader"></div>;
    if (error) return <div>خطأ: {error.message}</div>;

    const files = data.uploadFiles.data;
    const totalCount = data.uploadFiles.meta.pagination.total;
    const totalPages = Math.ceil(totalCount / pageSize);

    const renderPagination = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        const middlePage = Math.ceil(maxPagesToShow / 2);
        let startPage = currentPage <= middlePage ? 1 : currentPage - middlePage + 1;
        let endPage = startPage + maxPagesToShow - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(endPage - maxPagesToShow + 1, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={currentPage === i ? "act-num page-num" : "page-num"}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="pagination">
                <button className='arrow' onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    <MdKeyboardArrowRight />
                </button>
                {pageNumbers}
                <button className='arrow' onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                    <MdKeyboardArrowLeft />
                </button>
            </div>
        );
    };
    return (
        <main className="head">
            <div className="head-title">
                <h3 className="title">الملفات المرفوعة: {totalCount}</h3>
                {/* <Link href="/dashboard/upload-file" className="addButton">
                    رفع ملف جديد
                </Link> */}
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <table className="table">
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>الصورة</th>
                        <th>الرابط</th>
                        <th>تاريخ الرفع</th>
                        <th>الإعدادات</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map(file => (
                        <tr key={file.id}>
                            <td>{file.attributes.name}</td>
                            <td>
                                <img src={file.attributes.url} alt={file.attributes.name} width={64} height={64} />
                            </td>
                            <td>
                                <a href={file.attributes.url} target="_blank" rel="noopener noreferrer">
                                    فتح الملف
                                </a>
                            </td>
                            <td>{formatArabicDate(file.attributes.createdAt)}</td>
                            <td>
                                <RiDeleteBin6Line
                                    onClick={() => handleDeleteFile(file.id)}
                                    className='delete'
                                    style={{ cursor: 'pointer' }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {renderPagination()}
        </main>
    );
}