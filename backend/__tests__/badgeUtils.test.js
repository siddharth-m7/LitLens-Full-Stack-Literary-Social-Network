const { computeBadges, computeMilestones } = require('../utils/badgeUtils');

describe('computeMilestones', () => {
  it('returns all milestones locked when reviewCount is 0', () => {
    const result = computeMilestones(0);
    expect(result).toHaveLength(4);
    expect(result.every(m => m.unlocked === false)).toBe(true);
  });

  it('unlocks only the first milestone at reviewCount 1', () => {
    const result = computeMilestones(1);
    expect(result[0].unlocked).toBe(true);  // First Review
    expect(result[1].unlocked).toBe(false); // Book Worm (needs 5)
    expect(result[2].unlocked).toBe(false);
    expect(result[3].unlocked).toBe(false);
  });

  it('unlocks first two milestones at reviewCount 5', () => {
    const result = computeMilestones(5);
    expect(result[0].unlocked).toBe(true); // First Review
    expect(result[1].unlocked).toBe(true); // Book Worm
    expect(result[2].unlocked).toBe(false);
    expect(result[3].unlocked).toBe(false);
  });

  it('unlocks all milestones at reviewCount 25', () => {
    const result = computeMilestones(25);
    expect(result.every(m => m.unlocked === true)).toBe(true);
  });

  it('preserves milestone labels and emojis', () => {
    const result = computeMilestones(0);
    expect(result[0]).toMatchObject({ count: 1, label: 'First Review' });
    expect(result[3]).toMatchObject({ count: 25, label: 'Prolific Reviewer' });
  });
});

describe('computeBadges', () => {
  it('returns empty array when no conditions are met', () => {
    const badges = computeBadges({ reviewCount: 0, isEarlyAdopter: false, isTopReviewer: false });
    expect(badges).toEqual([]);
  });

  it('returns early_adopter badge when isEarlyAdopter is true', () => {
    const badges = computeBadges({ reviewCount: 0, isEarlyAdopter: true, isTopReviewer: false });
    expect(badges).toHaveLength(1);
    expect(badges[0].id).toBe('early_adopter');
  });

  it('returns book_worm badge when reviewCount >= 5', () => {
    const badges = computeBadges({ reviewCount: 5, isEarlyAdopter: false, isTopReviewer: false });
    expect(badges).toHaveLength(1);
    expect(badges[0].id).toBe('book_worm');
  });

  it('does not return book_worm when reviewCount is 4', () => {
    const badges = computeBadges({ reviewCount: 4, isEarlyAdopter: false, isTopReviewer: false });
    expect(badges.find(b => b.id === 'book_worm')).toBeUndefined();
  });

  it('returns top_reviewer badge when isTopReviewer is true', () => {
    const badges = computeBadges({ reviewCount: 0, isEarlyAdopter: false, isTopReviewer: true });
    expect(badges[0].id).toBe('top_reviewer');
  });

  it('returns all 3 badges when all conditions are met', () => {
    const badges = computeBadges({ reviewCount: 10, isEarlyAdopter: true, isTopReviewer: true });
    expect(badges).toHaveLength(3);
    const ids = badges.map(b => b.id);
    expect(ids).toContain('early_adopter');
    expect(ids).toContain('book_worm');
    expect(ids).toContain('top_reviewer');
  });
});
