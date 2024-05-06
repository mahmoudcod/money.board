// EditPostPage.js
'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client'
import gql from 'graphql-tag';
import { FiPlus, FiMinus } from "react-icons/fi";
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '@/app/auth';

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

const GetTags = gql`
  query getTags {
    tags {
      id
      name
    }
  }
`;

const UPDATE_POST = gql`
  mutation updatePost(
    $id: ID!
    $title: String!
    $category: ENUM_POST_CATEGORY!
    $subCategory: ENUM_POST_SUBCATEGORY!
    $body: String!
    $featureImage: ID!
    $slug: String!
    $tags: [ID]
    $excerpt: String!
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
    const router = useRouter()
    const { getToken } = useAuth()
    const token = getToken()
    const id = params.id
    const { loading, error, data } = useQuery(GET_POST, {
        variables: { id: id },
    });

    const { loading: loadingTags, data: tagsData } = useQuery(GetTags);


    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [body, setBody] = useState('');
    const [featureImage, setFeatureImage] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [published, setPublished] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);

    const [updatePost] = useMutation(UPDATE_POST, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

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
            setImageUrl(`https://api.ektesad.com/${post.featureImage.url}`)
        }
    }, [loading, data]);

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            [{ align: [] }],
            [{ color: [] }],
            ['code-block'],
            ['clean'],
        ],
    };


    const quillFormats = [
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'list',
        'bullet',
        'link',
        'image',
        'align',
        'color',
        'code-block',
    ];

    const handleEditorChange = (newContent) => {
        setBody(newContent);
    };




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
            let featureImageId = null;

            // Check if there's a new image to upload
            if (featureImage) {
                const formData = new FormData();
                formData.append('files', featureImage);

                const response = await fetch('https://api.ektesad.com/upload', {
                    method: 'POST',
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const res = await response.json();
                featureImageId = res[0].id;
            } else if (imageUrl) {
                // If there's no new image but there's an existing image URL, use its ID
                // Extract the image ID from the URL
                featureImageId = data.post.featureImage.id
            }

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

            router.push(`/dashboard/posts`);

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
                    <h3 className="title">تعديل مقالة: {title}</h3>
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
                                <>
                                    <img src={imageUrl} alt="Feature" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                                </>
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

                        {imageUrl ? (
                            <button type="button" className="delete-image-button" onClick={() => {
                                setFeatureImage(null);
                                setImageUrl('');
                            }}>حذف الصورة</button>
                        ) : ('')}
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
                        <textarea style={{ padding: "25px 10px" }} type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>محتوي المقالة:</label>
                        <QuillEditor
                            value={body}
                            onChange={handleEditorChange}
                            modules={quillModules}
                            formats={quillFormats}
                        />
                    </div>
                    <div className="form-group">
                        <label>الكلمات الدليلية:</label>
                        {loadingTags ? (
                            null
                        ) : (
                            <select className='select-box ' onChange={(e) => {
                                const selectedTagId = e.target.value;
                                const selectedTag = tagsData.tags.find(tag => tag.id === selectedTagId);
                                setSelectedTags(prevTags => [...prevTags, selectedTag]);
                            }}>
                                <option value="">اختر كلمة دليلية</option>
                                {tagsData.tags.map((tag) => (
                                    <option key={tag.id} value={tag.id}>
                                        {tag.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <div>
                            {selectedTags.map(tag => (
                                <span key={tag.id} className="tag">
                                    {tag.name}
                                    <button className='delete-tag-button' type="button" onClick={() => removeTag(tag.id)}>
                                        <FiMinus />
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
