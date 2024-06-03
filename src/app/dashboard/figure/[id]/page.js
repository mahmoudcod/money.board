'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { useAuth } from '@/app/auth';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const GET_FIGURE = gql`
  query getFigure($id: ID!) {
    figure(id: $id) {
      id
      name
      nationality
      job
      bio
      published
      featureImage {
        id
        url
      }
      slug
    }
  }
`;

const GetTags = gql`
  query getTags {
    tags {
      id
      name
    }
  }
`;

const UPDATE_FIGURE = gql`
  mutation updateFigure(
    $id: ID!
    $name: String!
    $nationality: String!
    $job: String!
    $bio: String!
    $published: Boolean
    $featureImage: ID
    $slug: String!
  ) {
    updateFigure(
      input: {
        where: { id: $id }
        data: {
          name: $name
          nationality: $nationality
          job: $job
          bio: $bio
          published: $published
          featureImage: $featureImage
          slug: $slug
        }
      }
    ) {
      figure {
        id
      }
    }
  }
`;

const EditFigurePage = ({ params }) => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();
    const id = params.id;
    const { loading, error, data } = useQuery(GET_FIGURE, {
        variables: { id: id },
    });

    const { loading: loadingTags, data: tagsData } = useQuery(GetTags);

    const [name, setName] = useState('');
    const [nationality, setNationality] = useState('');
    const [job, setJob] = useState('');
    const [bio, setBio] = useState('');
    const [published, setPublished] = useState(false);
    const [featureImage, setFeatureImage] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [updateFigure] = useMutation(UPDATE_FIGURE, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    useEffect(() => {
        if (!loading && data) {
            const figure = data.figure;
            setName(figure.name);
            setNationality(figure.nationality);
            setJob(figure.job);
            setBio(figure.bio);
            setPublished(figure.published);
            setSlug(figure.slug);
            setImageUrl(`https://api.ektesad.com/${figure.featureImage?.url || ''}`);
        }
    }, [loading, data]);

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
            setImageUrl(URL.createObjectURL(file));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        try {
            let featureImageId = null;

            // Check if there's a new image to upload
            if (featureImage) {
                const formData = new FormData();
                formData.append('files', featureImage);

                const response = await fetch('https://api.ektesad.com/upload', {
                    method: 'POST',
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const res = await response.json();
                featureImageId = res[0].id;
            } else if (imageUrl) {
                // If there's an existing image URL, use its ID
                featureImageId = data.figure.featureImage?.id;
            }

            await updateFigure({
                variables: {
                    id,
                    name,
                    nationality,
                    job,
                    bio,
                    published,
                    featureImage: featureImageId,
                    slug,
                },
            });

            setSuccessMessage('تم تحديث الشخصية بنجاح.');
            router.push(`/dashboard/figure`);

        } catch (error) {
            setErrorMessage('حدث خطأ أثناء تحديث الشخصية: ' + error.message);
        }
    };

    const handleEditorChange = ({ text }) => {
        setBio(text);
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">تعديل شخصية: {name}</h3>
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
                                <>
                                    <img src={imageUrl} alt="Feature" style={{ maxWidth: '100%', maxHeight: '200px' }} />
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

                        {imageUrl && (
                            <button type="button" className="delete-image-button" onClick={() => {
                                setFeatureImage(null);
                                setImageUrl('');
                            }}>حذف الصورة</button>
                        )}
                    </div>
                    <div className="form-group">
                        <label>الاسم:</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>الجنسية:</label>
                        <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>الوظيفة:</label>
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
                    <div className="form-group">
                        <label>الslug:</label>
                        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>
                    <button className='sub-button' type="submit">حفظ التغييرات</button>
                </form>
            </main>
        </>
    );
};

export default EditFigurePage;
