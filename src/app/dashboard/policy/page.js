'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const GET_POLICE = gql`
  query getPolice {
    police {
      data {
        attributes {
          advertising
          publish
          useage
          privacy
          about
          createdAt
          updatedAt
          publishedAt
        }
      }
    }
  }
`;

const UPDATE_POLICE = gql`
  mutation updatePolice(
    $advertising: String!
    $publish: String!
    $useage: String!
    $privacy: String!
    $about: String!
  ) {
    updatePolice(data: {
      advertising: $advertising
      publish: $publish
      useage: $useage
      privacy: $privacy
      about: $about
    }) {
      data {
        attributes {
          advertising
          publish
          useage
          privacy
          about
        }
      }
    }
  }
`;

const EditDataPage = () => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();

    const [advertising, setAdvertising] = useState('');
    const [publish, setPublish] = useState('');
    const [useage, setUseage] = useState('');
    const [privacy, setPrivacy] = useState('');
    const [about, setAbout] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { loading, error, data } = useQuery(GET_POLICE);

    const [updatePolice] = useMutation(UPDATE_POLICE, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    useEffect(() => {
        if (!loading && data) {
            const item = data.police.data.attributes;
            setAdvertising(item.advertising);
            setPublish(item.publish);
            setUseage(item.useage);
            setPrivacy(item.privacy);
            setAbout(item.about);
        }
    }, [loading, data]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            await updatePolice({
                variables: {
                    advertising,
                    publish,
                    useage,
                    privacy,
                    about,
                },
            });
            setSuccessMessage("تم تعديل البيانات بنجاح");
            router.push(`/dashboard/policy`);
        } catch (error) {
            setErrorMessage("خطأ أثناء تعديل البيانات: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">تعديل السياسات</h3>
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>سياسة الإعلان:</label>
                        <MdEditor
                            value={advertising}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={({ text }) => setAdvertising(text)}
                        />
                    </div>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>سياسة النشر:</label>
                        <MdEditor
                            value={publish}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={({ text }) => setPublish(text)}
                        />
                    </div>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>سياسة الاستخدام:</label>
                        <MdEditor
                            value={useage}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={({ text }) => setUseage(text)}
                        />
                    </div>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>سياسة الخصوصية:</label>
                        <MdEditor
                            value={privacy}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={({ text }) => setPrivacy(text)}
                        />
                    </div>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>عن الموقع:</label>
                        <MdEditor
                            value={about}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={({ text }) => setAbout(text)}
                        />
                    </div>
                    <button className='sub-button' type="submit" disabled={isLoading}>
                        {isLoading ? 'جاري التعديل...' : 'حفظ التغييرات'}
                    </button>
                </form>
            </main>
        </>
    );
};

export default EditDataPage;