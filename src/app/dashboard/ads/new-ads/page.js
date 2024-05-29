'use client'
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';
import { useRouter } from 'next/navigation';

const ADD_AD = gql`
  mutation createAdv(
    $type: String!
    $city: String!
    $budget: String!
    $company: String!
    $phone: String!
    $notes: String
    $email: String!
  ) {
    createAdv(
      input: {
        data: {
          type: $type
          city: $city
          budget: $budget
          company: $company
          phone: $phone
          notes: $notes
          email: $email
        }
      }
    ) {
      adv {
        id
        type
        city
        budget
        company
        phone
        notes
        email
      }
    }
  }
`;

const AddAd = () => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();

    const [type, setType] = useState('');
    const [city, setCity] = useState('');
    const [budget, setBudget] = useState('');
    const [company, setCompany] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [addAd] = useMutation(ADD_AD, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsLoading(true);
        try {
            await addAd({
                variables: {
                    type,
                    city,
                    budget,
                    company,
                    phone,
                    notes,
                    email,
                },
            });
            // Clear form fields and redirect to /dashboard/ads after successful submission
            setType('');
            setCity('');
            setBudget('');
            setCompany('');
            setPhone('');
            setNotes('');
            setEmail('');
            router.push('/dashboard/ads');
        } catch (error) {
            setErrorMessage("خطأ أثناء إضافة الإعلان: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">إضافة إعلان</h3>
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <form className="content" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>نوع الإعلان:</label>
                        <input type="text" value={type} onChange={(e) => setType(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>المدينة:</label>
                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>الميزانية:</label>
                        <input type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>الشركة:</label>
                        <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>الهاتف:</label>
                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>ملاحظات:</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>البريد الإلكتروني:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <button className='sub-button' type="submit" disabled={isLoading}>
                        {isLoading ? 'جاري الإضافة...' : 'اضافة'}
                    </button>
                </form>
            </main>
        </>
    );
};

export default AddAd;
