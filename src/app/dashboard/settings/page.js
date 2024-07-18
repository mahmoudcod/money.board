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

const UPDATE_LOGO = gql`
  mutation updateLogo($id: ID!, $logo: ID!) {
    updateLogo(id: $id, data: { logo: $logo }) {
      data {
        id
        attributes {
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

const LogoSettingsPage = () => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();

    const [logoId, setLogoId] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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

    useEffect(() => {
        if (!loading && data && data.logo && data.logo.data) {
            setLogoId(data.logo.data.id);
            setImageUrl(data.logo.data.attributes.logo.data?.attributes.url || '');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            let logoFileId = null;
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
                    id: logoId,
                    logo: logoFileId,
                },
            });

            setSuccessMessage("تم تحديث الشعار بنجاح");
            setTimeout(() => {
                router.push('/dashboard/settings');
            }, 3000);
        } catch (error) {
            setErrorMessage("خطأ أثناء تحديث الشعار: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) return <p>جاري التحميل...</p>;
    if (error) return <p>خطأ: {error.message}</p>;

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">تعديل شعار التطبيق</h3>
                </div>
                <form className="content" onSubmit={handleSubmit}>
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
                        {imageUrl ? (
                            <button
                                type="button"
                                className="delete-image-button"
                                onClick={() => {
                                    setImageUrl(null);
                                    setImageUrl('');
                                }}
                            >
                                حذف الصورة
                            </button>
                        ) : null}
                    </div>
                    <button className='sub-button' type="submit" disabled={isLoading}>
                        {isLoading ? 'جاري التحديث...' : 'حفظ التغييرات'}
                    </button>
                </form>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
            </main>
        </>
    );
};

export default LogoSettingsPage;