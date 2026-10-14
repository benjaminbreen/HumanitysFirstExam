import { FaceToggle } from "@/components/FaceToggle";

export function PageTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-10 max-w-3xl">
      <h1 className="font-pixel text-[40px] leading-none sm:text-[56px]">
        <FaceToggle>{title}</FaceToggle>
      </h1>
      {children && (
        <div className="mt-4 text-[1.1rem] leading-relaxed text-ink-soft">
          {children}
        </div>
      )}
    </header>
  );
}
