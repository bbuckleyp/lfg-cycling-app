import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { commentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  rideId: number;
  onCommentAdded: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ rideId, onCommentAdded }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const content = watch('content', '');

  const onSubmit = async (data: CommentFormData) => {
    if (!user) {
      setError('You must be logged in to comment');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await commentsApi.create(rideId, { content: data.content.trim() });
      reset();
      onCommentAdded();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600">
          <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </a>
          {' '}to join the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        {user.profilePhotoUrl ? (
          <img
            className="h-8 w-8 rounded-full"
            src={user.profilePhotoUrl}
            alt={`${user.firstName} ${user.lastName}`}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-600">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1">
          <div className="space-y-3">
            <textarea
              {...register('content')}
              placeholder="Share your thoughts about this ride..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={1000}
            />
            
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content.message}</p>
            )}
            
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {content.length}/1000 characters
              </span>
              
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentForm;