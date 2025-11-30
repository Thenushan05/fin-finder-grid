import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE,
  timeout: 30_000,
  withCredentials: true,
});

// Attach token from localStorage
api.interceptors.request.use((cfg) => {
  try {
    const token = localStorage.getItem("access_token");
    if (token && cfg.headers) cfg.headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {
    // ignore
  }
  return cfg;
});

// ========== NEW Types for Rules-Based System ==========

export interface MaintenanceRule {
  id?: string;
  system_id: string;
  part_name: string;
  trigger_type: "hours" | "days" | "trips" | "sensor";
  interval_value: number;
  warning_before: number;
  description?: string;
  created_at?: string;
}

export interface VesselState {
  vessel_id: string;
  engine_hours: number;
  total_trips: number;
  last_trip_date?: string;
  sensor_data?: Record<string, any>;
  updated_at?: string;
}

export interface MaintenanceLog {
  id?: string;
  vessel_id: string;
  system_id: string;
  part_name: string;
  done_at: string;
  technician: string;
  notes: string;
  cost?: string;
  engine_hours_at_service?: number;
  trips_at_service?: number;
  created_at?: string;
}

export interface PartMaintenanceStatus {
  name: string;
  status: "ok" | "due_soon" | "overdue";
  trigger_type: string;
  current_value?: number;
  due_at_value?: number;
  remaining?: number;
  message?: string;
  last_service?: MaintenanceLog;
}

export interface SystemMaintenanceStatus {
  system_id: string;
  system_name: string;
  status: "operational" | "due_soon" | "overdue" | "critical" | "offline";
  parts: PartMaintenanceStatus[];
  summary_message?: string;
}

export interface VesselMaintenanceSummary {
  vessel_id: string;
  vessel_name: string;
  state: VesselState;
  systems: SystemMaintenanceStatus[];
  overall_status:
    | "operational"
    | "due_soon"
    | "overdue"
    | "critical"
    | "offline";
  generated_at: string;
}

interface MaintenanceRulesState {
  rules: MaintenanceRule[];
  vesselStates: Record<string, VesselState>; // vessel_id -> state
  summaries: Record<string, VesselMaintenanceSummary>; // vessel_id -> summary
  logs: Record<string, MaintenanceLog[]>; // vessel_id -> logs
  loading: boolean;
  error: string | null;
}

const initialState: MaintenanceRulesState = {
  rules: [],
  vesselStates: {},
  summaries: {},
  logs: {},
  loading: false,
  error: null,
};

// ========== Async Thunks ==========

export const fetchRules = createAsyncThunk(
  "maintenanceRules/fetchRules",
  async (systemId?: string, { rejectWithValue }) => {
    try {
      const params = systemId ? { system_id: systemId } : {};
      const response = await api.get("/api/v1/maintenance-rules/rules", {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error("fetchRules error:", error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch rules";
      return rejectWithValue(errorMsg);
    }
  }
);

export const createRule = createAsyncThunk(
  "maintenanceRules/createRule",
  async (
    rule: Omit<MaintenanceRule, "id" | "created_at">,
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/api/v1/maintenance-rules/rules", rule);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create rule"
      );
    }
  }
);

export const updateRule = createAsyncThunk(
  "maintenanceRules/updateRule",
  async (
    { ruleId, updates }: { ruleId: string; updates: Partial<MaintenanceRule> },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(
        `/api/v1/maintenance-rules/rules/${ruleId}`,
        updates
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update rule"
      );
    }
  }
);

export const deleteRule = createAsyncThunk(
  "maintenanceRules/deleteRule",
  async (ruleId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/v1/maintenance-rules/rules/${ruleId}`);
      return ruleId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete rule"
      );
    }
  }
);

export const fetchVesselState = createAsyncThunk(
  "maintenanceRules/fetchVesselState",
  async (vesselId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/maintenance-rules/vessels/${vesselId}/state`
      );
      return { vesselId, state: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch vessel state"
      );
    }
  }
);

export const updateVesselState = createAsyncThunk(
  "maintenanceRules/updateVesselState",
  async (
    { vesselId, updates }: { vesselId: string; updates: Partial<VesselState> },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch(
        `/api/v1/maintenance-rules/vessels/${vesselId}/state`,
        updates
      );
      return { vesselId, state: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update vessel state"
      );
    }
  }
);

export const completeTrip = createAsyncThunk(
  "maintenanceRules/completeTrip",
  async (
    {
      vesselId,
      tripDurationHours,
      tripDate,
    }: { vesselId: string; tripDurationHours: number; tripDate: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(
        `/api/v1/maintenance-rules/vessels/${vesselId}/complete-trip`,
        null,
        {
          params: {
            trip_duration_hours: tripDurationHours,
            trip_date: tripDate,
          },
        }
      );
      return { vesselId, state: response.data.state };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to complete trip"
      );
    }
  }
);

export const fetchMaintenanceLogs = createAsyncThunk(
  "maintenanceRules/fetchMaintenanceLogs",
  async (
    {
      vesselId,
      systemId,
      partName,
    }: { vesselId: string; systemId?: string; partName?: string },
    { rejectWithValue }
  ) => {
    try {
      const params: any = {};
      if (systemId) params.system_id = systemId;
      if (partName) params.part_name = partName;
      const response = await api.get(
        `/api/v1/maintenance-rules/vessels/${vesselId}/logs`,
        { params }
      );
      return { vesselId, logs: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch maintenance logs"
      );
    }
  }
);

export const logMaintenance = createAsyncThunk(
  "maintenanceRules/logMaintenance",
  async (
    {
      vesselId,
      log,
    }: {
      vesselId: string;
      log: Omit<MaintenanceLog, "id" | "vessel_id" | "created_at">;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(
        `/api/v1/maintenance-rules/vessels/${vesselId}/logs`,
        log
      );
      return { vesselId, log: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to log maintenance"
      );
    }
  }
);

export const fetchMaintenanceSummary = createAsyncThunk(
  "maintenanceRules/fetchMaintenanceSummary",
  async (vesselId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/maintenance-rules/vessels/${vesselId}/summary`
      );
      return { vesselId, summary: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch maintenance summary"
      );
    }
  }
);

export const seedDefaultRules = createAsyncThunk(
  "maintenanceRules/seedDefaultRules",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/v1/maintenance-rules/seed-default-rules"
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to seed default rules"
      );
    }
  }
);

// ========== Slice ==========

const maintenanceRulesSlice = createSlice({
  name: "maintenanceRules",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Rules
    builder.addCase(fetchRules.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRules.fulfilled, (state, action) => {
      state.loading = false;
      state.rules = action.payload;
    });
    builder.addCase(fetchRules.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Rule
    builder.addCase(createRule.fulfilled, (state, action) => {
      state.rules.push(action.payload);
    });

    // Update Rule
    builder.addCase(updateRule.fulfilled, (state, action) => {
      const index = state.rules.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.rules[index] = action.payload;
      }
    });

    // Delete Rule
    builder.addCase(deleteRule.fulfilled, (state, action) => {
      state.rules = state.rules.filter((r) => r.id !== action.payload);
    });

    // Fetch Vessel State
    builder.addCase(fetchVesselState.fulfilled, (state, action) => {
      state.vesselStates[action.payload.vesselId] = action.payload.state;
    });

    // Update Vessel State
    builder.addCase(updateVesselState.fulfilled, (state, action) => {
      state.vesselStates[action.payload.vesselId] = action.payload.state;
    });

    // Complete Trip
    builder.addCase(completeTrip.fulfilled, (state, action) => {
      state.vesselStates[action.payload.vesselId] = action.payload.state;
    });

    // Fetch Maintenance Logs
    builder.addCase(fetchMaintenanceLogs.fulfilled, (state, action) => {
      state.logs[action.payload.vesselId] = action.payload.logs;
    });

    // Log Maintenance
    builder.addCase(logMaintenance.fulfilled, (state, action) => {
      const { vesselId, log } = action.payload;
      if (!state.logs[vesselId]) {
        state.logs[vesselId] = [];
      }
      state.logs[vesselId].unshift(log); // Add to front (most recent first)
    });

    // Fetch Maintenance Summary
    builder.addCase(fetchMaintenanceSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMaintenanceSummary.fulfilled, (state, action) => {
      state.loading = false;
      state.summaries[action.payload.vesselId] = action.payload.summary;
    });
    builder.addCase(fetchMaintenanceSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Seed Default Rules
    builder.addCase(seedDefaultRules.fulfilled, (state) => {
      // After seeding, rules should be re-fetched
      state.loading = false;
    });
  },
});

export const { clearError } = maintenanceRulesSlice.actions;
export default maintenanceRulesSlice.reducer;
