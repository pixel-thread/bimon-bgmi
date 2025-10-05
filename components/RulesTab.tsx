"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { LoaderFive } from "@/components/ui/loader";

interface Rule {
  id: string;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface RulesTabProps {
  readOnly?: boolean;
}

export function RulesTab({ readOnly = false }: RulesTabProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tournamentRules"),
      (snapshot) => {
        const rulesData = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Rule)
        );

        // Sort by order, then by creation date
        rulesData.sort((a, b) => {
          if (a.order !== b.order) {
            return a.order - b.order;
          }
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        setRules(rulesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to rules:", error);
        toast.error("Failed to load rules");
        setRules([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSaveRule = async () => {
    if (!newRule.title.trim() || !newRule.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsSaving(true);
    try {
      const ruleData = {
        title: newRule.title.trim(),
        content: newRule.content.trim(),
        order: editingRule ? editingRule.order : rules.length + 1,
        createdAt: editingRule
          ? editingRule.createdAt
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingRule) {
        await updateDoc(doc(db, "tournamentRules", editingRule.id), ruleData);
        toast.success("Rule updated successfully!");
      } else {
        const ruleId = `rule_${Date.now()}`;
        await setDoc(doc(db, "tournamentRules", ruleId), {
          id: ruleId,
          ...ruleData,
        });
        toast.success("Rule created successfully!");
      }

      setNewRule({ title: "", content: "" });
      setEditingRule(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving rule:", error);
      toast.error("Failed to save rule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setNewRule({
      title: rule.title,
      content: rule.content,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "tournamentRules", ruleId));
      toast.success("Rule deleted successfully!");
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast.error("Failed to delete rule");
    }
  };

  const handleClearAllRules = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL rules? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const rulesSnapshot = await getDocs(collection(db, "tournamentRules"));
      const deletePromises = rulesSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      toast.success("All rules deleted successfully!");
    } catch (error) {
      console.error("Error clearing rules:", error);
      toast.error("Failed to clear rules");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
    setNewRule({ title: "", content: "" });
  };

  return (
    <div className="w-full px-4 py-6 sm:px-8 lg:px-12 max-w-[90rem] mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground mb-2">
            Tournament Rules
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {readOnly
              ? "Review the rules and guidelines for the tournament"
              : "Manage tournament rules and guidelines"}
          </p>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto border-primary/20 hover:bg-primary/5 text-sm sm:text-base py-2 sm:py-1.5"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
            {rules.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllRules}
                className="w-full sm:w-auto text-muted-foreground hover:text-destructive text-sm sm:text-base py-2 sm:py-1.5"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        )}

        {/* Rules Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoaderFive text="Loading rules..." />
          </div>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
                No Rules Yet
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {readOnly
                  ? "No tournament rules have been set up yet."
                  : "Get started by creating your first tournament rule."}
              </p>
              {!readOnly && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="w-full sm:w-auto text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Rule
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div key={rule.id} className="border rounded-lg overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-4 space-y-3 sm:space-y-0">
                    <div className="text-base sm:text-lg font-medium text-muted-foreground shrink-0">
                      {index + 1}.
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                        <h3 className="text-base sm:text-lg md:text-xl font-medium text-foreground mb-2">
                          {rule.title}
                        </h3>
                        {!readOnly && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditRule(rule)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="mt-1">
                        <div
                          className={`text-foreground/90 text-sm sm:text-base ${
                            expandedRule === rule.id 
                              ? "" 
                              : "line-clamp-3"
                          }`}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {rule.content}
                          </div>
                        </div>

                        {rule.content.length > 100 && (
                          <button
                            onClick={() =>
                              setExpandedRule(
                                expandedRule === rule.id ? null : rule.id
                              )
                            }
                            className="text-sm font-medium mt-3 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out inline-flex items-center border border-transparent hover:border-primary/20 hover:bg-primary/5"
                          >
                            {expandedRule === rule.id ? (
                              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-semibold">
                                Show less
                              </span>
                            ) : (
                              <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent font-semibold">
                                Read more
                              </span>
                            )}
                          </button>
                        )}

                        <div className="text-xs sm:text-sm text-muted-foreground mt-3 pt-2 border-t border-border/30">
                          <span>
                            Created:{" "}
                            {new Date(rule.createdAt).toLocaleDateString()}
                          </span>
                          {rule.updatedAt !== rule.createdAt && (
                            <span className="ml-3">
                              Updated:{" "}
                              {new Date(rule.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Rule Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="w-[calc(100%-1rem)] max-w-lg sm:max-w-xl md:max-w-2xl mx-auto p-0 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-0">
              <DialogTitle className="text-lg sm:text-xl md:text-2xl">
                {editingRule ? "Edit Rule" : "Create New Rule"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="ruleTitle"
                  className="text-sm sm:text-base font-medium"
                >
                  Title
                </Label>
                <Input
                  id="ruleTitle"
                  value={newRule.title}
                  onChange={(e) =>
                    setNewRule((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Match Duration, Team Composition"
                  className="text-sm sm:text-base h-10 sm:h-11 px-3"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ruleContent"
                  className="text-sm sm:text-base font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="ruleContent"
                  value={newRule.content}
                  onChange={(e) =>
                    setNewRule((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Enter the rule details..."
                  rows={4}
                  className="text-sm sm:text-base min-h-[100px] sm:min-h-[140px] p-3 resize-y max-h-[40vh] overflow-y-auto"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:px-6 border-t border-border/50">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-4 sm:px-6 h-10 text-sm sm:text-base"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-auto px-4 sm:px-6 h-10 text-sm sm:text-base"
                onClick={handleSaveRule}
                disabled={
                  isSaving || !newRule.title.trim() || !newRule.content.trim()
                }
              >
                {isSaving
                  ? "Saving..."
                  : editingRule
                  ? "Save Changes"
                  : "Create Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
