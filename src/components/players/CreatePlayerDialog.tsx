"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { LoaderFive } from "@/src/components/ui/loader";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/src/hooks/useAuth";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/src/utils/validation/auth/register";
import z from "zod";

const generatePassword = () => {
  return Math.random().toString(36).slice(-8);
};

type PlayerT = z.infer<typeof registerSchema>;

export const CreatePlayerDialog = ({
  open,
  onVlaueChange,
}: {
  open: boolean;
  onVlaueChange: (value: boolean) => void;
}) => {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const onTogglePassword = () => setShowPassword(!showPassword);
  const role = user?.role;
  const queryClient = useQueryClient();
  const form = useForm<PlayerT>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userName: "",
      password: generatePassword() || "123Abc!@#",
    },
  });

  const { isPending: isSaving, mutate } = useMutation({
    mutationKey: ["players"],
    mutationFn: (data: PlayerT) => http.post<PlayerT>("/auth/signup", data),
    onSuccess: (data) => {
      if (data.success) {
        onVlaueChange(false);
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["players"] });
        queryClient.invalidateQueries({ queryKey: ["player", data?.data?.id] });
        return data;
      }
      toast.success(data.message);
      return data;
    },
  });

  const onSubmit: SubmitHandler<PlayerT> = (data) => mutate(data);

  return (
    <Dialog open={open} onOpenChange={onVlaueChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {role === "SUPER_ADMIN"
              ? "Create New Player Account"
              : "Create New Player"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="shadcn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="shadcn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {role === "SUPER_ADMIN" && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="shadcn"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onTogglePassword}
                  className="ml-2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        form.getValues("password") || "",
                      );
                      toast.success("Password copied to clipboard");
                    } catch (_) {
                      toast.error("Failed to copy password");
                    }
                  }}
                  className="ml-1"
                  title="Copy password"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </>
            )}

            <DialogFooter>
              <Button>
                {isSaving ? <LoaderFive text="Saving..." /> : "Add Player"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
