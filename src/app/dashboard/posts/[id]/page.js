// EditPostPage.js
'use client'
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client'
import gql from 'graphql-tag';
import { FiPlus, FiMinusCircle } from "react-icons/fi";
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const QuillEditor = dynamic(() => import('react-quill'), { ssr: false });

const GET_POST = gql`
  query getPost($id: ID!) {
    post(id: $id) {
      id
      title
      category
      subCategory
      body
      featureImage {
        id
        url
      }
      slug
      tags {
        id
        name
      }
      excerpt
      published
    }
  }
`;

const UPDATE_POST = gql`
  mutation updatePost(
    $id: ID!
    $title: String
    $category: ENUM_POST_CATEGORY
    $subCategory: ENUM_POST_SUBCATEGORY
    $body: String
    $featureImage: ID
    $slug: String
    $tags: [ID]
    $excerpt: String
    $published: Boolean
  ) {
    updatePost(
      input: {
        where: { id: $id }
        data: {
          title: $title
          category: $category
          subCategory: $subCategory
          body: $body
          featureImage: $featureImage
          slug: $slug
          tags: $tags
          excerpt: $excerpt
          published: $published
        }
      }
    ) {
      post {
        id
      }
    }
  }
`;

const EditPostPage = ({ params }) => {

    const id = params.id
    console.log(id);
    const { loading, error, data } = useQuery(GET_POST, {
        variables: { id: id },
    });

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [body, setBody] = useState('');
    const [featureImage, setFeatureImage] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [published, setPublished] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);

    const [updatePost] = useMutation(UPDATE_POST);

    useEffect(() => {
        if (!loading && data) {
            const post = data.post;
            setTitle(post.title);
            setCategory(post.category);
            setBody(post.body);
            setSlug(post.slug);
            setExcerpt(post.excerpt);
            setPublished(post.published);
            setSelectedTags(post.tags);
        }
    }, [loading, data]);

    const handleImageDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        setFeatureImage(file);
        previewImage(file);
    };

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        setFeatureImage(file);
        previewImage(file);
    };

    const previewImage = (file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('files', featureImage);

            const response = await fetch('https://api.ektesad.com/upload', {
                method: 'POST',
                body: formData,
            });

            const res = await response.json();
            const featureImageId = res[0].id;

            await updatePost({
                variables: {
                    id,
                    title,
                    category,
                    subCategory: "items",
                    body,
                    featureImage: featureImageId,
                    slug,
                    tags: selectedTags.map(tag => tag.id),
                    excerpt,
                    published,
                },
            });

            router.push(`/post/${id}`);

        } catch (error) {
            console.error(error);
        }
    };

    const removeTag = (tagId) => {
        setSelectedTags(prevTags => prevTags.filter(tag => tag.id !== tagId));
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">تعديل المقالة</h3>
                </div>
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>الصورة البارزة للمقالة:</label>
                        <div
                            className="drop-area"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleImageDrop}
                        >
                            {imageUrl ? (
                                <img src={imageUrl} alt="Feature" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                            ) : (
                                <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="file"
                                        id="file-input"
                                        style={{ display: 'none' }}
                                        onChange={handleInputChange}
                                        accept="image/*"
                                    />
                                    <FiPlus style={{ fontSize: "50px" }} />
                                    <p>اسحب الملف واسقطة في هذه المساحة او في المتصفح لرفعة</p>
                                </label>
                            )}
                            <input
                                type="file"
                                onChange={handleInputChange}
                                accept="image/*"
                                className="file-input"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>اسم المقالة:</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <div className='slug-andCat'>
                            <div className="form-group">
                                <label>الslug:</label>
                                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>القسم:</label>
                                <select className='select-box' value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="">اختر القسم</option>
                                    <option value="news">أخبار</option>
                                    <option value="event">أحداث</option>
                                    <option value="success">نجاح</option>
                                    <option value="opinion">رأي</option>
                                    <option value="investment">استثمار</option>
                                    <option value="culture">ثقافة</option>
                                    <option value="family">عائلة</option>
                                    <option value="saving">توفير</option>
                                    <option value="economy">اقتصاد</option>
                                    <option value="spending">إنفاق</option>
                                    <option value="banks">بنوك</option>
                                    <option value="jobs">وظائف</option>
                                    <option value="woman">المرأة</option>
                                    <option value="health">صحة</option>
                                    <option value="career">مسار وظيفي</option>
                                    <option value="summary">ملخص</option>
                                    <option value="incomes">الدخل</option>
                                    <option value="ideas">أفكار</option>
                                    <option value="entrepreneurship">ريادة الأعمال</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className='slug-andCat'>
                            <div className='form-group'>
                                <label>حالة المقالة:</label>
                                <div>
                                    <input
                                        type="radio"
                                        id="draft"
                                        name="published"
                                        value="draft"
                                        checked={!published}
                                        onChange={() => setPublished(false)}
                                    />
                                    <label htmlFor="draft">مسودة</label>
                                    <input
                                        type="radio"
                                        id="published"
                                        name="published"
                                        value="published"
                                        checked={published}
                                        onChange={() => setPublished(true)}
                                    />
                                    <label htmlFor="published">نشر</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>مقطف عن المقالة:</label>
                        <input style={{ padding: "25px 10px" }} type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>محتوي المقالة:</label>
                        <QuillEditor
                            value={body}
                            onChange={setBody}
                        />
                    </div>
                    <div className="form-group">
                        <label>الكلمات الدليلية:</label>
                        <div>
                            {selectedTags.map(tag => (
                                <span key={tag.id} className="tag">
                                    {tag.name}
                                    <button type="button" onClick={() => removeTag(tag.id)}>
                                        <FiMinusCircle />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <button className='sub-button' type="submit">حفظ التغييرات</button>
                </form>
            </main>
        </>
    );
};

export default EditPostPage;
