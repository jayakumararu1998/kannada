import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { cn } from "@/lib/utils";
import NewsCategoryButton from "@/components/ui/newscategorybutton";

type Props = StandardNewsProps;

export default function VerticalButtonWithText({
  title = {
    hidden: false,
    value: "ಪಲಕಯಟರ ಚಹರಕಯಪ ಕಳಗ ನರಣಯ ಧಮಕವದ ಪರಕರ ಕಸನಸ ಮಡ ಕವತರ.",
    customClass: "",
  },
}: Props) {
  const titleValue = fieldValue(title);

  return (
    <article className="w-full overflow-hidden bg-transparent p-4">
      <NewsCategoryButton label="ಬಹತ ಉಲಗ" />

      {!title?.hidden && titleValue && (
        <h3
          className={cn(
            "mt-2 text-333333 text-14-manrope-700 leading-[1.2]",
            title?.customClass,
          )}
        >
          {titleValue}
        </h3>
      )}
    </article>
  );
}
