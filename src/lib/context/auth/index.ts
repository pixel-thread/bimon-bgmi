import { AuthContextI } from "@/src/types/context/auth";
import React from "react";

export const AuthContext = React.createContext<AuthContextI | null>(null);
