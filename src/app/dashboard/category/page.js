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

const GET_CATEGORIES = gql`
  query GetCategories($start: Int!, $limit: Int!) {
    categories(
      pagination: { start: $start, limit: $limit }
      sort: "createdAt:desc"
      publicationState: PREVIEW
    ) {
      data {
        id
        attributes {
          name
          icon {
            data {
              attributes {
                url
              }
            }
          }
          createdAt
          publishedAt
          sub_categories {
            data {
              id
              attributes {
                subName
              }
            }
          }
          blogs {
            data {
              id
            }
          }
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

const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id) {
      data {
        id
      }
    }
  }
`;

export default function CategoriesPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [token, setToken] = useState(null);
    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [publishFilter, setPublishFilter] = useState('all'); // 'all', 'published', or 'unpublished'
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

    const { loading, error, data, refetch } = useQuery(GET_CATEGORIES, {
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

    const [deleteCategoryMutation] = useMutation(DELETE_CATEGORY, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    const handleDeleteCategory = async (categoryId) => {
        const confirmDelete = window.confirm("هل أنت متأكد أنك تريد حذف هذه الفئة؟");
        if (confirmDelete) {
            try {
                await deleteCategoryMutation({
                    variables: { id: categoryId },
                });
                refetch();
            } catch (error) {
                console.error("Error deleting category:", error.message);
                setErrorMessage("خطأ أثناء حذف الفئة: " + error.message);
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

    const allCategories = data?.categories.data.map(item => ({
        id: item.id,
        ...item.attributes,
        iconUrl: item.attributes.icon.data ? item.attributes.icon.data.attributes.url : null,
        subCategories: item.attributes.sub_categories.data.map(subCat => ({
            id: subCat.id,
            name: subCat.attributes.subName
        })),
        blogCount: item.attributes.blogs.data.length,
        isPublished: !!item.attributes.publishedAt
    })) || [];

    const filteredCategories = allCategories.filter(category => {
        if (publishFilter === 'all') return true;
        if (publishFilter === 'published') return category.isPublished;
        if (publishFilter === 'unpublished') return !category.isPublished;
        return true;
    });

    const totalCount = filteredCategories.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    const paginatedCategories = filteredCategories.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

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
                <h3 className="title">الفئات: {totalCount}</h3>
                <Link href="/dashboard/category/add-new" className="addButton">
                    اضافة فئة جديدة
                </Link>
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <div className="filter-controls">
                <select
                    className='select-box'
                    value={publishFilter}
                    onChange={(e) => {
                        setPublishFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="all">جميع الفئات</option>
                    <option value="published">الفئات المنشورة</option>
                    <option value="unpublished">الفئات غير المنشورة</option>
                </select>
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>الأيقونة</th>
                        <th>فرعي</th>
                        <th>عدد المقالات</th>
                        <th>تاريخ الإنشاء</th>
                        <th>الحالة</th>
                        <th>الإعدادات</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedCategories.map(category => (
                        <tr key={category.id}>
                            <td>{category.name}</td>
                            <td>
                                {category.iconUrl ? (
                                    <img src={category.iconUrl} alt={category.name} width={32} height={32} />
                                ) : (
                                    "لا توجد أيقونة"
                                )}
                            </td>
                            <td>
                                <ul>
                                    {category.subCategories.map(subCat => (
                                        <li key={subCat.id}>{subCat.name}</li>
                                    ))}
                                </ul>
                            </td>
                            <td>{category.blogCount}</td>
                            <td>{formatArabicDate(category.createdAt)}</td>
                            <td>{category.isPublished ? "منشور" : "غير منشور"}</td>
                            <td>
                                <HiPencil onClick={() => router.push(`/dashboard/category/${category.id}`)} style={{ cursor: 'pointer', marginLeft: '10px' }} />



                                <RiDeleteBin6Line onClick={() => handleDeleteCategory(category.id)} className='delete' style={{ cursor: 'pointer' }} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {renderPagination()}
        </main>
    );
}