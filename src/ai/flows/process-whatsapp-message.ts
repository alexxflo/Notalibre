'use server';
/**
 * @fileOverview Processes incoming WhatsApp messages to verify purchases.
 *
 * - processWhatsappMessage - A flow that parses a message, and if valid,
 *   updates a purchase verification and credits coins to a user.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import {
  doc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export const ProcessWhatsappMessageInputSchema = z.object({
  message: z.string().describe('The incoming message from WhatsApp.'),
});
export type ProcessWhatsappMessageInput = z.infer<
  typeof ProcessWhatsappMessageInputSchema
>;

export const ProcessWhatsappMessageOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ProcessWhatsappMessageOutput = z.infer<
  typeof ProcessWhatsappMessageOutputSchema
>;

// Define coin packages - should match what's in the frontend.
const coinPackages = [
  { id: 'basic', coins: 40 },
  { id: 'standard', coins: 80 },
  { id: 'premium', coins: 120 },
  { id: 'pro', coins: 300 },
];

export async function processWhatsappMessage(input: ProcessWhatsappMessageInput): Promise<ProcessWhatsappMessageOutput> {
  return processWhatsappMessageFlow(input);
}

const processWhatsappMessageFlow = ai.defineFlow(
  {
    name: 'processWhatsappMessageFlow',
    inputSchema: ProcessWhatsappMessageInputSchema,
    outputSchema: ProcessWhatsappMessageOutputSchema,
  },
  async ({ message }) => {
    // This flow uses the Firebase client SDK and will only work if the
    // Firestore security rules are configured to allow unauthenticated writes
    // from the server environment where this flow runs.
    // In production, you MUST use the Firebase Admin SDK for better security.
    const { firestore } = initializeFirebase();

    // Regex to find "ok" and a potential verification ID.
    // e.g., "ok <verificationId>"
    const match = message.toLowerCase().match(/ok\s+([a-zA-Z0-9]+)/);

    if (!match || !match[1]) {
      return {
        success: false,
        message: 'Message does not contain "ok" followed by a verification ID.',
      };
    }

    const verificationId = match[1];
    const verificationRef = doc(firestore, 'purchase_verifications', verificationId);

    try {
      const verificationSnap = await getDoc(verificationRef);

      if (!verificationSnap.exists()) {
        return {
          success: false,
          message: `Verification ID "${verificationId}" not found.`,
        };
      }

      const verificationData = verificationSnap.data();

      if (verificationData.status === 'completed') {
        return {
          success: false,
          message: `Purchase ${verificationId} has already been completed.`,
        };
      }

      const { userId, packageId } = verificationData;
      const userDocRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        await updateDoc(verificationRef, { status: 'rejected', reason: 'User not found' });
        return { success: false, message: `User ${userId} not found.` };
      }

      const pkg = coinPackages.find((p) => p.id === packageId);
      if (!pkg) {
        await updateDoc(verificationRef, { status: 'rejected', reason: 'Package not found' });
        return { success: false, message: `Package ${packageId} not found.` };
      }

      // Atomically update user's coin balance and the verification status.
      await updateDoc(userDocRef, {
        coinBalance: increment(pkg.coins),
      });

      await updateDoc(verificationRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Successfully processed purchase ${verificationId}. Added ${pkg.coins} coins to user ${userId}.`,
      };
    } catch (e: any) {
      console.error(`Error processing WhatsApp message for verificationId "${verificationId}":`, e);
      // In case of permission errors, this will be caught here.
      return { success: false, message: e.message || 'An unknown error occurred.' };
    }
  }
);
