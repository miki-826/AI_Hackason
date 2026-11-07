"use client";

import type { SVGProps } from "react";
import type { FurnitureType } from "@/game-core/types";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  size?: number;
};

function baseProps({ size = 20, className, ...rest }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className,
    ...rest,
  };
}

export function Chair(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M7 4v9h10V4" />
      <path d="M7 8h10" />
      <path d="M5 13h14v2H5z" />
      <path d="M7 15v5" />
      <path d="M17 15v5" />
    </svg>
  );
}

export function Clock(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M12 7v1.8l1.3 1" />
      <path d="M12 12v5" />
      <circle cx="12" cy="18.2" r="1.3" />
    </svg>
  );
}

export function Desk(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 8h18v3H3z" />
      <path d="M5 11v9" />
      <path d="M19 11v9" />
      <rect x="13" y="11" width="6" height="5" />
      <path d="M15.5 13.5h1" />
      <path d="M8 5.5l2-2.5 1.5 2.5" />
    </svg>
  );
}

export function Bookshelf(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M4 9h16" />
      <path d="M4 15h16" />
      <path d="M8 4.5v4.5" />
      <path d="M11 4.5v4.5" />
      <path d="M15 4.8l1.2 4.2" />
      <path d="M7 10.5v4.5" />
      <path d="M12 10.5v4.5" />
      <path d="M16 10.5v4.5" />
      <path d="M9 16.5v4.5" />
      <path d="M14 16.5v4.5" />
    </svg>
  );
}

export function Drawer(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M4 9.5h16" />
      <path d="M4 15h16" />
      <path d="M10.5 6.8h3" />
      <path d="M10.5 12.2h3" />
      <path d="M10.5 17.5h3" />
    </svg>
  );
}

export function Mirror(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <ellipse cx="12" cy="10.5" rx="5.5" ry="7.5" />
      <path d="M9.5 7.5l2.5-2" />
      <path d="M9 11l4.5-3.5" />
      <path d="M6.5 20h11" />
      <path d="M9 18v2" />
      <path d="M15 18v2" />
    </svg>
  );
}

export function Gear(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function Satchel(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8 7V5.5a4 4 0 0 1 8 0V7" />
      <rect x="3.5" y="7" width="17" height="13" rx="2" />
      <path d="M3.5 12h17" />
      <rect x="10.5" y="10.5" width="3" height="3.5" rx="0.5" />
    </svg>
  );
}

export function Lock(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.2" />
    </svg>
  );
}

export function Unlock(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.6-1.8" />
      <circle cx="12" cy="16" r="1.2" />
    </svg>
  );
}

export function Eye(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M2.2 12S6 5.5 12 5.5 21.8 12 21.8 12 18 18.5 12 18.5 2.2 12 2.2 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function Question(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.2a2.5 2.5 0 0 1 4.8.8c0 1.6-2.4 2.1-2.4 3.6" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function Back(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M15 18l-6-6 6-6" />
      <path d="M9.5 12H20" />
    </svg>
  );
}

export function Close(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function Magnifier(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}

export function Keyhole(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="2.2" />
      <path d="M10.8 11.9L10 16.5h4l-.8-4.6" />
    </svg>
  );
}

export function Door(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21" />
      <path d="M3.5 21h17" />
      <circle cx="14.8" cy="12.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function Sparkle(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3l2.1 6.4L20.5 12l-6.4 2.6L12 21l-2.1-6.4L3.5 12l6.4-2.6L12 3z" />
    </svg>
  );
}

export type FurnitureIconProps = IconProps & {
  type: FurnitureType;
};

export function FurnitureIcon({ type, ...rest }: FurnitureIconProps) {
  switch (type) {
    case "chair":
      return <Chair {...rest} />;
    case "clock":
      return <Clock {...rest} />;
    case "desk":
      return <Desk {...rest} />;
    case "bookshelf":
      return <Bookshelf {...rest} />;
    case "drawer":
      return <Drawer {...rest} />;
    case "mirror":
      return <Mirror {...rest} />;
  }
}
