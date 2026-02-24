"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
} from "lucide-react";

interface UserData {
    id: string;
    username: string;
    email: string | null;
    imageUrl: string | null;
    role: string;
    createdAt: string;
    player: {
        id: string;
        displayName: string | null;
    } | null;
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

const roleIcons: Record<string, React.ReactNode> = {
    SUPER_ADMIN: <Crown className="h-3 w-3" />,
    ADMIN: <Shield className="h-3 w-3" />,
    PLAYER: <User className="h-3 w-3" />,
    USER: <Users className="h-3 w-3" />,
};

export default function AdminsPage() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery<UserData[]>({
        queryKey: ["admins", roleFilter, search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (roleFilter) params.set("role", roleFilter);
            if (search) params.set("search", search);
            const res = await fetch(`/api/admins?${params}`);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000,
    });

    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch("/api/admins", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.message || "Failed to delete");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admins"] });
            onClose();
            setUserToDelete(null);
        },
    });

    const handleDeleteClick = (user: UserData) => {
        setUserToDelete(user);
        onOpen();
    };

    const confirmDelete = () => {
        if (userToDelete) {
            deleteMutation.mutate(userToDelete.id);
        }
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
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {/* Count */}
            {data && (
                <p className="text-xs text-foreground/40">{data.length} users</p>
            )}

            {/* User list */}
            {data && data.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                    <Users className="h-10 w-10 text-foreground/20" />
                    <p className="text-sm text-foreground/50">No users found</p>
                </div>
            )}

            {data && data.length > 0 && (
                <Card className="border border-divider overflow-hidden">
                    <CardBody className="p-0">
                        {data.map((user, i) => (
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
                                        {user.email && <span className="hidden sm:inline"> · {user.email}</span>}
                                    </p>
                                </div>
                                <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider ${user.role === "SUPER_ADMIN" ? "text-warning" :
                                    user.role === "ADMIN" ? "text-primary" :
                                        user.role === "PLAYER" ? "text-success" :
                                            "text-foreground/30"
                                    }`}>
                                    {roleLabels[user.role]}
                                </span>
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
            )}

            {/* Delete confirmation modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="sm">
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2 text-danger">
                        <AlertTriangle className="h-5 w-5" />
                        Delete User
                    </ModalHeader>
                    <ModalBody>
                        {userToDelete && (
                            <div className="space-y-3">
                                <p className="text-sm">
                                    Are you sure you want to delete{" "}
                                    <span className="font-bold">{userToDelete.username}</span>?
                                </p>
                                <div className="rounded-lg bg-danger-50 p-3 text-xs text-danger dark:bg-danger-50/10">
                                    <p className="font-semibold">⚠️ This action is irreversible!</p>
                                    <p className="mt-1">
                                        This will permanently delete the user and ALL associated data including:
                                    </p>
                                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                                        <li>Player profile & stats</li>
                                        <li>Wallet & transaction history</li>
                                        <li>Team & match records</li>
                                        <li>Poll votes & notifications</li>
                                        <li>Streaks & rewards</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={onClose}
                            size="sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onPress={confirmDelete}
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
