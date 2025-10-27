import * as React from "react";

const Ctx = React.createContext<{ onOpenChange?: (v: boolean) => void } | null>(null);

type DialogRootProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogRootProps) {
  // Renderuj children tylko gdy open = true (inaczej modal “wisi” zawsze)
  return (
    <Ctx.Provider value={{ onOpenChange }}>
      {open ? <>{children}</> : null}
    </Ctx.Provider>
  );
}

export function DialogTrigger({
  asChild = false,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const ctx = React.useContext(Ctx);
  const onClick = (e: any) => {
    children.props?.onClick?.(e);
    ctx?.onOpenChange?.(true);
  };
  return asChild
    ? React.cloneElement(children, { onClick })
    : <button onClick={onClick}>{children}</button>;
}

export function DialogContent({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(Ctx);
  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) ctx?.onOpenChange?.(false);
  };
  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") ctx?.onOpenChange?.(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [ctx]);

  return (
    <div
      onClick={onBackdrop}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className={`max-h-[85vh] w-[95vw] max-w-xl overflow-auto rounded-2xl bg-white p-4 shadow-xl ${className}`}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-2">{children}</div>;
}
export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold">{children}</h3>;
}
export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500">{children}</p>;
}
