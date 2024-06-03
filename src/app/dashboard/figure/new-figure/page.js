'use client'
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { FiPlus } from 'react-icons/fi';
import { useAuth } from '@/app/auth';
import { useRouter } from 'next/navigation';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const ADD_FIGURE = gql`
  mutation createFigure(
    $name: String!
    $slug: String!
    $nationality: String!
    $published: Boolean
    $job: String!
    $bio: String!
    $featureImage: ID
  ) {
    createFigure(
      input: {
        data: {
          name: $name
          slug: $slug
          nationality: $nationality
          published: $published
          job: $job
          bio: $bio
          featureImage: $featureImage
        }
      }
    ) {
      figure {
        id
        name
        slug
        nationality
        published
        job
        bio
        featureImage {
          id
          url
          createdAt
        }
      }
    }
  }
`;

const AddFigure = () => {
    const router = useRouter();

    const { getToken } = useAuth();
    const token = getToken();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [nationality, setNationality] = useState('');
    const [published, setPublished] = useState(false);
    const [job, setJob] = useState('');
    const [bio, setBio] = useState('');
    const [featureImage, setFeatureImage] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [addFigure] = useMutation(ADD_FIGURE, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const formData = new FormData();
            if (featureImage) {
                formData.append('files', featureImage);
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

            await addFigure({
                variables: {
                    name,
                    slug,
                    nationality,
                    published,
                    job,
                    bio,
                    featureImage: id,
                },
            });

            setSuccessMessage('تم إضافة الشخصية بنجاح.');
            router.push('/dashboard/figure');

        } catch (error) {
            setErrorMessage('حدث خطأ أثناء إضافة الشخصية: ' + error.message);
        }
    };

    const handleEditorChange = ({ text }) => {
        setBio(text);
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">اضافة شخصية</h3>
                </div>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>الصورة البارزة للشخصية:</label>
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
                        <label>اسم الشخصية:</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>الSlug:</label>
                        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>الجنسية:</label>
                        <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>وظيفة الشخصية:</label>
                        <input type="text" value={job} onChange={(e) => setJob(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>نبذة عن الشخصية:</label>
                        <MdEditor
                            value={bio}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={handleEditorChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>حالة الشخصية:</label>
                        <div>
                            <input
                                type="radio"
                                id="draft"
                                name="published"
                                value="draft"
                                checked={!published}
                                onChange={() => setPublished(false)}
                            />
                            <label htmlFor="draft">مسودة</label>
                            <input
                                type="radio"
                                id="published"
                                name="published"
                                value="published"
                                checked={published}
                                onChange={() => setPublished(true)}
                            />
                            <label htmlFor="published">نشر</label>
                        </div>
                    </div>
                    <button className='sub-button' type="submit">اضافة</button>
                </form>
            </main>
        </>
    );
};

export default AddFigure;
