// React hooks
import { useState, useMemo, useCallback, useEffect } from "react";

// React Icons
import { FiEdit, FiDownload, FiTrash2, FiAward, FiSave } from "react-icons/fi";

// UI Components from ShadCN
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Firebase Firestore
import { doc, updateDoc, writeBatch, collection, onSnapshot, query, addDoc, getDocs, getDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Custom Hooks
import { useTeams } from "@/hooks/useTeams";
import { useSequentialEditing } from "@/hooks/useSequentialEditing";
import { useTournaments } from "@/hooks/useTournaments";

// Types
import { CombinedTeamData, MatchScore, Player } from "@/lib/types";

// Custom Components
import ActionToolbar from "@/components/ActionToolbar";
import TeamCard from "@/components/TeamCard";
import EditTeamModal from "@/components/EditTeamModal";
import AddTeamModal from "@/components/AddTeamModal"; // Added
import TournamentSelector from "@/components/TournamentSelector";
import OverallStandingModal from "@/components/OverallStandingModal";
import SequentialEditModal from "@/components/SequentialEditModal";
import PlayerManagement from "@/components/PlayerManagement";
// import CreateTournamentModal from "@/components/CreateTournamentModal";
import { TournamentSettings } from "@/components/TournamentSettings";
import { MatchDropdown } from "@/components/MatchDropdown";

// Utilities
import { exportToCSV, calculatePlacementPoints } from "@/lib/utils";
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