"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextField } from "@/components/forms/text-field";
import { SaveButton } from "@/components/portal/save-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { profileSchema } from "@/lib/validations/auth";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const form = useForm<{ name: string }>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const { error } = await authClient.updateUser(values);
    if (error) {
      toast.error("We could not save your name. Please try again.");
      return;
    }
    toast.success("Your name was saved.");
    router.refresh();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your details</CardTitle>
        <CardDescription>
          Your email is {email}. Only the Super Admin can change your role or office.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
          <TextField
            control={form.control}
            name="name"
            label="Name"
            placeholder="Your full name"
            autoComplete="name"
          />
          <SaveButton isPending={form.formState.isSubmitting}>Save name</SaveButton>
        </form>
      </CardContent>
    </Card>
  );
}
