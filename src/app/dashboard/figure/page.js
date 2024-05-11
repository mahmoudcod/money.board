'use client'
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useAuth } from '@/app/auth';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import Link from 'next/link';

const GET_FIGURES = gql`
  query GetFigures($start: Int!, $limitForCount: Int!, $limitForFigures: Int!) {
    figuresConnection(start: $start, limit: $limitForCount) {
      aggregate {
        count
      }
    }
    figures(start: $start, limit: $limitForFigures) {
      id
      name
      slug
      nationality
      createdAt
    }
  }
`;

const DELETE_FIGURE = gql`
  mutation DeleteFigure($id: ID!) {
    deleteFigure(input: {
      where: {
        id: $id
      }
    }) {
      figure {
        id
      }
    }
  }
`;

export default function Figure() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFigures, setSelectedFigures] = useState([]);
    const [selectedFigureId, setSelectedFigureId] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isSmallScreen = window.innerWidth < 768;
            setSmallScreen(isSmallScreen);
        }
    }, []);

    const [isSmallScreen, setSmallScreen] = useState(false);
    const pageSize = 10;
    const { getToken } = useAuth();

    const { loading, error, data, refetch } = useQuery(GET_FIGURES, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limitForFigures: pageSize,
            limitForCount: 100000000
        },
    });

    const [deleteFigureMutation] = useMutation(DELETE_FIGURE);

    useEffect(() => {
        refetch();
        setSuccessMessage(null);
        setErrorMessage(null);
    }, [currentPage]);

    const handleCheckboxChange = (figureId) => {
        if (selectedFigures.includes(figureId)) {
            setSelectedFigures(selectedFigures.filter(id => id !== figureId));
        } else {
            setSelectedFigures([...selectedFigures, figureId]);
        }
    };

    const deleteSelectedFigures = async () => {
        const confirmDelete = window.confirm("هل انت متاكد من حذف الشخصيات المختارة?");
        if (confirmDelete) {
            const token = getToken();
            try {
                await Promise.all(selectedFigures.map(figureId => deleteFigureMutation({
                    variables: {
                        id: figureId
                    },
                    context: {
                        headers: {
                            Authorization: token ? `Bearer ${token}` : ''
                        }
                    }
                })));
                setSuccessMessage("تم حذف الشخصيات المتخارة بنجاح.");
                setSelectedFigures([]); // Clear selected figures after deletion
                refetch(); // Refetch figures after deletion
            } catch (error) {
                setErrorMessage("خطاء اثناء الحذف: " + error.message);
            }
        }
    };

    const deleteFigure = async (figureId) => {
        const confirmDelete = window.confirm("هل انت متاكد من حذف هذه الشخصية?");
        if (confirmDelete) {
            const token = getToken();
            try {
                await deleteFigureMutation({
                    variables: {
                        id: figureId
                    },
                    context: {
                        headers: {
                            Authorization: token ? `Bearer ${token}` : ''
                        }
                    }
                });
                setSuccessMessage("تم حذف الشخصية بنجاح.");
                setSelectedFigureId(null); // Clear selected figure ID after deletion
                refetch(); // Refetch figures after deletion
            } catch (error) {
                setErrorMessage("خطأ في حذف الشخصية: " + error.message);
            }
        }
    };

    if (loading) return null;
    if (error) return <p>Error: {error.message}</p>;

    const figures = data.figures;
    const totalCount = data.figuresConnection.aggregate.count;
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
            </button>);
    }

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">الشخصيات: {totalCount}</h3>
                    <Link href="/dashboard/figure/new-figure" className="addButton">إضافة شخصية جديدة</Link>
                </div>

                {selectedFigures.length > 0 && (
                    <button className='delete-button' onClick={deleteSelectedFigures}>
                        <MdDelete />
                        حذف جميع المختار
                    </button>
                )}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedFigures.length === figures.length}
                                        onChange={() => {
                                            if (selectedFigures.length === figures.length) {
                                                setSelectedFigures([]);
                                            } else {
                                                setSelectedFigures(figures.map(figure => figure.id));
                                            }
                                        }}
                                    />
                                </th>
                                <th>اسم الشخصية</th>
                                {!isSmallScreen && <th>Slug</th>}
                                <th>الجنسية</th>
                                {!isSmallScreen && <th>تاريخ النشر</th>}
                                <th>الإعدادات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {figures.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedFigures.includes(item.id)}
                                            onChange={() => handleCheckboxChange(item.id)}
                                        />
                                    </td>
                                    <td>{item.name}</td>
                                    {!isSmallScreen && <td>{item.slug}</td>}
                                    <td>{item.nationality}</td>
                                    {!isSmallScreen && <td>{formatArabicDate(item.createdAt)}</td>}
                                    <td>
                                        <Link href={`/dashboard/figure/${item.id}`}>
                                            <MdOutlineEdit style={{ color: " #4D4F5C" }} />
                                        </Link>
                                        <RiDeleteBin6Line onClick={() => deleteFigure(item.id)} className='delete' style={{ margin: "0px 10px" }} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {successMessage && <p className="success-message">{successMessage}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}

                <div className="pagination">
                    <button className='arrow' onClick={prevPage} disabled={currentPage === 1}><MdKeyboardArrowRight /></button>
                    {pageNumbers}
                    <button className='arrow' onClick={nextPage} disabled={currentPage === totalPages}><MdKeyboardArrowLeft /></button>
                </div>
            </main>
        </>
    );
}
