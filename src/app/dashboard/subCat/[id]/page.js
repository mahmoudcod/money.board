'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';

const GET_SUBCATEGORY = gql`
  query getSubCategory($id: ID!) {
    subCategory(id: $id) {
      data {
        id
        attributes {
          subName
          slug
          description
          category {
            data {
              id
            }
          }
        }
      }
    }
  }
`;

const UPDATE_SUBCATEGORY = gql`
  mutation updateSubCategory(
    $id: ID!
    $subName: String!
    $slug: String!
    $description: String
    $category: ID
    $publishedAt: DateTime!
  ) {
    updateSubCategory(
      id: $id
      data: {
        subName: $subName
        slug: $slug
        description: $description
        category: $category
        publishedAt: $publishedAt
      }
    ) {
      data {
        id
      }
    }
  }
`;

const GET_CATEGORIES = gql`
  query getCategories {
    categories {
      data {
        id
        attributes {
          name
        }
      }
    }
  }
`;

const EditSubCategoryPage = ({ params }) => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();
    const id = params.id;

    const [subName, setSubName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { loading, error: subCategoryError, data } = useQuery(GET_SUBCATEGORY, {
        variables: { id: id },
        onError: (error) => {
            console.error('Error fetching subcategory:', error);
            setErrorMessage('حدث خطأ أثناء جلب بيانات الفئة الفرعية.');
        },
    });

    const { data: categoriesData } = useQuery(GET_CATEGORIES, {
        onError: (error) => {
            console.error('Error fetching categories:', error);
            setErrorMessage('حدث خطأ أثناء جلب الفئات.');
        },
    });

    const [updateSubCategory, { error: updateError }] = useMutation(UPDATE_SUBCATEGORY, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
        onError: (error) => {
            console.error('Error updating subcategory:', error);
            setErrorMessage('حدث خطأ أثناء تحديث الفئة الفرعية.');
        },
        onCompleted: () => {
            if (!updateError) {
                setSuccessMessage('تم تحديث الفئة الفرعية بنجاح.');
                setTimeout(() => {
                    if (!errorMessage) {
                        router.push(`/dashboard/subcategory`);
                    }
                }, 2000);
            }
        },
    });

    useEffect(() => {
        if (!loading && data) {
            const subCategory = data.subCategory.data.attributes;
            setSubName(subCategory.subName || '');
            setSlug(subCategory.slug || '');
            setDescription(subCategory.description || '');
            setCategoryId(subCategory.category?.data?.id || '');
        }
    }, [loading, data]);

    const handleSubNameChange = (e) => {
        const newSubName = e.target.value;
        setSubName(newSubName);
        setSlug(newSubName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateSubCategory({
                variables: {
                    id,
                    subName,
                    slug,
                    description,
                    category: categoryId,
                    publishedAt: new Date().toISOString()
                },
            });

            setSuccessMessage('تم تحديث ونشر الفئة الفرعية بنجاح.');
            setTimeout(() => {
                if (!errorMessage) {
                    router.push(`/dashboard/subCat`);
                }
            }, 2000);
        } catch (error) {
            console.error(error);
            setErrorMessage('حدث خطأ أثناء تحديث الفئة الفرعية.');
        }
    };

    return (
        <main className="head">
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            <div className="head-title">
                <h3 className="title">تعديل الفئة الفرعية: {subName}</h3>
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
                <div className="form-group">
                    <label>الفئة الرئيسية:</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                    >
                        <option value="">اختر الفئة الرئيسية</option>
                        {categoriesData?.categories.data.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.attributes.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button className="sub-button" type="submit">
                    حفظ  التغييرات
                </button>
            </form>
        </main>
    );
};

export default EditSubCategoryPage;