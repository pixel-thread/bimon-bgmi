"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import {
    useCreateJobListing,
    useUpdateJobListing,
    useJobCategories,
    JobListing,
    JOB_CATEGORIES,
    EXPERIENCE_OPTIONS,
} from "@/src/hooks/jobListing/useJobListings";

interface JobListingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editListing?: JobListing | null;
}

const TITLE_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 150;

export function JobListingDialog({
    open,
    onOpenChange,
    editListing,
}: JobListingDialogProps) {
    const { mutate: createListing, isPending: isCreating } = useCreateJobListing();
    const { mutate: updateListing, isPending: isUpdating } = useUpdateJobListing();
    const { data: categories } = useJobCategories();

    // Load custom categories from localStorage
    const LOCAL_CUSTOM_CATEGORIES_KEY = "customJobCategories";
    const getLocalCustomCategories = (): string[] => {
        try {
            const stored = localStorage.getItem(LOCAL_CUSTOM_CATEGORIES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    };
    const saveLocalCustomCategory = (name: string) => {
        const existing = getLocalCustomCategories();
        if (!existing.includes(name)) {
            localStorage.setItem(LOCAL_CUSTOM_CATEGORIES_KEY, JSON.stringify([...existing, name]));
        }
    };

    // Use fetched categories + local custom ones
    const [localCustomCategories, setLocalCustomCategories] = useState<string[]>([]);
    const allCategories = [...(categories || [...JOB_CATEGORIES]), ...localCustomCategories.filter(c => !(categories || []).includes(c))];

    const [category, setCategory] = useState("");
    const [category2, setCategory2] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [showCustomPopup, setShowCustomPopup] = useState(false);
    const [customCategoryInput, setCustomCategoryInput] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [experience, setExperience] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load local custom categories on mount
    useEffect(() => {
        setLocalCustomCategories(getLocalCustomCategories());
    }, [open]);

    const isEditing = !!editListing;
    const isPending = isCreating || isUpdating;

    const STORAGE_KEY = "jobListingDraft";
    const STORAGE_EXPIRY = 5 * 60 * 1000; // 5 minutes

    // Load saved draft from localStorage
    useEffect(() => {
        if (open && !editListing) {
            const savedDraft = localStorage.getItem(STORAGE_KEY);
            if (savedDraft) {
                try {
                    const { data, timestamp } = JSON.parse(savedDraft);
                    if (Date.now() - timestamp < STORAGE_EXPIRY) {
                        setCategory(data.category || "");
                        setCategory2(data.category2 || "");
                        setCustomCategory(data.customCategory || "");
                        setTitle(data.title || "");
                        setDescription(data.description || "");
                        setPhoneNumber(data.phoneNumber || "");
                        return;
                    } else {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                } catch {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        }
    }, [open, editListing]);

    // Save draft to localStorage when form changes
    useEffect(() => {
        if (!editListing && (category || category2 || title || description || phoneNumber || customCategory)) {
            const draft = {
                data: { category, category2, customCategory, title, description, phoneNumber },
                timestamp: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        }
    }, [category, category2, customCategory, title, description, phoneNumber, editListing]);

    // Clear draft on successful submission
    const clearDraft = () => {
        localStorage.removeItem(STORAGE_KEY);
    };

    // Reset form when dialog opens with edit listing
    useEffect(() => {
        if (open && editListing) {
            setCategory(editListing.category);
            setCustomCategory(editListing.customCategory || "");
            setTitle(editListing.title);
            setDescription(editListing.description || "");
            setPhoneNumber(editListing.phoneNumber);
            setErrors({});
        } else if (open && !editListing) {
            setErrors({});
        }
    }, [open, editListing]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!category) {
            newErrors.category = "Please select a category";
        }

        if (category === "Other" && !customCategory.trim()) {
            newErrors.customCategory = "Please enter a custom category";
        }

        if (!title.trim()) {
            newErrors.title = "Title is required";
        } else if (title.length > TITLE_MAX_LENGTH) {
            newErrors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
        }

        if (description.length > DESCRIPTION_MAX_LENGTH) {
            newErrors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less`;
        }

        if (!phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const data = {
            category,
            category2: category2 || undefined,
            customCategory: category === "Other" ? customCategory : undefined,
            title: title.trim(),
            description: description.trim() || undefined,
            phoneNumber: phoneNumber.trim(),
            experience: experience || undefined,
        };

        if (isEditing && editListing) {
            updateListing(
                { id: editListing.id, ...data },
                {
                    onSuccess: (response) => {
                        if (response.success) {
                            onOpenChange(false);
                        }
                    },
                }
            );
        } else {
            createListing(data, {
                onSuccess: (response) => {
                    if (response.success) {
                        clearDraft();
                        onOpenChange(false);
                    }
                },
            });
        }
    };

    // Also clear draft when edit is successful
    const handleEditSuccess = (response: { success: boolean }) => {
        if (response.success) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Job Listing" : "Add Job Listing"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update your job listing details below."
                            : "Share your skills with the community. Your listing will appear on the vote page."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Categories */}
                    <div className="space-y-2">
                        <Label htmlFor="category">
                            Category <span className="text-red-500">*</span>
                        </Label>

                        <Select
                            value=""
                            onValueChange={(val) => {
                                if (val === "Other") {
                                    setShowCustomPopup(true);
                                    return;
                                }
                                // Toggle selection - if already selected, deselect
                                if (val === category) {
                                    if (category2) {
                                        setCategory(category2);
                                        setCategory2("");
                                    } else {
                                        setCategory("");
                                    }
                                    return;
                                }
                                if (val === category2) {
                                    setCategory2("");
                                    return;
                                }
                                // Add new selection
                                if (!category) {
                                    setCategory(val);
                                } else if (!category2) {
                                    setCategory2(val);
                                } else {
                                    // Already have 2 selected, replace the second one
                                    setCategory2(val);
                                }
                            }}
                        >
                            <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                                <SelectValue placeholder={
                                    category && category2
                                        ? `${category}, ${category2}`
                                        : category
                                            ? category
                                            : "Select category"
                                } />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-auto">
                                {allCategories
                                    .filter(c => c !== "Other")
                                    .map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {(cat === category || cat === category2) ? `✓ ${cat}` : cat}
                                        </SelectItem>
                                    ))}
                                <SelectItem value="Other" className="text-amber-600 dark:text-amber-400">
                                    + Add Custom Category
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.category && (
                            <p className="text-xs text-red-500">{errors.category}</p>
                        )}
                    </div>

                    {/* Custom Category Popup */}
                    {showCustomPopup && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCustomPopup(false)}>
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-lg font-semibold mb-4">Add Custom Category</h3>
                                <Input
                                    value={customCategoryInput}
                                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                                    placeholder="e.g., Photographer, Artist"
                                    maxLength={30}
                                    className="mb-4"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && customCategoryInput.trim()) {
                                            const newCat = customCategoryInput.trim();
                                            saveLocalCustomCategory(newCat);
                                            setLocalCustomCategories([...localCustomCategories, newCat]);
                                            if (!category) {
                                                setCategory(newCat);
                                            } else {
                                                setCategory2(newCat);
                                            }
                                            setCustomCategoryInput("");
                                            setShowCustomPopup(false);
                                        }
                                    }}
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setShowCustomPopup(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (customCategoryInput.trim()) {
                                                const newCat = customCategoryInput.trim();
                                                saveLocalCustomCategory(newCat);
                                                setLocalCustomCategories([...localCustomCategories, newCat]);
                                                if (!category) {
                                                    setCategory(newCat);
                                                } else {
                                                    setCategory2(newCat);
                                                }
                                                setCustomCategoryInput("");
                                                setShowCustomPopup(false);
                                            }
                                        }}
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                                    >
                                        Save & Select
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="title">
                                Job Title <span className="text-red-500">*</span>
                            </Label>
                            <span className="text-xs text-muted-foreground">
                                {title.length}/{TITLE_MAX_LENGTH}
                            </span>
                        </div>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., House Painter, Delivery Services"
                            maxLength={TITLE_MAX_LENGTH}
                            className={errors.title ? "border-red-500" : ""}
                        />
                        {errors.title && (
                            <p className="text-xs text-red-500">{errors.title}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="description">Description (optional)</Label>
                            <span className="text-xs text-muted-foreground">
                                {description.length}/{DESCRIPTION_MAX_LENGTH}
                            </span>
                        </div>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of your services..."
                            maxLength={DESCRIPTION_MAX_LENGTH}
                            rows={2}
                            className={errors.description ? "border-red-500" : ""}
                        />
                        {errors.description && (
                            <p className="text-xs text-red-500">{errors.description}</p>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">
                            Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="phoneNumber"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g., +91 98765 43210"
                            className={errors.phoneNumber ? "border-red-500" : ""}
                        />
                        {errors.phoneNumber && (
                            <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            This will be publicly visible on your listing.
                        </p>
                    </div>

                    {/* Experience */}
                    <div className="space-y-2">
                        <Label htmlFor="experience">
                            Experience <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <Select value={experience} onValueChange={setExperience}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                            <SelectContent>
                                {EXPERIENCE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isEditing ? "Save Changes" : "Add Listing"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
