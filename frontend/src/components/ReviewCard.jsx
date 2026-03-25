import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function ReviewCard({ review, onEdit, onDelete }) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(review._id);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-amber-400 text-lg">★</span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-amber-300 text-lg">☆</span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-amber-300 opacity-40 text-lg">☆</span>
      );
    }

    return stars;
  };

  return (
    <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 mb-4">

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        {/* Rating section */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-0.5">
              {renderStars(review.rating)}
            </div>
            <span className="text-sm font-semibold text-gray-700 bg-[#F0EAD6] px-2 py-0.5 rounded-md">
              {review.rating}/5
            </span>
          </div>

          {/* User info if available */}
          {review.userName && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-5 h-5 bg-[#F0EAD6] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium text-gray-700">{review.userName}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {user && review.user === user.id && (
          <div className="flex items-center space-x-2 sm:space-x-2">
            <button
              onClick={() => onEdit(review)}
              className="flex items-center space-x-1 border border-gray-900 text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`flex items-center space-x-1 border border-red-300 text-red-600 px-3 py-2 rounded-lg transition-colors text-sm font-medium focus:outline-none ${
                isDeleting
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-red-50'
              }`}
            >
              {isDeleting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              <span className="hidden sm:inline">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Review comment */}
      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
        {review.comment}
      </p>

      {/* Review date if available */}
      {review.createdAt && (
        <div className="mt-4 pt-3 border-t border-[#E8E0CE]">
          <p className="text-xs text-gray-400">
            Reviewed on {new Date(review.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      )}
    </div>
  );
}
