/**
 * The Nomad HQ Voting Service
 *
 * Handles community voting for city category scores.
 * Uses Supabase as backend with localStorage fallback.
 */

// ============================================
// CONFIGURATION
// ============================================

const VOTE_CONFIG = {
  maxAdjustment: 1.5,      // Maximum score adjustment (±1.5)
  confidenceThreshold: 50,  // Votes needed for full confidence
  cacheTimeout: 5 * 60 * 1000  // 5 minutes cache
};

// In-memory cache for vote aggregates
let voteCache = {
  data: {},
  timestamp: 0
};

// ============================================
// USER ID MANAGEMENT
// ============================================

/**
 * Get user ID for voting - uses Supabase user ID if authenticated,
 * otherwise falls back to a persistent localStorage ID
 */
function getVotingUserId() {
  // Try to get Supabase user ID first
  if (typeof NomadAuth !== 'undefined') {
    const userId = NomadAuth.getUserId();
    if (userId) {
      return userId;
    }
  }

  // Fallback: Check localStorage auth
  try {
    const auth = JSON.parse(localStorage.getItem('nomadcompass_auth'));
    if (auth && auth.userId) {
      return auth.userId;
    }
  } catch {
    // Ignore errors
  }

  // Last resort: Generate a persistent anonymous ID
  let anonId = localStorage.getItem('nomadcompass_voter_id');
  if (!anonId) {
    anonId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('nomadcompass_voter_id', anonId);
  }
  return anonId;
}

/**
 * Check if user is logged in
 */
function isUserLoggedIn() {
  // Check NomadAuth first
  if (typeof NomadAuth !== 'undefined') {
    return NomadAuth.isLoggedIn();
  }

  // Fallback to localStorage check
  try {
    const auth = JSON.parse(localStorage.getItem('nomadcompass_auth'));
    return auth && auth.loggedIn;
  } catch {
    return false;
  }
}

// ============================================
// SCORE CALCULATION
// ============================================

/**
 * Calculate adjusted score based on community votes
 *
 * Formula:
 *   adjustment = voteRatio * maxAdjustment * confidenceFactor
 *   adjustedScore = baseScore + adjustment (clamped to 1-10)
 *
 * @param {number} baseScore - Original score from cities-data.js (1-10)
 * @param {number} upvotes - Number of upvotes
 * @param {number} downvotes - Number of downvotes
 * @returns {object} { adjustedScore, adjustment, confidence }
 */
function calculateAdjustedScore(baseScore, upvotes = 0, downvotes = 0) {
  const totalVotes = upvotes + downvotes;

  if (totalVotes === 0) {
    return {
      adjustedScore: baseScore,
      adjustment: 0,
      confidence: 0,
      totalVotes: 0
    };
  }

  // Vote ratio: -1 (all downvotes) to +1 (all upvotes)
  const voteRatio = (upvotes - downvotes) / totalVotes;

  // Confidence factor: scales from 0 to 1 based on vote count
  const confidenceFactor = Math.min(totalVotes / VOTE_CONFIG.confidenceThreshold, 1);

  // Calculate adjustment
  const adjustment = voteRatio * VOTE_CONFIG.maxAdjustment * confidenceFactor;

  // Apply adjustment and clamp to valid range
  const adjustedScore = Math.max(1, Math.min(10, baseScore + adjustment));

  return {
    adjustedScore: Math.round(adjustedScore * 10) / 10, // Round to 1 decimal
    adjustment: Math.round(adjustment * 100) / 100,
    confidence: Math.round(confidenceFactor * 100),
    totalVotes
  };
}

/**
 * Calculate adjusted Nomad Score from adjusted category scores
 *
 * @param {object} city - City object with scores
 * @param {object} voteAggregates - Vote aggregates for city categories
 * @returns {number} Adjusted Nomad Score
 */
function calculateAdjustedNomadScore(city, voteAggregates = {}) {
  const categories = ['climate', 'cost', 'wifi', 'nightlife', 'nature',
                      'safety', 'food', 'community', 'english', 'visa',
                      'culture', 'cleanliness', 'airquality'];

  let totalScore = 0;
  categories.forEach(cat => {
    const baseScore = city.scores[cat] || 5;
    const votes = voteAggregates[cat] || { upvotes: 0, downvotes: 0 };
    const { adjustedScore } = calculateAdjustedScore(baseScore, votes.upvotes, votes.downvotes);
    totalScore += adjustedScore;
  });

  return Math.round((totalScore / categories.length) * 10) / 10;
}

// ============================================
// SUPABASE API FUNCTIONS
// ============================================

/**
 * Fetch vote aggregates for a single city
 *
 * @param {string} cityId - City ID
 * @returns {Promise<object>} Vote aggregates by category
 */
async function fetchVoteAggregates(cityId) {
  const client = getSupabase();

  if (!client || !isSupabaseConfigured()) {
    return getLocalVoteAggregates(cityId);
  }

  try {
    const { data, error } = await client
      .from('vote_aggregates')
      .select('*')
      .eq('city_id', cityId);

    if (error) throw error;

    // Convert to object keyed by category
    const aggregates = {};
    (data || []).forEach(row => {
      aggregates[row.category] = {
        upvotes: parseInt(row.upvotes) || 0,
        downvotes: parseInt(row.downvotes) || 0,
        totalVotes: parseInt(row.total_votes) || 0
      };
    });

    return aggregates;
  } catch (error) {
    console.error('Error fetching vote aggregates:', error);
    return getLocalVoteAggregates(cityId);
  }
}

/**
 * Fetch vote aggregates for all cities (for cities listing page)
 * Uses caching to reduce API calls
 *
 * @returns {Promise<object>} Vote aggregates keyed by city_id then category
 */
async function fetchAllVoteAggregates() {
  // Check cache first
  if (Date.now() - voteCache.timestamp < VOTE_CONFIG.cacheTimeout &&
      Object.keys(voteCache.data).length > 0) {
    return voteCache.data;
  }

  const client = getSupabase();

  if (!client || !isSupabaseConfigured()) {
    return getAllLocalVoteAggregates();
  }

  try {
    const { data, error } = await client
      .from('vote_aggregates')
      .select('*');

    if (error) throw error;

    // Group by city_id
    const aggregates = {};
    (data || []).forEach(row => {
      if (!aggregates[row.city_id]) {
        aggregates[row.city_id] = {};
      }
      aggregates[row.city_id][row.category] = {
        upvotes: parseInt(row.upvotes) || 0,
        downvotes: parseInt(row.downvotes) || 0,
        totalVotes: parseInt(row.total_votes) || 0
      };
    });

    // Update cache
    voteCache.data = aggregates;
    voteCache.timestamp = Date.now();

    return aggregates;
  } catch (error) {
    console.error('Error fetching all vote aggregates:', error);
    return getAllLocalVoteAggregates();
  }
}

/**
 * Submit a vote for a city category
 *
 * @param {string} cityId - City ID
 * @param {string} category - Category key
 * @param {number} vote - Vote value: 1 (upvote) or -1 (downvote)
 * @returns {Promise<object>} Result with success status
 */
async function submitVote(cityId, category, vote) {
  if (!isUserLoggedIn()) {
    return { success: false, error: 'Please sign in to vote' };
  }

  const userId = getVotingUserId();
  const client = getSupabase();

  if (!client || !isSupabaseConfigured()) {
    return submitLocalVote(cityId, category, vote, userId);
  }

  try {
    // Use upsert to handle both new votes and vote changes
    const { data, error } = await client
      .from('votes')
      .upsert({
        city_id: cityId,
        category: category,
        user_id: userId,
        vote: vote,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'city_id,category,user_id'
      });

    if (error) throw error;

    // Invalidate cache
    voteCache.timestamp = 0;

    // Also save locally for offline access
    saveLocalVote(cityId, category, vote, userId);

    return { success: true };
  } catch (error) {
    console.error('Error submitting vote:', error);
    // Fall back to local storage
    return submitLocalVote(cityId, category, vote, userId);
  }
}

/**
 * Remove a vote (toggle off)
 *
 * @param {string} cityId - City ID
 * @param {string} category - Category key
 * @returns {Promise<object>} Result with success status
 */
async function removeVote(cityId, category) {
  const userId = getVotingUserId();
  const client = getSupabase();

  if (!client || !isSupabaseConfigured()) {
    return removeLocalVote(cityId, category, userId);
  }

  try {
    const { error } = await client
      .from('votes')
      .delete()
      .eq('city_id', cityId)
      .eq('category', category)
      .eq('user_id', userId);

    if (error) throw error;

    // Invalidate cache
    voteCache.timestamp = 0;

    // Also remove locally
    removeLocalVote(cityId, category, userId);

    return { success: true };
  } catch (error) {
    console.error('Error removing vote:', error);
    return removeLocalVote(cityId, category, userId);
  }
}

/**
 * Get current user's votes for a city
 *
 * @param {string} cityId - City ID
 * @returns {Promise<object>} User votes by category
 */
async function getUserVotes(cityId) {
  const userId = getVotingUserId();
  const client = getSupabase();

  if (!client || !isSupabaseConfigured()) {
    return getLocalUserVotes(cityId, userId);
  }

  try {
    const { data, error } = await client
      .from('votes')
      .select('category, vote')
      .eq('city_id', cityId)
      .eq('user_id', userId);

    if (error) throw error;

    const votes = {};
    (data || []).forEach(row => {
      votes[row.category] = row.vote;
    });

    return votes;
  } catch (error) {
    console.error('Error fetching user votes:', error);
    return getLocalUserVotes(cityId, userId);
  }
}

// ============================================
// LOCAL STORAGE FALLBACK
// ============================================

/**
 * Get localStorage key for votes
 */
function getLocalVotesKey(cityId) {
  return `nomadcompass_votes_${cityId}`;
}

/**
 * Save vote to localStorage
 */
function saveLocalVote(cityId, category, vote, userId) {
  const key = getLocalVotesKey(cityId);
  const data = JSON.parse(localStorage.getItem(key) || '{}');

  if (!data.votes) data.votes = {};
  if (!data.userVotes) data.userVotes = {};

  // Track user's vote
  const prevVote = data.userVotes[userId]?.[category];
  if (!data.userVotes[userId]) data.userVotes[userId] = {};
  data.userVotes[userId][category] = vote;

  // Update aggregates
  if (!data.votes[category]) {
    data.votes[category] = { upvotes: 0, downvotes: 0 };
  }

  // Remove previous vote from aggregates
  if (prevVote === 1) data.votes[category].upvotes--;
  if (prevVote === -1) data.votes[category].downvotes--;

  // Add new vote
  if (vote === 1) data.votes[category].upvotes++;
  if (vote === -1) data.votes[category].downvotes++;

  localStorage.setItem(key, JSON.stringify(data));

  return { success: true };
}

/**
 * Submit vote using localStorage only
 */
function submitLocalVote(cityId, category, vote, userId) {
  return saveLocalVote(cityId, category, vote, userId);
}

/**
 * Remove vote from localStorage
 */
function removeLocalVote(cityId, category, userId) {
  const key = getLocalVotesKey(cityId);
  const data = JSON.parse(localStorage.getItem(key) || '{}');

  if (data.userVotes?.[userId]?.[category]) {
    const prevVote = data.userVotes[userId][category];

    // Remove from aggregates
    if (data.votes?.[category]) {
      if (prevVote === 1) data.votes[category].upvotes--;
      if (prevVote === -1) data.votes[category].downvotes--;
    }

    delete data.userVotes[userId][category];
    localStorage.setItem(key, JSON.stringify(data));
  }

  return { success: true };
}

/**
 * Get vote aggregates from localStorage
 */
function getLocalVoteAggregates(cityId) {
  const key = getLocalVotesKey(cityId);
  const data = JSON.parse(localStorage.getItem(key) || '{}');

  const aggregates = {};
  if (data.votes) {
    Object.keys(data.votes).forEach(cat => {
      aggregates[cat] = {
        upvotes: data.votes[cat].upvotes || 0,
        downvotes: data.votes[cat].downvotes || 0,
        totalVotes: (data.votes[cat].upvotes || 0) + (data.votes[cat].downvotes || 0)
      };
    });
  }

  return aggregates;
}

/**
 * Get all vote aggregates from localStorage
 */
function getAllLocalVoteAggregates() {
  const aggregates = {};
  const prefix = 'nomadcompass_votes_';

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(prefix)) {
      const cityId = key.replace(prefix, '');
      aggregates[cityId] = getLocalVoteAggregates(cityId);
    }
  }

  return aggregates;
}

/**
 * Get user's votes from localStorage
 */
function getLocalUserVotes(cityId, userId) {
  const key = getLocalVotesKey(cityId);
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  return data.userVotes?.[userId] || {};
}

// ============================================
// EXPORTS (for use in other scripts)
// ============================================

// Make functions available globally
window.VotingService = {
  calculateAdjustedScore,
  calculateAdjustedNomadScore,
  fetchVoteAggregates,
  fetchAllVoteAggregates,
  submitVote,
  removeVote,
  getUserVotes,
  isUserLoggedIn,
  getVotingUserId,
  VOTE_CONFIG
};
