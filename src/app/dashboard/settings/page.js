'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';

const GET_SETTINGS = gql`
  query getSettings {
    Settings: settings {
      facebook
      googlePlus
      pinterest
      twitter
      email
      phone
      appLogo
    }
  }
`;

const UPDATE_SETTINGS = gql`
  mutation updateSettings(
    $facebook: String!
    $googlePlus: String!
    $pinterest: String!
    $twitter: String!
    $email: String!
    $phone: String!
    $appLogo: String!
  ) {
    updateSetting(
      input: {
        data: {
          facebook: $facebook
          googlePlus: $googlePlus
          pinterest: $pinterest
          twitter: $twitter
          email: $email
          phone: $phone
          appLogo: $appLogo
        }
      }
    ) {
      setting {
        id
      }
    }
  }
`;

const SettingsPage = () => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();

    const [facebook, setFacebook] = useState('');
    const [googlePlus, setGooglePlus] = useState('');
    const [pinterest, setPinterest] = useState('');
    const [twitter, setTwitter] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [appLogo, setAppLogo] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { loading, error, data } = useQuery(GET_SETTINGS, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    const [updateSettings] = useMutation(UPDATE_SETTINGS, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    useEffect(() => {
        if (!loading && data) {
            const settings = data.Settings[0]; // Assuming data.Settings is an array and we need the first item
            setFacebook(settings.facebook || '');
            setGooglePlus(settings.googlePlus || '');
            setPinterest(settings.pinterest || '');
            setTwitter(settings.twitter || '');
            setEmail(settings.email || '');
            setPhone(settings.phone || '');
            setAppLogo(settings.appLogo || '');
        }
    }, [loading, data]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsLoading(true);
        try {
            await updateSettings({
                variables: {
                    facebook,
                    googlePlus,
                    pinterest,
                    twitter,
                    email,
                    phone,
                    appLogo,
                },
            });
            setSuccessMessage("تم تحديث الإعدادات بنجاح");
            router.push(`/dashboard/settings`);
        } catch (error) {
            setErrorMessage("خطأ أثناء تحديث الإعدادات: " + error.message);
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
                    <h3 className="title">تعديل الإعدادات</h3>
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>فيسبوك:</label>
                        <input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>جوجل بلس:</label>
                        <input type="text" value={googlePlus} onChange={(e) => setGooglePlus(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>بينتيريست:</label>
                        <input type="text" value={pinterest} onChange={(e) => setPinterest(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>تويتر:</label>
                        <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>البريد الإلكتروني:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>الهاتف:</label>
                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>شعار التطبيق:</label>
                        <input type="text" value={appLogo} onChange={(e) => setAppLogo(e.target.value)} />
                    </div>
                    <button className='sub-button' type="submit" disabled={isLoading}>
                        {isLoading ? 'جاري التحديث...' : 'حفظ التغييرات'}
                    </button>
                </form>
            </main>
        </>
    );
};

export default SettingsPage;
