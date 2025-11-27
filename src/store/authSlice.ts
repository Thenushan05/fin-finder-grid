import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authLogin, authRegister, authMe } from "@/services/api";

type User = {
  id: number;
  email: string;
  is_active?: boolean;
  role?: string;
} | null;

export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    thunkAPI
  ) => {
    try {
      const data = await authLogin(email, password);
      // If backend returns access_token, store it (dev fallback)
      if (data && data.access_token)
        localStorage.setItem("access_token", data.access_token);
      // Fetch /me to populate user profile
      try {
        const me = await authMe();
        return me;
      } catch (e) {
        return null;
      }
    } catch (error: any) {
      // Extract error message from response (backend sends as "error" field)
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.message ||
        "Login failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    {
      name,
      email,
      password,
    }: { name?: string | null; email: string; password: string },
    thunkAPI
  ) => {
    try {
      const data = await authRegister(name || null, email, password);
      if (data && data.access_token)
        localStorage.setItem("access_token", data.access_token);
      try {
        const me = await authMe();
        return me;
      } catch (e) {
        return null;
      }
    } catch (error: any) {
      // Extract error message from response (backend sends as "error" field)
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.message ||
        "Registration failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState: {
  user: User;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
} = {
  user: null,
  status: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      try {
        localStorage.removeItem("access_token");
      } catch (e) {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
        state.status = "succeeded";
        state.user = action.payload || null;
        state.error = undefined;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) || action.error?.message || "Login failed";
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<any>) => {
        state.status = "succeeded";
        state.user = action.payload || null;
        state.error = undefined;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ||
          action.error?.message ||
          "Registration failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
