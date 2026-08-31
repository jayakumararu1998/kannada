"use client";

import * as React from "react";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsappIcon,
  XIcon,
  YoutubeIcon,
  type SocialSvgIcon,
} from "@/components/ui/socialIconSvgs";

import { cn } from "@/lib/utils";

type HeaderSocialPlatform =
  "facebook" | "x" | "instagram" | "youtube" | "whatsapp";

type HeaderSocialIconItem = {
  platform: HeaderSocialPlatform;
  href: string;
  ariaLabel?: string;
};

type SocialIconsHeadeerProps = {
  links?: HeaderSocialIconItem[];
  className?: string;
  iconClassName?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
};

const ICONS: Record<
  HeaderSocialPlatform,
  { component: SocialSvgIcon; label: string; className: string }
> = {
  facebook: {
    component: FacebookIcon,
    label: "Facebook",
    className: "bg-[#1877F2] text-white",
  },
  x: {
    component: XIcon,
    label: "X",
    className: "bg-[#000000] text-white",
  },
  instagram: {
    component: InstagramIcon,
    label: "Instagram",
    className: "bg-[#E6007E] text-white",
  },
  youtube: {
    component: YoutubeIcon,
    label: "YouTube",
    className: "bg-[#FF0000] text-white",
  },
  whatsapp: {
    component: WhatsappIcon,
    label: "WhatsApp",
    className: "bg-[#25D366] text-white",
  },
};

const DEFAULT_LINKS: HeaderSocialIconItem[] = [
  { platform: "facebook", href: "#" },
  { platform: "x", href: "#" },
  { platform: "instagram", href: "#" },
  { platform: "youtube", href: "#" },
  { platform: "whatsapp", href: "#" },
];

export default function SocialIconsHeadeer({
  links = DEFAULT_LINKS,
  className,
  iconClassName,
  target = "_blank",
  rel = "noopener noreferrer",
}: SocialIconsHeadeerProps) {
  return (
    <div className={cn("inline-flex items-center gap-[20px]", className)}>
      {links.map((link) => {
        const config = ICONS[link.platform];
        const Icon = config.component;

        return (
          <a
            key={link.platform}
            href={link.href}
            target={target}
            rel={rel}
            aria-label={link.ariaLabel ?? config.label}
            className={cn(
              "inline-flex h-[28px] w-[28px] items-center justify-center rounded-full transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-000000",
              config.className,
              iconClassName,
            )}
          >
            <span className="sr-only">{config.label}</span>
            <Icon size={16} aria-hidden="true" className="text-current" />
          </a>
        );
      })}
    </div>
  );
}
