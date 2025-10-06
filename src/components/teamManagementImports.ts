// React hooks
import { useState, useMemo, useCallback, useEffect } from "react";

// React Icons
import { FiEdit, FiDownload, FiTrash2, FiAward, FiSave } from "react-icons/fi";

// UI Components from ShadCN
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";

// Firebase Firestore
import {
  doc,
  updateDoc,
  writeBatch,
  collection,
  onSnapshot,
  query,
  addDoc,
  getDocs,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";

// Custom Hooks
import { useTeams } from "@/src/hooks/useTeams";
import { useSequentialEditing } from "@/src/hooks/useSequentialEditing";
import { useTournaments } from "@/src/hooks/useTournaments";

// Types
import { CombinedTeamData, MatchScore, Player } from "@/src/lib/types";

// Custom Components
import ActionToolbar from "@/src/components/ActionToolbar";
import TeamCard from "@/src/components/TeamCard";
import EditTeamModal from "@/src/components/EditTeamModal";
import AddTeamModal from "@/src/components/AddTeamModal"; // Added
import TournamentSelector from "@/src/components/TournamentSelector";
import OverallStandingModal from "@/src/components/OverallStandingModal";
import SequentialEditModal from "@/src/components/SequentialEditModal";
import PlayerManagement from "@/src/components/PlayerManagement";
// import CreateTournamentModal from "@/components/CreateTournamentModal";
import { TournamentSettings } from "@/src/components/TournamentSettings";
import { MatchDropdown } from "@/src/components/MatchDropdown";

// Utilities
import { exportToCSV, calculatePlacementPoints } from "@/src/lib/utils";
import { toast } from "sonner";

// Re-export types using 'export type'
export type { CombinedTeamData, MatchScore, Player };

// Re-export values
export {
  useState,
  useMemo,
  useCallback,
  useEffect,
  FiEdit,
  FiDownload,
  FiTrash2,
  FiAward,
  FiSave,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  doc,
  updateDoc,
  writeBatch,
  collection,
  onSnapshot,
  query,
  addDoc,
  getDocs,
  getDoc,
  where,
  db,
  useTeams,
  useSequentialEditing,
  ActionToolbar,
  TeamCard,
  EditTeamModal,
  AddTeamModal, // Added
  TournamentSelector,
  OverallStandingModal,
  SequentialEditModal,
  PlayerManagement,
  // CreateTournamentModal,
  TournamentSettings,
  exportToCSV,
  calculatePlacementPoints,
  useTournaments,
  Button,
  MatchDropdown,
  toast,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};

