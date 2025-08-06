// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: loggedInUser } = useSelector((state) => state.auth);
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [editingContent, setEditingContent] = useState({
    title: '',
    content: ''
  });
  
  // Fetch user data and posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch profile data
        const profileResponse = await axiosClient.get(`/users/profile/${userId}`);
        
        // Set user data and posts
        setUser(profileResponse.data.user);
        setPosts(profileResponse.data.posts || []);
        setBio(profileResponse.data.user?.bio || '');
        
        // Check if current user is viewing their own profile
        setIsCurrentUser(loggedInUser?._id === profileResponse.data.user._id);
        
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (loggedInUser) {
      fetchData();
    }
  }, [userId, loggedInUser]);

  // Handle bio update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axiosClient.put('/users/profileupdate', { bio });
      
      // Refresh profile data
      const profileResponse = await axiosClient.get(`/users/profile/${userId}`);
      setUser(profileResponse.data.user);
      setBio(profileResponse.data.user?.bio || '');
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle post editing
  const handleEditPost = (post) => {
    setEditingPost(post._id);
    setEditingContent({
      title: post.title,
      content: post.content
    });
  };

  // Handle post update
  const handleUpdatePost = async (postId) => {
    try {
      setIsLoading(true);
      
      const response = await axiosClient.put(`/post/${postId}`, editingContent);
      
      // Update the post in state
      setPosts(posts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              title: response.data.post.title, 
              content: response.data.post.content,
              updatedAt: response.data.post.updatedAt // Add updatedAt
            } 
          : post
      ));
      
      setEditingPost(null);
      setEditingContent({ title: '', content: '' });
    } catch (error) {
      console.error("Error updating post:", error);
      alert(`Failed to update post: ${error.response?.data || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel post editing
  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditingContent({ title: '', content: '' });
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    try {
      setIsLoading(true);
      
      // Verify ownership before deleting
      const postToDelete = posts.find(post => post._id === postId);
      if (!postToDelete) throw new Error("Post not found");
      if (postToDelete.author._id !== loggedInUser._id) {
        throw new Error("You can only delete your own posts");
      }
      
      await axiosClient.delete(`/post/${postId}`);
      
      // Remove the deleted post from state
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await axiosClient.post('/user/logout');
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Skeleton loading for profile header
  const renderProfileHeaderSkeleton = () => (
    <div className="bg-[#212122] rounded-lg p-6 mb-8 shadow-md">
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0">
        <div className="bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mr-4 animate-pulse"></div>
        
        <div className="flex-1 space-y-3">
          <div className="h-7 bg-gray-700 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
          <div className="h-16 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  // Skeleton loading for posts
  const renderPostsSkeleton = () => (
    <div className="mb-8">
      <div className="h-6 bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
      
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#212122] rounded-lg p-5 shadow-md relative">
            <div className="absolute top-3 right-3 flex space-x-2">
              <div className="h-5 w-5 bg-gray-700 rounded-full animate-pulse"></div>
              <div className="h-5 w-5 bg-gray-700 rounded-full animate-pulse"></div>
            </div>
            
            <div className="h-4 bg-gray-700 rounded w-1/3 mb-3 animate-pulse"></div>
            
            <div className="space-y-2 mb-4">
              <div className="h-5 bg-gray-700 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </div>
            
            <div className="flex items-center text-gray-400 text-sm">
              <div className="flex items-center mr-4">
                <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
              </div>
              <div className="flex items-center">
                <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-[#171819] text-white">
        {/* Navigation Bar Skeleton */}
        <nav className="bg-[#212122] py-4 px-6 flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-2">
            <div className="bg-[#0A5BFF] w-8 h-8 rounded-md animate-pulse"></div>
            <div className="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="h-6 bg-gray-700 rounded w-16 animate-pulse"></div>
              <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </nav>

        {/* Main Content Skeleton */}
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          {renderProfileHeaderSkeleton()}
          {renderPostsSkeleton()}
        </main>

        {/* Footer Skeleton */}
        <footer className="bg-[#212122] py-6 px-4 text-center">
          <div className="h-4 bg-gray-700 rounded w-1/3 mx-auto animate-pulse"></div>
        </footer>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#171819] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-white">Profile Not Found</h2>
          <button 
            onClick={() => navigate('/')}
            className="bg-[#0A5BFF] text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171819] text-white">
      {/* Navigation Bar */}
      <nav className="bg-[#212122] py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <div className="bg-[#0A5BFF] w-8 h-8 rounded-md"></div>
          <h1 className="text-xl font-bold">CIAAN</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {loggedInUser && (
            <div className="flex items-center space-x-3">
              <button 
                className="text-sm hover:underline"
                onClick={() => navigate('/')}
              >
                Home
              </button>
              <button 
                onClick={handleLogout}
                className="bg-[#0A5BFF] text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Header */}
        {isLoading ? renderProfileHeaderSkeleton() : (
          <div className="bg-[#212122] rounded-lg p-6 mb-8 shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0">
              <div className="bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mr-4 text-2xl font-bold">
                {user.firstName.charAt(0)}{user.lastName?.charAt(0) || ''}
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {user.firstName} {user.lastName || ''}
                </h1>
                <p className="text-gray-400 mb-2">{user.emailId}</p>
                <p className="text-gray-400 text-sm mb-3">
                  Member since: {new Date(user.createdAt).toLocaleDateString()}
                </p>
                
                {editing ? (
                  <form onSubmit={handleUpdateProfile} className="mt-3">
                    <textarea
                      className="w-full bg-transparent border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#0A5BFF]"
                      placeholder="Tell us about yourself..."
                      rows="3"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={500}
                    ></textarea>
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        type="button"
                        className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#0A5BFF] text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600 transition-colors"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          </div>
                        ) : "Save Bio"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-white whitespace-pre-line">
                      {user.bio || "This user hasn't written a bio yet."}
                    </p>
                    {isCurrentUser && (
                      <button
                        onClick={() => setEditing(true)}
                        className="mt-3 bg-[#0A5BFF] text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600 transition-colors"
                        disabled={isLoading}
                      >
                        Edit Bio
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User's Posts */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            {isCurrentUser ? "Your Posts" : `${user.firstName}'s Posts`}
          </h3>
          
          {isLoading ? renderPostsSkeleton() : (
            posts.length === 0 ? (
              <div className="bg-[#212122] rounded-lg p-8 text-center">
                <p className="text-gray-400">
                  {isCurrentUser ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
                </p>
                {isCurrentUser && (
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 bg-[#0A5BFF] text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600 transition-colors"
                  >
                    Create Your First Post
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post._id} className="bg-[#212122] rounded-lg p-5 shadow-md relative">
                    {/* Action buttons (only for current user's posts) */}
                    {isCurrentUser && (
                      <div className="absolute top-3 right-3 flex space-x-2">
                        <button
                          onClick={() => handleEditPost(post)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit post"
                          disabled={isLoading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete post"
                          disabled={isLoading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    <div className="text-gray-400 text-sm mb-2 flex items-center">
                      {formatDate(post.createdAt)}
                      {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Edited)
                        </span>
                      )}
                    </div>
                    
                    {editingPost === post._id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          className="w-full bg-transparent border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#0A5BFF]"
                          placeholder="Post title..."
                          value={editingContent.title}
                          onChange={(e) => setEditingContent({
                            ...editingContent,
                            title: e.target.value
                          })}
                        />
                        <textarea
                          className="w-full bg-transparent border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#0A5BFF]"
                          placeholder="What's on your mind..."
                          rows="4"
                          value={editingContent.content}
                          onChange={(e) => setEditingContent({
                            ...editingContent,
                            content: e.target.value
                          })}
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors"
                            disabled={isLoading}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdatePost(post._id)}
                            className="bg-[#0A5BFF] text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600 transition-colors"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                              </div>
                            ) : "Update Post"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold mb-2 text-[#0A5BFF]">
                          {post.title}
                        </h3>
                        
                        <div className="mb-4">
                          <p className="text-white">{post.content}</p>
                        </div>
                      </>
                    )}
                    
                    <div className="flex items-center text-gray-400 text-sm">
                      <div className="flex items-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{post.likeCount} likes</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{post.commentCount} comments</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#212122] py-6 px-4 text-center text-gray-400 text-sm">
        <p>© 2023 CIAAN Community Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ProfilePage;