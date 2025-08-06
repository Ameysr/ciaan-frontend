import React, { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../authSlice';

const Homepage = () => {
  // State declarations
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [likedPosts, setLikedPosts] = useState(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const postsPerPage = 5;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Fetch user and posts data
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch user data
        const userResponse = await axiosClient.get('/user/check');
        if (isMounted) setUser(userResponse.data.user);
        
        // Fetch posts with pagination
        const postsResponse = await axiosClient.get('/post/feed', {
          params: {
            page: currentPage,
            limit: postsPerPage,
            t: Date.now() // Bypass cache
          }
        });
        
        if (isMounted) {
          setPosts(postsResponse.data.posts);
          setTotalPages(postsResponse.data.pagination.totalPages);
          setTotalPosts(postsResponse.data.pagination.totalPosts);
          setHasNext(postsResponse.data.pagination.hasNext);
          setHasPrev(postsResponse.data.pagination.hasPrev);

          // Initialize liked posts
          const likedSet = new Set();
          postsResponse.data.posts.forEach(post => {
            if (post.likedBy && post.likedBy.includes(userResponse.data.user._id)) {
              likedSet.add(post._id);
            }
          });
          setLikedPosts(likedSet);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          dispatch(logoutUser());
          navigate('/login');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    
    return () => {
      isMounted = false; // Cleanup on unmount
    };
  }, [currentPage]);

  // Create new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    
    try {
      setIsLoading(true);
      await axiosClient.post('/post/create', { 
        title: newPostTitle.trim(), 
        content: newPostContent.trim() 
      });
      
      // Reset form and close modal
      setNewPostTitle('');
      setNewPostContent('');
      setIsCreateModalOpen(false);
      
      // Refresh feed data
      const postsResponse = await axiosClient.get('/post/feed', {
        params: {
          page: currentPage,
          limit: postsPerPage,
          t: Date.now()
        }
      });
      
      setPosts(postsResponse.data.posts);
      setTotalPages(postsResponse.data.pagination.totalPages);
      setTotalPosts(postsResponse.data.pagination.totalPosts);
      setHasNext(postsResponse.data.pagination.hasNext);
      setHasPrev(postsResponse.data.pagination.hasPrev);
      
      // Reset to first page if not already there
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert('Error creating post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle post likes
  const handleLike = async (postId) => {
    try {
      const response = await axiosClient.post(`/post/${postId}/like`);
      
      // Update posts with new like count
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, likeCount: response.data.likeCount }
          : post
      ));
      
      // Update liked posts
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (response.data.isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  // Toggle comments visibility
  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments(prev => ({ ...prev, [postId]: false }));
    } else {
      setExpandedComments(prev => ({ ...prev, [postId]: true }));
      
      // Fetch comments if not already loaded
      if (!comments[postId]) {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        try {
          const response = await axiosClient.get(`/post/${postId}/comments`);
          setComments(prev => ({ ...prev, [postId]: response.data.comments }));
        } catch (error) {
          console.error("Error fetching comments:", error);
        } finally {
          setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
      }
    }
  };

  // Add new comment
  const handleAddComment = async (postId) => {
    const commentContent = newComment[postId];
    if (!commentContent || !commentContent.trim()) return;

    try {
      const response = await axiosClient.post(`/post/${postId}/comment`, {
        content: commentContent.trim()
      });

      // Add new comment to list
      setComments(prev => ({
        ...prev,
        [postId]: [response.data.comment, ...(prev[postId] || [])]
      }));

      // Update comment count
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, commentCount: (post.commentCount || 0) + 1 }
          : post
      ));

      // Clear comment input
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  // Format date
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

  // Navigate to profile
  const goToProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Pagination functions
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render page numbers for pagination
  const renderPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Adjust pagination range
    if (endPage - startPage < 4 && totalPages > 5) {
      if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(totalPages - 4, 1);
      }
    }
    
    // Add first page and ellipsis
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => goToPage(1)}
          className="px-3 py-2 rounded-md text-sm font-medium bg-[#2d2d2e] text-gray-300 hover:bg-gray-600 transition-colors"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-2 text-gray-500">...</span>
        );
      }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === i
              ? 'bg-[#0A5BFF] text-white'
              : 'bg-[#2d2d2e] text-gray-300 hover:bg-gray-600'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Add last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-2 text-gray-500">...</span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => goToPage(totalPages)}
          className="px-3 py-2 rounded-md text-sm font-medium bg-[#2d2d2e] text-gray-300 hover:bg-gray-600 transition-colors"
        >
          {totalPages}
        </button>
      );
    }
    
    return pages;
  };

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => {
    if (!post) return false;
    
    const title = post.title || '';
    const content = post.content || '';
    const firstName = post.author?.firstName || '';
    const lastName = post.author?.lastName || '';
    
    const searchLower = searchQuery.toLowerCase();
    
    return (
      title.toLowerCase().includes(searchLower) ||
      content.toLowerCase().includes(searchLower) ||
      firstName.toLowerCase().includes(searchLower) ||
      lastName.toLowerCase().includes(searchLower) ||
      `${firstName} ${lastName}`.toLowerCase().includes(searchLower)
    );
  });

  // Skeleton components
  const renderNavSkeleton = () => (
    <nav className="bg-[#212122] py-4 px-6 flex justify-between items-center shadow-md sticky top-0 z-10">
      <div className="flex items-center space-x-2">
        <div className="bg-gray-700 rounded-md w-8 h-8 animate-pulse"></div>
        <div className="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
      </div>
      <div className="flex-1 mx-8 max-w-2xl">
        <div className="relative">
          <div className="w-full bg-gray-700 rounded-full py-2 px-4 pl-10 h-10 animate-pulse"></div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="h-6 bg-gray-700 rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    </nav>
  );

  const renderWelcomeSkeleton = () => (
    <div className="mb-8 space-y-2">
      <div className="h-8 bg-gray-700 rounded w-1/3 animate-pulse"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
    </div>
  );

  const renderPostSkeleton = () => (
    <div className="bg-[#212122] rounded-lg p-5 shadow-md">
      <div className="flex items-start mb-4">
        <div className="bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center mr-3 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3 animate-pulse"></div>
        </div>
      </div>
      <div className="h-5 bg-gray-700 rounded w-1/2 mb-3 animate-pulse"></div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-gray-700 rounded w-4/5 animate-pulse"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-600 pt-3">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="h-5 w-5 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="h-5 w-5 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeedSkeleton = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 bg-gray-700 rounded w-1/4 animate-pulse"></div>
        <div className="h-4 bg-gray-700 rounded w-1/5 animate-pulse"></div>
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i}>{renderPostSkeleton()}</div>
        ))}
      </div>
    </div>
  );

  const renderPaginationSkeleton = () => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-600">
      <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse"></div>
      <div className="flex items-center gap-2">
        <div className="h-10 bg-gray-700 rounded w-20 animate-pulse"></div>
        <div className="flex gap-1">
          <div className="h-10 bg-gray-700 rounded w-10 animate-pulse"></div>
          <div className="h-10 bg-gray-700 rounded w-10 animate-pulse"></div>
          <div className="h-10 bg-gray-700 rounded w-10 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-700 rounded w-20 animate-pulse"></div>
      </div>
    </div>
  );

  // Render full page skeleton during initial load
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-[#171819] text-white">
        {renderNavSkeleton()}
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          {renderWelcomeSkeleton()}
          {renderFeedSkeleton()}
          {renderPaginationSkeleton()}
        </main>
        <footer className="bg-[#212122] py-6 px-4 text-center">
          <div className="h-4 bg-gray-700 rounded w-1/3 mx-auto animate-pulse"></div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171819] text-white">
      {/* Navigation Bar */}
      {isLoading ? renderNavSkeleton() : (
        <nav className="bg-[#212122] py-4 px-6 flex justify-between items-center shadow-md sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <div className="bg-[#0A5BFF] w-8 h-8 rounded-md"></div>
            <h1 className="text-xl font-bold">CIAAN</h1>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 mx-8 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                className="w-full bg-[#2d2d2e] border border-gray-700 rounded-full py-2 px-4 pl-10 text-white focus:outline-none focus:ring-1 focus:ring-[#0A5BFF]"
                placeholder="Search posts, people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <button 
                  className="text-sm hover:underline"
                  onClick={() => goToProfile(user._id)}
                >
                  My Profile
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
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Welcome Message */}
        {user && (
          isLoading ? renderWelcomeSkeleton() : (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold">
                Welcome back, <span className="text-[#0A5BFF]">{user.firstName}</span>
              </h2>
              <p className="text-gray-400">What would you like to share today?</p>
            </div>
          )
        )}

        {/* Feed Section */}
        {isLoading ? renderFeedSkeleton() : (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Community Feed</h3>
              {!isLoading && totalPosts > 0 && (
                <p className="text-gray-400 text-sm">
                  Showing {((currentPage - 1) * postsPerPage) + 1}-{Math.min(currentPage * postsPerPage, totalPosts)} of {totalPosts} posts
                </p>
              )}
            </div>
            
            {filteredPosts.length === 0 ? (
              <div className="bg-[#212122] rounded-lg p-8 text-center">
                {searchQuery ? (
                  <p className="text-gray-400">No posts found for "{searchQuery}"</p>
                ) : (
                  <p className="text-gray-400">No posts yet. Be the first to share something!</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post) => {
                  const isLiked = likedPosts.has(post._id);
                  
                  return (
                    <div key={post._id} className="bg-[#212122] rounded-lg p-5 shadow-md transition-transform hover:scale-[1.01]">
                      <div className="flex items-start mb-4">
                        <div 
                          className="bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center mr-3 cursor-pointer"
                          onClick={() => goToProfile(post.author._id)}
                        >
                          <span className="font-semibold">{post.author?.firstName?.charAt(0) || 'U'}</span>
                        </div>
                        <div className="flex-1">
                          <div 
                            className="font-medium cursor-pointer hover:underline"
                            onClick={() => goToProfile(post.author._id)}
                          >
                            {post.author?.firstName || 'Unknown'}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {formatDate(post.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Post Title */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-[#0A5BFF]">
                          {post.title}
                        </h3>
                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                            Updated
                          </span>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-white">{post.content}</p>
                      </div>
                      
                      {/* Action Bar */}
                      <div className="flex items-center justify-between border-t border-gray-600 pt-3">
                        <div className="flex items-center space-x-6">
                          <button 
                            onClick={() => handleLike(post._id)}
                            className={`flex items-center space-x-2 transition-colors ${
                              isLiked 
                                ? 'text-red-400 hover:text-red-300' 
                                : 'text-gray-400 hover:text-red-400'
                            }`}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              fill={isLiked ? "currentColor" : "none"} 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{post.likeCount || 0} likes</span>
                          </button>
                          
                          <button 
                            onClick={() => toggleComments(post._id)}
                            className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post.commentCount || 0} comments</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Comments Section */}
                      {expandedComments[post._id] && (
                        <div className="mt-4 border-t border-gray-600 pt-4">
                          {/* Add Comment */}
                          <div className="mb-4">
                            <div className="flex space-x-3">
                              <div className="bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold">{user?.firstName?.charAt(0) || 'U'}</span>
                              </div>
                              <div className="flex-1">
                                <textarea
                                  className="w-full bg-[#2d2d2e] border border-gray-600 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#0A5BFF] resize-none"
                                  placeholder="Write a comment..."
                                  rows="2"
                                  maxLength={500}
                                  value={newComment[post._id] || ''}
                                  onChange={(e) => setNewComment(prev => ({ ...prev, [post._id]: e.target.value }))}
                                />
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-gray-400 text-xs">
                                    {(newComment[post._id] || '').length}/500
                                  </span>
                                  <button
                                    onClick={() => handleAddComment(post._id)}
                                    disabled={!newComment[post._id]?.trim()}
                                    className="bg-[#0A5BFF] text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Comment
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Comments List */}
                          {loadingComments[post._id] ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#0A5BFF]"></div>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {comments[post._id]?.map((comment) => (
                                <div key={comment._id} className="flex space-x-3">
                                  <div className="bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-semibold">{comment.author?.firstName?.charAt(0) || 'U'}</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="bg-[#2d2d2e] rounded-lg p-3">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm font-medium text-white">
                                          {comment.author?.firstName || 'Unknown'} {comment.author?.lastName || 'User'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {formatDate(comment.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-300">{comment.content}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {comments[post._id]?.length === 0 && (
                                <p className="text-gray-400 text-sm text-center py-4">No comments yet.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 ? (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-600">
            <div className="text-gray-400 text-sm">
              Page {currentPage} of {totalPages} • {totalPosts} total posts
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={!hasPrev}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !hasPrev
                    ? 'bg-[#2d2d2e] text-gray-600 cursor-not-allowed' 
                    : 'bg-[#2d2d2e] text-gray-300 hover:bg-gray-600'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {renderPageNumbers()}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={!hasNext}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !hasNext
                    ? 'bg-[#2d2d2e] text-gray-600 cursor-not-allowed' 
                    : 'bg-[#2d2d2e] text-gray-300 hover:bg-gray-600'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        ) : isLoading ? renderPaginationSkeleton() : null}
      </main>

      {/* Floating Action Button */}
      {user && (
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-8 right-8 bg-[#0A5BFF] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-transform hover:scale-110"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Create Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-[#212122] rounded-lg w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-bold mb-4">Create New Post</h2>
            
            <form onSubmit={handleCreatePost}>
              <input
                type="text"
                className="w-full bg-[#2d2d2e] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#0A5BFF] mb-3"
                placeholder="Post Title"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                maxLength={100}
                autoFocus
              />
              
              <textarea
                className="w-full bg-[#2d2d2e] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#0A5BFF] min-h-[150px]"
                placeholder="Share your thoughts..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                maxLength={1000}
              ></textarea>
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-gray-400 text-sm">
                  {newPostContent.length}/1000 characters
                </div>
                <button
                  type="submit"
                  className="bg-[#0A5BFF] text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                  disabled={!newPostTitle.trim() || !newPostContent.trim() || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Posting...
                    </div>
                  ) : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#212122] py-6 px-4 text-center text-gray-400 text-sm">
        <p>© 2023 CIAAN Community Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Homepage;