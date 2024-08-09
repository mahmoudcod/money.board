'use client';

import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { useAuth } from '@/app/auth';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import Link from 'next/link';

const GET_POSTS = gql`
  query GetPosts($start: Int!, $limit: Int!, $searchTerm: String) {
    blogs(
      sort: "updatedAt:desc"
      pagination: { start: $start, limit: $limit }
      filters: { title: { contains: $searchTerm } }
      publicationState: PREVIEW
    ) {
      data {
        id
        attributes {
          title
          slug
          categories {
            data {
              attributes {
                name
              }
            }
          }
          createdAt
          updatedAt
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

const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deleteBlog(id: $id) {
      data {
        id
      }
    }
  }
`;

export default function Post() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPosts, setSelectedPosts] = useState([]);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [publishFilter, setPublishFilter] = useState('all');
    const [isSmallScreen, setSmallScreen] = useState(false);
    const pageSize = 10;
    const { getToken } = useAuth();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setSmallScreen(window.innerWidth < 768);
        }
    }, []);

    const { loading, error, data, refetch } = useQuery(GET_POSTS, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limit: pageSize,
            searchTerm: searchQuery,
        },
    });

    const [deletePostMutation] = useMutation(DELETE_POST);

    useEffect(() => {
        refetch({
            start: (currentPage - 1) * pageSize,
            searchTerm: searchQuery,
        });
    }, [currentPage, searchQuery, refetch]);

    const handleCheckboxChange = (postId) => {
        setSelectedPosts(prev =>
            prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
        );
    };

    const deleteSelectedPosts = async () => {
        if (window.confirm('Are you sure you want to delete selected posts?')) {
            const token = getToken();
            try {
                await Promise.all(
                    selectedPosts.map((postId) =>
                        deletePostMutation({
                            variables: { id: postId },
                            context: {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            },
                        })
                    )
                );
                setSelectedPosts([]);
                setDeleteSuccess(true);
                refetch();
            } catch (error) {
                console.error('Error deleting selected posts:', error.message);
            }
        }
    };

    useEffect(() => {
        if (deleteSuccess) {
            const timer = setTimeout(() => setDeleteSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [deleteSuccess]);

    if (loading) return <div class="loader"></div>;
    if (error) return <p>Error: {error.message}</p>;

    const allPosts = data?.blogs?.data || [];
    const filteredPosts = allPosts.filter(post => {
        if (publishFilter === 'all') return true;
        if (publishFilter === 'published') return post.attributes.publishedAt;
        if (publishFilter === 'unpublished') return !post.attributes.publishedAt;
        return true;
    });

    const totalCount = filteredPosts.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    const paginatedPosts = filteredPosts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const setPage = (page) => setCurrentPage(page);

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

    const deletePost = async (postId) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            const token = getToken();
            try {
                await deletePostMutation({
                    variables: { id: postId },
                    context: {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                });
                setDeleteSuccess(true);
                refetch();
            } catch (error) {
                console.error('Error deleting post:', error.message);
            }
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setSearchQuery(searchTerm);
            setCurrentPage(1);
        }
    };

    const maxPagesToShow = 5;
    const middlePage = Math.ceil(maxPagesToShow / 2);
    let startPage = currentPage <= middlePage ? 1 : currentPage - middlePage + 1;
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pageButtons = [];
    for (let i = startPage; i <= endPage; i++) {
        pageButtons.push(
            <button
                key={i}
                onClick={() => setPage(i)}
                className={currentPage === i ? 'act-num page-num' : 'page-num'}
            >
                {i}
            </button>
        );
    }

    return (
        <>

            <main className="head">
                <input
                    type="text"
                    className="search"
                    placeholder="البحث"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleSearch}
                />
                <div className="head-title">
                    <h3 className="title">المقالات: {totalCount}</h3>
                    <Link href="/dashboard/posts/new-post" className="addButton">
                        اضافة مقالة جديدة
                    </Link>
                </div>

                <div className="filter-container">
                    <select
                        className='select-box'
                        value={publishFilter}
                        onChange={(e) => {
                            setPublishFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">جميع المقالات</option>
                        <option value="published">المقالات المنشورة</option>
                        <option value="unpublished">المقالات  مسودة</option>
                    </select>
                </div>

                {selectedPosts.length > 0 && (
                    <button className="delete-button" onClick={deleteSelectedPosts}>
                        <MdDelete />
                        حذف جميع المختار
                    </button>
                )}

                {deleteSuccess && <div className="success-message">تم الحذف بنجاح</div>}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedPosts.length === paginatedPosts.length}
                                        onChange={() => {
                                            if (selectedPosts.length === paginatedPosts.length) {
                                                setSelectedPosts([]);
                                            } else {
                                                setSelectedPosts(paginatedPosts.map((post) => post.id));
                                            }
                                        }}
                                    />
                                </th>
                                <th>اسم المقالة</th>
                                {!isSmallScreen && <th>Slug</th>}
                                {!isSmallScreen && <th>القسم</th>}
                                <th>حالة المقالة</th>
                                {!isSmallScreen && <th>تاريخ النشر</th>}
                                <th>الاعدادات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPosts.map((post) => (
                                <tr key={post.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedPosts.includes(post.id)}
                                            onChange={() => handleCheckboxChange(post.id)}
                                        />
                                    </td>
                                    <td>{post.attributes.title}</td>
                                    {!isSmallScreen && <td>{post.attributes.slug}</td>}
                                    {!isSmallScreen && <td>{post.attributes.categories.data.map(cat => cat.attributes.name).join(', ')}</td>}
                                    <td>{post.attributes.publishedAt ? 'منشور' : 'مسودة'}</td>
                                    {!isSmallScreen && <td>{formatArabicDate(post.attributes.createdAt)}</td>}
                                    <td>
                                        <Link href={`/dashboard/posts/${post.id}`}>
                                            <MdOutlineEdit style={{ color: '#4D4F5C', fontSize: '18px' }} />
                                        </Link>
                                        <RiDeleteBin6Line
                                            onClick={() => deletePost(post.id)}
                                            className="delete"
                                            style={{ marginRight: ' 18px', fontSize: '18px' }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <button
                        className="arrow"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                    >
                        <MdKeyboardArrowRight />
                    </button>
                    {pageButtons}
                    <button
                        className="arrow"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                    >
                        <MdKeyboardArrowLeft />
                    </button>
                </div>
            </main>
        </>
    );
}