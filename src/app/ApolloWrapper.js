'use client'
import { ApolloLink, HttpLink } from "@apollo/client";
import { ApolloNextAppProvider, NextSSRInMemoryCache, NextSSRApolloClient, SSRMultipartLink } from "@apollo/experimental-nextjs-app-support/ssr";
import { useAuth } from './auth'; // Import your authentication hook

function makeClient(token) {
    const httpLink = new HttpLink({
        uri: "https://api.ektesad.com/graphql",
        fetchOptions: { cache: "no-store" },
    });

    // Create a middleware to include the authentication token in the request headers
    const authMiddleware = new ApolloLink((operation, forward) => {
        // Set the token in the request headers
        operation.setContext({
            headers: {
                authorization: token ? `Bearer ${token}` : ''
            }
        });
        // Call the next link in the chain
        return forward(operation);
    });

    return new NextSSRApolloClient({
        cache: new NextSSRInMemoryCache(),
        link:
            typeof window === "undefined"
                ? ApolloLink.from([
                    new SSRMultipartLink({
                        stripDefer: true,
                    }),
                    authMiddleware.concat(httpLink), // Include authentication middleware before HTTP link
                ])
                : httpLink,
    });
}

export function ApolloWrapper({ children }) {
    const { getToken } = useAuth();
    const token = getToken();
    return (
        <ApolloNextAppProvider makeClient={() => makeClient(token)}>
            {children}
        </ApolloNextAppProvider>
    );
}
