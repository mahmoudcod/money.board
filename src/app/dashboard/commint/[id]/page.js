'use client'
import React from 'react';
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';

const GET_COMMENT = gql`
  query GetComment($id: ID!) {
    comment(id: $id) {
      data {
        id
        attributes {
          name
          email
          comment
          saveInfo
          createdAt
          updatedAt
        }
      }
    }
  }
`;

const Comment = ({ params }) => {
    const { getToken } = useAuth();
    const token = getToken();
    const id = params.id

    const { data, loading, error } = useQuery(GET_COMMENT, {
        variables: { id: id },
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    if (loading) return null;
    if (error) return <p>Error: {error.message}</p>;

    const comment = data.comment.data.attributes;

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">تفاصيل التعليق</h3>
                </div>
                <div className="content">
                    <div className="comment-item">
                        <div className="comment-header">
                            <p className="date"><strong>تاريخ :</strong> {new Date(comment.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className='name-email'>
                            <p><strong>الاسم:</strong> {comment.name}</p>
                            <p className='mail'><strong>البريد الإلكتروني:</strong> <a href={`mailto:${comment.email}`}>{comment.email}</a></p>
                        </div>
                        <p className="message"><strong>التعليق:</strong> {comment.comment}</p>
                    </div>
                </div>
            </main>
        </>
    );
};

export default Comment;