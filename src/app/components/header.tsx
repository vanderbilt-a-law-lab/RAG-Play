import Logo from "@/components/logo.svg";
import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";
import { SITE } from "@/app/site";

export function Header() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex">
          <Link className="mr-6 flex items-center space-x-3" href="/">
            <div className="h-8 w-8">
              <Image src={Logo} alt="Logo" className="h-full w-full" />
            </div>
            <span className="font-semibold text-xl">{SITE.name}</span>
          </Link>
        </div>

        <Link
          href={SITE.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
          aria-label="View source on GitHub"
        >
          <Github className="h-6 w-6" />
        </Link>
      </div>
    </nav>
  );
}
