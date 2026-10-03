import { createContext } from "react";

// Kept out of AuthContext.jsx so that file exports only components
// (fast refresh + the react/only-export-components rule).
export const AuthContext = createContext(null);
