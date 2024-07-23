"use client"
import React, { useState } from 'react';
import { useAuth } from './auth';
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';

const GET_LOGO = gql`
  query getLogo {
    logo {
      data {
        id
        attributes {
          appName
        }
      }
    }
  }
`;

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const { data, loading: queryLoading, error: queryError } = useQuery(GET_LOGO);

  const appName = data?.logo?.data?.attributes?.appName || 'صناع المال';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (error) {
      console.error('Login failed:', error.message);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (queryLoading) return null;
  if (queryError) return <p>Error loading app name</p>;

  return (
    <>

      <form className="login-page" onSubmit={handleSubmit}>
        <div className='login'>
          <h1>{appName}</h1>
        </div>
        <div className="login-info">
          <div className="login-content">
            <p>.مرحبا بعودتك! يرجى تسجيل الدخول إلى حسابك</p>
            <input type='email' required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="البريد الإلكتروني" />
            <input type='password' required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" />
            <button type="submit" disabled={loading}>{loading ? 'جار التحميل...' : 'تسجيل الدخول'}</button>
            {errorMessage && <p style={{ color: 'red' }} className="error-message">{errorMessage}</p>}
          </div>
        </div>
      </form>
    </>
  );
}