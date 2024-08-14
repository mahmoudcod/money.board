'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';
import { FiPlus } from 'react-icons/fi';

const GET_LOGO = gql`
  query getLogo {
    logo {
      data {
        id
        attributes {
          appName
          description
          favicon {
            data {
              id
              attributes {
                url
              }
            }
          }
          footerLogo {
            data {
              id
              attributes {
                url
              }
            }
          }
          logo {
            data {
              id
              attributes {
                url
              }
            }
          }
        }
      }
    }
  }
`;

const UPDATE_LOGO = gql`
  mutation updateLogo($data: LogoInput!) {
    updateLogo(data: $data) {
      data {
        id
        attributes {
          appName
          description
          favicon {
            data {
              id
              attributes {
                url
              }
            }
          }
          footerLogo {
            data {
              id
              attributes {
                url
              }
            }
          }
          logo {
            data {
              id
              attributes {
                url
              }
            }
          }
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

const LogoSettingsPage = () => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();

    const [logoId, setLogoId] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);
    const [footerLogoFile, setFooterLogoFile] = useState(null);
    const [logoUrl, setLogoUrl] = useState('');
    const [faviconUrl, setFaviconUrl] = useState('');
    const [footerLogoUrl, setFooterLogoUrl] = useState('');
    const [appName, setAppName] = useState('');
    const [description, setDescription] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showImageLibrary, setShowImageLibrary] = useState(false);
    const [libraryImages, setLibraryImages] = useState([]);
    const [libraryPage, setLibraryPage] = useState(0);
    const [hasMoreImages, setHasMoreImages] = useState(true);
    const [selectedLibraryImage, setSelectedLibraryImage] = useState(null);
    const [selectedLibraryFavicon, setSelectedLibraryFavicon] = useState(null);
    const [selectedLibraryFooterLogo, setSelectedLibraryFooterLogo] = useState(null);
    const [currentImageType, setCurrentImageType] = useState(null);

    const { loading, error, data } = useQuery(GET_LOGO, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    const [updateLogo] = useMutation(UPDATE_LOGO, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
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
        if (!loading && data && data.logo && data.logo.data) {
            const logoData = data.logo.data.attributes;
            setLogoId(data.logo.data.id);
            setLogoUrl(logoData.logo.data?.attributes.url || '');
            setFaviconUrl(logoData.favicon.data?.attributes.url || '');
            setFooterLogoUrl(logoData.footerLogo.data?.attributes.url || '');
            setAppName(logoData.appName || '');
            setDescription(logoData.description || '');
            if (logoData.logo.data) {
                setSelectedLibraryImage(logoData.logo.data.id);
            }
            if (logoData.favicon.data) {
                setSelectedLibraryFavicon(logoData.favicon.data.id);
            }
            if (logoData.footerLogo.data) {
                setSelectedLibraryFooterLogo(logoData.footerLogo.data.id);
            }
        }
    }, [loading, data]);

    const handleImageDrop = (e, imageType) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (imageType === 'logo') {
            setLogoFile(file);
            previewImage(file, setLogoUrl);
        } else if (imageType === 'favicon') {
            setFaviconFile(file);
            previewImage(file, setFaviconUrl);
        } else if (imageType === 'footerLogo') {
            setFooterLogoFile(file);
            previewImage(file, setFooterLogoUrl);
        }
    };

    const handleInputChange = (e, imageType) => {
        const file = e.target.files[0];
        if (imageType === 'logo') {
            setLogoFile(file);
            previewImage(file, setLogoUrl);
        } else if (imageType === 'favicon') {
            setFaviconFile(file);
            previewImage(file, setFaviconUrl);
        } else if (imageType === 'footerLogo') {
            setFooterLogoFile(file);
            previewImage(file, setFooterLogoUrl);
        }
    };

    const previewImage = (file, setUrlFunction) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUrlFunction(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSelectFromLibrary = (imageUrl, imageId) => {
        if (currentImageType === 'logo') {
            setLogoUrl(imageUrl);
            setSelectedLibraryImage(imageId);
            setLogoFile(null);
        } else if (currentImageType === 'favicon') {
            setFaviconUrl(imageUrl);
            setSelectedLibraryFavicon(imageId);
            setFaviconFile(null);
        } else if (currentImageType === 'footerLogo') {
            setFooterLogoUrl(imageUrl);
            setSelectedLibraryFooterLogo(imageId);
            setFooterLogoFile(null);
        }
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

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('files', file);

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
        return res[0]?.id;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            let logoFileId = selectedLibraryImage;
            let faviconFileId = selectedLibraryFavicon;
            let footerLogoFileId = selectedLibraryFooterLogo;

            if (logoFile) {
                logoFileId = await uploadImage(logoFile);
            }

            if (faviconFile) {
                faviconFileId = await uploadImage(faviconFile);
            }

            if (footerLogoFile) {
                footerLogoFileId = await uploadImage(footerLogoFile);
            }

            await updateLogo({
                variables: {
                    data: {
                        logo: logoFileId,
                        favicon: faviconFileId,
                        footerLogo: footerLogoFileId,
                        appName: appName,
                        description: description,
                    },
                },
            });

            setSuccessMessage("تم تحديث الشعار واسم التطبيق والأيقونة وشعار التذييل والوصف بنجاح");
            setTimeout(() => {
                router.push('/dashboard/settings');
            }, 3000);
        } catch (error) {
            setErrorMessage("خطأ أثناء التحديث: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) return <div className="loader"></div>;
    if (error) return <p>خطأ: {error.message}</p>;

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">تعديل شعار واسم التطبيق</h3>
                </div>
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>اسم التطبيق:</label>
                        <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="أدخل اسم التطبيق"
                        />
                    </div>
                    <div className="form-group">
                        <label>وصف التطبيق:</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="أدخل وصف التطبيق"
                        />
                    </div>
                    <div className="form-group">
                        <label>شعار التطبيق:</label>
                        <div
                            className="drop-area"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleImageDrop(e, 'logo')}
                        >
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                            ) : (
                                <label htmlFor="logo-input" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="file"
                                        id="logo-input"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleInputChange(e, 'logo')}
                                        accept="image/*"
                                    />
                                    <FiPlus style={{ fontSize: '50px' }} />
                                    <p>اسحب الملف واسقطة في هذه المساحة او في المتصفح لرفعة</p>
                                </label>
                            )}
                        </div>
                        {logoUrl && (
                            <button
                                type="button"
                                className="delete-image-button"
                                onClick={() => {
                                    setLogoFile(null);
                                    setLogoUrl('');
                                    setSelectedLibraryImage(null);
                                }}
                            >
                                حذف الصورة
                            </button>
                        )}
                        <button className='addButton mar' type="button" onClick={() => {
                            setCurrentImageType('logo');
                            setShowImageLibrary(true);
                        }}>
                            اختر من المكتبة
                        </button>
                    </div>
                    <div className="form-group">
                        <label>أيقونة التطبيق:</label>
                        <div
                            className="drop-area"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleImageDrop(e, 'favicon')}
                        >
                            {faviconUrl ? (
                                <img src={faviconUrl} alt="Favicon" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                            ) : (
                                <label htmlFor="favicon-input" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="file"
                                        id="favicon-input"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleInputChange(e, 'favicon')}
                                        accept="image/*"
                                    />
                                    <FiPlus style={{ fontSize: '50px' }} />
                                    <p>اسحب الملف واسقطة في هذه المساحة او في المتصفح لرفعة</p>
                                </label>
                            )}
                        </div>
                        {faviconUrl && (
                            <button
                                type="button"
                                className="delete-image-button"
                                onClick={() => {
                                    setFaviconFile(null);
                                    setFaviconUrl('');
                                    setSelectedLibraryFavicon(null);
                                }}
                            >
                                حذف الأيقونة
                            </button>
                        )}
                        <button className='addButton mar' type="button" onClick={() => {
                            setCurrentImageType('favicon');
                            setShowImageLibrary(true);
                        }}>
                            اختر من المكتبة
                        </button>
                    </div>
                    <div className="form-group">
                        <label>شعار التذييل:</label>
                        <div
                            className="drop-area"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleImageDrop(e, 'footerLogo')}
                        >
                            {footerLogoUrl ? (
                                <img src={footerLogoUrl} alt="Footer Logo" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                            ) : (
                                <label htmlFor="footer-logo-input" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="file"
                                        id="footer-logo-input"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleInputChange(e, 'footerLogo')}
                                        accept="image/*"
                                    />
                                    <FiPlus style={{ fontSize: '50px' }} />
                                    <p>اسحب الملف واسقطة في هذه المساحة او في المتصفح لرفعة</p>
                                </label>
                            )}
                        </div>
                        {footerLogoUrl && (
                            <button
                                type="button"
                                className="delete-image-button"
                                onClick={() => {
                                    setFooterLogoFile(null);
                                    setFooterLogoUrl('');
                                    setSelectedLibraryFooterLogo(null);
                                }}
                            >
                                حذف شعار التذييل
                            </button>
                        )}
                        <button className='addButton mar' type="button" onClick={() => {
                            setCurrentImageType('footerLogo');
                            setShowImageLibrary(true);
                        }}>
                            اختر من المكتبة
                        </button>
                    </div>
                    <button className='sub-button' type="submit" disabled={isLoading}>
                        {isLoading ? 'جاري التحديث...' : 'حفظ التغييرات'}
                    </button>
                </form>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
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

export default LogoSettingsPage;