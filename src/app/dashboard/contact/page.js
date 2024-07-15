'use client'
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useQuery, useMutation } from '@apollo/client';
import { HiOutlineEye } from "react-icons/hi";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';
import gql from 'graphql-tag';

const GET_CONTACT_QUERIES = gql`
  query GetContactQueries($start: Int!, $limit: Int!) {
    contactUses(
      pagination: { start: $start, limit: $limit }
      sort: "createdAt:desc"
    ) {
      data {
        id
        attributes {
          name
          email
          phone
          message
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

const DELETE_QUERY = gql`
  mutation DeleteQuery($id: ID!) {
    deleteContactUs(id: $id) {
      data {
        id
      }
    }
  }
`;

export default function ContactQueries() {
    const [currentPage, setCurrentPage] = useState(1);
    const [token, setToken] = useState(null);
    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const pageSize = 10;
    const router = useRouter();
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

    const { loading, error, data, refetch } = useQuery(GET_CONTACT_QUERIES, {
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

    const [deleteQueryMutation] = useMutation(DELETE_QUERY, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    const handleDeleteQuery = async (queryId) => {
        const confirmDelete = window.confirm("هل أنت متأكد أنك تريد حذف هذه الرسالة؟");
        if (confirmDelete) {
            try {
                await deleteQueryMutation({
                    variables: { id: queryId },
                });
                refetch();
            } catch (error) {
                console.error("Error deleting query:", error.message);
                setErrorMessage("خطأ أثناء حذف الرسالة: " + error.message);
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

    if (isTokenLoading) return <div>جاري التحميل...</div>;
    if (!token) return <div>لم يتم العثور على رمز المصادقة. يرجى تسجيل الدخول مرة أخرى.</div>;
    if (loading) return <div>جاري تحميل البيانات...</div>;
    if (error) return <div>خطأ: {error.message}</div>;

    const queries = data.contactUses.data.map(item => ({
        id: item.id,
        ...item.attributes
    }));
    const totalCount = data.contactUses.meta.pagination.total;
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
                <h3 className="title">رسائل تواصل معنا: {totalCount}</h3>
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <table className="table">
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>البريد الإلكتروني</th>
                        <th>الرسالة</th>
                        <th>تاريخ الرسالة</th>
                        <th>الإعدادات</th>
                    </tr>
                </thead>
                <tbody>
                    {queries.map(query => (
                        <tr key={query.id}>
                            <td>{query.name}</td>
                            <td>{query.email}</td>
                            <td>{query.message.substring(0, 50)}...</td>
                            <td>{formatArabicDate(query.createdAt)}</td>
                            <td>
                                <HiOutlineEye onClick={() => router.push(`/dashboard/contact/${query.id}`)} style={{ cursor: 'pointer', marginRight: '10px' }} />
                                <RiDeleteBin6Line onClick={() => handleDeleteQuery(query.id)} className='delete' style={{ cursor: 'pointer' }} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {renderPagination()}
        </main>
    );
}