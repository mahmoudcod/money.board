'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { FiPlus } from 'react-icons/fi';
import { useAuth } from '@/app/auth';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const GET_USER = gql`
  query getUser($id: ID!) {
    usersPermissionsUser(id: $id) {
      data {
        id
        attributes {
          username
          email
          description
          role {
            data {
              id
              attributes {
                name
              }
            }
          }
          slug
          cover {
            data {
              id
              attributes {
                url
              }
            }
          }
          confirmed
        }
      }
    }
  }
`;

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

const UPDATE_USER = gql`
  mutation updateUsersPermissionsUser($id: ID!, $data: UsersPermissionsUserInput!) {
    updateUsersPermissionsUser(id: $id, data: $data) {
      data {
        id
        attributes {
          username
        }
      }
    }
  }
`;

const EditUserPage = ({ params }) => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();
    const id = params.id;
    const { loading, error, data } = useQuery(GET_USER, {
        variables: { id },
    });

    const { data: rolesData } = useQuery(GET_ROLES);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    // const [phone, setPhone] = useState('');
    // const [address, setAddress] = useState('');
    const [description, setdescription] = useState('');
    const [role, setRole] = useState('');
    const [cover, setcover] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [confirmed, setConfirmed] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [updateUser] = useMutation(UPDATE_USER, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    useEffect(() => {
        if (!loading && data) {
            const user = data.usersPermissionsUser.data.attributes;
            setUsername(user.username);
            setEmail(user.email);
            // setPhone(user.phone);
            // setAddress(user.address);
            setdescription(user.description);
            setRole(user.role.data.id);
            setSlug(user.slug);
            setConfirmed(user.confirmed);
            setImageUrl(user.cover?.data?.attributes?.url);
        }
    }, [loading, data]);

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
            setImageUrl(URL.createObjectURL(file));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        try {
            let coverId = null;

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
                coverId = res[0].id;
            } else if (imageUrl) {
                coverId = data.usersPermissionsUser.data.attributes.cover?.data?.id;
            }

            await updateUser({
                variables: {
                    id,
                    data: {
                        username,
                        email,
                        // phone,
                        // address,
                        description,
                        role,
                        cover: coverId,
                        slug,
                        confirmed,
                    },
                },
            });

            setSuccessMessage('تم تحديث المستخدم بنجاح.');
            router.push(`/dashboard/users`);

        } catch (error) {
            setErrorMessage('حدث خطأ أثناء تحديث المستخدم: ' + error.message);
        }
    };

    const handleEditorChange = ({ text }) => {
        setdescription(text);
    };

    const roles = rolesData?.usersPermissionsRoles?.data || [];

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">تعديل المستخدم: {username}</h3>
                </div>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>الصورة البارزة للمستخدم:</label>
                        <div
                            className="drop-area"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleImageDrop}
                        >
                            {imageUrl ? (
                                <>
                                    <img src={imageUrl} alt="cover" style={{ maxWidth: '100%', maxHeight: '200px' }} />
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

                        {imageUrl && (
                            <button type="button" className="delete-image-button" onClick={() => {
                                setcover(null);
                                setImageUrl('');
                            }}>حذف الصورة</button>
                        )}
                    </div>

                    <div className="form-group">
                        <label>اسم المستخدم:</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>البريد الإلكتروني:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    {/* <div className="form-group">
                        <label>الهاتف:</label>
                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div> */}

                    {/* <div className="form-group">
                        <label>العنوان:</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div> */}

                    <div className="form-group">
                        <label>نبذة عن المستخدم:</label>
                        <MdEditor
                            value={description}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={handleEditorChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>الدور:</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="">اختر الدور</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.attributes.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Slug:</label>
                        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Confirmed:</label>
                        <label className="switcher is-normal">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={(e) => setConfirmed(e.target.checked)}
                                className="switcher-input"
                            />
                            <span className="switcher-body">
                                <span className="switcher-handle"></span>
                            </span>
                        </label>
                    </div>
                    <button className='sub-button' type="submit">حفظ التغييرات</button>
                </form>
            </main>
        </>
    );
};

export default EditUserPage;