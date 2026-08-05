import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const tokenExists = Boolean(localStorage.getItem('token'));

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: tokenExists, // start loading true if token exists so ProtectedRoute doesn't redirect early
  unreadNotificationsCount: 0,
  settings: null,
  settingsLoading: false,
};

// Async thunks for Settings
export const fetchSettings = createAsyncThunk('auth/fetchSettings', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/api/settings');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch settings');
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data.data;
  } catch (error) {
    // If token is invalid or expired, remove it
    localStorage.removeItem('token');
    return rejectWithValue(error.response?.data?.message || 'Failed to load user');
  }
});

export const updateSettings = createAsyncThunk('auth/updateSettings', async (updates, { rejectWithValue }) => {
  try {
    const response = await api.put('/api/settings', updates);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update settings');
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      // login logic placeholder
    },
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.unreadNotificationsCount = 0;
    },
    updateSavedPosts: (state, action) => {
      if (state.user) {
        state.user.savedPosts = action.payload;
      }
    },
    updateFollowing: (state, action) => {
      if (state.user) {
        state.user.following = action.payload;
      }
    },
    updateBlockedUsers: (state, action) => {
      if (state.user) {
        state.user.blockedUsers = action.payload;
      }
    },
    updateMutedUsers: (state, action) => {
      if (state.user) {
        state.user.mutedUsers = action.payload;
      }
    },
    updateRestrictedUsers: (state, action) => {
      if (state.user) {
        state.user.restrictedUsers = action.payload;
      }
    },
    updateCloseFriends: (state, action) => {
      if (state.user) {
        state.user.closeFriends = action.payload;
      }
    },
    updateUserRelations: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setUnreadNotificationsCount: (state, action) => {
      state.unreadNotificationsCount = action.payload;
    },
    incrementUnreadCount: (state) => {
      state.unreadNotificationsCount = state.unreadNotificationsCount + 1;
    },
    decrementUnreadCount: (state) => {
      state.unreadNotificationsCount = Math.max(0, state.unreadNotificationsCount - 1);
    },
    clearUnreadCount: (state) => {
      state.unreadNotificationsCount = 0;
    },
    optimisticUpdateSetting: (state, action) => {
      if (state.settings) {
        // Handle nested settings (e.g., { privacy: { isPrivate: true } })
        const updates = action.payload;
        for (const category in updates) {
          if (typeof updates[category] === 'object' && !Array.isArray(updates[category])) {
            if (!state.settings[category]) state.settings[category] = {};
            for (const key in updates[category]) {
              state.settings[category][key] = updates[category][key];
            }
          } else {
            state.settings[category] = updates[category];
          }
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(fetchSettings.pending, (state) => {
        state.settingsLoading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state) => {
        state.settingsLoading = false;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  logout, 
  updateSavedPosts, 
  updateFollowing,
  updateBlockedUsers,
  updateMutedUsers,
  updateRestrictedUsers,
  updateCloseFriends,
  updateUserRelations,
  setUnreadNotificationsCount,
  incrementUnreadCount,
  decrementUnreadCount,
  clearUnreadCount,
  optimisticUpdateSetting
} = authSlice.actions;
export default authSlice.reducer;
