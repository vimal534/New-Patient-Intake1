/**
 * STUB — swap for a real payment gateway call (Stripe, etc.).
 * Simulates charging the selected card after a short delay.
 */
export function processPayment(_amount: number): Promise<{ success: true; receiptEmail: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, receiptEmail: "e•••••@example.com" });
    }, 1700);
  });
}
