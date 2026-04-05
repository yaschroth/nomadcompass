/**
 * NOMADCOMPASS - AUTH STATE MANAGEMENT (Supabase)
 *
 * This script handles site-wide authentication using Supabase Auth.
 * Import this file on every page to enable:
 * - Nav state updates (login/logout button)
 * - Protected features (voting, saving)
 * - User personalization
 */

(function() {
  'use strict';

  // ============================================
  // AUTH STATE
  // ============================================

  let currentUser = null;
  let currentProfile = null;

  /**
   * Initialize Supabase auth listener
   */
  async function initAuth() {
    const client = getSupabase();
    if (!client) {
      // Fallback to localStorage auth if Supabase not configured
      initLocalAuth();
      return;
    }

    // Check current session
    const { data: { session } } = await client.auth.getSession();
    if (session) {
      currentUser = session.user;
      await loadProfile(session.user.id);
      syncToLocalStorage();
    }

    // Listen for auth changes
    client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        await loadProfile(session.user.id);
        syncToLocalStorage();
        updateNav();
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;
        localStorage.removeItem('nomadcompass_auth');
        updateNav();
      }
    });

    updateNav();
  }

  /**
   * Load user profile from Supabase
   */
  async function loadProfile(userId) {
    const client = getSupabase();
    if (!client) return;

    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        currentProfile = data;
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  }

  /**
   * Sync auth state to localStorage for backward compatibility
   */
  function syncToLocalStorage() {
    if (currentUser) {
      const authData = {
        loggedIn: true,
        name: currentProfile?.name || currentUser.email,
        email: currentUser.email,
        userId: currentUser.id,
        timezone: currentProfile?.timezone || 0,
        avatarUrl: currentProfile?.avatar_url || null
      };
      localStorage.setItem('nomadcompass_auth', JSON.stringify(authData));
    }
  }

  /**
   * Fallback to localStorage auth (when Supabase not configured)
   */
  function initLocalAuth() {
    const auth = getLocalAuthState();
    if (auth) {
      currentUser = { id: auth.userId || 'local-user', email: auth.email || auth.name };
      currentProfile = { name: auth.name, timezone: auth.timezone };
    }
    updateNav();
  }

  /**
   * Gets the current auth state from localStorage (fallback)
   */
  function getLocalAuthState() {
    try {
      const auth = JSON.parse(localStorage.getItem('nomadcompass_auth'));
      if (auth && auth.loggedIn) {
        return auth;
      }
    } catch (e) {
      localStorage.removeItem('nomadcompass_auth');
    }
    return null;
  }

  /**
   * Gets the current auth state
   */
  function getAuthState() {
    if (currentUser) {
      return {
        loggedIn: true,
        name: currentProfile?.name || currentUser.email,
        email: currentUser.email,
        userId: currentUser.id,
        timezone: currentProfile?.timezone || 0,
        avatarUrl: currentProfile?.avatar_url || null
      };
    }
    return getLocalAuthState();
  }

  /**
   * Checks if user is currently logged in
   */
  function isLoggedIn() {
    return currentUser !== null || getLocalAuthState() !== null;
  }

  /**
   * Gets the user's display name
   */
  function getUserName() {
    if (currentProfile?.name) return currentProfile.name;
    if (currentUser?.email) return currentUser.email;
    const auth = getLocalAuthState();
    return auth ? auth.name : null;
  }

  /**
   * Gets the user's ID
   */
  function getUserId() {
    if (currentUser?.id) return currentUser.id;
    const auth = getLocalAuthState();
    return auth?.userId || null;
  }

  /**
   * Sign up a new user
   */
  async function signUp(email, password, name, timezone) {
    const client = getSupabase();
    if (!client || !isSupabaseConfigured()) {
      // Fallback to localStorage
      const authData = {
        loggedIn: true,
        name: name,
        email: email,
        userId: 'local_' + Date.now(),
        timezone: timezone
      };
      localStorage.setItem('nomadcompass_auth', JSON.stringify(authData));
      return { success: true };
    }

    const { data, error } = await client.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Update profile with timezone
    if (data.user) {
      await client
        .from('profiles')
        .update({ timezone: timezone, name: name })
        .eq('id', data.user.id);
    }

    return { success: true, user: data.user };
  }

  /**
   * Sign in an existing user
   */
  async function signIn(email, password) {
    const client = getSupabase();
    if (!client || !isSupabaseConfigured()) {
      // Fallback to localStorage check
      const auth = getLocalAuthState();
      if (auth && auth.email === email) {
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  }

  /**
   * Logs the user out
   */
  async function logout() {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      await client.auth.signOut();
    }
    currentUser = null;
    currentProfile = null;
    localStorage.removeItem('nomadcompass_auth');
    window.location.reload();
  }

  /**
   * Update user profile
   */
  async function updateProfile(updates) {
    const client = getSupabase();
    if (!client || !currentUser) return { success: false };

    const { error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', currentUser.id);

    if (!error) {
      currentProfile = { ...currentProfile, ...updates };
      syncToLocalStorage();
      return { success: true };
    }

    return { success: false, error: error.message };
  }

  // ============================================
  // NAV UPDATE
  // ============================================

  /**
   * Updates the navigation to reflect auth state
   */
  function updateNav() {
    // Update desktop nav
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      updateNavActions(navActions);
    }

    // Update mobile nav
    const mobileActions = document.querySelector('.nav-mobile-actions');
    if (mobileActions) {
      updateMobileNavActions(mobileActions);
    }

    // Mark auth state as ready to show nav buttons (prevents flash)
    document.documentElement.classList.add('auth-ready');
  }

  function updateNavActions(navActions) {
    const auth = getAuthState();

    if (auth && auth.loggedIn) {
      const initials = getInitials(auth.name);
      const avatarUrl = auth.avatarUrl || currentProfile?.avatar_url;
      const avatarContent = avatarUrl
        ? `<img src="${escapeHtml(avatarUrl)}" alt="" class="nav-avatar-img">`
        : `<span class="nav-avatar-initials">${escapeHtml(initials)}</span>`;

      navActions.innerHTML = `
        <a href="profile.html" class="nav-user-btn">
          <span class="nav-avatar">${avatarContent}</span>
          <span class="nav-user-name">${escapeHtml(getDisplayName(auth.name))}</span>
        </a>
        <button class="nav-logout-btn" type="button" title="Log out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      `;

      const logoutBtn = navActions.querySelector('.nav-logout-btn');
      logoutBtn.addEventListener('click', logout);
    } else {
      navActions.innerHTML = `
        <a href="login.html" class="nav-login">Login</a>
        <a href="signup.html" class="btn btn-primary nav-signup">Sign Up</a>
      `;
    }
  }

  function updateMobileNavActions(mobileActions) {
    const auth = getAuthState();

    if (auth && auth.loggedIn) {
      const initials = getInitials(auth.name);
      const avatarUrl = auth.avatarUrl || currentProfile?.avatar_url;
      const avatarContent = avatarUrl
        ? `<img src="${escapeHtml(avatarUrl)}" alt="" class="nav-avatar-img">`
        : `<span class="nav-avatar-initials">${escapeHtml(initials)}</span>`;

      mobileActions.innerHTML = `
        <a href="profile.html" class="nav-user-btn nav-user-btn-mobile">
          <span class="nav-avatar nav-avatar-lg">${avatarContent}</span>
          <span class="nav-user-name">${escapeHtml(getDisplayName(auth.name))}</span>
        </a>
        <button class="btn btn-secondary nav-logout-btn-mobile" type="button">Log Out</button>
      `;

      const logoutBtn = mobileActions.querySelector('.nav-logout-btn-mobile');
      logoutBtn.addEventListener('click', logout);
    } else {
      mobileActions.innerHTML = `
        <a href="login.html" class="btn btn-secondary">Login</a>
        <a href="signup.html" class="btn btn-primary">Sign Up</a>
      `;
    }
  }

  /**
   * Gets initials from name
   */
  function getInitials(name) {
    if (!name) return '?';
    if (name.includes('@')) {
      return name.split('@')[0].charAt(0).toUpperCase();
    }
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  /**
   * Escapes HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Gets a friendly display name from email or name
   */
  function getDisplayName(name) {
    if (!name) return 'User';
    if (name.includes('@')) {
      return name.split('@')[0];
    }
    return name.split(' ')[0];
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    initAuth();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose auth functions globally
  window.NomadAuth = {
    isLoggedIn,
    getUserName,
    getUserId,
    getAuthState,
    signUp,
    signIn,
    logout,
    updateProfile
  };

})();
