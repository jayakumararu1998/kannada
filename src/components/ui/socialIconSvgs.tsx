import * as React from "react";

export type SocialSvgIcon = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number }
>;

type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

function IconBase({ size = 16, className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M14.2 8.3H17V5h-2.8c-3 0-4.6 1.8-4.6 4.4v2H7v3.3h2.6V22h3.5v-7.3H16l.5-3.3h-3.4V9.7c0-.9.4-1.4 1.1-1.4Z"
        fill="currentColor"
      />
    </IconBase>
  );
}

export function XIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M5 4h4.1l3.7 5 4.3-5H20l-5.8 6.8L21 20h-4.1l-4.2-5.7L7.8 20H5l6.4-7.4L5 4Zm2.3 1.7 10.5 12.6h1L8.3 5.7h-1Z"
        fill="currentColor"
      />
    </IconBase>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="2" />
      <circle cx="16.7" cy="7.4" r="1.2" fill="currentColor" />
    </IconBase>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.6 12 5.6 12 5.6s-5 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 0-7.6Z"
        fill="currentColor"
      />
      <path d="m10.4 15.2 5.1-3.2-5.1-3.2v6.4Z" fill="#FF0000" />
    </IconBase>
  );
}

export function WhatsappIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4.2 20 5.4 16.2a8 8 0 1 1 3 2.9L4.2 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.2c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4-.1.6l-.5.6c.6 1 1.4 1.8 2.6 2.4l.7-.8c.2-.2.4-.3.7-.2l1.5.7c.3.1.4.3.4.6v.5c0 .8-.8 1.6-1.7 1.6-2.9 0-7.1-3.6-7.1-6.6 0-.4.1-.6.4-.9Z"
        fill="currentColor"
      />
    </IconBase>
  );
}

export function LinkedinIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M5 9h3.3v10H5V9Zm1.7-4.6a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8ZM10.2 9h3.1v1.4c.5-.8 1.5-1.7 3.2-1.7 3.4 0 4 2.2 4 5.1V19h-3.3v-4.6c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4V19h-3.3V9Z"
        fill="currentColor"
      />
    </IconBase>
  );
}

export function EmailIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m5 8 7 5 7-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ShareNodesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="18" cy="5.5" r="2.6" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="12" r="2.6" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="18.5" r="2.6" stroke="currentColor" strokeWidth="2" />
      <path
        d="m8.4 10.8 7.2-3.9M8.4 13.2l7.2 3.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}
