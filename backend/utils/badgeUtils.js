const BADGES = {
  early_adopter: { id: 'early_adopter', label: 'Early Adopter', emoji: '🌱', desc: 'One of the first 50 members' },
  book_worm:     { id: 'book_worm',     label: 'Book Worm',     emoji: '📚', desc: 'Written 5+ reviews' },
  top_reviewer:  { id: 'top_reviewer',  label: 'Top Reviewer',  emoji: '🏆', desc: 'Top reviewer this month' },
};

const MILESTONES = [
  { count: 1,  label: 'First Review',      emoji: '✍️' },
  { count: 5,  label: 'Book Worm',         emoji: '📚' },
  { count: 10, label: 'Active Reader',     emoji: '🎯' },
  { count: 25, label: 'Prolific Reviewer', emoji: '🏆' },
];

function computeBadges({ reviewCount, isEarlyAdopter, isTopReviewer }) {
  const earned = [];
  if (isEarlyAdopter) earned.push(BADGES.early_adopter);
  if (reviewCount >= 5) earned.push(BADGES.book_worm);
  if (isTopReviewer) earned.push(BADGES.top_reviewer);
  return earned;
}

function computeMilestones(reviewCount) {
  return MILESTONES.map(m => ({ ...m, unlocked: reviewCount >= m.count }));
}

module.exports = { computeBadges, computeMilestones };
