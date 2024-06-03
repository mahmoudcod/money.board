'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import dynamic from 'next/dynamic';
import { useAuth } from '@/app/auth';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const GET_DATA = gql`
  query getData($id: ID!) {
    about(id: $id) {
      id
      usage
      privacy
      mediaCh
      vision
      description
      mission
    }
  }
`;

const UPDATE_DATA = gql`
  mutation updateAbout(
    $id: ID!
    $usage: String!
    $privacy: String!
    $mediaCh: String!
    $vision: String!
    $description: String!
    $mission: String!
  ) {
    updateAbout(
      input: {
        where: { id: $id }
        data: {
          usage: $usage
          privacy: $privacy
          mediaCh: $mediaCh
          vision: $vision
          description: $description
          mission: $mission
        }
      }
    ) {
      about {
        id
      }
    }
  }
`;

const EditDataPage = ({ params }) => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();
    const id = "618a41e3ae446e4c9c6cd289";

    const [usage, setUsage] = useState('');
    const [privacy, setPrivacy] = useState('');
    const [mediaCh, setMediaCh] = useState('');
    const [vision, setVision] = useState('');
    const [description, setDescription] = useState('');
    const [mission, setMission] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { loading, error, data } = useQuery(GET_DATA, {
        variables: { id },
    });

    const [updateData] = useMutation(UPDATE_DATA, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    useEffect(() => {
        if (!loading && data) {
            const item = data.about;
            setUsage(item.usage);
            setPrivacy(item.privacy);
            setMediaCh(item.mediaCh);
            setVision(item.vision);
            setDescription(item.description);
            setMission(item.mission);
        }
    }, [loading, data]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            await updateData({
                variables: {
                    id,
                    usage,
                    privacy,
                    mediaCh,
                    vision,
                    description,
                    mission,
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
                    <h3 className="title">تعديل البيانات</h3>
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>الاستخدام:</label>
                        <MdEditor
                            value={usage}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={({ text }) => setUsage(text)}
                        />
                    </div>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>الخصوصية:</label>
                        <MdEditor
                            value={privacy}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={({ text }) => setPrivacy(text)}
                        />
                    </div>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>الميثاق الإعلامي:</label>
                        <MdEditor
                            value={mediaCh}
                            style={{ height: '300px' }}
                            renderHTML={(text) => mdParser.render(text)}
                            onChange={({ text }) => setMediaCh(text)}
                        />
                    </div>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>الرؤية:</label>
                        <textarea
                            value={vision}
                            onChange={(e) => setVision(e.target.value)}
                            rows="4"
                        />
                    </div>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>الوصف:</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                        />
                    </div>
                    <div className="form-group" style={{ width: '100%' }}>
                        <label>المهمة:</label>
                        <textarea
                            value={mission}
                            onChange={(e) => setMission(e.target.value)}
                            rows="4"
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
