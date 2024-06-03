'use client'
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { useAuth } from '@/app/auth';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

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
    $featureImage: ID
    $slug: String!
    $tags: [ID]
    $user: ID
    $excerpt: String!
    $published: Boolean
    $publishDate: DateTime!
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
          publishDate: $publishDate
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
        publishDate
      }
    }
  }
`;

const AddPost = () => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();

    const { loading: loadingUsers, data: userData, error: usersError } = useQuery(GetUsers);
    const { loading: loadingTags, data: tagsData, error: tagsError } = useQuery(GetTags);
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
    const [publishDate, setPublishDate] = useState('');
    const [addPostError, setAddPostError] = useState(null);
    const [addPostSuccess, setAddPostSuccess] = useState(null);

    const [addPost] = useMutation(ADD_POST, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
        onError(error) {
            setAddPostError(error.message);
            setAddPostSuccess(null);
        },
        onCompleted() {
            setAddPostSuccess('تم إضافة المقالة بنجاح!');
            setTimeout(() => {
                router.push('/dashboard/posts');
            }, 3000);
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
            if (featureImage) {
                formData.append('files', featureImage);

                const response = await fetch('https://api.ektesad.com/upload', {
                    method: 'POST',
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Failed to upload image');
                }

                const res = await response.json();
                const id = res[0]?.id;

                await addPost({
                    variables: {
                        title,
                        category,
                        subCategory: 'items',
                        body,
                        featureImage: id,
                        slug,
                        tags: selectedTags.map((tag) => tag.id),
                        user: selectedUser,
                        excerpt,
                        published,
                        publishDate,
                    },
                });
            } else {
                await addPost({
                    variables: {
                        title,
                        category,
                        subCategory: 'items',
                        body,
                        featureImage: null,
                        slug,
                        tags: selectedTags.map((tag) => tag.id),
                        user: selectedUser,
                        excerpt,
                        published,
                        publishDate,
                    },
                });
            }
        } catch (error) {
            setAddPostError(error.message);
            setAddPostSuccess(null);
        }
    };

    const removeTag = (tagId) => {
        setSelectedTags((prevTags) => prevTags.filter((tag) => tag.id !== tagId));
    };

    const handleEditorChange = ({ text }) => {
        setBody(text);
    };

    useEffect(() => {
        if (addPostError) {
            const timer = setTimeout(() => {
                setAddPostError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [addPostError]);

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
                                    <FiPlus style={{ fontSize: '50px' }} />
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
                        <div className="slug-andCat">
                            <div className="form-group">
                                <label>الslug:</label>
                                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>القسم:</label>
                                <select
                                    className="select-box"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
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
                        <div className="slug-andCat">
                            <div className="form-group">
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
                            <div className="form-group">
                                <label>الكاتب:</label>
                                {loadingUsers ? (
                                    null
                                ) : usersError ? (
                                    <p>خطأ في جلب البيانات: {usersError.message}</p>
                                ) : (
                                    <select
                                        className="select-box"
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                    >
                                        <option value="">اختر كاتب</option>
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
                        <textarea
                            style={{ padding: '25px 10px' }}
                            type="text"
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>محتوي المقالة:</label>
                        <MdEditor
                            value={body}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={handleEditorChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>الكلمات الدليلية:</label>
                        {loadingTags ? (
                            null
                        ) : tagsError ? (
                            <p>خطأ في جلب البيانات: {tagsError.message}</p>
                        ) : (
                            <select
                                className="select-box"
                                onChange={(e) => {
                                    const selectedTagId = e.target.value;
                                    const selectedTag = tagsData.tags.find((tag) => tag.id === selectedTagId);
                                    setSelectedTags((prevTags) => [...prevTags, selectedTag]);
                                }}
                            >
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

                                {selectedTags.map((tag) => (
                                    <span className='tag' key={tag.id}>
                                        {tag.name}
                                        <button className='delete-tag-button' type="button" onClick={() => removeTag(tag.id)}>
                                            <FiMinus />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* <div className="form-group">
                        <label>تاريخ ووقت النشر:</label>
                        <input
                            type="datetime-local"
                            value={publishDate}
                            onChange={(e) => setPublishDate(e.target.value)}
                        />
                    </div> */}
                    <button className="sub-button" type="submit">
                        اضافة
                    </button>
                </form>
                {addPostError && (
                    <p className="error-message">حدث خطأ أثناء إضافة المقالة: {addPostError}</p>
                )}
                {addPostSuccess && <p className="success-message">{addPostSuccess}</p>}
            </main>
        </>
    );
};

export default AddPost;
