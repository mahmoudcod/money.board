'use client';

import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { useAuth } from '@/app/auth';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import Link from 'next/link';

const GET_POSTS = gql`
  query GetPosts($limitForPosts: Int!, $searchTerm: String, $start: Int!, $publicationState: PublicationState) {
    blogs(
      sort: "updatedAt:desc"
      pagination: { limit: $limitForPosts, start: $start }
      filters: { title: { contains: $searchTerm } }
      publicationState: $publicationState
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
    const pageSize = 10;
    const { getToken } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('PREVIEW');
    const [isSmallScreen, setSmallScreen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isSmallScreen = window.innerWidth < 768;
            setSmallScreen(isSmallScreen);
        }
    }, []);

    const { loading, error, data, refetch } = useQuery(GET_POSTS, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limitForPosts: pageSize,
            searchTerm: searchQuery,
            publicationState: filterStatus === 'ALL' ? undefined : filterStatus === 'PUBLISHED' ? 'LIVE' : 'PREVIEW',
        },
    });

    const [deletePostMutation] = useMutation(DELETE_POST);

    useEffect(() => {
        refetch({
            start: (currentPage - 1) * pageSize,
            searchTerm: searchQuery,
            publicationState: filterStatus === 'ALL' ? undefined : filterStatus === 'PUBLISHED' ? 'LIVE' : 'PREVIEW',
        });
    }, [currentPage, searchQuery, filterStatus]);

    const handleCheckboxChange = (postId) => {
        const updatedSelectedPosts = selectedPosts.includes(postId)
            ? selectedPosts.filter((id) => id !== postId)
            : [...selectedPosts, postId];
        setSelectedPosts(updatedSelectedPosts);
    };

    const deleteSelectedPosts = async () => {
        if (window && window.confirm('Are you sure you want to delete selected posts?')) {
            const token = getToken();
            try {
                await Promise.all(
                    selectedPosts.map((postId) =>
                        deletePostMutation({
                            variables: { id: postId },
                            context: {
                                headers: {
                                    Authorization: token ? `Bearer ${token}` : '',
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
            const timer = setTimeout(() => {
                setDeleteSuccess(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [deleteSuccess]);

    if (loading) return null;
    if (error) return <p>Error: {error.message}</p>;

    const posts = data?.blogs?.data || [];
    const totalCount = data?.blogs?.meta?.pagination?.total || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const nextPage = () => setCurrentPage((prevPage) => prevPage + 1);
    const prevPage = () => setCurrentPage((prevPage) => prevPage - 1);

    const setPage = (page) => {
        setCurrentPage(page);
    };

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
        if (window && window.confirm('Are you sure you want to delete this post?')) {
            const token = getToken();
            try {
                await deletePostMutation({
                    variables: { id: postId },
                    context: {
                        headers: {
                            Authorization: token ? `Bearer ${token}` : '',
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

    const handleFilterChange = (status) => {
        setFilterStatus(status);
        setCurrentPage(1);
        refetch({
            start: 0,
            publicationState: status === 'ALL' ? undefined : status === 'PUBLISHED' ? 'LIVE' : 'PREVIEW',
        });
    };
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
                    <button
                        onClick={() => handleFilterChange('ALL')}
                        className={filterStatus === 'ALL' ? 'active-filter' : 'filter-icon'}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => handleFilterChange('PUBLISHED')}
                        className={filterStatus === 'PUBLISHED' ? 'active-filter' : 'filter-icon'}
                    >
                        منشور
                    </button>
                    <button
                        onClick={() => handleFilterChange('DRAFT')}
                        className={filterStatus === 'DRAFT' ? 'active-filter' : 'filter-icon'}
                    >
                        مسودة
                    </button>
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
                                        checked={selectedPosts.length === posts.length}
                                        onChange={() => {
                                            if (selectedPosts.length === posts.length) {
                                                setSelectedPosts([]);
                                            } else {
                                                setSelectedPosts(posts.map((post) => post.id));
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
                            {posts.map((post) => (
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
                                            <MdOutlineEdit style={{ color: '#4D4F5C' }} />
                                        </Link>
                                        <RiDeleteBin6Line
                                            onClick={() => deletePost(post.id)}
                                            className="delete"
                                            style={{ margin: '0px 10px' }}
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