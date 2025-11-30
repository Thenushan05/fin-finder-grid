import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import maintenanceReducer from "./maintenanceSlice";
import maintenanceRulesReducer from "./maintenanceRulesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    maintenance: maintenanceReducer,
    maintenanceRules: maintenanceRulesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
