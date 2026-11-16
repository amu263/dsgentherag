import Image from "next/image";
import Link from "next/link";
import { formatCount } from "@/lib/format";
import type { Work } from "@/lib/types";
import { ArrowUpRight, HeartIcon } from "./Icons";

export default function WorkCard({ work, index }: { work: Work; index: number }) {
  const promptPreview = work.promptPublic && work.prompt ? work.prompt : "作者未公开提示词";
  return (
    <Link className="work" href={`/p/${work.id}`} aria-label={`${work.title}，${work.author}`}>
      <div className="work__media" style={{ aspectRatio: `${work.width} / ${work.height}` }}>
        <Image
          src={work.thumb}
          alt={work.title}
          fill
          sizes="(max-width: 599px) 48vw, (max-width: 839px) 32vw, (max-width: 1179px) 31vw, (max-width: 1559px) 24vw, 19vw"
          placeholder="blur"
          blurDataURL={work.blur}
          style={{ objectFit: "cover" }}
        />
        <div className="work__top">
          <span className="work__model">
            <i />
            {work.modelShort || work.modelLabel}
          </span>
          <span className="work__no">NO.{String(index + 1).padStart(3, "0")}</span>
        </div>
        <div className="work__hover">
          <p className="work__prompt">{promptPreview}</p>
          <span className="work__cta">
            打开提示词 <ArrowUpRight />
          </span>
        </div>
      </div>
      <div className="work__bar">
        <div className="work__bar-main">
          <span className="work__title">{work.title}</span>
          <span className="work__sub">by {work.author}</span>
        </div>
        <span className="work__like">
          <HeartIcon /> {formatCount(work.stats.likes)}
        </span>
      </div>
    </Link>
  );
}
