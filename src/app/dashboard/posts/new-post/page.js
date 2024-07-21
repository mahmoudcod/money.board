'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { FiPlus, FiMinus, FiX } from 'react-icons/fi';
import { useAuth } from '@/app/auth';
import { useRouter } from 'next/navigation';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const GET_USERS = gql`
  query getUsers {
    usersPermissionsUsers {
      data {
        id
        attributes {
          username
        }
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
          slug
          sub_categories {
            data {
              id
              attributes {
                subName
                slug
              }
            }
          }
        }
      }
    }
  }
`;

const GET_TAGS = gql`
  query getTags {
    tags {
      data {
        id
        attributes {
          name
        }
      }
    }
  }
`;

const ADD_POST = gql`
  mutation createBlog(
    $title: String!
    $categories: [ID]!
    $blog: String!
    $cover: ID
    $slug: String!
    $tags: [ID]
    $users_permissions_user: ID
    $description: String!
  ) {
    createBlog(
      data: {
        title: $title
        categories: $categories
        blog: $blog
        cover: $cover
        slug: $slug
        tags: $tags
        users_permissions_user: $users_permissions_user
        description: $description
      }
    ) {
      data {
        id
        attributes {
          title
          categories {
            data {
              id
              attributes {
                name
              }
            }
          }
          blog
          cover {
            data {
              id
              attributes {
                url
              }
            }
          }
          slug
          tags {
            data {
              id
              attributes {
                name
              }
            }
          }
          users_permissions_user {
            data {
              id
              attributes {
                username
              }
            }
          }
          description
          createdAt
          updatedAt
        }
      }
    }
  }
`;

const GET_UPLOADED_FILES = gql`
  query GetUploadedFiles($limit: Int, $start: Int) {
    uploadFiles(
      pagination: { limit: $limit, start: $start }
      sort: ["createdAt:desc"]
    ) {
      data {
        id
        attributes {
          name
          url
        }
      }
      meta {
        pagination {
          total
        }
      }
    }
  }
`;

const AddPost = () => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();

    const { loading: loadingUsers, data: userData, error: usersError } = useQuery(GET_USERS);
    const { loading: loadingTags, data: tagsData, error: tagsError } = useQuery(GET_TAGS);
    const { loading: loadingCategories, data: categoriesData, error: categoriesError } = useQuery(GET_CATEGORIES);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [featureImage, setFeatureImage] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [published, setPublished] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [addPostError, setAddPostError] = useState(null);
    const [addPostSuccess, setAddPostSuccess] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const dropdownRef = useRef(null);

    const [showImageLibrary, setShowImageLibrary] = useState(false);
    const [libraryImages, setLibraryImages] = useState([]);
    const [libraryPage, setLibraryPage] = useState(0);
    const [hasMoreImages, setHasMoreImages] = useState(true);
    const [selectedLibraryImage, setSelectedLibraryImage] = useState(null);

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

    const { data: libraryData, fetchMore } = useQuery(GET_UPLOADED_FILES, {
        variables: { limit: 20, start: 0 },
        onCompleted: (data) => {
            setLibraryImages(data.uploadFiles.data);
            setHasMoreImages(data.uploadFiles.data.length < data.uploadFiles.meta.pagination.total);
        },
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleCategorySelect = (categoryId, subcategoryId = null) => {
        setSelectedCategories(prev => {
            const newSelection = { categoryId, subcategoryId };
            const exists = prev.some(item =>
                item.categoryId === categoryId && item.subcategoryId === subcategoryId
            );

            if (exists) {
                return prev.filter(item =>
                    !(item.categoryId === categoryId && item.subcategoryId === subcategoryId)
                );
            } else {
                return [...prev, newSelection];
            }
        });
    };

    const removeSelection = (categoryId, subcategoryId = null) => {
        setSelectedCategories(prev =>
            prev.filter(item =>
                !(item.categoryId === categoryId && item.subcategoryId === subcategoryId)
            )
        );
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

    const handleSelectFromLibrary = (imageUrl, imageId) => {
        setImageUrl(imageUrl);
        setSelectedLibraryImage(imageId);
        setShowImageLibrary(false);
    };

    const loadMoreImages = () => {
        const nextPage = libraryPage + 1;
        fetchMore({
            variables: {
                start: nextPage * 20,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;
                setLibraryImages([...libraryImages, ...fetchMoreResult.uploadFiles.data]);
                setHasMoreImages(fetchMoreResult.uploadFiles.data.length === 20);
                setLibraryPage(nextPage);
                return {
                    uploadFiles: {
                        ...fetchMoreResult.uploadFiles,
                        data: [...prev.uploadFiles.data, ...fetchMoreResult.uploadFiles.data],
                    },
                };
            },
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let featureImageId = null;
            if (featureImage) {
                const formData = new FormData();
                formData.append('files', featureImage);

                const response = await fetch('https://money-api.ektesad.com/api/upload', {
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
                featureImageId = res[0]?.id;
            } else if (selectedLibraryImage) {
                featureImageId = selectedLibraryImage;
            }

            const formattedCategories = selectedCategories.map(item => item.categoryId);

            await addPost({
                variables: {
                    title,
                    categories: formattedCategories,
                    blog: body,
                    cover: featureImageId,
                    slug,
                    tags: selectedTags.map((tag) => tag.id),
                    users_permissions_user: selectedUser,
                    description: excerpt,
                },
            });
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
                    {/* Feature Image */}
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
                        </div>
                        <button className='addButton mar' type="button" onClick={() => setShowImageLibrary(true)}>
                            اختر من المكتبة
                        </button>
                    </div>
                    {/* Title */}
                    <div className="form-group">
                        <label>اسم المقالة:</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    {/* Slug */}
                    <div className="form-group">
                        <label>الslug:</label>
                        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                    </div>
                    {/* Categories */}
                    <div className="form-group">
                        <label>الأقسام:</label>
                        {loadingCategories ? (
                            <p>جاري تحميل الأقسام...</p>
                        ) : categoriesError ? (
                            <p>خطأ في جلب الأقسام: {categoriesError.message}</p>
                        ) : (
                            <div>
                                <div ref={dropdownRef} style={{ position: 'relative' }}>
                                    <div
                                        className="custom-select"
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        style={{
                                            border: '1px solid #ccc',
                                            padding: '10px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        اختر الأقسام
                                    </div>
                                    {showDropdown && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                backgroundColor: 'white',
                                                border: '1px solid #ccc',
                                                zIndex: 1000,
                                                maxHeight: '300px',
                                                overflowY: 'auto'
                                            }}
                                        >
                                            {categoriesData.categories.data.map((cat) => (
                                                <div
                                                    key={cat.id}
                                                    onMouseEnter={() => setHoveredCategory(cat.id)}
                                                    onMouseLeave={() => setHoveredCategory(null)}
                                                    style={{
                                                        padding: '10px',
                                                        cursor: 'pointer',
                                                        backgroundColor: hoveredCategory === cat.id ? '#f0f0f0' : 'white'
                                                    }}
                                                >
                                                    <div
                                                        onClick={() => handleCategorySelect(cat.id)}
                                                        style={{
                                                            fontWeight: selectedCategories.some(item => item.categoryId === cat.id && !item.subcategoryId) ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        {cat.attributes.name}
                                                    </div>
                                                    {(hoveredCategory === cat.id || selectedCategories.some(item => item.categoryId === cat.id)) &&
                                                        cat.attributes.sub_categories.data.length > 0 && (
                                                            <div style={{ marginLeft: '20px', fontSize: '0.9em', color: '#666' }}>
                                                                {cat.attributes.sub_categories.data.map(subcat => (
                                                                    <div
                                                                        key={subcat.id}
                                                                        onClick={() => handleCategorySelect(cat.id, subcat.id)}
                                                                        style={{
                                                                            fontWeight: selectedCategories.some(item => item.categoryId === cat.id && item.subcategoryId === subcat.id) ? 'bold' : 'normal'
                                                                        }}
                                                                    >
                                                                        {subcat.attributes.subName}</div>
                                                                ))}
                                                            </div>
                                                        )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    {selectedCategories.map((item, index) => {
                                        const category = categoriesData.categories.data.find(cat => cat.id === item.categoryId);
                                        const subcategory = item.subcategoryId
                                            ? category.attributes.sub_categories.data.find(subcat => subcat.id === item.subcategoryId)
                                            : null;
                                        return (
                                            <span
                                                key={index}
                                                style={{
                                                    backgroundColor: '#e0e0e0',
                                                    padding: '5px 10px',
                                                    margin: '0 5px 5px 0',
                                                    borderRadius: '15px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {category.attributes.name}
                                                {subcategory && ` > ${subcategory.attributes.subName}`}
                                                <FiX
                                                    onClick={() => removeSelection(item.categoryId, item.subcategoryId)}
                                                    style={{ marginLeft: '5px', cursor: 'pointer' }}
                                                />
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Author */}
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
                                required
                            >
                                <option value="">اختر كاتب</option>
                                {userData.usersPermissionsUsers.data.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.attributes.username}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    {/* Excerpt */}
                    <div className="form-group">
                        <label>مقتطف عن المقالة:</label>
                        <textarea
                            style={{ padding: '25px 10px' }}
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            required
                        />
                    </div>
                    {/* Body */}
                    <div className="form-group">
                        <label>محتوى المقالة:</label>
                        <MdEditor
                            value={body}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={handleEditorChange}
                        />
                    </div>
                    {/* Tags */}
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
                                    const selectedTag = tagsData.tags.data.find((tag) => tag.id === selectedTagId);
                                    if (selectedTag && !selectedTags.some(tag => tag.id === selectedTag.id)) {
                                        setSelectedTags((prevTags) => [...prevTags, selectedTag]);
                                    }
                                }}
                            >
                                <option value="">اختر كلمة دليلية</option>
                                {tagsData.tags.data.map((tag) => (
                                    <option key={tag.id} value={tag.id}>
                                        {tag.attributes.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {selectedTags.length > 0 && (
                            <div>
                                {selectedTags.map((tag) => (
                                    <span className='tag' key={tag.id}>
                                        {tag.attributes.name}
                                        <button className='delete-tag-button' type="button" onClick={() => removeTag(tag.id)}>
                                            <FiMinus />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="sub-button" type="submit">
                        اضافة
                    </button>
                </form>
                {addPostError && (
                    <p className="error-message">حدث خطأ أثناء إضافة المقالة: {addPostError}</p>
                )}
                {addPostSuccess && <p className="success-message">{addPostSuccess}</p>}
            </main>

            {showImageLibrary && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>اختر صورة من المكتبة</h2>
                        <div className="image-grid">
                            {libraryImages.map((file) => (
                                <img
                                    key={file.id}
                                    src={file.attributes.url}
                                    alt={file.attributes.name}
                                    onClick={() => handleSelectFromLibrary(file.attributes.url, file.id)}
                                    style={{ width: '100px', height: '100px', objectFit: 'cover', cursor: 'pointer' }}
                                />
                            ))}
                        </div>
                        {hasMoreImages && (
                            <button className='addButton mar' onClick={loadMoreImages}>تحميل المزيد من الصور</button>
                        )}
                        <button className='addButton mar' onClick={() => setShowImageLibrary(false)}>إغلاق</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddPost;