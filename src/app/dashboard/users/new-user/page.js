'use client'
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { FiPlus } from "react-icons/fi";
import { useAuth } from '@/app/auth';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useRouter } from 'next/navigation';

const ADD_USER = gql`
  mutation addUser($userInput: UserInput) {
    User: createUser(input: { data: $userInput }) {
      user {
        id
      }
    }
  }
`;

const QuillEditor = dynamic(() => import('react-quill'), { ssr: false });

const AddUser = () => {
    const router = useRouter();

    const { getToken } = useAuth();
    const token = getToken();
    const [username, setUsername] = useState('');
    const [slug, setSlug] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [roleError, setRoleError] = useState('');

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
        setAvatar(file);
        previewImage(file);
    };

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        setAvatar(file);
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
            const formData = new FormData();
            if (avatar) {
                formData.append('files', avatar);
            }

            const response = await fetch('https://api.ektesad.com/upload', {
                method: 'POST',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const res = await response.json();
            const id = res[0]?.id;

            await addUser({
                variables: {
                    userInput: {
                        username,
                        slug,
                        email,
                        roles: role,
                        password,
                        bio,
                        avatar: id,
                    },
                },
            });

            setSuccessMessage('تم إضافة المستخدم بنجاح.');
            router.push('/dashboard/users');

        } catch (error) {
            setErrorMessage('حدث خطأ أثناء إضافة المستخدم: ' + error.message);
        }
    };

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            [{ align: [] }],
            [{ color: [] }],
            ['code-block'],
            ['clean'],
        ],
    };

    const quillFormats = [
        'header',
        'bold',
        'italic',
        'underline', 'strike',
        'blockquote',
        'list',
        'bullet',
        'link',
        'image',
        'align',
        'color',
        'code-block',
    ];

    const handleEditorChange = (newContent) => {
        setBio(newContent);
    };

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
                                <img src={imageUrl} alt="Avatar" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                            ) : (
                                <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="file"
                                        id="file-input"
                                        style={{ display: 'none' }}
                                        onChange={handleInputChange}
                                        accept="image/*"
                                    />
                                    <FiPlus style={{ fontSize: "50px" }} />
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
                            <option value="admin">Admin</option>
                            <option value="contentManager">Content Manager</option>
                            <option value="contributor">Contributor</option>
                        </select>
                        {roleError && <p className="input-message is-warning is-small">{roleError}</p>}
                    </div>
                    <div className="form-group">
                        <label>نبذة عن المستخدم:</label>
                        <QuillEditor
                            value={bio}
                            onChange={handleEditorChange}
                            modules={quillModules}
                            formats={quillFormats}
                        />
                    </div>
                    <button className='sub-button' type="submit">اضافة</button>
                </form>
            </main>
        </>
    );
};

export default AddUser;
