"use client";

import Image from "next/image";
import React from "react";

import { cn } from "@/lib/utils";

export type ZodiacSignName =
  | "mesha"
  | "vrishabha"
  | "mithuna"
  | "kataka"
  | "simha"
  | "kanya"
  | "tula"
  | "vrischika"
  | "dhanu"
  | "makara"
  | "kumbha"
  | "meena";

export type ZodiacSignData = {
  id: ZodiacSignName;
  signName: string;
  dateRange: string;
  image: string;
  tagline: string;
};

export type VerticalAstrologyCardFieldConfig = {
  hidden?: boolean;
  value?: string;
  customClass?: string;
};

export const ASTROLOGY_AVATAR_IMAGES = [
  "/images/astrology%20images/astro1.png",
  "/images/astrology%20images/astro2.png",
  "/images/astrology%20images/astro3.png",
  "/images/astrology%20images/astro4.png",
  "/images/astrology%20images/astro5.png",
  "/images/astrology%20images/astro6.png",
  "/images/astrology%20images/astro7.png",
  "/images/astrology%20images/astro8.png",
  "/images/astrology%20images/astro9.png",
  "/images/astrology%20images/astro10.png",
  "/images/astrology%20images/astro11.png",
  "/images/astrology%20images/astro12.png",
];

export const zodiacSignsData: Record<ZodiacSignName, ZodiacSignData> = {
  mesha: {
    id: "mesha",
    signName: "ಮೇಷ",
    dateRange: "March 21 - April 19",
    image: ASTROLOGY_AVATAR_IMAGES[0],
    tagline: "ಪೋಟಿ",
  },
  vrishabha: {
    id: "vrishabha",
    signName: "ವೃಷಭ",
    dateRange: "April 20 - May 20",
    image: ASTROLOGY_AVATAR_IMAGES[1],
    tagline: "ಮುನ್ನಡೆ",
  },
  mithuna: {
    id: "mithuna",
    signName: "ಮಿಥುನ",
    dateRange: "May 21 - June 20",
    image: ASTROLOGY_AVATAR_IMAGES[2],
    tagline: "ನಲಿವು",
  },
  kataka: {
    id: "kataka",
    signName: "ಕಟಕ",
    dateRange: "June 21 - July 22",
    image: ASTROLOGY_AVATAR_IMAGES[3],
    tagline: "ಶುಭ",
  },
  simha: {
    id: "simha",
    signName: "ಸಿಂಹ",
    dateRange: "July 23 - August 22",
    image: ASTROLOGY_AVATAR_IMAGES[4],
    tagline: "ಧೈರ್ಯ",
  },
  kanya: {
    id: "kanya",
    signName: "ಕನ್ಯಾ",
    dateRange: "August 23 - September 22",
    image: ASTROLOGY_AVATAR_IMAGES[5],
    tagline: "ಚಿಂತನೆ",
  },
  tula: {
    id: "tula",
    signName: "ತುಲಾ",
    dateRange: "September 23 - October 22",
    image: ASTROLOGY_AVATAR_IMAGES[6],
    tagline: "ಸಮತೋಲನ",
  },
  vrischika: {
    id: "vrischika",
    signName: "ವೃಶ್ಚಿಕ",
    dateRange: "October 23 - November 21",
    image: ASTROLOGY_AVATAR_IMAGES[7],
    tagline: "ಸಾಧನೆ",
  },
  dhanu: {
    id: "dhanu",
    signName: "ಧನು",
    dateRange: "November 22 - December 21",
    image: ASTROLOGY_AVATAR_IMAGES[8],
    tagline: "ನಂಬಿಕೆ",
  },
  makara: {
    id: "makara",
    signName: "ಮಕರ",
    dateRange: "December 22 - January 19",
    image: ASTROLOGY_AVATAR_IMAGES[9],
    tagline: "ಯಶಸ್ಸು",
  },
  kumbha: {
    id: "kumbha",
    signName: "ಕುಂಭ",
    dateRange: "January 20 - February 18",
    image: ASTROLOGY_AVATAR_IMAGES[10],
    tagline: "ಆಲೋಚನೆ",
  },
  meena: {
    id: "meena",
    signName: "ಮೀನ",
    dateRange: "February 19 - March 20",
    image: ASTROLOGY_AVATAR_IMAGES[11],
    tagline: "ಖ್ಯಾತಿ",
  },
};

export type VerticalAstrologyCardProps = {
  sign?: ZodiacSignName;
  topText?: string;
  bottomText?: string;
  size?: number;
  className?: string;
  textClassName?: string;
  style?: React.CSSProperties;
  avatarSrc?: string;
  avatarAlt?: string;
  avatarIndex?: number;
  priority?: boolean;
  category?: VerticalAstrologyCardFieldConfig;
  title?: VerticalAstrologyCardFieldConfig;
};

export default function VerticalAstrologyCard({
  sign = "mesha",
  topText,
  bottomText,
  size = 80,
  className,
  textClassName,
  style,
  avatarSrc,
  avatarAlt,
  avatarIndex,
  priority = false,
  category,
  title = {
    hidden: false,
    value: "ಮೆಟ್ರೋಪಾಲಿಟನ್ ಚಾಲೆಂಜ್ ಕೇಳಿ ನಿರಾಯ ಧರ್ಮಶಾಲ ಪ್ರಕಾರ",
  },
}: VerticalAstrologyCardProps) {
  const signData = zodiacSignsData[sign];
  const selectedImage =
    avatarSrc ||
    (typeof avatarIndex === "number"
      ? ASTROLOGY_AVATAR_IMAGES[
          Math.max(0, Math.min(avatarIndex, ASTROLOGY_AVATAR_IMAGES.length - 1))
        ]
      : signData.image);
  const categoryValue = topText ?? category?.value ?? signData.signName;
  const titleValue = bottomText ?? title?.value ?? signData.tagline;

  return (
    <article
      className={cn(
        "w-full overflow-hidden bg-F2F7FF px-5 pb-6 pt-7 text-center",
        className,
      )}
      style={style}
    >
      <div
        className="relative mx-auto overflow-hidden rounded-full border border-FFFFFF bg-FFFFFF"
        style={{ width: size, height: size }}
      >
        <Image
          src={selectedImage}
          alt={avatarAlt || signData.signName}
          fill
          priority={priority}
          sizes={`${size}px`}
          className="object-cover object-top"
          unoptimized={selectedImage.startsWith("data:")}
        />
      </div>

      {!category?.hidden && categoryValue && (
        <div
          className={cn(
            "mt-6 text-12-inter-600 uppercase leading-100 text-3742B8",
            textClassName,
            category?.customClass,
          )}
        >
          {categoryValue}
        </div>
      )}

      {!title?.hidden && titleValue && (
        <h3
          className={cn(
            "mt-3 text-center text-14-manrope-700 capitalize leading-130 text-333333",
            title?.customClass,
          )}
        >
          {titleValue}
        </h3>
      )}
    </article>
  );
}
