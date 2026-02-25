"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import {
    Card,
    CardBody,
    Avatar,
    Skeleton,
    Input,
    Select,
    SelectItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Chip,
} from "@heroui/react";
import {
    Shield,
    AlertCircle,
    Crown,
    Search,
    Trash2,
    AlertTriangle,
    User,
    Users,
    Loader2,
} from "lucide-react";

interface UserData {
    id: string;
    username: string;
    email: string | null;
    imageUrl: string | null;
    role: string;
    isOnboarded: boolean;
    createdAt: string;
    player: {
        id: string;
        displayName: string | null;
    } | null;
}

interface UsersResponse {
    items: UserData[];
    nextCursor: string | null;
    hasMore: boolean;
}

const ROLES = [
    { key: "ALL", label: "All Roles" },
    { key: "SUPER_ADMIN", label: "Super Admin" },
    { key: "ADMIN", label: "Admin" },
    { key: "PLAYER", label: "Player" },
    { key: "USER", label: "User" },
];

const roleColors: Record<string, "warning" | "primary" | "success" | "default"> = {
    SUPER_ADMIN: "warning",
    ADMIN: "primary",
    PLAYER: "success",
    USER: "default",
};

const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    PLAYER: "Player",
    USER: "User",
};

export default function AdminsPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");

    // Role change state
    const [roleTarget, setRoleTarget] = useState<UserData | null>(null);
    const [newRole, setNewRole] = useState("");
    const roleModal = useDisclosure();

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
    const deleteModal = useDisclosure();

    const queryClient = useQueryClient();
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery<UsersResponse>({
        queryKey: ["admins", roleFilter, debouncedSearch],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            if (roleFilter) params.set("role", roleFilter);
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (pageParam) params.set("cursor", pageParam as string);
            params.set("limit", "10");
            const res = await fetch(`/api/admins?${params}`);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

    // Auto-load next page when sentinel enters viewport
    useEffect(() => {
        const sentinel = loadMoreRef.current;
        if (!sentinel || !hasNextPage) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { rootMargin: "200px" },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const allUsers = data?.pages.flatMap((p) => p.items) ?? [];

    // Role change mutation
    const roleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const res = await fetch("/api/admins", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.message || "Failed");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admins"] });
            roleModal.onClose();
            setRoleTarget(null);
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch("/api/admins", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.message || "Failed");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admins"] });
            deleteModal.onClose();
            setDeleteTarget(null);
        },
    });

    const handleRoleClick = (user: UserData) => {
        setRoleTarget(user);
        setNewRole(user.role);
        roleModal.onOpen();
    };

    const handleDeleteClick = (user: UserData) => {
        setDeleteTarget(user);
        deleteModal.onOpen();
    };

    return (
        <div className="space-y-4 p-4">
            <div>
                <h1 className="text-lg font-bold">Users & Admins</h1>
                <p className="text-xs text-foreground/40">
                    Manage all users, admins, and their roles
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                    placeholder="Search username, email, display name..."
                    startContent={<Search className="h-4 w-4 text-foreground/40" />}
                    value={search}
                    onValueChange={setSearch}
                    size="sm"
                    className="flex-1"
                    isClearable
                />
                <Select
                    size="sm"
                    selectedKeys={[roleFilter]}
                    onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        if (val) setRoleFilter(val);
                    }}
                    className="w-full sm:w-40"
                    aria-label="Filter by role"
                >
                    {ROLES.map((r) => (
                        <SelectItem key={r.key}>{r.label}</SelectItem>
                    ))}
                </Select>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load users.
                </div>
            )}

            {isLoading && (
                <div className="space-y-0 rounded-xl border border-divider overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))}
                </div>
            )}

            {/* User list */}
            {allUsers.length > 0 && (
                <>
                    <Card className="border border-divider overflow-hidden">
                        <CardBody className="p-0">
                            {allUsers.map((user, i) => (
                                <div
                                    key={user.id}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 ${i > 0 ? "border-t border-divider" : ""}`}
                                >
                                    <Avatar
                                        src={user.imageUrl || undefined}
                                        name={user.username}
                                        size="sm"
                                        className="shrink-0 h-8 w-8"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {user.player?.displayName || user.username}
                                        </p>
                                        <p className="truncate text-xs text-foreground/40">
                                            @{user.username}
                                            {!user.isOnboarded && (
                                                <span className="text-foreground/20"> · not onboarded</span>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRoleClick(user)}
                                        className="shrink-0"
                                    >
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={roleColors[user.role] || "default"}
                                            className="cursor-pointer text-[10px]"
                                        >
                                            {roleLabels[user.role]}
                                        </Chip>
                                    </button>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => handleDeleteClick(user)}
                                        className="shrink-0 min-w-6 w-6 h-6"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                    {/* Infinite scroll sentinel — always rendered */}
                    <div ref={loadMoreRef} className="flex justify-center py-3">
                        {isFetchingNextPage && (
                            <Loader2 className="h-4 w-4 animate-spin text-foreground/30" />
                        )}
                    </div>
                </>
            )}

            {!isLoading && allUsers.length === 0 && !error && (
                <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                    <Users className="h-10 w-10 text-foreground/20" />
                    <p className="text-sm text-foreground/50">No users found</p>
                </div>
            )}

            {/* Role change modal */}
            <Modal isOpen={roleModal.isOpen} onClose={roleModal.onClose} size="sm">
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Change Role
                    </ModalHeader>
                    <ModalBody>
                        {roleTarget && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Avatar
                                        src={roleTarget.imageUrl || undefined}
                                        name={roleTarget.username}
                                        size="sm"
                                    />
                                    <div>
                                        <p className="text-sm font-medium">{roleTarget.player?.displayName || roleTarget.username}</p>
                                        <p className="text-xs text-foreground/40">@{roleTarget.username}</p>
                                    </div>
                                </div>
                                <Select
                                    label="Role"
                                    size="sm"
                                    selectedKeys={[newRole]}
                                    onSelectionChange={(keys) => {
                                        const val = Array.from(keys)[0] as string;
                                        if (val) setNewRole(val);
                                    }}
                                >
                                    {ROLES.filter((r) => r.key !== "ALL").map((r) => (
                                        <SelectItem key={r.key}>{r.label}</SelectItem>
                                    ))}
                                </Select>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={roleModal.onClose} size="sm">
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            size="sm"
                            isLoading={roleMutation.isPending}
                            isDisabled={newRole === roleTarget?.role}
                            onPress={() => {
                                if (roleTarget) {
                                    roleMutation.mutate({ userId: roleTarget.id, role: newRole });
                                }
                            }}
                        >
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete confirmation modal */}
            <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} size="sm">
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2 text-danger">
                        <AlertTriangle className="h-5 w-5" />
                        Delete User
                    </ModalHeader>
                    <ModalBody>
                        {deleteTarget && (
                            <div className="space-y-3">
                                <p className="text-sm">
                                    Are you sure you want to delete{" "}
                                    <span className="font-bold">@{deleteTarget.username}</span>?
                                </p>
                                <div className="rounded-lg bg-danger-50 p-3 text-xs text-danger dark:bg-danger-50/10">
                                    <p className="font-semibold">⚠️ This action is irreversible!</p>
                                    <p className="mt-1">
                                        All data will be permanently deleted:
                                    </p>
                                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                                        <li>Player profile & stats</li>
                                        <li>Wallet & transactions</li>
                                        <li>Team & match records</li>
                                        <li>Streaks & rewards</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={deleteModal.onClose} size="sm">
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onPress={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                            isLoading={deleteMutation.isPending}
                            size="sm"
                        >
                            Delete Permanently
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
