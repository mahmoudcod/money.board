"use client"
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap'; // You can use any UI library
import { useQuery, useMutation } from '@apollo/client';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import 'bootstrap/dist/css/bootstrap.min.css';

import emailjs from 'emailjs-com';
import gql from 'graphql-tag';

const GET_CONTACT_QUERIES = gql`
  query GetContactQueries($start: Int!, $limitForCount: Int!, $limitForQueries: Int!) {
    contactsConnection(start: $start, limit: $limitForCount) {
      aggregate {
        count
      }
    }
    contacts(start: $start, limit: $limitForQueries) {
      id
      name
      email
      message
      createdAt
    }
  }
`;

const DELETE_QUERY = gql`
  mutation DeleteQuery($id: ID!) {
    deleteQuery(input: {
      where: {
        id: $id
      }
    }) {
      query {
        id
      }
    }
  }
`;

export default function ContactQueries() {
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [emailContent, setEmailContent] = useState('');
    const pageSize = 10;

    const { loading, error, data } = useQuery(GET_CONTACT_QUERIES, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limitForQueries: pageSize,
            limitForCount: 100000000
        },
    });

    const [deleteQueryMutation] = useMutation(DELETE_QUERY);

    const handleReply = (query) => {
        setSelectedQuery(query);
        setEmailContent(`Hello ${query.name},\n\n`); // Pre-fill with your content
        setShowModal(true);
    };

    const handleSendEmail = () => {
        const templateParams = {
            to_email: selectedQuery.email,
            from_name: 'Your Site Name',
            message: emailContent,
            reply_to: 'your-email@example.com',
        };

        emailjs.send('your_service_id', 'your_template_id', templateParams, 'your_user_id')
            .then((response) => {
                console.log('Email sent successfully:', response.status, response.text);
                setShowModal(false);
            }, (error) => {
                console.error('Failed to send email:', error);
            });
    };

    if (loading) return null;
    if (error) return <p>Error: {error.message}</p>;

    const queries = data.contacts;
    const totalCount = data.contactsConnection.aggregate.count;
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

    const deleteQuery = async (queryId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this query?");
        if (confirmDelete) {
            try {
                await deleteQueryMutation({
                    variables: {
                        id: queryId
                    },
                });
                console.log("Query deleted successfully.");
            } catch (error) {
                console.error("Error deleting query:", error.message);
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
                className={currentPage === i ? "act-num page-num" : "page-num "}
            >
                {i}
            </button>);
    }

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">رسائل تواصل معنا: {totalCount}</h3>
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" /></th>
                            <th>الاسم</th>
                            <th>الاميل</th>
                            <th>الرسالة</th>
                            <th>تاريخ الرسالة</th>
                            <th>الاعدادات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {queries.map(query => (
                            <tr key={query.id}>
                                <td><input type='checkbox' /></td>
                                <td>{query.name}</td>
                                <td>{query.email}</td>
                                <td>{query.message}</td>
                                <td>{formatArabicDate(query.createdAt)}</td>
                                <td>
                                    <button onClick={() => handleReply(query)}>Reply</button>
                                    <RiDeleteBin6Line onClick={() => deleteQuery(query.id)} className='delete' style={{ margin: "0px 10px" }} />
                                </td>
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

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Reply to {selectedQuery?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Email Content</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                value={emailContent}
                                onChange={(e) => setEmailContent(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleSendEmail}>Send Email</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
