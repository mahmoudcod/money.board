'use client'
import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';

const GET_CONTACT_QUERY = gql`
  query GetContactQuery($id: ID!) {
    contactUs(id: $id) {
      data {
        id
        attributes {
          name
          email
          phone
          message
          createdAt
        }
      }
    }
  }
`;

const ContactQuery = ({ params }) => {
    const [token, setToken] = useState(null);
    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const { getToken, refreshToken } = useAuth();
    const id = params.id;

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
            } finally {
                setIsTokenLoading(false);
            }
        };

        fetchToken();
    }, [getToken, refreshToken]);

    const { data, loading, error } = useQuery(GET_CONTACT_QUERY, {
        variables: { id: id },
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
        skip: !token || isTokenLoading,
    });

    if (isTokenLoading) return null;
    if (!token) return <div>لم يتم العثور على رمز المصادقة. يرجى تسجيل الدخول مرة أخرى.</div>;
    if (loading) return <div className="loader"></div>;
    if (error) return <div>خطأ: {error.message}</div>;

    if (!data || !data.contactUs || !data.contactUs.data) {
        return <p>لا توجد بيانات اتصال متاحة.</p>;
    }

    const contact = data.contactUs.data.attributes;

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

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">رسالة من: {contact.name}</h3>
                    <p className="title"><strong>التاريخ:</strong> {formatArabicDate(contact.createdAt)}</p>
                </div>
                <div className="content">
                    <div className="contact-item">
                        <div className="contact-header">
                        </div>
                        <div className='name-email'>
                            <p style={{ marginBottom: '10px' }}><strong>الهاتف:</strong> {contact.phone}</p>
                            <p style={{ marginBottom: '10px' }} className='mail'><strong>البريد الإلكتروني:</strong> <a href={`mailto:${contact.email}`}>{contact.email}</a></p>
                        </div>
                        <p className="message">{contact.message}</p>
                    </div>
                </div>
            </main>
        </>
    );
};

export default ContactQuery;