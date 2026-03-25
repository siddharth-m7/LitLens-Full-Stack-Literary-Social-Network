import { useState } from 'react';

export default function BookCard({ book, onDelete, onEdit }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(book._id);
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
        <span key={i} className="text-amber-400 text-sm">★</span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-amber-400 text-sm">☆</span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300 text-sm">☆</span>
      );
    }

    return stars;
  };

  const truncateDescription = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const averageRating = book.averageRating ?? null;
  const reviewCount = book.reviewCount || 0;

  return (
    <div className="bg-white border border-[#E8E0CE] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">

      {/* Header: cover + title/author + action buttons */}
      <div className="flex items-start gap-3 mb-3">

        {/* Cover image or fallback */}
        <div className="flex-shrink-0">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-12 h-16 object-cover rounded-md border border-[#E8E0CE]"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-12 h-16 bg-[#F0EAD6] rounded-md items-center justify-center ${book.coverImage ? 'hidden' : 'flex'}`}
          >
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
          </div>
        </div>

        {/* Title + Author */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 mb-0.5">
            {book.title}
          </h2>
          <p className="text-gray-500 text-sm truncate">{book.author}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(book)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
              title="Edit book"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`p-1.5 rounded-lg transition-colors focus:outline-none ${
                isDeleting
                  ? 'text-red-300 cursor-not-allowed'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={isDeleting ? 'Deleting...' : 'Delete book'}
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
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {book.description && (
        <div className="mb-4">
          <p className="text-gray-500 text-sm leading-relaxed">
            {showFullDescription ? book.description : truncateDescription(book.description)}
          </p>
          {book.description.length > 120 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-gray-900 hover:text-gray-600 text-xs font-medium mt-1 transition-colors"
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Footer: rating + genre */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E8E0CE]">
        <div className="flex items-center gap-2">
          {averageRating !== null ? (
            <>
              <div className="flex items-center gap-0.5">
                {renderStars(averageRating)}
              </div>
              <span className="text-sm font-medium text-gray-700">{averageRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
            </>
          ) : (
            <span className="text-gray-400 text-xs italic">No ratings yet</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {book.genre && (
            <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">
              {book.genre}
            </span>
          )}
          {book.publishedYear && (
            <span className="text-xs text-gray-400">
              {book.publishedYear}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
