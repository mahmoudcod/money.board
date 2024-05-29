'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useAuth } from '@/app/auth';

const GET_AD = gql`
  query getAdv($id: ID!) {
    adv(id: $id) {
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
`;

const UPDATE_AD = gql`
  mutation updateAdv(
    $id: ID!
    $type: String!
    $city: String!
    $budget: String!
    $company: String!
    $phone: String!
    $notes: String
    $email: String!
  ) {
    updateAdv(
      input: {
        where: { id: $id }
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
      }
    }
  }
`;

const EditAdPage = ({ params }) => {
    const router = useRouter();
    const { getToken } = useAuth();
    const token = getToken();
    const id = params.id;

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

    const { loading, error, data } = useQuery(GET_AD, {
        variables: { id: id },
    });

    const [updateAd] = useMutation(UPDATE_AD, {
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : '',
            },
        },
    });

    useEffect(() => {
        if (!loading && data) {
            const ad = data.adv;
            setType(ad.type);
            setCity(ad.city);
            setBudget(ad.budget);
            setCompany(ad.company);
            setPhone(ad.phone);
            setNotes(ad.notes);
            setEmail(ad.email);
        }
    }, [loading, data]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsLoading(true);
        try {
            await updateAd({
                variables: {
                    id,
                    type,
                    city,
                    budget,
                    company,
                    phone,
                    notes,
                    email,
                },
            });
            setSuccessMessage("تم تعديل الإعلان بنجاح");
            router.push(`/dashboard/ads`);
        } catch (error) {
            setErrorMessage("خطأ أثناء تعديل الإعلان: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <>
            <main className="head">
                <div className="head-title">
                    <h3 className="title">تعديل الإعلان: {type}</h3>
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
                        {isLoading ? 'جاري التعديل...' : 'حفظ التغييرات'}
                    </button>
                </form>
            </main>
        </>
    );
};

export default EditAdPage;
