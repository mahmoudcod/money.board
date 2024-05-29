'use client'
import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineEdit, MdDelete } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useAuth } from '@/app/auth';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import Link from 'next/link';

const GET_ADS = gql`
  query GetAds($start: Int!, $limitForCount: Int!, $limitForAdvs: Int!) {
    advsConnection(start: $start, limit: $limitForCount) {
      aggregate {
        count
      }
    }
    advs(sort: "updatedAt:desc", start: $start, limit: $limitForAdvs) {
      id
      type
      city
      budget
      company
      phone
      notes
      email
      createdAt
    }
  }
`;

const DELETE_AD = gql`
  mutation DeleteAdv($id: ID!) {
    deleteAdv(input: {
      where: {
        id: $id
      }
    }) {
      adv {
        id
      }
    }
  }
`;

export default function Advertisements() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAds, setSelectedAds] = useState([]);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    const pageSize = 10;
    const { getToken } = useAuth();

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 650);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const { loading, error, data, refetch } = useQuery(GET_ADS, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limitForAdvs: pageSize,
            limitForCount: 100000000
        },
    });

    const [deleteAdMutation] = useMutation(DELETE_AD);

    const handleDeleteAd = async (adId) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        const token = getToken();
        try {
            await deleteAdMutation({
                variables: {
                    id: adId
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

    const ads = data.advs;
    const totalCount = data.advsConnection.aggregate.count;
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

    const toggleAdSelection = (adId) => {
        if (selectedAds.includes(adId)) {
            setSelectedAds(selectedAds.filter(id => id !== adId));
        } else {
            setSelectedAds([...selectedAds, adId]);
        }
    };

    const selectAllAds = () => {
        if (selectedAds.length === ads.length) {
            setSelectedAds([]);
        } else {
            setSelectedAds(ads.map(ad => ad.id));
        }
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

    const deleteSelectedAds = async () => {
        const confirmDelete = window.confirm("هل انت متاكد انك تريد حذف الإعلانات المختارة?");
        if (confirmDelete) {
            const token = getToken();
            try {
                await Promise.all(selectedAds.map(adId => handleDeleteAd(adId)));
                setSelectedAds([]); // Clear selected ads after deletion
            } catch (error) {
                console.error("خطأ أثناء الحذف:", error.message);
            }
        }
    };

    const maxPagesToShow = 5;
    const middlePage = Math.ceil(maxPagesToShow / 2);
    let startPage = currentPage <= middlePage ? 1 : currentPage - middlePage + 1;
    let endPage = startPage + maxPagesToShow - 1;
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
            <button
                key={i}
                onClick={() => setPage(i)}
                className={currentPage === i ? "active-num page-num" : "page-num"}
            >
                {i}
            </button>
        );
    }

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">الإعلانات: {totalCount}</h3>
                    <Link href="/dashboard/ads/new-ads" className="addButton">إضافة إعلان جديد</Link>
                </div>

                {selectedAds.length > 0 && (
                    <button className='delete-button' onClick={deleteSelectedAds}> <MdDelete /> حذف جميع المختار </button>
                )}

                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th> <input type="checkbox" checked={selectedAds.length === ads.length} onChange={selectAllAds} /></th>
                                <th>الهاتف</th>
                                {!isSmallScreen && <th>النوع</th>}
                                {!isSmallScreen && <th>المدينة</th>}
                                <th>ملاحظات</th>
                                {!isSmallScreen && <th>الميزانية</th>}
                                {!isSmallScreen && <th>التاريخ</th>}
                                <th>الإعدادات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ads.map(ad => (
                                <tr key={ad.id}>
                                    <td><input type='checkbox' checked={selectedAds.includes(ad.id)} onChange={() => toggleAdSelection(ad.id)} /></td>
                                    <td>{ad.phone}</td>
                                    {!isSmallScreen && <td>{ad.type}</td>}
                                    {!isSmallScreen && <td>{ad.city}</td>}
                                    <td>{ad.notes}</td>
                                    {!isSmallScreen && <td>{ad.budget}</td>}
                                    {!isSmallScreen && <td>{formatArabicDate(ad.createdAt)}</td>}
                                    <td>
                                        <Link href={`/dashboard/ads/${ad.id}`}>
                                            <MdOutlineEdit style={{ color: "#4D4F5C" }} />
                                        </Link>
                                        <RiDeleteBin6Line onClick={() => handleDeleteAd(ad.id)} className='delete' style={{ margin: "0px 10px" }} />
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
