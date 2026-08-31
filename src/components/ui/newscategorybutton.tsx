type NewsCategoryButtonProps = {
  label?: string;
  className?: string;
};

export default function NewsCategoryButton({
  label = "",
  className,
}: NewsCategoryButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex h-[27px] w-[114px] items-center justify-center gap-[10px] rounded-[50px] rounded-br-none bg-3046EB text-FFFFFF text-14-balootamma2-600 leading-[1] ${className || ""}`}
    >
      {label}
    </button>
  );
}
