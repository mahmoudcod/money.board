// SearchPosts.js
'use client'
import React, { useState } from 'react';

const SearchPosts = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        try {
            setLoading(true);
            setError(null);

            // Perform the search API call here
            const response = await fetch(`https://api.ektesad.com/posts?sort=${searchTerm}`);
            const data = await response.json();

            setPosts(data.posts);
            setLoading(false);
        } catch (error) {
            setError('Error searching posts');
            setLoading(false);
        }
    };

    return (
        <div>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="  ..."
            />
            <button onClick={handleSearch}>Search</button>

            {loading && <div>Loading...</div>}

            {error && <div>{error}</div>}

            {posts.length > 0 && (
                <ul>
                    {posts.map((post) => (
                        <li key={post.id}>{post.title}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchPosts;
