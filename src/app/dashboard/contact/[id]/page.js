'use client'
import React from 'react';
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';

const GET_CONTACT_QUERY = gql`
  query GetContactQuery($id: ID!) {
    contact(id: $id) {
      id
      name
      email
      message
      createdAt
    }
  }
`;

const ContactQuery = ({ params }) => {
    const { getToken } = useAuth();
    const token = getToken();
    const id = params.id

    const { data, loading, error } = useQuery(GET_CONTACT_QUERY, {
        variables: { id: id },

        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    if (loading) return null
    if (error) return <p>Error: {error.message}</p>;

    const { contact } = data;

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">استفسار تواصل</h3>
                </div>
                <div className="content">
                    <div className="contact-item">
                        <div className="contact-header">
                            <p className="date"><strong>التاريخ:</strong> {new Date(contact.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className='name-email'>
                            <p><strong>الاسم:</strong> {contact.name} </p>
                            <p className='mail'><strong>البريد الإلكتروني:</strong> <a href={`mailto:${contact.email}`}>{contact.email}</a></p>
                        </div>
                        <p className="message"><strong>الرسالة:</strong> {contact.message}</p>
                    </div>
                </div>
            </main>
        </>
    );
};

export default ContactQuery;
