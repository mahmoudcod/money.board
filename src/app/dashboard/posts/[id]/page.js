'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { FiPlus, FiMinus, FiX } from 'react-icons/fi';
import { useAuth } from '@/app/auth';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const GET_POST = gql`
  query getBlog($id: ID!) {
    blog(id: $id) {
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
          description
          publishedAt
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

const UPDATE_POST = gql`
  mutation updateBlog(
    $id: ID!
    $title: String!
    $categories: [ID]!
    $blog: String!
    $cover: ID
    $slug: String!
    $tags: [ID]
    $description: String!
    $publishedAt: DateTime
  ) {
    updateBlog(id: $id, data: {
      title: $title
      categories: $categories
      blog: $blog
      cover: $cover
      slug: $slug
      tags: $tags
      description: $description
      publishedAt: $publishedAt
    }) {
      data {
        id
        attributes {
          title
          slug
          description
          publishedAt
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
const EditPostPage = ({ params }) => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();
    const id = params.id;

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [featureImage, setFeatureImage] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [published, setPublished] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const dropdownRef = useRef(null);

    const [showImageLibrary, setShowImageLibrary] = useState(false);
    const [libraryImages, setLibraryImages] = useState([]);
    const [libraryPage, setLibraryPage] = useState(0);
    const [hasMoreImages, setHasMoreImages] = useState(true);
    const [selectedLibraryImage, setSelectedLibraryImage] = useState(null);

    const [slugError, setSlugError] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [isCurrentlyScheduled, setIsCurrentlyScheduled] = useState(false);
    const [publishMode, setPublishMode] = useState('immediate');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    const [publisherAction, setPublisherAction] = useState(null);

    const { loading, error: postError, data } = useQuery(GET_POST, {
        variables: { id: id },
        onError: (error) => {
            console.error('Error fetching post:', error);
        },
    });

    const { loading: loadingCategories, data: categoriesData, error: categoriesError } = useQuery(GET_CATEGORIES);
    const { loading: loadingTags, data: tagsData } = useQuery(GET_TAGS);

    const [updatePost, { error: updateError }] = useMutation(UPDATE_POST, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
        onError: (error) => {
            console.error('Error updating post:', error);
        },
        onCompleted: () => {
            if (!updateError) {
                setSuccessMessage('تم تحديث المقالة بنجاح.');
                setTimeout(() => {
                    if (!errorMessage) {
                        router.push(`/dashboard/posts`);
                    }
                }, 2000);
            }
        },
    });

    const [createTag] = useMutation(ADD_TAG, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
        onError(error) {
            setErrorMessage(`Error creating tag: ${error.message}`);
        },
    });

    const { data: libraryData, fetchMore } = useQuery(GET_UPLOADED_FILES, {
        variables: { limit: 20, start: 0 },
        onCompleted: (data) => {
            setLibraryImages(data.uploadFiles.data);
            setHasMoreImages(data.uploadFiles.data.length < data.uploadFiles.meta.pagination.total);
        },
    });
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\p{L}\p{N}-]/gu, '')
            .replace(/-+/g, '-')
            .trim();
    };

    useEffect(() => {
        if (!loading && data && data.blog && data.blog.data) {
            const post = data.blog.data.attributes;
            setTitle(post.title || '');
            setBody(post.blog || '');
            setSlug(post.slug || '');
            setExcerpt(post.description || '');
            setPublished(!!post.publishedAt);
            setSelectedTags(post.tags?.data || []);
            setSelectedCategories(post.categories?.data?.map(cat => ({
                categoryId: cat.id,
                subcategoryId: null
            })) || []);
            if (post.cover && post.cover.data) {
                setImageUrl(post.cover.data.attributes.url);
            }

            if (post.publishedAt) {
                const publishDate = new Date(post.publishedAt);
                if (publishDate > new Date()) {
                    setPublishMode('scheduled');
                    setScheduleDate(publishDate.toISOString().split('T')[0]);
                    setScheduleTime(publishDate.toTimeString().slice(0, 5));
                    setIsCurrentlyScheduled(true);
                } else {
                    setPublishMode('immediate');
                }
            } else {
                setPublishMode('draft');
            }
        }
    }, [loading, data]);

    useEffect(() => {
        const generatedSlug = title.trim().replace(/\s+/g, '-');
        setSlug(generatedSlug);
    }, [title]);

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

    useEffect(() => {
        if (id) {
            fetchPublisherAction();
        }
    }, [id]);

    const fetchPublisherAction = async () => {
        try {
            const response = await fetch(`https://money-api.ektesad.com/api/publisher/actions?filters[entityId]=${id}&filters[entitySlug]=api::blog.blog`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch publisher action');
            }

            const data = await response.json();
            if (data && data.data && data.data.length > 0) {
                setPublisherAction(data.data[0]);
                const scheduledDate = new Date(data.data[0].attributes.executeAt);
                setScheduleDate(scheduledDate.toISOString().split('T')[0]);
                setScheduleTime(scheduledDate.toTimeString().slice(0, 5));
                setIsCurrentlyScheduled(true);
                setPublishMode('scheduled');
            }
        } catch (error) {
            console.error('Error fetching publisher action:', error);
            setErrorMessage('Failed to fetch scheduling information.');
        }
    };

    const handleEditorChange = ({ text }) => {
        setBody(text);
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

    const handleSchedulePost = async (postId, scheduledDateTime) => {
        try {
            const publisherActionData = {
                data: {
                    executeAt: scheduledDateTime.toISOString(),
                    mode: 'publish',
                    entityId: parseInt(postId),
                    entitySlug: "api::blog.blog"
                }
            };

            let response;
            if (publisherAction) {
                // Update existing publisher action
                response = await fetch(`https://money-api.ektesad.com/api/publisher/actions/${publisherAction.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(publisherActionData),
                });
            } else {
                // Create new publisher action
                response = await fetch('https://money-api.ektesad.com/api/publisher/actions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(publisherActionData),
                });
            }

            if (!response.ok) {
                throw new Error('Failed to schedule post');
            }

            const result = await response.json();
            setPublisherAction(result.data);
            return result;
        } catch (error) {
            console.error('Error scheduling post:', error);
            throw error;
        }
    };

    const cancelScheduledPost = async () => {
        try {
            if (!publisherAction) {
                throw new Error('No scheduled action found');
            }

            const response = await fetch(`https://money-api.ektesad.com/api/publisher/actions/${publisherAction.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to cancel scheduled post');
            }

            setIsCurrentlyScheduled(false);
            setPublishMode('draft');
            setPublisherAction(null);
            setSuccessMessage('تم إلغاء جدولة النشر بنجاح.');
        } catch (error) {
            console.error('Error cancelling scheduled post:', error);
            setErrorMessage('فشل في إلغاء جدولة النشر.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let coverData = null;

            if (featureImage) {
                // New image selected, upload it
                const formData = new FormData();
                formData.append('files', featureImage);

                const response = await fetch('https://money-api.ektesad.com/api/upload', {
                    method: 'POST',
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const res = await response.json();
                coverData = res[0].id;
            } else if (selectedLibraryImage) {
                // Image selected from library
                coverData = selectedLibraryImage;
            } else if (imageUrl && !imageUrl.startsWith('data:')) {
                // Existing image, keep it as is
                coverData = data.blog.data.attributes.cover.data.id;
            }

            const formattedCategories = selectedCategories.map(item => item.categoryId);

            let publishedAt = null;
            if (publishMode === 'immediate') {
                publishedAt = new Date().toISOString();
            } else if (publishMode === 'scheduled') {
                // For scheduled posts, set publishedAt to null
                publishedAt = null;
            }

            const updateVariables = {
                id,
                title,
                categories: formattedCategories,
                blog: body,
                cover: coverData,
                slug,
                tags: selectedTags.map((tag) => tag.id),
                description: excerpt,
                publishedAt: publishedAt,
            };

            console.log('Sending update with variables:', updateVariables);

            const { data: postData } = await updatePost({
                variables: updateVariables,
            });

            if (publishMode === 'scheduled') {
                const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
                await handleSchedulePost(id, scheduledDateTime);
                setSuccessMessage('تم تحديث المقالة وجدولة نشرها بنجاح!');
                setIsCurrentlyScheduled(true);
            } else if (publishMode === 'immediate') {
                if (isCurrentlyScheduled) {
                    await cancelScheduledPost();
                }
                setSuccessMessage('تم نشر المقالة بنجاح!');
            } else {
                if (isCurrentlyScheduled) {
                    await cancelScheduledPost();
                }
                setSuccessMessage('تم حفظ المقالة كمسودة بنجاح!');
            }

            // Update local state with the returned data
            if (postData && postData.updateBlog && postData.updateBlog.data) {
                const updatedPost = postData.updateBlog.data.attributes;
                setTitle(updatedPost.title);
                setBody(updatedPost.blog);
                setSlug(updatedPost.slug);
                setExcerpt(updatedPost.description);
                setPublished(!!updatedPost.publishedAt);
                setSelectedTags(updatedPost.tags.data || []);
                setSelectedCategories(updatedPost.categories.data.map(cat => ({
                    categoryId: cat.id,
                    subcategoryId: null
                })) || []);
                if (updatedPost.cover && updatedPost.cover.data) {
                    setImageUrl(updatedPost.cover.data.attributes.url);
                }
            }

            setTimeout(() => {
                if (!errorMessage) {
                    router.push(`/dashboard/posts`);
                }
            }, 2000);
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };
    const removeTag = (tagId) => {
        setSelectedTags((prevTags) => prevTags.filter((tag) => tag.id !== tagId));
    };

    const handleSlugChange = (e) => {
        const newSlug = e.target.value;
        setSlug(newSlug);
        if (/[^\p{L}\p{N}\-_.~]/u.test(newSlug)) {
            setSlugError('Slug can only contain letters, numbers, hyphens, underscores, periods, and tildes');
        } else {
            setSlugError('');
        }
    };

    const handleTagInputChange = (e) => {
        const input = e.target.value;
        setTagInput(input);

        if (input.length >= 1) {
            const suggestions = tagsData.tags.data.filter(tag =>
                tag.attributes.name.toLowerCase().includes(input.toLowerCase())
            );
            setTagSuggestions(suggestions);
        } else {
            setTagSuggestions([]);
        }
    };

    const addTag = async (tag) => {
        if (!selectedTags.some(t => t.id === tag.id)) {
            setSelectedTags([...selectedTags, tag]);
        }
        setTagInput('');
        setTagSuggestions([]);
    };

    const createNewTag = async () => {
        try {
            const slug = generateSlug(tagInput);
            const { data } = await createTag({
                variables: {
                    name: tagInput,
                    slug: slug,
                    publishedAt: new Date().toISOString()
                }
            });
            if (data && data.createTag && data.createTag.data) {
                const newTag = {
                    id: data.createTag.data.id,
                    attributes: {
                        name: data.createTag.data.attributes.name,
                        slug: data.createTag.data.attributes.slug
                    }
                };
                addTag(newTag);
            } else {
                throw new Error('Failed to create tag');
            }
        } catch (error) {
            setErrorMessage(`Error creating tag: ${error.message}`);
        }
    };
    // Modify the MdEditor configuration to hide the preview
    const editorConfig = {
        view: {
            menu: true,
            md: true,
            html: false  // This hides the preview
        }
    };

    return (
        <>
            <main className="head">
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
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
                        {imageUrl && (
                            <button
                                type="button"
                                className="delete-image-button"
                                onClick={() => {
                                    setFeatureImage(null);
                                    setImageUrl('');
                                    setSelectedLibraryImage(null);
                                }}
                            >
                                حذف الصورة
                            </button>
                        )}
                        <button className='addButton mar' type="button" onClick={() => setShowImageLibrary(true)}>
                            اختر من المكتبة
                        </button>
                    </div>
                    <div className="form-group">
                        <label>اسم المقالة:</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>الslug:</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={handleSlugChange}
                            placeholder="يمكن استخدام الأحرف العربية هنا"
                            required
                        />
                        {slugError && <p className="error-message">{slugError}</p>}
                    </div>
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
                                                                        {subcat.attributes.subName}
                                                                    </div>
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
                    <div className="form-group">
                        <label>وضع النشر:</label>
                        <select
                            value={publishMode}
                            onChange={(e) => setPublishMode(e.target.value)}
                            className="select-box"
                        >
                            <option value="draft">مسودة</option>
                            <option value="immediate">نشر فوري</option>
                            <option value="scheduled">جدولة النشر</option>
                        </select>
                        {isCurrentlyScheduled && (
                            <button type="button" onClick={cancelScheduledPost} className="cancel-schedule-button">
                                إلغاء الجدولة
                            </button>
                        )}
                    </div>

                    {publishMode === 'scheduled' && (
                        <div className="form-group">
                            <label>تاريخ ووقت النشر:</label>
                            <input
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                required
                            />
                            <input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>مقتطف عن المقالة:</label>
                        <textarea
                            style={{ padding: '25px 10px' }}
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>محتوى المقالة:</label>
                        <MdEditor
                            value={body}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={handleEditorChange}
                            config={editorConfig}
                        />
                    </div>
                    <div className="form-group">
                        <label>الكلمات الدليلية:</label>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={handleTagInputChange}
                            placeholder="ابحث عن كلمة دليلية أو أضف جديدة"
                        />
                        {tagSuggestions.length > 0 && (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {tagSuggestions.map(tag => (
                                    <li
                                        key={tag.id}
                                        onClick={() => addTag(tag)}
                                        style={{ cursor: 'pointer', padding: '5px', backgroundColor: '#f0f0f0', margin: '2px 0' }}
                                    >
                                        {tag.attributes.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {tagInput && !tagSuggestions.length && (
                            <button type="button" onClick={createNewTag}>إنشاء كلمة دليلية جديدة: {tagInput}</button>
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
                        حفظ التغييرات
                    </button>
                </form>
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

export default EditPostPage;