export type ColorFamily =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "purple"
  | "pink"
  | "mono"
  | "earth";

export type SortKey =
  | "featured"
  | "latest"
  | "hot"
  | "likes"
  | "views"
  | "favorites"
  | "random"
  | "oldest";

export interface GenParams {
  steps?: number;
  sampler?: string;
  cfg?: number;
  seed?: string;
  size?: string;
  clipSkip?: number;
  denoise?: number;
}

export interface WorkStats {
  views: number;
  likes: number;
  favorites: number;
  downloads: number;
}

export interface Work {
  id: string;
  title: string;
  prompt: string;
  negativePrompt: string;
  promptPublic: boolean;
  note: string;
  modelId: string;
  modelLabel: string;
  modelShort: string;
  params: GenParams;
  tags: string[];
  characters: string[];
  colorFamily: ColorFamily;
  palette: string[];
  width: number;
  height: number;
  src: string;
  thumb: string;
  dominant: string;
  blur: string;
  author: string;
  authorUrl: string;
  sourceName: string;
  sourceUrl: string;
  stats: WorkStats;
  createdAt: string;
  featured: number;
  nsfw: boolean;
}

export interface Model {
  id: string;
  name: string;
  en: string;
  vendor: string;
  code: string;
  tagline: string;
  blurb: string;
  order: number;
}

export type TagGroup =
  | "风格"
  | "场景"
  | "服饰"
  | "构图"
  | "光影"
  | "题材"
  | "色调"
  | "画质"
  | "自定义";

export interface Tag {
  id: string;
  name: string;
  en: string;
  group: TagGroup;
}

export interface Character {
  id: string;
  name: string;
  en: string;
  series: string;
  blurb: string;
  coverId?: string;
  coverPosition?: string;
}

export interface DB {
  version: 1;
  updatedAt: string;
  works: Work[];
  models: Model[];
  characters: Character[];
  tags: Tag[];
}

export interface WorkQuery {
  q?: string;
  model?: string;
  tags?: string[];
  characters?: string[];
  color?: string;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

export interface WorkQueryResult {
  items: Work[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
