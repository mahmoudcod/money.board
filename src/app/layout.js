import { ApolloWrapper } from "./ApolloWrapper";
import { AuthProvider } from './auth';
import Head from "next/head";
import "./globals.css";

export const metadata = {
  title: "لوحة التحكم",
  description: "Generated by mahmoud.code",
  icons: {
    icon: "/favicon.svg"
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <Head>
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <AuthProvider>
        <ApolloWrapper>
          <body>
            {children}
          </body>
        </ApolloWrapper>
      </AuthProvider>
    </html>
  );
}