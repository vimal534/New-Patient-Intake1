import { PhoneFrame } from "@/app/tap-intake/components/PhoneFrame";
import { VerifyScreen } from "../components/shared/VerifyScreen";
import { getDeviceVerificationState } from "./actions";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/intake") ? next : "/intake/app";
  const { canUsePin, justLockedOut } = await getDeviceVerificationState();

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-6 pt-6">
        <VerifyScreen canUsePin={canUsePin} justLockedOut={justLockedOut} next={safeNext} />
      </div>
    </PhoneFrame>
  );
}
