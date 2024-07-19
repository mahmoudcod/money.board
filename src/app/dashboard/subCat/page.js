'use client'
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useQuery, useMutation } from '@apollo/client';
import { HiPencil } from "react-icons/hi";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/auth';
import gql from 'graphql-tag';

const GET_SUBCATEGORIES = gql`
  query GetSubCategories($start: Int!, $limit: Int!) {
    subCategories(
      pagination: { start: $start, limit: $limit }
      sort: "createdAt:desc"
    ) {
      data {
        id
        attributes {
          subName
          slug
          description
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

const DELETE_SUBCATEGORY = gql`
  mutation DeleteSubCategory($id: ID!) {
    deleteSubCategory(id: $id) {
      data {
        id
      }
    }
  }
`;

export default function SubCategoriesPage() {
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

    const { loading, error, data, refetch } = useQuery(GET_SUBCATEGORIES, {
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

    const [deleteSubCategoryMutation] = useMutation(DELETE_SUBCATEGORY, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    const handleDeleteSubCategory = async (subCategoryId) => {
        const confirmDelete = window.confirm("هل أنت متأكد أنك تريد حذف هذه الفئة الفرعية؟");
        if (confirmDelete) {
            try {
                await deleteSubCategoryMutation({
                    variables: { id: subCategoryId },
                });
                refetch();
            } catch (error) {
                console.error("Error deleting subcategory:", error.message);
                setErrorMessage("خطأ أثناء حذف الفئة الفرعية: " + error.message);
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

    const subCategories = data.subCategories.data.map(item => ({
        id: item.id,
        ...item.attributes
    }));
    const totalCount = data.subCategories.meta.pagination.total;
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
                <h3 className="title">الفئات الفرعية: {totalCount}</h3>
                <Link href="/dashboard/subCat/add-new" className="addButton">
                    اضافة فئة فرعية جديدة
                </Link>
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <table className="table">
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>(slug)</th>
                        <th>الوصف</th>
                        <th>تاريخ الإنشاء</th>
                        <th>الإعدادات</th>
                    </tr>
                </thead>
                <tbody>
                    {subCategories.map(subCategory => (
                        <tr key={subCategory.id}>
                            <td>{subCategory.subName}</td>
                            <td>{subCategory.slug}</td>
                            <td>{subCategory.description}</td>
                            <td>{formatArabicDate(subCategory.createdAt)}</td>
                            <td>
                                <HiPencil onClick={() => router.push(`/dashboard/subCat/${subCategory.id}`)} style={{ cursor: 'pointer', marginRight: '10px' }} />
                                <RiDeleteBin6Line onClick={() => handleDeleteSubCategory(subCategory.id)} className='delete' style={{ cursor: 'pointer' }} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {renderPagination()}
        </main>
    );
}