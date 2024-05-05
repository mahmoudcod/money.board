'use client'
import React, { useState } from 'react';
import { MdKeyboardArrowLeft } from "react-icons/md";
import { MdKeyboardArrowRight } from "react-icons/md";

import { MdOutlineEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import Link from 'next/link';
// Define your GraphQL query with pagination parameters
const GET_POSTS = gql`
  query GetPosts($start: Int!, $limitForCount: Int!, $limitForPosts: Int!) {
    postsConnection(start: $start, limit: $limitForCount) {
      aggregate {
        count
      }
    }
    posts(start: $start, limit: $limitForPosts) {
      id
      title
      slug
      category
      createdAt
      published
    }
  }
`;

export default function Post() {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const { loading, error, data } = useQuery(GET_POSTS, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limitForPosts: pageSize,
            limitForCount: 1000
        },
    });

    if (loading) return null;
    if (error) return <p>Error: {error.message}</p>;

    const posts = data.posts;
    const totalCount = data.postsConnection.aggregate.count;
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
    // Format the date into Arabic using toLocaleString with appropriate options
    const formatArabicDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ar', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            timeZone: 'UTC' // Adjust timeZone as per your requirement
        });
    };


    // Generate page number buttons
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
            </button>);
    }


    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">المقالات</h3>
                    <Link href="/dashboard/posts/new-post" className="addButton">اضافة مقالة جديدة</Link>
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" /></th>
                            <th>اسم المقالة</th>
                            <th>Slug</th>
                            <th>القسم</th>
                            <th>حالة المقالة</th>
                            <th>تاريخ النشر</th>
                            <th>الاعدادات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map(item => (
                            <tr key={item.id}>
                                <td><input type='checkbox' /></td>
                                <td>{item.title.slice(0, 40)}</td>
                                <td>{item.slug.slice(0, 40)}</td>
                                <td>{item.category}</td>
                                {!item.published ? <td>مسودة</td> : <td>منشور</td>}
                                <td>{formatArabicDate(item.createdAt)}</td>
                                <td>
                                    <Link href={`/dashboard/posts/${item.id}`}>
                                        <MdOutlineEdit />
                                    </Link>
                                    <RiDeleteBin6Line style={{ margin: "0px 10px" }} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination">
                    <button className='arrow' onClick={prevPage} disabled={currentPage === 1}><MdKeyboardArrowRight /></button>
                    {pageNumbers}
                    <button className='arrow' onClick={nextPage} disabled={currentPage === totalPages}><MdKeyboardArrowLeft /></button>
                </div>
            </main>
        </>
    );
}