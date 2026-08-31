import type { StandardNewsProps } from "@/components/news-props";
import { fieldValue } from "@/components/news-props";
import { cn } from "@/lib/utils";

type Props = StandardNewsProps;

const DEFAULT_SUMMARY =
  "ಜನ 3 ರದ ಕರನಟಕದ ನತನ ಮಖಯಮತರಯಗ ಕಗರಸ ನಯಕ ಡ ಕ ಶವಕಮರ ಪರಮಣ ವಚನ ಸವಕರಕಕ ಲಕ ಭವನದಲಲ ವಯಪಕ ವಯವಸಥ ಮಡಲಗದ.\n" +
  "ವಧನಸಧ ಮತತ ಲಕಭವನ ಪರದಶದ ಸತತಲ ಸನಯ ಗಧ, ರಹಲ ಗಧ, ಡಕ ಶವಕಮರ, ಎಐಸಸ ಪರಧನ ಕರಯದರಶ, ಕರನಟಕದ ಉಸತವರ ರಣದಪ ಸಗ ಸರಜವಲ ಮತತ ನರಗಮತ ಮಖಯಮತರ ಸದದರಮಯಯ ಸರದತ ಹಲವ ನಯಕರನನ ಒಳಗಡ ಕಗರಸ ಧವಜಗಳ ಮತತ ದಡಡ ಬಯನರಗಳನನ ಹಕಲಗದ.\n" +
  "ಕರನಟಕ ಕಗರಸ ಅಧಯಕಷರ ಆಗರವ ಶವಕಮರ, ಬಧವರ ಸಜ 4.05 ಗಟಗ ಲಕ ಭವನದಲಲ ಸಚವ ಸಪಟದ ಕಲವ ಸದಸಯರದಗ ಮಖಯಮತರಯಗ ಪರಮಣ ವಚನ ಸವಕರಸಲದದರ.";

export default function VerticalSummeryNews({
  excerpt = {
    hidden: false,
    value: DEFAULT_SUMMARY,
    customClass: "",
  },
  className,
}: Props) {
  const summaryValue = fieldValue(excerpt);
  const paragraphs = summaryValue.split(/\n+/).filter(Boolean);

  return (
    <section
      className={cn(
        "w-full overflow-hidden bg-transparent border-b-[2px] border-3742B8",
        className,
      )}
    >
      <div className="inline-flex h-[50px] min-w-[160px] items-center rounded-br-[24px] bg-transparent px-8 text-[22px] font-semibold leading-none text-FFFFFF">
        Summary
      </div>

      {!excerpt?.hidden && paragraphs.length > 0 && (
        <div
          className={`px-8 pt-7 pb-9 font-manrope text-[17px] font-medium leading-[1.7] text-333333 ${
            excerpt?.customClass || ""
          }`}
        >
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="mb-5 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
