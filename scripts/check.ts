import assert from "node:assert/strict";
import { parseA1111, parseComfyJSON, parseNovelAI } from "../lib/metadata";
import { createWork } from "../lib/adminWork";
import { emptyDB, loadDB } from "../lib/store";
import { runQuery } from "../lib/query";

let passed = 0;
function ok(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`ok  ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

ok("A1111 参数解析", () => {
  const src = `masterpiece, 1girl, neon city\nNegative prompt: lowres, watermark\nSteps: 28, Sampler: Euler a, CFG scale: 7, Seed: 123456, Size: 832x1216, Model hash: abc, Model: flux-dev, Clip skip: 2`;
  const m = parseA1111(src);
  assert.ok(m);
  assert.equal(m!.prompt, "masterpiece, 1girl, neon city");
  assert.equal(m!.negativePrompt, "lowres, watermark");
  assert.equal(m!.params.steps, 28);
  assert.equal(m!.params.sampler, "Euler a");
  assert.equal(m!.params.cfg, 7);
  assert.equal(m!.params.seed, "123456");
  assert.equal(m!.params.size, "832x1216");
  assert.equal(m!.params.clipSkip, 2);
  assert.equal(m!.modelName, "flux-dev");
});

ok("ComfyUI prompt JSON 解析", () => {
  const json = JSON.stringify({
    "3": {
      class_type: "KSampler",
      inputs: {
        seed: 998877,
        steps: 24,
        cfg: 6.5,
        sampler_name: "euler",
        positive: ["6", 0],
        negative: ["7", 0],
        denoise: 1,
      },
    },
    "6": { class_type: "CLIPTextEncode", inputs: { text: "a cat on a windowsill" } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality" } },
    "4": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "flux1-dev.safetensors" } },
    "5": { class_type: "EmptyLatentImage", inputs: { width: 1024, height: 1536 } },
  });
  const m = parseComfyJSON(json);
  assert.ok(m);
  assert.equal(m!.source, "comfyui");
  assert.equal(m!.prompt, "a cat on a windowsill");
  assert.equal(m!.negativePrompt, "blurry, low quality");
  assert.equal(m!.params.steps, 24);
  assert.equal(m!.params.cfg, 6.5);
  assert.equal(m!.params.seed, "998877");
  assert.equal(m!.params.size, "1024x1536");
  assert.equal(m!.modelName, "flux1-dev.safetensors");
});

ok("NovelAI Comment JSON 解析", () => {
  const m = parseNovelAI(
    JSON.stringify({
      prompt: "1girl, white hair",
      uc: "bad hands",
      steps: 28,
      scale: 5,
      seed: 42,
      sampler: "k_euler",
      width: 832,
      height: 1216,
    }),
  );
  assert.ok(m);
  assert.equal(m!.source, "novelai");
  assert.equal(m!.prompt, "1girl, white hair");
  assert.equal(m!.negativePrompt, "bad hands");
  assert.equal(m!.params.cfg, 5);
});

const db = loadDB();

ok("查询：模型筛选", () => {
  assert.equal(runQuery(db, { model: "flux", page: 1 }).total, 6);
});

ok("查询：标签交集", () => {
  assert.equal(runQuery(db, { tags: ["cyberpunk"], page: 1 }).total, 3);
});

ok("查询：角色筛选", () => {
  assert.equal(runQuery(db, { characters: ["mengyin"], page: 1 }).total, 7);
  assert.equal(runQuery(db, { characters: ["aqua"], page: 1 }).total, 1);
});

ok("查询：关键词搜索", () => {
  assert.ok(runQuery(db, { q: "双面", page: 1 }).total >= 1);
  assert.ok(runQuery(db, { q: "赛博", page: 1 }).total >= 1);
});

ok("查询：排序与分页", () => {
  const latest = runQuery(db, { sort: "latest", page: 1, pageSize: 5 });
  assert.equal(latest.items.length, 5);
  assert.ok(latest.hasMore);
  assert.ok(latest.items[0].createdAt >= latest.items[4].createdAt);
});

ok("后台：自动建模型 / 标签 / 角色", () => {
  const temp = emptyDB();
  const w = createWork(temp, {
    title: "新作品",
    prompt: "test",
    modelName: "全新模型",
    tags: ["新标签"],
    characters: ["新角色"],
    src: "/api/uploads/x.webp",
    width: 100,
    height: 200,
  });
  assert.equal(temp.models.length, 1);
  assert.equal(temp.tags.length, 1);
  assert.equal(temp.characters.length, 1);
  assert.equal(w.modelId, temp.models[0].id);
  assert.equal(w.tags[0], temp.tags[0].id);
  assert.equal(w.characters[0], temp.characters[0].id);
});

console.log(`\n${passed} checks passed${process.exitCode ? " (with failures)" : ""}`);
