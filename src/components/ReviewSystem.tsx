"use client"
import React, { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';

interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewType: 'CLIENT_TO_THERAPIST' | 'THERAPIST_TO_CLIENT';
  helpfulCount: number;
  createdAt: string;
  reviewer: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  booking: {
    serviceType: string;
    scheduledDate: string;
  };
}


export const ReviewSystem: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const markAsHelpful = async (reviewId: number) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, helpfulCount: review.helpfulCount + 1 }
            : review
        ));
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'received'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Полученные отзывы
        </button>
        <button
          onClick={() => setActiveTab('given')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'given'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Оставленные отзывы
        </button>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={review.reviewer.avatarUrl || '/default-avatar.png'}
                  alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {review.reviewer.firstName} {review.reviewer.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {review.booking.serviceType} • {formatDate(review.booking.scheduledDate)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {renderStars(review.rating)}
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(review.createdAt)}
                </p>
              </div>
            </div>

            {review.comment && (
              <p className="mt-3 text-gray-700 leading-relaxed">
                {review.comment}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                review.reviewType === 'CLIENT_TO_THERAPIST'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {review.reviewType === 'CLIENT_TO_THERAPIST' 
                  ? 'От клиента' 
                  : 'От массажиста'}
              </span>

              <button
                onClick={() => markAsHelpful(review.id)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Полезно ({review.helpfulCount})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
