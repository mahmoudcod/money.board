'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { FiMinus } from 'react-icons/fi';
import { useAuth } from '@/app/auth';

const GET_CATEGORY = gql`
  query getCategory($id: ID!) {
    category(id: $id) {
      data {
        id
        attributes {
          name
          slug
          description
          isShow
          publishedAt
          icon {
            data {
              attributes {
                url
              }
            }
          }
          sub_categories {
            data {
              id
              attributes {
                subName
              }
            }
          }
        }
      }
    }
  }
`;

const UPDATE_CATEGORY = gql`
  mutation updateCategory(
    $id: ID!
    $name: String!
    $slug: String!
    $icon: ID
    $sub_categories: [ID]
    $isShow: Boolean!
    $description: String
    $publishedAt: DateTime
  ) {
    updateCategory(
      id: $id
      data: {
        name: $name
        slug: $slug
        icon: $icon
        sub_categories: $sub_categories
        isShow: $isShow
        description: $description
        publishedAt: $publishedAt
      }
    ) {
      data {
        id
      }
    }
  }
`;

const GET_ALL_SUBCATEGORIES = gql`
  query getAllSubCategories {
    subCategories {
      data {
        id
        attributes {
          subName
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

const EditCategoryPage = ({ params }) => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();
    const id = params.id;

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [icon, setIcon] = useState(null);
    const [iconUrl, setIconUrl] = useState('');
    const [subCategories, setSubCategories] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]);
    const [isShow, setIsShow] = useState(true);
    const [description, setDescription] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [showImageLibrary, setShowImageLibrary] = useState(false);
    const [libraryImages, setLibraryImages] = useState([]);
    const [libraryPage, setLibraryPage] = useState(0);
    const [hasMoreImages, setHasMoreImages] = useState(true);
    const [selectedLibraryImage, setSelectedLibraryImage] = useState(null);

    const { loading, error: categoryError, data } = useQuery(GET_CATEGORY, {
        variables: { id: id },
        onError: (error) => {
            console.error('Error fetching category:', error);
            setErrorMessage('حدث خطأ أثناء جلب بيانات الفئة.');
        },
    });

    const { data: subCategoriesData } = useQuery(GET_ALL_SUBCATEGORIES, {
        onError: (error) => {
            console.error('Error fetching subcategories:', error);
            setErrorMessage('حدث خطأ أثناء جلب الفئات الفرعية.');
        },
    });

    const { data: libraryData, fetchMore } = useQuery(GET_UPLOADED_FILES, {
        variables: { limit: 20, start: 0 },
        onCompleted: (data) => {
            setLibraryImages(data.uploadFiles.data);
            setHasMoreImages(data.uploadFiles.data.length < data.uploadFiles.meta.pagination.total);
        },
    });

    const [updateCategory, { error: updateError }] = useMutation(UPDATE_CATEGORY, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
        onError: (error) => {
            console.error('Error updating category:', error);
            setErrorMessage('حدث خطأ أثناء تحديث الفئة.');
        },
        onCompleted: () => {
            if (!updateError) {
                setSuccessMessage('تم تحديث الفئة بنجاح.');
                setTimeout(() => {
                    if (!errorMessage) {
                        router.push(`/dashboard/category`);
                    }
                }, 2000);
            }
        },
    });

    useEffect(() => {
        if (!loading && data) {
            const category = data.category.data.attributes;
            setName(category.name || '');
            setSlug(category.slug || '');
            setSubCategories(category.sub_categories.data || []);
            setIsShow(category.isShow);
            setDescription(category.description || '');
            setIsPublished(!!category.publishedAt);
            if (category.icon && category.icon.data) {
                setIconUrl(`${category.icon.data.attributes.url}`);
            }
        }
    }, [loading, data]);

    useEffect(() => {
        if (subCategoriesData) {
            setAllSubCategories(subCategoriesData.subCategories.data);
        }
    }, [subCategoriesData]);

    const handleIconDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        setIcon(file);
        previewIcon(file);
    };

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        setIcon(file);
        previewIcon(file);
    };

    const previewIcon = (file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setIconUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubCategoryChange = (e) => {
        const selectedId = e.target.value;
        if (selectedId) {
            const subCategoryToAdd = allSubCategories.find(subCat => subCat.id === selectedId);
            if (subCategoryToAdd && !subCategories.some(subCat => subCat.id === subCategoryToAdd.id)) {
                setSubCategories([...subCategories, subCategoryToAdd]);
            }
        }
    };

    const removeSubCategory = (id) => {
        setSubCategories(subCategories.filter(subCat => subCat.id !== id));
    };

    const handleNameChange = (e) => {
        const newName = e.target.value;
        setName(newName);
        setSlug(newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    };

    const handleSelectFromLibrary = (imageUrl, imageId) => {
        setIconUrl(imageUrl);
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
            let iconId = null;

            if (icon) {
                const formData = new FormData();
                formData.append('files', icon);

                const response = await fetch('https://money-api.ektesad.com/api/upload', {
                    method: 'POST',
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const res = await response.json();
                iconId = res[0].id;
            } else if (selectedLibraryImage) {
                iconId = selectedLibraryImage;
            } else if (iconUrl) {
                const iconIdMatch = iconUrl.match(/\/(\d+)\/?$/);
                iconId = iconIdMatch ? iconIdMatch[1] : null;

                if (!iconId && iconUrl.startsWith('http')) {
                    iconId = undefined;
                }
            }

            const updateVariables = {
                id,
                name,
                slug,
                sub_categories: subCategories.map(subCat => subCat.id),
                isShow,
                description,
                publishedAt: isPublished ? new Date().toISOString() : null,
            };

            if (iconId !== undefined) {
                updateVariables.icon = iconId;
            }

            await updateCategory({
                variables: updateVariables,
            });

            setSuccessMessage('تم تحديث الفئة بنجاح.');
            setTimeout(() => {
                if (!errorMessage) {
                    router.push(`/dashboard/category`);
                }
            }, 2000);
        } catch (error) {
            console.error(error);
            setErrorMessage('حدث خطأ أثناء تحديث الفئة.');
        }
    };

    return (
        <main className="head">
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            <div className="head-title">
                <h3 className="title">تعديل الفئة: {name}</h3>
            </div>
            <form className="content" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>أيقونة الفئة:</label>
                    <div
                        className="drop-area"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleIconDrop}
                    >
                        {iconUrl ? (
                            <img src={iconUrl} alt="Icon" width={100} height={100} />
                        ) : (
                            <label htmlFor="icon-input" style={{ cursor: 'pointer' }}>
                                <input
                                    type="file"
                                    id="icon-input"
                                    style={{ display: 'none' }}
                                    onChange={handleInputChange}
                                    accept="image/*"
                                />
                                <p>اسحب الأيقونة واسقطها هنا أو انقر للاختيار</p>
                            </label>
                        )}
                    </div>
                    {iconUrl && (
                        <button
                            type="button"
                            className="delete-image-button"
                            onClick={() => {
                                setIcon(null);
                                setIconUrl('');
                                setSelectedLibraryImage(null);
                            }}
                        >
                            حذف الأيقونة
                        </button>
                    )}
                    <button className='addButton mar' type="button" onClick={() => setShowImageLibrary(true)}>
                        اختر من المكتبة
                    </button>
                </div>
                <div className="form-group">
                    <label>اسم الفئة:</label>
                    <input type="text" value={name} onChange={handleNameChange} required />
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
                    <label>
                        <input
                            type="checkbox"
                            checked={isShow}
                            onChange={(e) => setIsShow(e.target.checked)}
                        />
                        إظهار الفئة
                    </label>
                </div>
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                        />
                        نشر الفئة
                    </label>
                </div>
                <div className="form-group">
                    <label>الفئات الفرعية:</label>
                    <div>
                        {subCategories.map((subCat) => (
                            <span key={subCat.id} className="tag">
                                {subCat.attributes.subName}
                                <button
                                    className="delete-tag-button"
                                    type="button"
                                    onClick={() => removeSubCategory(subCat.id)}
                                >
                                    <FiMinus />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="add-subcategory">
                        <select
                            className='select-box'
                            onChange={handleSubCategoryChange}
                            value=""
                        >
                            <option value="">اختر فئة فرعية</option>
                            {allSubCategories.map((subCat) => (
                                <option key={subCat.id} value={subCat.id}>
                                    {subCat.attributes.subName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <button className="sub-button" type="submit">
                    حفظ التغييرات
                </button>
            </form>

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
        </main>
    );
};

export default EditCategoryPage;