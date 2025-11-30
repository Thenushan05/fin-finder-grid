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

// Types
export interface MaintenanceTask {
  id: string;
  task: string;
  due: string;
  priority: "low" | "medium" | "high";
}

export interface ServiceLog {
  date: string;
  technician: string;
  notes: string;
  cost?: string;
}

export interface SystemSpec {
  value: string;
  status: "good" | "warning" | "critical";
}

export interface SubPart {
  id: string;
  label: string;
  x: number;
  y: number;
  status: "good" | "warning" | "critical";
}

export interface FishingSystem {
  id: string;
  name: string;
  status: "operational" | "due-soon" | "overdue" | "critical" | "offline";
  description: string;
  blueprintImage: string;
  specs: Record<string, string | SystemSpec>;
  upcomingTasks: MaintenanceTask[];
  lastService: ServiceLog;
  aiTips?: string[];
  subParts?: SubPart[];
}

export interface VesselStats {
  lastTrip: string;
  engineHours: number;
  fuelOnBoard: string;
  iceCapacity: string;
  nextServiceDue: string;
}

export interface Vessel {
  id: string;
  name: string;
  type: string;
  stats: VesselStats;
  systems: FishingSystem[];
}

interface MaintenanceState {
  vessels: Vessel[];
  selectedVesselId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: MaintenanceState = {
  vessels: [],
  selectedVesselId: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchVessels = createAsyncThunk(
  "maintenance/fetchVessels",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v1/maintenance/vessels");
      return response.data.vessels;
    } catch (error: any) {
      console.error("fetchVessels error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to fetch vessels";
      return rejectWithValue(errorMsg);
    }
  }
);

export const fetchVessel = createAsyncThunk(
  "maintenance/fetchVessel",
  async (vesselId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/maintenance/vessels/${vesselId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch vessel"
      );
    }
  }
);

export const createVessel = createAsyncThunk(
  "maintenance/createVessel",
  async (vessel: Omit<Vessel, "id">, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/v1/maintenance/vessels", vessel);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create vessel"
      );
    }
  }
);

export const updateVessel = createAsyncThunk(
  "maintenance/updateVessel",
  async (
    { vesselId, vessel }: { vesselId: string; vessel: Vessel },
    { rejectWithValue }
  ) => {
    try {
      await api.put(`/api/v1/maintenance/vessels/${vesselId}`, vessel);
      return vessel;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update vessel"
      );
    }
  }
);

export const deleteVessel = createAsyncThunk(
  "maintenance/deleteVessel",
  async (vesselId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/v1/maintenance/vessels/${vesselId}`);
      return vesselId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete vessel"
      );
    }
  }
);

export const updateSystemStatus = createAsyncThunk(
  "maintenance/updateSystemStatus",
  async (
    {
      vesselId,
      systemId,
      status,
    }: { vesselId: string; systemId: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      await api.patch(
        `/api/v1/maintenance/vessels/${vesselId}/systems/${systemId}/status`,
        {
          status,
        }
      );
      return { vesselId, systemId, status };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update system status"
      );
    }
  }
);

export const createTask = createAsyncThunk(
  "maintenance/createTask",
  async (
    {
      vesselId,
      systemId,
      task,
      due,
      priority,
    }: {
      vesselId: string;
      systemId: string;
      task: string;
      due: string;
      priority: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(
        `/api/v1/maintenance/vessels/${vesselId}/systems/${systemId}/tasks`,
        { systemId, task, due, priority }
      );
      return {
        vesselId,
        systemId,
        taskId: response.data.id,
        task,
        due,
        priority,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create task"
      );
    }
  }
);

export const updateTask = createAsyncThunk(
  "maintenance/updateTask",
  async (
    {
      vesselId,
      systemId,
      taskId,
      updates,
    }: {
      vesselId: string;
      systemId: string;
      taskId: string;
      updates: Partial<MaintenanceTask>;
    },
    { rejectWithValue }
  ) => {
    try {
      await api.patch(
        `/api/v1/maintenance/vessels/${vesselId}/systems/${systemId}/tasks/${taskId}`,
        updates
      );
      return { vesselId, systemId, taskId, updates };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update task"
      );
    }
  }
);

export const deleteTask = createAsyncThunk(
  "maintenance/deleteTask",
  async (
    {
      vesselId,
      systemId,
      taskId,
    }: { vesselId: string; systemId: string; taskId: string },
    { rejectWithValue }
  ) => {
    try {
      await api.delete(
        `/api/v1/maintenance/vessels/${vesselId}/systems/${systemId}/tasks/${taskId}`
      );
      return { vesselId, systemId, taskId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete task"
      );
    }
  }
);

export const createServiceLog = createAsyncThunk(
  "maintenance/createServiceLog",
  async (
    {
      vesselId,
      systemId,
      date,
      technician,
      notes,
      cost,
    }: {
      vesselId: string;
      systemId: string;
      date: string;
      technician: string;
      notes: string;
      cost?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      await api.post(
        `/api/v1/maintenance/vessels/${vesselId}/systems/${systemId}/service-logs`,
        { systemId, date, technician, notes, cost }
      );
      return {
        vesselId,
        systemId,
        serviceLog: { date, technician, notes, cost },
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create service log"
      );
    }
  }
);

// Slice
const maintenanceSlice = createSlice({
  name: "maintenance",
  initialState,
  reducers: {
    setSelectedVessel: (state, action: PayloadAction<string>) => {
      state.selectedVesselId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch vessels
      .addCase(fetchVessels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVessels.fulfilled, (state, action) => {
        state.loading = false;
        state.vessels = action.payload;
      })
      .addCase(fetchVessels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch single vessel
      .addCase(fetchVessel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVessel.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.vessels.findIndex(
          (v) => v.id === action.payload.id
        );
        if (index !== -1) {
          state.vessels[index] = action.payload;
        } else {
          state.vessels.push(action.payload);
        }
      })
      .addCase(fetchVessel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create vessel
      .addCase(createVessel.fulfilled, (state) => {
        // Refetch vessels after creation
        state.loading = false;
      })
      // Update vessel
      .addCase(updateVessel.fulfilled, (state, action) => {
        const index = state.vessels.findIndex(
          (v) => v.id === action.payload.id
        );
        if (index !== -1) {
          state.vessels[index] = action.payload;
        }
      })
      // Delete vessel
      .addCase(deleteVessel.fulfilled, (state, action) => {
        state.vessels = state.vessels.filter((v) => v.id !== action.payload);
        if (state.selectedVesselId === action.payload) {
          state.selectedVesselId = null;
        }
      })
      // Update system status
      .addCase(updateSystemStatus.fulfilled, (state, action) => {
        const vessel = state.vessels.find(
          (v) => v.id === action.payload.vesselId
        );
        if (vessel) {
          const system = vessel.systems.find(
            (s) => s.id === action.payload.systemId
          );
          if (system) {
            system.status = action.payload.status as any;
          }
        }
      })
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        const vessel = state.vessels.find(
          (v) => v.id === action.payload.vesselId
        );
        if (vessel) {
          const system = vessel.systems.find(
            (s) => s.id === action.payload.systemId
          );
          if (system) {
            system.upcomingTasks.push({
              id: action.payload.taskId,
              task: action.payload.task,
              due: action.payload.due,
              priority: action.payload.priority as any,
            });
          }
        }
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const vessel = state.vessels.find(
          (v) => v.id === action.payload.vesselId
        );
        if (vessel) {
          const system = vessel.systems.find(
            (s) => s.id === action.payload.systemId
          );
          if (system) {
            const task = system.upcomingTasks.find(
              (t) => t.id === action.payload.taskId
            );
            if (task) {
              Object.assign(task, action.payload.updates);
            }
          }
        }
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        const vessel = state.vessels.find(
          (v) => v.id === action.payload.vesselId
        );
        if (vessel) {
          const system = vessel.systems.find(
            (s) => s.id === action.payload.systemId
          );
          if (system) {
            system.upcomingTasks = system.upcomingTasks.filter(
              (t) => t.id !== action.payload.taskId
            );
          }
        }
      })
      // Create service log
      .addCase(createServiceLog.fulfilled, (state, action) => {
        const vessel = state.vessels.find(
          (v) => v.id === action.payload.vesselId
        );
        if (vessel) {
          const system = vessel.systems.find(
            (s) => s.id === action.payload.systemId
          );
          if (system) {
            system.lastService = action.payload.serviceLog;
          }
        }
      });
  },
});

export const { setSelectedVessel, clearError } = maintenanceSlice.actions;
export default maintenanceSlice.reducer;
