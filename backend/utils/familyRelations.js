/**
 * Family relationship helper functions
 * These functions derive relationships dynamically from the family member schema
 */

/**
 * Get parents of a family member
 * @param {Array} allMembers - All family members
 * @param {Number} memberId - The member's ID
 * @returns {Array} Array of parent members
 */
export const getParents = (allMembers, memberId) => {
  const member = allMembers.find(m => m.id === memberId);
  if (!member || !member.parentId) return [];

  const parent = allMembers.find(m => m.id === member.parentId);
  if (!parent) return [];

  // If parent has a spouse, return both
  if (parent.spouseId) {
    const spouse = allMembers.find(m => m.id === parent.spouseId);
    return spouse ? [parent, spouse] : [parent];
  }

  return [parent];
};

/**
 * Get spouse of a family member
 * @param {Array} allMembers - All family members
 * @param {Number} memberId - The member's ID
 * @returns {Object|null} Spouse member or null
 */
export const getSpouse = (allMembers, memberId) => {
  const member = allMembers.find(m => m.id === memberId);
  if (!member || !member.spouseId) return null;

  return allMembers.find(m => m.id === member.spouseId) || null;
};

/**
 * Get children of a family member
 * @param {Array} allMembers - All family members
 * @param {Number} memberId - The member's ID
 * @returns {Array} Array of child members
 */
export const getChildren = (allMembers, memberId) => {
  return allMembers.filter(m => m.parentId === memberId);
};

/**
 * Get siblings of a family member
 * @param {Array} allMembers - All family members
 * @param {Number} memberId - The member's ID
 * @returns {Array} Array of sibling members
 */
export const getSiblings = (allMembers, memberId) => {
  const member = allMembers.find(m => m.id === memberId);
  if (!member || !member.parentId) return [];

  return allMembers.filter(m => 
    m.id !== memberId && 
    m.parentId === member.parentId
  );
};

/**
 * Get anniversary date from spouse relationship
 * @param {Array} allMembers - All family members
 * @param {Number} memberId - The member's ID
 * @returns {String|null} Anniversary date (YYYY-MM-DD) or null
 */
export const getAnniversaryDate = (allMembers, memberId) => {
  const member = allMembers.find(m => m.id === memberId);
  if (!member || !member.spouseId) return null;

  const spouse = allMembers.find(m => m.id === member.spouseId);
  if (!spouse) return null;

  // Use the earlier birth date as anniversary reference
  // In real scenarios, you might want to store actual wedding date
  const memberBirth = new Date(member.birthDate);
  const spouseBirth = new Date(spouse.birthDate);
  
  // For demo purposes, use a calculated date
  // In production, you'd want to store actual wedding date
  const earlierDate = memberBirth < spouseBirth ? memberBirth : spouseBirth;
  const anniversaryDate = new Date(earlierDate);
  anniversaryDate.setFullYear(earlierDate.getFullYear() + 25); // Example: 25 years after birth
  
  return anniversaryDate.toISOString().split('T')[0];
};

