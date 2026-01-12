import { createContext } from "react";
import type { Cell } from "./StandardCode.utils";

export const HoveredCellContext = createContext<Cell | undefined>(undefined);
export const ClickedCellContext = createContext<Cell | undefined>(undefined);
