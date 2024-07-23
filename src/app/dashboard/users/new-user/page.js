'use client'
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { FiPlus } from 'react-icons/fi';
import { useAuth } from '@/app/auth';
import { useRouter } from 'next/navigation';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const GET_ROLES = gql`
  query GetRoles {
    usersPermissionsRoles {
      data {
        id
        attributes {
          name
        }
      }
    }
  }
`;

const ADD_USER = gql`
  mutation createUsersPermissionsUser($data: UsersPermissionsUserInput!) {
    createUsersPermissionsUser(data: $data) {
      data {
        id
        attributes {
          username
          email
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

const AddUser = () => {
    const router = useRouter();

    const { getToken } = useAuth();
    const token = getToken();
    const [username, setUsername] = useState('');
    const [slug, setSlug] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [description, setdescription] = useState('');
    const [cover, setcover] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [roleError, setRoleError] = useState('');

    const [showImageLibrary, setShowImageLibrary] = useState(false);
    const [libraryImages, setLibraryImages] = useState([]);
    const [libraryPage, setLibraryPage] = useState(0);
    const [hasMoreImages, setHasMoreImages] = useState(true);
    const [selectedLibraryImage, setSelectedLibraryImage] = useState(null);

    const { loading: rolesLoading, error: rolesError, data: rolesData } = useQuery(GET_ROLES);

    const [addUser] = useMutation(ADD_USER, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });
    useEffect(() => {
        // Auto-generate slug from title
        const generatedSlug = username.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
        setSlug(generatedSlug);
    }, [username]);


    const { data: libraryData, fetchMore } = useQuery(GET_UPLOADED_FILES, {
        variables: { limit: 20, start: 0 },
        onCompleted: (data) => {
            setLibraryImages(data.uploadFiles.data);
            setHasMoreImages(data.uploadFiles.data.length < data.uploadFiles.meta.pagination.total);
        },
    });

    const handleImageDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        setcover(file);
        previewImage(file);
    };

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        setcover(file);
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
        setErrorMessage('');
        setSuccessMessage('');
        setRoleError('');

        if (!role) {
            setRoleError('الدور مطلوب');
            return;
        }

        try {
            let coverId;
            if (cover) {
                const formData = new FormData();
                formData.append('files', cover);

                const response = await fetch('https://money-api.ektesad.com/api/upload', {
                    method: 'POST',
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const res = await response.json();
                coverId = res[0]?.id;
            } else if (selectedLibraryImage) {
                coverId = selectedLibraryImage;
            }

            const { data } = await addUser({
                variables: {
                    data: {
                        username,
                        email,
                        password,
                        role,
                        description,
                        cover: coverId,
                        slug,
                    },
                },
            });

            setSuccessMessage('تم إضافة المستخدم بنجاح.');
            router.push('/dashboard/users');

        } catch (error) {
            setErrorMessage('حدث خطأ أثناء إضافة المستخدم: ' + error.message);
        }
    };

    const handleEditorChange = ({ text }) => {
        setdescription(text);
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

    if (rolesLoading) return null;
    if (rolesError) return <p>حدث خطأ أثناء تحميل الأدوار: {rolesError.message}</p>;

    const roles = rolesData?.usersPermissionsRoles?.data || [];

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">اضافة مستخدم</h3>
                </div>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>الصورة الرمزية:</label>
                        <div
                            className="drop-area"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleImageDrop}
                        >
                            {imageUrl ? (
                                <img src={imageUrl} alt="cover" style={{ maxWidth: '100%', maxHeight: '200px' }} />
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
                        <button className='addButton mar' type="button" onClick={() => setShowImageLibrary(true)}>
                            اختر من المكتبة
                        </button>
                    </div>
                    <div className="form-group">
                        <label>اسم المستخدم:</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>الSlug:</label>
                        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>البريد الإلكتروني:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>كلمة المرور:</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>الدور:</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className={roleError ? 'has-error select-box ' : 'select-box '}
                        >
                            <option value="">اختر دور</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.attributes.name}
                                </option>
                            ))}
                        </select>
                        {roleError && <p className="input-message is-warning is-small">{roleError}</p>}
                    </div>
                    <div className="form-group">
                        <label>نبذة عن المستخدم:</label>
                        <MdEditor
                            value={description}
                            style={{ height: '300px' }}
                            onChange={handleEditorChange}
                            view={{ menu: true, md: true, html: false }}
                            canView={{ menu: true, md: true, html: false, fullScreen: false, hideMenu: true }}
                        />
                    </div>
                    <button className='sub-button' type="submit">اضافة</button>
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

export default AddUser;