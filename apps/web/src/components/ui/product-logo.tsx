import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export function ProductLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href={ROUTES.projects} className="inline-flex shrink-0 items-center gap-2">
      <Image
        src="/icon-only.png"
        alt="キメボード"
        width={28}
        height={28}
        className="rounded-[8px]"
        priority
      />
      {compact ? null : (
        <span className="whitespace-nowrap text-base font-semibold tracking-tight">
          キメボード
        </span>
      )}
    </Link>
  );
}
