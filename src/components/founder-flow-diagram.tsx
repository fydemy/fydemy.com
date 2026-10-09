import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function FlowNode({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-xs rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-center font-mono text-sm leading-snug text-foreground font-medium",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ConnectorDown() {
  return (
    <div className="flex flex-col items-center py-2" aria-hidden>
      <div className="h-4 w-px bg-foreground/20" />
      <ChevronDown className="size-3.5 -mt-0.5 text-foreground/30" strokeWidth={2} />
    </div>
  );
}

function ConnectorSplit() {
  return (
    <div className="w-full py-2" aria-hidden>
      <div className="mx-auto flex max-w-xs flex-col items-center md:hidden">
        <div className="h-4 w-px bg-foreground/20" />
        <ChevronDown className="size-3.5 -mt-0.5 text-foreground/30" strokeWidth={2} />
      </div>
      <svg
        viewBox="0 0 100 28"
        className="mx-auto hidden h-7 w-full max-w-2xl text-foreground/20 md:block"
        preserveAspectRatio="none"
      >
        <path
          d="M50 0 V10 M16.67 10 H83.33 M16.67 10 V28 M50 10 V28 M83.33 10 V28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function ConnectorMerge() {
  return (
    <div className="w-full py-2" aria-hidden>
      <svg
        viewBox="0 0 100 28"
        className="mx-auto hidden h-7 w-full max-w-2xl text-foreground/20 md:block"
        preserveAspectRatio="none"
      >
        <path
          d="M16.67 0 V10 M50 0 V10 M83.33 0 V10 M16.67 10 H83.33 M50 10 V28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function BranchItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-4 text-sm leading-relaxed text-foreground/85 before:absolute before:top-2 before:left-0 before:size-1.5 before:rounded-full before:bg-foreground/25">
      {children}
    </li>
  );
}

function OptionColumn({
  title,
  subtitle,
  items,
  footer,
}: {
  title: string;
  subtitle: string;
  items: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2 text-center">
        <FlowNode className="max-w-none">{title}</FlowNode>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <ul className="space-y-2.5">{items}</ul>
      {footer ? (
        <p className="mt-auto pt-2 text-sm leading-relaxed text-foreground/80">
          {footer}
        </p>
      ) : null}
    </div>
  );
}

export function FounderFlowDiagram({
  title = "How it works?",
  className,
}: {
  title?: string;
  className?: string;
}) {
  return (
    <section className={cn("w-full space-y-5 text-left", className)}>
      {title ? (
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          {title}
        </h2>
      ) : null}

      <div className="w-full rounded-xl border border-border/60 p-5 shadow-sm sm:p-8">
        <div
          className="flex flex-col items-center gap-1"
          aria-label="Founder application and routing pipeline"
        >
          <FlowNode>Apply</FlowNode>
          <ConnectorDown />
          <FlowNode>Review & Choose Option<br />(can be simultaneously and optionally)</FlowNode>
          <ConnectorSplit />

          <div className="my-4 grid w-full grid-cols-1 gap-10 md:grid-cols-3 md:gap-6 lg:gap-8">
            <OptionColumn
              title="Core"
              subtitle="Default"
              items={
                <>
                  <BranchItem>
                    Accompanied by Deal Partner @ Boardy
                  </BranchItem>
                  <BranchItem>
                    Playbook & tools from Notion and alumni team
                  </BranchItem>
                  <BranchItem>
                    Peer progress & strategic reviews with mentors
                  </BranchItem>
                </>
              }
            />

            <OptionColumn
              title="Growth"
              subtitle="Partner"
              items={
                <>
                  <BranchItem>
                    Paired with ex-founders, incubator managers, series-A founders
                  </BranchItem>
                  <BranchItem>Strategic Business Development &amp; GTM Execution</BranchItem>
                </>
              }
            />

            <OptionColumn
              title="People"
              subtitle="Partner"
              items={
                <>
                  <BranchItem>
                    Access to YC, MIT, Harvard, Stanford Builder Hubs
                  </BranchItem>
                </>
              }
            />
          </div>

          <ConnectorMerge />
          <ConnectorDown />
          <FlowNode className="max-w-sm sm:max-w-md">Warm Intro</FlowNode>
        </div>
      </div>
    </section>
  );
}
