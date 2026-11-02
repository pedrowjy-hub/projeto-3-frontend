import { createContext, useContext } from "react";

export const AppearanceContext = createContext(null);
export default function useAppearance() { return useContext(AppearanceContext); }
