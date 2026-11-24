import "server-only";

import type { MESSAGE_SUBJECTS } from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { ContactMessageModel } from "@/server/db/models/contact-message.model";

export interface NewContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: (typeof MESSAGE_SUBJECTS)[number];
  message: string;
  departmentId: string;
}

export async function createContactMessage(data: NewContactMessage): Promise<void> {
  await connectDb();
  await ContactMessageModel.create(data);
}
