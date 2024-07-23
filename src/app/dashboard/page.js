import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import Head from 'next/head';

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

export default function Dashboard() {
    const { data, loading: queryLoading, error: queryError } = useQuery(GET_LOGO);
    const appName = data?.logo?.data?.attributes?.appName || 'صناع المال';

    return (
        <>
            <Head>
                <title>{appName}</title>
                <meta name="application-name" content={appName} />
                <meta name="description" content={`Welcome to ${appName}`} />
                {/* You can add more meta tags as needed */}
            </Head>
            {/* Your dashboard content goes here */}
        </>
    );
}