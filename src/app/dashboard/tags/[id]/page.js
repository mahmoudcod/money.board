'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';

const GET_TAG = gql`
  query getTag($id: ID!) {
    tag(id: $id) {
      data {
        id
        attributes {
          name
        }
      }
    }
  }
`;

const UPDATE_TAG = gql`
  mutation updateTag($id: ID!, $name: String!) {
    updateTag(id: $id, data: { name: $name }) {
      data {
        id
        attributes {
          name
        }
      }
    }
  }
`;

const EditTagPage = ({ params }) => {
  const router = useRouter();
  const { getToken } = useAuth();
  const [token, setToken] = useState(null);
  const id = params.id;
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      const fetchedToken = await getToken();
      setToken(fetchedToken);
    };
    fetchToken();
  }, [getToken]);

  const { loading, error, data } = useQuery(GET_TAG, {
    variables: { id: id },
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
    },
    skip: !token,
  });

  const [updateTag] = useMutation(UPDATE_TAG, {
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
    },
  });

  useEffect(() => {
    if (!loading && data && data.tag && data.tag.data) {
      const tag = data.tag.data.attributes;
      setName(tag.name);
    }
  }, [loading, data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await updateTag({
        variables: {
          id,
          name,
        },
      });
      setSuccessMessage("تم تعديل العلامة بنجاح");
      setTimeout(() => {
        router.push('/dashboard/tags');
      }, 2000);
    } catch (error) {
      setErrorMessage("خطأ أثناء تعديل العلامة: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <main className="head">
        <div className="head-title">
          <h3 className="title">تعديل علامة: {name}</h3>
        </div>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <form className="content" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>اسم العلامة:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <button className='sub-button' type="submit" disabled={isLoading}>
            {isLoading ? 'جاري التعديل...' : 'حفظ التغييرات'}
          </button>
        </form>
      </main>
    </>
  );
};

export default EditTagPage;