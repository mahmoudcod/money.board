'use client'
import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { FiPlus } from 'react-icons/fi';
import { useAuth } from '@/app/auth';
import { useRouter } from 'next/navigation';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

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

    const { loading: rolesLoading, error: rolesError, data: rolesData } = useQuery(GET_ROLES);

    const [addUser] = useMutation(ADD_USER, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
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

    if (rolesLoading) return <p>جاري تحميل الأدوار...</p>;
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
                            className={roleError ? 'has-error' : ''}
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
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={handleEditorChange}
                        />
                    </div>
                    <button className='sub-button' type="submit">اضافة</button>
                </form>
            </main>
        </>
    );
};

export default AddUser;