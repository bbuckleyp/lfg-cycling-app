import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { commentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { CommentWithUser } from '../types/comment';

interface CommentListProps {
  rideId: number;
  onCommentAdded: () => void;
}

const CommentList: React.FC<CommentListProps> = ({ rideId, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await commentsApi.getRideComments(rideId);
      setComments(response.comments);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [rideId, onCommentAdded]);

  const handleEdit = (comment: CommentWithUser) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    try {
      setIsUpdating(true);
      await commentsApi.update(commentId, { content: editContent.trim() });
      setEditingComment(null);
      setEditContent('');
      await fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update comment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsApi.delete(commentId);
      await fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {comment.user.profilePhotoUrl ? (
                <img
                  className="h-8 w-8 rounded-full"
                  src={comment.user.profilePhotoUrl}
                  alt={`${comment.user.firstName} ${comment.user.lastName}`}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {comment.user.firstName[0]}{comment.user.lastName[0]}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {comment.user.firstName} {comment.user.lastName}
                  </span>
                  {comment.user.experienceLevel && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {comment.user.experienceLevel}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(comment.createdAt)}
                  {comment.createdAt !== comment.updatedAt && ' (edited)'}
                </span>
              </div>
            </div>
            
            {user?.id === comment.userId && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(comment)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Edit comment"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-gray-400 hover:text-red-600"
                  title="Delete comment"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-3">
            {editingComment === comment.id ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateComment(comment.id)}
                    disabled={isUpdating || !editContent.trim()}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;