'use client'
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';
import { useRouter } from 'next/navigation';

const ADD_TAG = gql`
  mutation CreateAndPublishTag($name: String!, $slug: String!, $publishedAt: DateTime!) {
    createTag(data: { name: $name, slug: $slug, publishedAt: $publishedAt }) {
      data {
        id
        attributes {
          name
          slug
          publishedAt
        }
      }
    }
  }
`;

const AddTag = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [addTag] = useMutation(ADD_TAG, {
    context: {
      headers: {
        authorization: `Bearer ${getToken()}`,
      },
    },
  });

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .normalize("NFD")  // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, "")  // Remove diacritical marks
      .replace(/[^\p{L}\p{N}\s-]/gu, "") // Keep only letters, numbers, spaces, and hyphens
      .replace(/\s+/g, '-')  // Replace spaces with hyphens
      .replace(/-+/g, '-')   // Remove consecutive hyphens
      .replace(/^-+/, '')    // Remove starting hyphens
      .replace(/-+$/, '');   // Remove trailing hyphens
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const slug = generateSlug(name);
      const result = await addTag({
        variables: {
          name,
          slug,
          publishedAt: new Date().toISOString(),
        },
      });

      // Check if the tag was successfully created and published
      if (result.data.createTag.data.attributes.publishedAt) {
        setName('');
        setSuccessMessage("تمت إضافة ونشر العلامة بنجاح");
        setTimeout(() => {
          router.push('/dashboard/tags');
        }, 2000);
      } else {
        setErrorMessage("تم إنشاء العلامة ولكن فشل النشر");
      }
    } catch (error) {
      setErrorMessage("خطأ أثناء إضافة ونشر العلامة: " + error.message);
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
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
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