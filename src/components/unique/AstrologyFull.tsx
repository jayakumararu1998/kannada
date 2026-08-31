"use client";

import Image from "next/image";

import {
  zodiacSignsData,
  type ZodiacSignName,
  type ZodiacSignData,
} from "@/components/ui/VerticalAstrologyCard";
import { cn } from "@/lib/utils";

export type AstrologyFullFieldConfig = {
  hidden?: boolean;
  value?: string;
  customClass?: string;
};

export type AstrologyFullTimeConfig = {
  hidden?: boolean;
  label?: string;
  value?: string;
  icon?: string;
  customClass?: string;
};

export type AstrologyFullProps = {
  className?: string;
  backgroundSrc?: string;
  priority?: boolean;
  heading?: AstrologyFullFieldConfig;
  signs?: ZodiacSignName[];
  signData?: Partial<Record<ZodiacSignName, ZodiacSignData>>;
  infoTitle?: AstrologyFullFieldConfig;
  infoDate?: AstrologyFullFieldConfig;
  infoDescription?: AstrologyFullFieldConfig;
  luckyTitle?: AstrologyFullFieldConfig;
  sunTime?: AstrologyFullTimeConfig;
  moonTime?: AstrologyFullTimeConfig;
  avatarSize?: number;
};

const DEFAULT_SIGNS: ZodiacSignName[] = [
  "mesha",
  "vrishabha",
  "mithuna",
  "kataka",
  "tula",
  "vrischika",
  "dhanu",
  "makara",
  "simha",
  "kanya",
  "kumbha",
  "meena",
];

export default function AstrologyFull({
  className,
  backgroundSrc = "/images/astrology%20images/astro-main.png",
  priority = false,
  heading = { hidden: false, value: "ರಾಶಿಫಲ" },
  signs = DEFAULT_SIGNS,
  signData,
  infoTitle = { hidden: false, value: "ದಿನದ ವಿಶೇಷಗಳು:" },
  infoDate = { hidden: false, value: "ಶುಕ್ರವಾರ 10 ಜುಲೈ 2026" },
  infoDescription = { hidden: false, value: "ಕನ್ನಡ ಪ್ರಭಾ ಜ್ಯೋತಿಷ್ಯ" },
  luckyTitle = { hidden: false, value: "ಉತ್ತಮ ಸಮಯ" },
  sunTime = {
    hidden: false,
    icon: "☀",
    label: "ಬೆಳಗ್ಗೆ",
    value: "9.30 - 10.30",
  },
  moonTime = {
    hidden: false,
    icon: "☾",
    label: "ಸಂಜೆ",
    value: "4.30 - 5.30",
  },
  avatarSize = 80,
}: AstrologyFullProps) {
  const mergedSignData = { ...zodiacSignsData, ...signData };

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-0D156C px-5 py-6 text-FFFFFF sm:px-7 sm:py-8 md:px-9",
        className,
      )}
      aria-label={heading.value || "Astrology"}
    >
      <Image
        src={backgroundSrc}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 1025px) 100vw, 1025px"
        className="object-cover"
        aria-hidden="true"
        unoptimized={backgroundSrc.startsWith("data:")}
      />

      <div className="relative grid gap-7 md:grid-cols-2 md:items-center">
        <div>
          {!heading.hidden && heading.value && (
            <h2 className={cn("mb-5 text-20-manrope-700", heading.customClass)}>
              {heading.value}
            </h2>
          )}

          <div
            className="grid justify-center gap-x-4 gap-y-5"
            style={{
              gridTemplateColumns: `repeat(auto-fit, ${avatarSize}px)`,
            }}
          >
            {signs.map((sign) => {
              const data = mergedSignData[sign];

              if (!data) {
                return null;
              }

              return (
                <div key={sign} className="flex flex-col items-center">
                  <div
                    className="relative overflow-hidden rounded-full border border-FFFFFF bg-0D156C"
                    style={{ width: avatarSize, height: avatarSize }}
                  >
                    <Image
                      src={data.image}
                      alt={data.signName}
                      fill
                      sizes={`${avatarSize}px`}
                      className="object-cover"
                      unoptimized={data.image.startsWith("data:")}
                    />
                  </div>
                  <div className="mt-2 text-center text-12-inter-600 leading-100 text-FFFFFF">
                    {data.signName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="border border-FACC15 bg-0D156C px-7 py-8">
          {!infoTitle.hidden && infoTitle.value && (
            <h3
              className={cn(
                "mb-5 text-20-manrope-700 leading-130 text-FACC15",
                infoTitle.customClass,
              )}
            >
              {infoTitle.value}
            </h3>
          )}

          {(!infoDate.hidden || !infoDescription.hidden) && (
            <div className="mb-7 text-12-manrope-600 leading-130 text-FFFFFF">
              {!infoDate.hidden && infoDate.value && (
                <p className={infoDate.customClass}>{infoDate.value}</p>
              )}
              {!infoDescription.hidden && infoDescription.value && (
                <p className={infoDescription.customClass}>
                  {infoDescription.value}
                </p>
              )}
            </div>
          )}

          {!luckyTitle.hidden && luckyTitle.value && (
            <h4
              className={cn(
                "mb-4 text-16-manrope-700 leading-130 text-FACC15",
                luckyTitle.customClass,
              )}
            >
              {luckyTitle.value}
            </h4>
          )}

          <div className="grid gap-4 text-12-manrope-600 leading-130 text-FFFFFF">
            {!sunTime.hidden && (
              <div
                className={cn("flex items-center gap-2", sunTime.customClass)}
              >
                <span className="text-FACC15" aria-hidden="true">
                  {sunTime.icon}
                </span>
                <span>
                  {sunTime.label}: {sunTime.value}
                </span>
              </div>
            )}

            {!moonTime.hidden && (
              <div
                className={cn("flex items-center gap-2", moonTime.customClass)}
              >
                <span className="text-FACC15" aria-hidden="true">
                  {moonTime.icon}
                </span>
                <span>
                  {moonTime.label}: {moonTime.value}
                </span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
