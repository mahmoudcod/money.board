'use client'
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useQuery, useMutation } from '@apollo/client';
import { HiOutlineEye } from "react-icons/hi";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth';
import gql from 'graphql-tag';

const GET_COMMENTS = gql`
  query GetComments($start: Int!, $limit: Int!, $name: String) {
    comments(
      filters: { name: { contains: $name } }
      pagination: { start: $start, limit: $limit }
      sort: ["createdAt:desc"]
    ) {
      data {
        id
        attributes {
          email
          name
          comment
          saveInfo
          createdAt
          updatedAt
        }
      }
      meta {
        pagination {
          total
          page
          pageSize
          pageCount
        }
      }
    }
  }
`;

const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id) {
      data {
        id
      }
    }
  }
`;

export default function Comments() {
    const [currentPage, setCurrentPage] = useState(1);
    const [token, setToken] = useState(null);
    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [nameFilter, setNameFilter] = useState("");
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

    const { loading, error, data, refetch } = useQuery(GET_COMMENTS, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limit: pageSize,
            name: nameFilter,
        },
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
        skip: !token || isTokenLoading,
    });

    const [deleteCommentMutation] = useMutation(DELETE_COMMENT, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    const handleDeleteComment = async (commentId) => {
        const confirmDelete = window.confirm("هل أنت متأكد أنك تريد حذف هذا التعليق؟");
        if (confirmDelete) {
            try {
                await deleteCommentMutation({
                    variables: { id: commentId },
                });
                refetch();
            } catch (error) {
                console.error("Error deleting comment:", error.message);
                setErrorMessage("خطأ أثناء حذف التعليق: " + error.message);
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

    if (isTokenLoading) return null;
    if (!token) return <div>لم يتم العثور على رمز المصادقة. يرجى تسجيل الدخول مرة أخرى.</div>;
    if (loading) return <div class="loader"></div>;
    if (error) return <div>خطأ: {error.message}</div>;

    const comments = data.comments.data.map(item => ({
        id: item.id,
        ...item.attributes
    }));
    const totalCount = data.comments.meta.pagination.total;
    const totalPages = data.comments.meta.pagination.pageCount;

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
                <h3 className="title">التعليقات: {totalCount}</h3>
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}



            <table className="table">
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>البريد الإلكتروني</th>
                        <th>التعليق</th>
                        <th>تاريخ الإنشاء</th>
                        <th>الإعدادات</th>
                    </tr>
                </thead>
                <tbody>
                    {comments.map(comment => (
                        <tr key={comment.id}>
                            <td>{comment.name}</td>
                            <td>{comment.email}</td>
                            <td>{comment.comment.substring(0, 50)}...</td>
                            <td>{formatArabicDate(comment.createdAt)}</td>
                            <td>
                                <HiOutlineEye onClick={() => router.push(`/dashboard/commint/${comment.id}`)} style={{ cursor: 'pointer', marginLeft: '10px' }} />
                                <RiDeleteBin6Line onClick={() => handleDeleteComment(comment.id)} className='delete' style={{ cursor: 'pointer' }} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {renderPagination()}
        </main>
    );
}