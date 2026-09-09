import { Github } from "lucide-react";
import Link from "next/link";
import { SITE } from "@/app/site";

const linkClass =
  "font-medium underline underline-offset-4 hover:text-primary";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by the{" "}
            <Link href={SITE.labUrl} target="_blank" rel="noreferrer" className={linkClass}>
              {SITE.labName}
            </Link>{" "}
            for the course AI in Law Practice. Adapted from{" "}
            <Link href={SITE.upstreamRepoUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              RAG-Play
            </Link>{" "}
            by{" "}
            <Link href={SITE.upstreamAuthorUrl} target="_blank" rel="noreferrer" className={linkClass}>
              Kain
            </Link>{" "}
            (MIT License). Source on{" "}
            <Link href={SITE.repoUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              GitHub
            </Link>
            .
          </p>
          <div className="flex items-center space-x-1">
            <Link
              href={SITE.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex h-9 w-9 items-center justify-center rounded-md bg-background hover:bg-muted"
            >
              <Github className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
