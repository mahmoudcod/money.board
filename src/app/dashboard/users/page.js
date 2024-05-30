'use client'
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from "react-icons/md";
import { useAuth } from '@/app/auth';
import { RiDeleteBin6Line } from "react-icons/ri";
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import Link from 'next/link';

const GET_USERS = gql`
  query getUsers($start: Int!, $limitForCount: Int!, $limitForUsers: Int!) {
    usersConnection(start: $start, limit: $limitForCount) {
      aggregate {
        count
      }
    }
    users(sort: "createdAt:desc", start: $start, limit: $limitForUsers) {
      id
      username
      slug
      email
      roles
      createdAt
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(input: {
      where: {
        id: $id
      }
    }) {
      user {
        id
      }
    }
  }
`;

export default function Users() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const pageSize = 30;
    const { getToken } = useAuth();

    const { loading, error, data, refetch } = useQuery(GET_USERS, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limitForUsers: pageSize,
            limitForCount: 100000000
        },
        notifyOnNetworkStatusChange: true, // Ensure the query gets updated when variables change
    });

    const [deleteUserMutation] = useMutation(DELETE_USER);

    const handleDeleteUser = async (userId) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        const token = getToken();
        try {
            await deleteUserMutation({
                variables: {
                    id: userId
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

    useEffect(() => {
        refetch({
            start: (currentPage - 1) * pageSize,
            limitForUsers: pageSize,
            limitForCount: 100000000
        });
    }, [currentPage, refetch]);

    if (loading) return null;
    if (error) {
        return (
            <div className="error-message">
                <p>Error: {error.message}</p>
            </div>
        );
    }

    const users = data.users;
    const totalCount = data.usersConnection.aggregate.count;
    const totalPages = Math.ceil(totalCount / pageSize);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const setPage = (page) => {
        setCurrentPage(page);
    };

    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const selectAllUsers = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user.id));
        }
    };

    const deleteSelectedUsers = async () => {
        const confirmDelete = window.confirm("هل انت متاكد انك تريد حذف المستخدمين المختارين?");
        if (confirmDelete) {
            const token = getToken();
            try {
                await Promise.all(selectedUsers.map(userId => handleDeleteUser(userId)));
                setSelectedUsers([]); // Clear selected users after deletion
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
                    <h3 className="title">المستخدمين: {totalCount}</h3>
                    <Link href="/dashboard/users/new-user" className="addButton">إضافة مستخدم جديد</Link>
                </div>

                {selectedUsers.length > 0 && (
                    <button className='delete-button' onClick={deleteSelectedUsers}> <MdDelete /> حذف جميع المختارين </button>
                )}

                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th> <input type="checkbox" checked={selectedUsers.length === users.length} onChange={selectAllUsers} /></th>
                                <th>اسم المستخدم</th>
                                <th>البريد الإلكتروني</th>
                                <th>الأدوار</th>
                                <th>تاريخ الإنشاء</th>
                                <th>الإعدادات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td><input type='checkbox' checked={selectedUsers.includes(user.id)} onChange={() => toggleUserSelection(user.id)} /></td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{user.roles}</td>
                                    <td>{formatArabicDate(user.createdAt)}</td>
                                    <td>
                                        <Link href={`/dashboard/users/${user.id}`}>
                                            <MdOutlineEdit style={{ color: "#4D4F5C" }} />
                                        </Link>
                                        <RiDeleteBin6Line onClick={() => handleDeleteUser(user.id)} className='delete' style={{ margin: "0px 10px" }} />
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
