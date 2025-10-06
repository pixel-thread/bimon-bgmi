"use client";

import { useState, useEffect } from "react";
import { db } from "@/src/lib/firebase";
import {
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function AdminForm() {
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState("");

  const fetchEmails = async () => {
    const querySnapshot = await getDocs(collection(db, "authorized_emails"));
    const emailsList = querySnapshot.docs.map((doc) => doc.id);
    setEmails(emailsList);
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    try {
      await setDoc(doc(db, "authorized_emails", email), { authorized: true });
      setEmail("");
      fetchEmails();
    } catch (err: any) {
      setError("Failed to add email: " + err.message);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    try {
      await deleteDoc(doc(db, "authorized_emails", emailToRemove));
      fetchEmails();
    } catch (err: any) {
      setError("Failed to remove email: " + err.message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Admin: Manage Authorized Emails
      </h1>
      <form onSubmit={handleAddEmail}>
        <div className="mb-4">
          <label className="block text-sm font-medium">Add Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="mt-1 w-full rounded-md border p-2"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Add Email
        </button>
      </form>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <div className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Authorized Emails</h2>
        {emails.length === 0 ? (
          <p>No emails added yet.</p>
        ) : (
          <ul>
            {emails.map((email) => (
              <li key={email} className="flex justify-between py-1">
                {email}
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
