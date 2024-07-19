'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';

const CREATE_SUBCATEGORY = gql`
  mutation createSubCategory($subName: String!, $slug: String!, $description: String) {
    createSubCategory(data: { 
      subName: $subName, 
      slug: $slug, 
      description: $description 
    }) {
      data {
        id
      }
    }
  }
`;

const CreateSubCategoryPage = () => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();

    const [subName, setSubName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [createSubCategory, { error: createError }] = useMutation(CREATE_SUBCATEGORY, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
        onError: (error) => {
            console.error('Error creating subcategory:', error);
            setErrorMessage('حدث خطأ أثناء إنشاء الفئة الفرعية.');
        },
        onCompleted: () => {
            if (!createError) {
                setSuccessMessage('تم إنشاء الفئة الفرعية بنجاح.');
                setTimeout(() => {
                    if (!errorMessage) {
                        router.push(`/dashboard/subcategory`);
                    }
                }, 2000);
            }
        },
    });

    const handleSubNameChange = (e) => {
        const newSubName = e.target.value;
        setSubName(newSubName);
        // Automatically generate a slug from the subName
        setSlug(newSubName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createSubCategory({
                variables: {
                    subName,
                    slug,
                    description,
                },
            });

            setSuccessMessage('تم إنشاء الفئة الفرعية بنجاح.');
            setTimeout(() => {
                if (!errorMessage) {
                    router.push(`/dashboard/subCat`);
                }
            }, 2000);
        } catch (error) {
            console.error(error);
            setErrorMessage('حدث خطأ أثناء إنشاء الفئة الفرعية.');
        }
    };

    return (
        <main className="head">
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            <div className="head-title">
                <h3 className="title">إنشاء فئة فرعية جديدة</h3>
            </div>
            <form className="content" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>اسم الفئة الفرعية:</label>
                    <input type="text" value={subName} onChange={handleSubNameChange} required />
                </div>
                <div className="form-group">
                    <label>الاسم اللطيف (Slug):</label>
                    <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>الوصف:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                    />
                </div>
                <button className="sub-button" type="submit">
                    إنشاء الفئة الفرعية
                </button>
            </form>
        </main>
    );
};

export default CreateSubCategoryPage;