"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Upload, X, Link as LinkIcon } from "lucide-react";
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
    TIME_OPTIONS,
} from "@/src/hooks/jobListing/useJobListings";
import { useDialogBackHandler } from "@/src/hooks/useDialogBackHandler";
import { useGoogleDrive } from "@/src/hooks/jobListing/useGoogleDrive";

interface JobListingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editListing?: JobListing | null;
}

// Image Upload Section Component
function ImageUploadSection({
    imageUrls,
    setImageUrls,
}: {
    imageUrls: string[];
    setImageUrls: (urls: string[]) => void;
}) {
    const { isConnected, isCheckingStatus, isUploading, uploadImage, connectDrive } = useGoogleDrive();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState("");

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const url = await uploadImage(file);
        if (url) {
            const emptyIndex = imageUrls.findIndex((u) => !u.trim());
            if (emptyIndex !== -1) {
                const newUrls = [...imageUrls];
                newUrls[emptyIndex] = url;
                setImageUrls(newUrls);
            }
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleAddUrl = () => {
        if (!urlInput.trim()) return;
        const emptyIndex = imageUrls.findIndex((u) => !u.trim());
        if (emptyIndex !== -1) {
            const newUrls = [...imageUrls];
            newUrls[emptyIndex] = urlInput.trim();
            setImageUrls(newUrls);
            setUrlInput("");
            setShowUrlInput(false);
        }
    };

    const removeImage = (index: number) => {
        const newUrls = [...imageUrls];
        newUrls[index] = "";
        setImageUrls(newUrls);
    };

    const filledCount = imageUrls.filter((u) => u.trim()).length;
    const canAddMore = filledCount < 3;

    return (
        <div className="space-y-3">
            <Label>
                Work Samples <span className="text-muted-foreground text-xs">(optional, max 3)</span>
            </Label>

            {/* Image previews */}
            <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((url, index) =>
                    url.trim() ? (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url}
                                alt={`Sample ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23334155" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="10">Error</text></svg>';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : null
                )}
            </div>

            {/* Upload/Connect buttons */}
            {canAddMore && (
                <div className="space-y-2">
                    {isCheckingStatus ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking Google Drive...
                        </div>
                    ) : isConnected ? (
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex-1"
                            >
                                {isUploading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                )}
                                {isUploading ? "Uploading..." : "Upload Image"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUrlInput(!showUrlInput)}
                            >
                                <LinkIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                Connect Google Drive to upload images (stored in your Drive)
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={connectDrive}
                                className="w-full"
                            >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.062 0 3.76-.02 3.76-.047s-1.692-3.001-3.76-6.62l-3.76-6.574h-3.79zm-4.76 6.574l-3.76 6.574c-2.068 3.619-3.76 6.6-3.76 6.62 0 .027 1.698.047 3.76.047h3.76l3.76-6.574c2.068-3.619 3.76-6.6 3.76-6.62 0-.027-1.698-.047-3.76-.047h-3.76z"
                                    />
                                </svg>
                                Connect Google Drive
                            </Button>
                            <button
                                type="button"
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                className="text-xs text-blue-500 hover:underline"
                            >
                                Or paste image URL instead
                            </button>
                        </div>
                    )}

                    {/* Manual URL input */}
                    {showUrlInput && (
                        <div className="flex gap-2">
                            <Input
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="Paste image URL..."
                                className="flex-1 text-sm"
                            />
                            <Button type="button" size="sm" onClick={handleAddUrl}>
                                Add
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const TITLE_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 150;
const LOCATION_MAX_LENGTH = 50;

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
    const [location, setLocation] = useState("");
    const [availability, setAvailability] = useState("");
    const [workingHours, setWorkingHours] = useState<Record<string, string>>({});
    const [imageUrls, setImageUrls] = useState<string[]>(["", "", ""]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load local custom categories on mount
    useEffect(() => {
        setLocalCustomCategories(getLocalCustomCategories());
    }, [open]);

    const isEditing = !!editListing;
    const isPending = isCreating || isUpdating;

    // Use the back button handler hook
    const handleOpenChange = useDialogBackHandler(open, onOpenChange, "jobListing");

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
                        setLocation(data.location || "");
                        setAvailability(data.availability || "");
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
        if (!editListing && (category || category2 || title || description || phoneNumber || customCategory || location || availability)) {
            const draft = {
                data: { category, category2, customCategory, title, description, phoneNumber, location, availability },
                timestamp: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        }
    }, [category, category2, customCategory, title, description, phoneNumber, location, availability, editListing]);

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
            setExperience(editListing.experience || "");
            setLocation(editListing.location || "");
            setAvailability(editListing.availability || "");
            setWorkingHours(editListing.workingHours || {});
            const existingUrls = editListing.imageUrls || [];
            setImageUrls([existingUrls[0] || "", existingUrls[1] || "", existingUrls[2] || ""]);
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
            location: location.trim() || undefined,
            availability: availability || undefined,
            workingHours: Object.keys(workingHours).length > 0 ? workingHours : undefined,
            imageUrls: imageUrls.filter(url => url.trim()).length > 0 ? imageUrls.filter(url => url.trim()) : undefined,
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-md max-h-[90vh] flex flex-col"
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

                <div className="space-y-4 py-4 overflow-y-auto flex-1">
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

                    {/* Location */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="location">
                                Location <span className="text-muted-foreground text-xs">(optional)</span>
                            </Label>
                            <span className="text-xs text-muted-foreground">
                                {location.length}/{LOCATION_MAX_LENGTH}
                            </span>
                        </div>
                        <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g., Mumbai, Delhi NCR, Bangalore"
                            maxLength={LOCATION_MAX_LENGTH}
                        />
                    </div>

                    {/* Availability - Time Range */}
                    <div className="space-y-2">
                        <Label>
                            Availability <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <Select
                                value={availability.split("-")[0] || ""}
                                onValueChange={(val) => {
                                    const endTime = availability.split("-")[1] || "";
                                    setAvailability(endTime ? `${val}-${endTime}` : val);
                                }}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="From" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {TIME_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-muted-foreground text-sm">to</span>
                            <Select
                                value={availability.split("-")[1] || ""}
                                onValueChange={(val) => {
                                    const startTime = availability.split("-")[0] || "";
                                    setAvailability(startTime ? `${startTime}-${val}` : `-${val}`);
                                }}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="To" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {TIME_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Working Hours - Compact */}
                    <div className="space-y-2">
                        <Label>
                            Working Days <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <div className="grid grid-cols-7 gap-1">
                            {[
                                { key: "mon", label: "M" },
                                { key: "tue", label: "T" },
                                { key: "wed", label: "W" },
                                { key: "thu", label: "T" },
                                { key: "fri", label: "F" },
                                { key: "sat", label: "S" },
                                { key: "sun", label: "S" },
                            ].map(({ key, label }) => {
                                const isClosed = workingHours[key] === "CLOSED";
                                const isOpen = workingHours[key] && workingHours[key] !== "CLOSED";
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            const newHours = { ...workingHours };
                                            if (isClosed) {
                                                // CLOSED -> Remove (not set)
                                                delete newHours[key];
                                            } else if (isOpen) {
                                                // Open -> CLOSED
                                                newHours[key] = "CLOSED";
                                            } else {
                                                // Not set -> Open (use availability time range)
                                                newHours[key] = availability || "Available";
                                            }
                                            setWorkingHours(newHours);
                                        }}
                                        className={`w-full aspect-square rounded text-xs font-medium transition-colors ${isClosed
                                            ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700"
                                            : isOpen
                                                ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-700"
                                            }`}
                                        title={isClosed ? `${key}: Closed` : isOpen ? `${key}: ${workingHours[key]}` : `${key}: Not set`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Tap: Gray → Green (Open) → Red (Closed) → Gray
                        </p>
                    </div>

                    {/* Image URLs */}
                    <ImageUploadSection
                        imageUrls={imageUrls}
                        setImageUrls={setImageUrls}
                    />
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
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
