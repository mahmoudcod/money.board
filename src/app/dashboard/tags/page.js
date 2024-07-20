'use client'
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from "react-icons/md";
import { useAuth } from '@/app/auth';
import { RiDeleteBin6Line } from "react-icons/ri";
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import Link from 'next/link';

const GET_TAGS = gql`
  query GetTags($start: Int!, $limit: Int!) {
    tags(
      pagination: { start: $start, limit: $limit }
      sort: ["updatedAt:desc"]
      publicationState: PREVIEW
    ) {
      data {
        id
        attributes {
          name
          createdAt
          publishedAt
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

const DELETE_TAG = gql`
  mutation DeleteTag($id: ID!) {
    deleteTag(id: $id) {
      data {
        id
      }
    }
  }
`;

export default function Tags() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTags, setSelectedTags] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [token, setToken] = useState(null);
    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const [publishFilter, setPublishFilter] = useState('all');
    const pageSize = 10;
    const { getToken, refreshToken } = useAuth();

    useEffect(() => {
        const fetchToken = async () => {
            setIsTokenLoading(true);
            try {
                let currentToken = getToken();
                console.log("Initial token:", currentToken);
                if (!currentToken) {
                    console.log("No token found, attempting to refresh...");
                    currentToken = await refreshToken();
                    console.log("Refreshed token:", currentToken);
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

    const { loading, error, data, refetch } = useQuery(GET_TAGS, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limit: pageSize,
        },
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        },
        skip: !token || isTokenLoading,
    });

    const [deleteTagMutation] = useMutation(DELETE_TAG);

    const handleDeleteTag = async (tagId) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            await deleteTagMutation({
                variables: {
                    id: tagId
                },
                context: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });
            setSuccessMessage("تم الحذف بنجاح");
            refetch();
        } catch (error) {
            setErrorMessage("خطأ أثناء الحذف: " + error.message);
        }
    };

    if (isTokenLoading) return null;
    if (!token) return <div>No authentication token available. Please log in again.</div>;
    if (loading) return <div class="loader"></div>;
    if (error) {
        return (
            <div className="error-message">
                <p>Error: {error.message}</p>
            </div>
        );
    }

    if (!data || !data.tags || !data.tags.data) {
        return <div>No data available</div>;
    }

    const allTags = data.tags.data.map(tag => ({
        id: tag.id,
        ...tag.attributes,
        isPublished: !!tag.attributes.publishedAt
    }));

    const filteredTags = allTags.filter(tag => {
        if (publishFilter === 'all') return true;
        if (publishFilter === 'published') return tag.isPublished;
        if (publishFilter === 'unpublished') return !tag.isPublished;
        return true;
    });

    const totalCount = filteredTags.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    const paginatedTags = filteredTags.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const nextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const prevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const setPage = (page) => {
        setCurrentPage(page);
    };

    const toggleTagSelection = (tagId) => {
        if (selectedTags.includes(tagId)) {
            setSelectedTags(selectedTags.filter(id => id !== tagId));
        } else {
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    const selectAllTags = () => {
        if (selectedTags.length === paginatedTags.length) {
            setSelectedTags([]);
        } else {
            setSelectedTags(paginatedTags.map(tag => tag.id));
        }
    };

    const deleteSelectedTags = async () => {
        const confirmDelete = window.confirm("هل انت متاكد انك تريد حذف الكلمات المختارة?");
        if (confirmDelete) {
            try {
                await Promise.all(selectedTags.map(tagId => handleDeleteTag(tagId)));
                setSelectedTags([]);
            } catch (error) {
                console.error("خطأ أثناء الحذف:", error.message);
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

    const pageNumbers = [];
    const maxPagesToShow = 5;
    const middlePage = Math.ceil(maxPagesToShow / 2);
    let startPage = currentPage <= middlePage ? 1 : currentPage - middlePage + 1;
    let endPage = startPage + maxPagesToShow - 1;
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = endPage - maxPagesToShow + 1;
        if (startPage < 1) {
            startPage = 1;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
            <button
                key={i}
                onClick={() => setPage(i)}
                className={currentPage == i ? "act-num page-num" : "page-num "}
            >
                {i}
            </button>
        );
    }

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">العلامات: {totalCount}</h3>
                    <Link href="/dashboard/tags/new-tags" className="addButton">إضافة علامة جديدة</Link>
                </div>

                <div className="filter-controls">
                    <select
                        className='select-box'
                        value={publishFilter}
                        onChange={(e) => {
                            setPublishFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">جميع العلامات</option>
                        <option value="published">العلامات المنشورة</option>
                        <option value="unpublished">العلامات غير المنشورة</option>
                    </select>
                </div>

                {selectedTags.length > 0 && (
                    <button className='delete-button' onClick={deleteSelectedTags}> <MdDelete /> حذف جميع المختار </button>
                )}

                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" checked={selectedTags.length === paginatedTags.length} onChange={selectAllTags} /></th>
                                <th>اسم العلامة</th>
                                <th>تاريخ النشر</th>
                                <th>الحالة</th>
                                <th>الإعدادات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTags.map(item => (
                                <tr key={item.id}>
                                    <td><input type='checkbox' checked={selectedTags.includes(item.id)} onChange={() => toggleTagSelection(item.id)} /></td>
                                    <td>{item.name}</td>
                                    <td>{formatArabicDate(item.createdAt)}</td>
                                    <td>{item.isPublished ? "منشور" : "غير منشور"}</td>
                                    <td>
                                        <Link href={`/dashboard/tags/${item.id}`}>
                                            <MdOutlineEdit style={{ color: "#4D4F5C" }} />
                                        </Link>
                                        <RiDeleteBin6Line onClick={() => handleDeleteTag(item.id)} className='delete' style={{ margin: "0px 10px" }} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <button className='arrow' onClick={prevPage} disabled={currentPage === 1}><MdKeyboardArrowRight /></button>
                    {pageNumbers}
                    <button className='arrow' onClick={nextPage} disabled={currentPage === totalPages}><MdKeyboardArrowLeft /></button>
                </div>
            </main>
        </>
    );
}