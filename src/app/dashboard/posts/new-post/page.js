'use client'

import React, { useState, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { FiPlus, FiMinusCircle } from "react-icons/fi"; // Import FiMinusCircle icon
import { useAuth } from '@/app/auth';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';


const GetUsers = gql`
  query getUsers {
    users {
      id
      username
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

const ADD_POST = gql`
  mutation createPost(
    $title: String!
    $category: ENUM_POST_CATEGORY!
    $subCategory: ENUM_POST_SUBCATEGORY!
    $body: String!
    $featureImage: ID! 
    $slug: String!
    $tags: [ID]
    $user: ID
    $excerpt: String!
    $published: Boolean
  ) {
    createPost(
      input: {
        data: {
          title: $title
          category: $category
          subCategory: $subCategory
          body: $body
          featureImage: $featureImage
          slug: $slug
          tags: $tags
          user: $user
          excerpt: $excerpt
          published: $published
        }
      }
    ) {
      post {
        id
        title
        category
        body
        featureImage {
          id
          url 
          createdAt
        }
        slug
        tags {
          id
          name
        }
        user {
          id
          username
        }
        excerpt
        published
        createdAt
        updatedAt
      }
    }
  }
`;
const QuillEditor = dynamic(() => import('react-quill'), { ssr: false });

const AddPost = () => {

    const { getToken } = useAuth();
    const token = getToken();

    const { loading: loadingUsers, data: userData } = useQuery(GetUsers);
    const { loading: loadingTags, data: tagsData } = useQuery(GetTags);
    const fileInputRef = useRef(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [body, setBody] = useState('');
    const [featureImage, setFeatureImage] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [published, setPublished] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');

    const [addPost] = useMutation(ADD_POST, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

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
                headers: {
                    authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const res = await response.json();
            const id = res[0].id;

            await addPost({
                variables: {
                    title,
                    category,
                    subCategory: "items",
                    body,
                    featureImage: id,
                    slug,
                    tags: selectedTags.map(tag => tag.id),
                    user: selectedUser,
                    excerpt,
                    published,
                },
            });

        } catch (error) {
            console.error(error);
        }
    };

    const removeTag = (tagId) => {
        setSelectedTags(prevTags => prevTags.filter(tag => tag.id !== tagId));
    };

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


    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">اضافة مقالة</h3>
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
                            <div className='form-group'>
                                <label>الكاتب:</label>
                                {loadingUsers ? (
                                    null
                                ) : (
                                    <select className='select-box' value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                                        <option value=""> اختر كاتب</option>
                                        {userData.users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.username}
                                            </option>
                                        ))}
                                    </select>
                                )}
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
                        {selectedTags.length > 0 && (
                            <div>
                                <p>الكلمات الدليلية المختارة:</p>
                                <ul>
                                    {selectedTags.map(tag => (
                                        <li key={tag.id}>
                                            {tag.name}
                                            <button type="button" onClick={() => removeTag(tag.id)}>
                                                <FiMinusCircle />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <button className='sub-button' type="submit">اضافة</button>
                </form>
            </main>
        </>
    );
};

export default AddPost;
