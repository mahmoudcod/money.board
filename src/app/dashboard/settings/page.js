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
          logo {
            data {
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
    const [imageUrl, setImageUrl] = useState('');
    const [appName, setAppName] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showImageLibrary, setShowImageLibrary] = useState(false);
    const [libraryImages, setLibraryImages] = useState([]);
    const [libraryPage, setLibraryPage] = useState(0);
    const [hasMoreImages, setHasMoreImages] = useState(true);
    const [selectedLibraryImage, setSelectedLibraryImage] = useState(null);

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
            setLogoId(data.logo.data.id);
            setImageUrl(data.logo.data.attributes.logo.data?.attributes.url || '');
            setAppName(data.logo.data.attributes.appName || '');
            if (data.logo.data.attributes.logo.data) {
                setSelectedLibraryImage(data.logo.data.attributes.logo.data.id);
            }
        }
    }, [loading, data]);

    const handleImageDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        setLogoFile(file);
        previewImage(file);
    };

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        setLogoFile(file);
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
        setLogoFile(null);
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
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            let logoFileId = selectedLibraryImage;

            if (logoFile) {
                const formData = new FormData();
                formData.append('files', logoFile);

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
                logoFileId = res[0]?.id;
            }

            await updateLogo({
                variables: {
                    data: {
                        logo: logoFileId,
                        appName: appName,
                    },
                },
            });

            setSuccessMessage("تم تحديث الشعار واسم التطبيق بنجاح");
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
                        <input
                            type="text"
                            value={null}
                            // onChange={(e) => setAppName(e.target.value)}
                            placeholder="أدخل وصف التطبيق"
                        />
                    </div>
                    <div className="form-group">
                        <label>شعار التطبيق:</label>
                        <div
                            className="drop-area"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleImageDrop}
                        >
                            {imageUrl ? (
                                <img src={imageUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '200px' }} />
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
                                    setLogoFile(null);
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
                        <label>ايقونة التطبيق:</label>
                        <div
                            className="drop-area"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleImageDrop}
                        >

                            <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                                <input
                                    type="file"
                                    id="file-input"
                                    style={{ display: 'none' }}
                                    // onChange={handleInputChange}
                                    accept="image/*"
                                />
                                <FiPlus style={{ fontSize: '50px' }} />
                                <p>اسحب الملف واسقطة في هذه المساحة او في المتصفح لرفعة</p>
                            </label>

                        </div>
                        {/* {imageUrl && (
                            <button
                                type="button"
                                className="delete-image-button"
                                onClick={() => {
                                    // setLogoFile(null);
                                    // setImageUrl('');
                                    // setSelectedLibraryImage(null);
                                }}
                            >
                                حذف الصورة
                            </button>
                        )} */}
                        {/* <button className='addButton mar' type="button" onClick={() => setShowImageLibrary(true)}>
                            اختر من المكتبة
                        </button> */}
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