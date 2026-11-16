import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function base(props: P) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const XIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 5l14 14M19 5 5 19" />
  </svg>
);

export const ChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const ArrowUpRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const ArrowLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 12H5M11 18l-6-6 6-6" />
  </svg>
);

export const ArrowDown = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v15M6 13l6 6 6-6" />
  </svg>
);

export const HeartIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20s-7.2-4.5-7.2-9.4A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.2 3.2C19.2 15.5 12 20 12 20Z" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />
  </svg>
);

export const CopyIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="8" y="8" width="12" height="13" rx="1" />
    <path d="M16 5H5a1 1 0 0 0-1 1v12" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 12 5 5L20 6" />
  </svg>
);

export const ShuffleIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 7h3.5c4 0 4.5 10 8.5 10H21M18 4l3 3-3 3M3 17h3.5c1.3 0 2.3-1 3.1-2.5M15 7h3M18 14l3 3-3 3" />
  </svg>
);

export const SlidersIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </svg>
);

export const LockIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10" width="14" height="10" rx="1" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export const EyeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.7" />
  </svg>
);

export const ShareIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="m8.3 10.8 7.4-3.6M8.3 13.2l7.4 3.6" />
  </svg>
);

export const SparkIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);

export const GridIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="7" height="7" />
    <rect x="13" y="4" width="7" height="7" />
    <rect x="4" y="13" width="7" height="7" />
    <rect x="13" y="13" width="7" height="7" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
  </svg>
);

export const PencilIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 20 4.5-1L20 7.5 16.5 4 5 15.5 4 20ZM14.5 6l3.5 3.5" />
  </svg>
);

export const UploadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
  </svg>
);

export const LogOutIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 4H4v16h6M15 8l4 4-4 4M19 12H9" />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
  </svg>
);

export const ExternalIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
  </svg>
);

export const ImageIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="1" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m4 18 5-5 4 4 3-3 4 4" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c0-4 3.4-6 7.5-6s7.5 2 7.5 6" />
  </svg>
);

export const TagIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12V4h8l9 9-8 8-9-9Z" />
    <circle cx="7.5" cy="8.5" r="1.3" />
  </svg>
);

export const PaletteIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.6-1-2.6c0-1 .8-1.4 2-1.4h2.5A3.5 3.5 0 0 0 21 11.5C21 6.8 17 3 12 3Z" />
    <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="9.5" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="14" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const CpuIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="6" y="6" width="12" height="12" rx="1" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
  </svg>
);

export const LayersIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17l9 5 9-5" />
  </svg>
);

export const MenuIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const LinkIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 13a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 0 0-5.7-5.7L11 6.3" />
    <path d="M14 11a4 4 0 0 0-5.7 0L6 13.3a4 4 0 0 0 5.7 5.7l1.3-1.3" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

export const FlagIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 21V4h9l-1 3h6l-2 5 2 5h-6l-1-3H5" />
  </svg>
);
