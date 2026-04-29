import { Link } from "wouter";
import { Logo } from "@/components/Logo";

export function BrandLogo() {
  return (
    <Link href="/">
      <span className="flex items-center gap-2 cursor-pointer">
        <Logo size="nav" />
        <span className="font-display font-medium text-lg text-primary">
          MyWhiskeyPedia
        </span>
      </span>
    </Link>
  );
}
