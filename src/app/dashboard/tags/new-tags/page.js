'use client'
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';
import { useRouter } from 'next/navigation';

const ADD_TAG = gql`
  mutation createTag(
    $name: String!
  ) {
    createTag(
      input: {
        data: {
          name: $name
        }
      }
    ) {
      tag {
        id
        name
      }
    }
  }
`;

const AddTag = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const token = getToken();

  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [addTag] = useMutation(ADD_TAG, {
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await addTag({
        variables: {
          name,
        },
      });
      // Clear form fields and redirect to /dashboard/tags after successful submission
      setName('');
      router.push('/dashboard/tags');
    } catch (error) {
      setErrorMessage("خطأ أثناء إضافة العلامة: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="head">
        <div className="head-title">
          <h3 className="title">إضافة علامة</h3>
        </div>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <form className="content" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>اسم العلامة:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button className='sub-button' type="submit" disabled={isLoading}>
            {isLoading ? 'جاري الإضافة...' : 'اضافة'}
          </button>
        </form>
      </main>
    </>
  );
};

export default AddTag;
