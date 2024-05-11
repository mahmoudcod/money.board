'use client'
import React, { useState } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from "react-icons/md";
import { useAuth } from '@/app/auth';
import { RiDeleteBin6Line } from "react-icons/ri";
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import Link from 'next/link';

const GET_TAGS = gql`
  query GetTags($start: Int!, $limitForCount: Int!, $limitForTags: Int!) {
    tagsConnection(start: $start, limit: $limitForCount) {
      aggregate {
        count
      }
    }
    tags(sort: "updatedAt:desc", start: $start, limit: $limitForTags) {
      id
      name
      createdAt
    }
  }
`;

const DELETE_TAG = gql`
  mutation DeleteTag($id: ID!) {
    deleteTag(input: {
      where: {
        id: $id
      }
    }) {
      tag {
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
    const pageSize = 10;
    const { getToken } = useAuth();

    const { loading, error, data, refetch } = useQuery(GET_TAGS, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limitForTags: pageSize,
            limitForCount: 100000000
        },
    });

    const [deleteTagMutation] = useMutation(DELETE_TAG);

    const handleDeleteTag = async (tagId) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        const token = getToken();
        try {
            await deleteTagMutation({
                variables: {
                    id: tagId
                },
                context: {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : ''
                    }
                }
            });
            setSuccessMessage("تم الحذف بنجاح");
            refetch(); // Refetch data after deletion
        } catch (error) {
            setErrorMessage("خطأ أثناء الحذف: " + error.message);
        }
    };

    if (loading) return null;
    if (error) {
        return (
            <div className="error-message">
                <p>Error: {error.message}</p>
            </div>
        );
    }

    const tags = data.tags;
    const totalCount = data.tagsConnection.aggregate.count;
    const totalPages = Math.ceil(totalCount / pageSize);

    const nextPage = () => {
        setCurrentPage(currentPage + 1);
    };

    const prevPage = () => {
        setCurrentPage(currentPage - 1);
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
        if (selectedTags.length === tags.length) {
            setSelectedTags([]);
        } else {
            setSelectedTags(tags.map(tag => tag.id));
        }
    };

    const deleteSelectedTags = async () => {
        const confirmDelete = window.confirm("هل انت متاكد انك تريد حذف الكلمات المختارة?");
        if (confirmDelete) {
            const token = getToken();
            try {
                await Promise.all(selectedTags.map(tagId => handleDeleteTag(tagId)));
                setSelectedTags([]); // Clear selected tags after deletion
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

                {selectedTags.length > 0 && (
                    <button className='delete-button' onClick={deleteSelectedTags}> <MdDelete /> حذف جميع المختار </button>
                )}

                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th> <input type="checkbox" checked={selectedTags.length === tags.length} onChange={selectAllTags} /></th>
                                <th>اسم العلامة</th>
                                <th>تاريخ النشر</th>
                                <th>الإعدادات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tags.map(item => (
                                <tr key={item.id}>
                                    <td><input type='checkbox' checked={selectedTags.includes(item.id)} onChange={() => toggleTagSelection(item.id)} /></td>
                                    <td>{item.name}</td>
                                    <td>{formatArabicDate(item.createdAt)}</td>
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
