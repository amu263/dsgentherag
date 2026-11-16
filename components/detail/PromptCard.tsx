"use client";

import type { Work } from "@/lib/types";
import { LockIcon } from "../Icons";
import CopyButton from "./CopyButton";

function fullParameters(work: Work): string {
  const p = work.params;
  const clean = (v?: string) =>
    v && !/^(undefined|null|none|n\/?a|unknown)$/i.test(v.trim()) ? v : "";
  const bits: string[] = [];
  if (p.steps) bits.push(`Steps: ${p.steps}`);
  if (clean(p.sampler)) bits.push(`Sampler: ${clean(p.sampler)}`);
  if (p.cfg != null) bits.push(`CFG scale: ${p.cfg}`);
  if (clean(p.seed)) bits.push(`Seed: ${clean(p.seed)}`);
  if (clean(p.size)) bits.push(`Size: ${clean(p.size)}`);
  if (p.clipSkip) bits.push(`Clip skip: ${p.clipSkip}`);
  if (p.denoise != null) bits.push(`Denoising strength: ${p.denoise}`);
  const head = clean(p.size) ? `Size: ${clean(p.size)}` : "";
  const line = bits.join(", ");
  return [
    work.prompt || "(no prompt)",
    work.negativePrompt ? `Negative prompt: ${work.negativePrompt}` : "",
    line || head,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function PromptCard({ work }: { work: Work }) {
  const hasPrompt = work.promptPublic && work.prompt.trim().length > 0;
  return (
    <div className="prompt-card">
      <div className="prompt-card__head">
        <span className="mono">PROMPT / 提示词</span>
        {hasPrompt && <CopyButton text={work.prompt} className="prompt-card__copy" compact />}
      </div>
      {hasPrompt ? (
        <p className="prompt-card__text">{work.prompt}</p>
      ) : (
        <div className="prompt-card__locked">
          <LockIcon />
          <div>
            <b>{work.note || "作者未公开提示词"}</b>
            <span>生成参数仍然公开，可以先从模型与标签入手。</span>
          </div>
        </div>
      )}
      {work.negativePrompt && (
        <details className="prompt-card__neg">
          <summary>
            <span>负面提示词</span>
            <em className="mono">{work.negativePrompt.length} chars</em>
          </summary>
          <p>{work.negativePrompt}</p>
          <CopyButton text={work.negativePrompt} className="prompt-card__copy prompt-card__copy--text" compact />
        </details>
      )}
      <div className="prompt-card__foot">
        <CopyButton
          text={fullParameters(work)}
          label="复制完整参数"
          className="prompt-card__full"
        />
        <span className="mono">A1111 FORMAT</span>
      </div>
    </div>
  );
}
