import {
  PreviewLinkCard,
  PreviewLinkCardContent,
  PreviewLinkCardImage,
  PreviewLinkCardTrigger,
} from "./animate-ui/components/radix/preview-link-card";

interface PreviewSocialButtonProps {
  href: string;
  label: string;
  icon: string;
  iconHover: string;
}

export default function PreviewSocialButton({
  href,
  label,
  icon,
  iconHover,
}: PreviewSocialButtonProps) {
  return (
    <PreviewLinkCard href={href} followCursor>
      <PreviewLinkCardTrigger
        target="_blank"
        className="group inline-flex items-center gap-2 border border-zinc-800
                   text-zinc-400 text-sm px-4 py-2 rounded-full
                   hover:border-zinc-600 hover:text-zinc-100 hover:scale-105 hover:-translate-y-0.5
                   transition-all duration-300"
      >
        <span className="relative w-5 h-5 shrink-0">
          <span
            dangerouslySetInnerHTML={{ __html: icon }}
            className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0"
          />
          <span
            dangerouslySetInnerHTML={{ __html: iconHover }}
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </span>
        {label}
      </PreviewLinkCardTrigger>

      <PreviewLinkCardContent side="top" align="center" target="_blank">
        <PreviewLinkCardImage alt="Vista previa del enlace de GitHub" />
      </PreviewLinkCardContent>
    </PreviewLinkCard>
  );
}
