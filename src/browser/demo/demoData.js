const parseTimestamp = (val) => {
  if (!val) return 0;
  const t = Date.parse(val);
  return Number.isFinite(t) ? t : 0;
};

const now = Date.now();
const DAY = 86400000;

const jobsData = [
  {
    id: 1,
    original_filename: "aurora-timelapse.mp4",
    filename: "aurora-timelapse.mp4",
    prompt: "Northern lights timelapse over mountains",
    status: "finished",
    width: 1920,
    height: 1080,
    duration: 30.5,
    created_at: new Date(now - DAY * 7).toISOString(),
    updated_at: new Date(now - DAY * 6).toISOString(),
    tags: ["aurora", "nature", "timelapse", "night", "hdr"],
    rating: 5,
    generator: "vid2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 2,
    original_filename: "city-sunset-drone.mp4",
    filename: "city-sunset-drone.mp4",
    prompt: "Aerial drone footage of city at sunset",
    status: "finished",
    width: 3840,
    height: 2160,
    duration: 45.2,
    created_at: new Date(now - DAY * 5).toISOString(),
    updated_at: new Date(now - DAY * 4).toISOString(),
    tags: ["drone", "cityscape", "sunset", "aerial", "4K"],
    rating: 4,
    generator: "img2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 3,
    original_filename: "underwater-reef.mp4",
    filename: "underwater-reef.mp4",
    prompt: "Coral reef underwater footage with fish",
    status: "processing",
    width: 1920,
    height: 1080,
    duration: 20.0,
    created_at: new Date(now - DAY * 3).toISOString(),
    updated_at: new Date(now - DAY * 2).toISOString(),
    tags: ["underwater", "ocean", "wildlife", "coral", "HDR"],
    rating: 3,
    generator: "txt2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 4,
    original_filename: "macro-butterfly.mp4",
    filename: "macro-butterfly.mp4",
    prompt: "Macro shot of butterfly on flower",
    status: "finished",
    width: 1920,
    height: 1080,
    duration: 15.7,
    created_at: new Date(now - DAY * 10).toISOString(),
    updated_at: new Date(now - DAY * 9).toISOString(),
    tags: ["macro", "nature", "insect", "flower", "slow-motion"],
    rating: 4,
    generator: "vid2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 5,
    original_filename: "storm-clouds.mp4",
    filename: "storm-clouds.mp4",
    prompt: "Time-lapse of storm clouds rolling in",
    status: "queued",
    width: 1920,
    height: 1080,
    duration: 60.0,
    created_at: new Date(now - DAY * 1).toISOString(),
    updated_at: new Date(now - DAY * 1).toISOString(),
    tags: ["weather", "storm", "timelapse", "dramatic"],
    rating: 0,
    generator: "vid2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 6,
    original_filename: "dance-performance.mp4",
    filename: "dance-performance.mp4",
    prompt: "Contemporary dance performance on stage",
    status: "finished",
    width: 1920,
    height: 1080,
    duration: 120.0,
    created_at: new Date(now - DAY * 14).toISOString(),
    updated_at: new Date(now - DAY * 13).toISOString(),
    tags: ["dance", "performance", "stage", "lighting", "art"],
    rating: 5,
    generator: "vid2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 7,
    original_filename: "desert-dunes.mp4",
    filename: "desert-dunes.mp4",
    prompt: "Sweeping shots of desert dunes at golden hour",
    status: "finished",
    width: 3840,
    height: 2160,
    duration: 35.0,
    created_at: new Date(now - DAY * 21).toISOString(),
    updated_at: new Date(now - DAY * 20).toISOString(),
    tags: ["desert", "landscape", "golden-hour", "4K", "nature"],
    rating: 4,
    generator: "img2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 8,
    original_filename: "food-preparation.mp4",
    filename: "food-preparation.mp4",
    prompt: "Professional chef preparing pasta dish",
    status: "finished",
    width: 1920,
    height: 1080,
    duration: 90.0,
    created_at: new Date(now - DAY * 2).toISOString(),
    updated_at: new Date(now - DAY * 1).toISOString(),
    tags: ["food", "cooking", "recipe", "italian", "close-up"],
    rating: 3,
    generator: "txt2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 9,
    original_filename: "rainforest-waterfall.mp4",
    filename: "rainforest-waterfall.mp4",
    prompt: "Jungle waterfall in tropical rainforest",
    status: "processing",
    width: 1920,
    height: 1080,
    duration: 25.0,
    created_at: new Date(now - DAY * 4).toISOString(),
    updated_at: new Date(now - DAY * 3).toISOString(),
    tags: ["rainforest", "waterfall", "nature", "tropical", "green"],
    rating: 4,
    generator: "vid2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 10,
    original_filename: "night-lapse-stars.mp4",
    filename: "night-lapse-stars.mp4",
    prompt: "Milky Way time-lapse over mountain silhouette",
    status: "finished",
    width: 1920,
    height: 1080,
    duration: 40.0,
    created_at: new Date(now - DAY * 30).toISOString(),
    updated_at: new Date(now - DAY * 29).toISOString(),
    tags: ["astrophotography", "stars", "night", "timelapse", "landscape"],
    rating: 5,
    generator: "img2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 11,
    original_filename: "street-fashion.mp4",
    filename: "street-fashion.mp4",
    prompt: "Street fashion photography in Tokyo",
    status: "finished",
    width: 1920,
    height: 1080,
    duration: 55.0,
    created_at: new Date(now - DAY * 11).toISOString(),
    updated_at: new Date(now - DAY * 10).toISOString(),
    tags: ["fashion", "street", "tokyo", "urban", "portrait"],
    rating: 4,
    generator: "txt2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 12,
    original_filename: "waves-rocky-coast.mp4",
    filename: "waves-rocky-coast.mp4",
    prompt: "Waves crashing against rocky coastline",
    status: "finished",
    width: 1920,
    height: 1080,
    duration: 22.0,
    created_at: new Date(now - DAY * 18).toISOString(),
    updated_at: new Date(now - DAY * 17).toISOString(),
    tags: ["ocean", "waves", "coast", "nature", "slow-motion"],
    rating: 4,
    generator: "vid2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 13,
    original_filename: "sports-highlights.mp4",
    filename: "sports-highlights.mp4",
    prompt: "Basketball game highlights reel",
    status: "queued",
    width: 1920,
    height: 1080,
    duration: 180.0,
    created_at: new Date(now - DAY * 0.5).toISOString(),
    updated_at: new Date(now - DAY * 0.5).toISOString(),
    tags: ["sports", "basketball", "highlights", "action"],
    rating: 0,
    generator: "vid2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 14,
    original_filename: "wildlife-safari.mp4",
    filename: "wildlife-safari.mp4",
    prompt: "African safari wildlife compilation",
    status: "processing",
    width: 1920,
    height: 1080,
    duration: 45.0,
    created_at: new Date(now - DAY * 6).toISOString(),
    updated_at: new Date(now - DAY * 5).toISOString(),
    tags: ["wildlife", "safari", "animals", "africa", "nature"],
    rating: 0,
    generator: "vid2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 15,
    original_filename: "abstract-art.mp4",
    filename: "abstract-art.mp4",
    prompt: "Abstract generative art animation",
    status: "finished",
    width: 1920,
    height: 1080,
    duration: 12.0,
    created_at: new Date(now - DAY * 25).toISOString(),
    updated_at: new Date(now - DAY * 24).toISOString(),
    tags: ["abstract", "generative", "art", "colorful", "animation"],
    rating: 5,
    generator: "deforum",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 16,
    original_filename: "vintage-film.mp4",
    filename: "vintage-film.mp4",
    prompt: "Vintage 8mm film style city streets",
    status: "finished",
    width: 1280,
    height: 720,
    duration: 33.0,
    created_at: new Date(now - DAY * 16).toISOString(),
    updated_at: new Date(now - DAY * 15).toISOString(),
    tags: ["vintage", "retro", "film", "urban", "nostalgic"],
    rating: 3,
    generator: "vid2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 17,
    original_filename: "garden-timelapse.mp4",
    filename: "garden-timelapse.mp4",
    prompt: "Flower garden timelapse spring bloom",
    status: "finished",
    width: 1920,
    height: 1080,
    duration: 28.0,
    created_at: new Date(now - DAY * 12).toISOString(),
    updated_at: new Date(now - DAY * 11).toISOString(),
    tags: ["garden", "flowers", "timelapse", "spring", "nature"],
    rating: 4,
    generator: "vid2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 18,
    original_filename: "architecture-interior.mp4",
    filename: "architecture-interior.mp4",
    prompt: "Modern architecture interior spaces tour",
    status: "finished",
    width: 3840,
    height: 2160,
    duration: 65.0,
    created_at: new Date(now - DAY * 9).toISOString(),
    updated_at: new Date(now - DAY * 8).toISOString(),
    tags: ["architecture", "interior", "modern", "design", "4K"],
    rating: 4,
    generator: "img2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 19,
    original_filename: "pet-dog.mp4",
    filename: "pet-dog.mp4",
    prompt: "Golden retriever playing in park",
    status: "finished",
    width: 1920,
    height: 1080,
    duration: 18.0,
    created_at: new Date(now - DAY * 20).toISOString(),
    updated_at: new Date(now - DAY * 19).toISOString(),
    tags: ["pets", "dog", "outdoor", "cute", "happy"],
    rating: 5,
    generator: "txt2vid",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
  {
    id: 20,
    original_filename: "art-tutorial.mp4",
    filename: "art-tutorial.mp4",
    prompt: "Digital painting speed art tutorial",
    status: "processing",
    width: 1920,
    height: 1080,
    duration: 300.0,
    created_at: new Date(now - DAY * 0.3).toISOString(),
    updated_at: new Date(now - DAY * 0.3).toISOString(),
    tags: ["art", "tutorial", "digital-painting", "speed-art", "educational"],
    rating: 0,
    generator: "deforum",
    url: null,
    preview_url: null,
    preview_img: null,
    preview_animation: null,
    thumbnail: null,
  },
];

const fileCategories = [
  { name: "backgrounds", hue: 210 },
  { name: "textures", hue: 30 },
  { name: "characters", hue: 340 },
  { name: "props", hue: 100 },
  { name: "effects", hue: 270 },
  { name: "ui-assets", hue: 50 },
  { name: "reference", hue: 180 },
  { name: "renders", hue: 0 },
];

function generateFiles(count = 48) {
  const files = [];
  const extensions = [".png", ".jpg", ".svg", ".webp", ".gif", ".blend", ".psd", ".exr"];
  const mimes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".blend": "application/octet-stream",
    ".psd": "image/vnd.adobe.photoshop",
    ".exr": "image/x-exr",
  };
  const names = [
    "hero-banner", "particle-sprite", "ground-tile", "sky-gradient", "character-idle",
    "ui-panel-bg", "icon-search", "logo-dark", "logo-light", "mountain-bg",
    "water-texture", "leaf-sprite", "rock-tile", "wall-brick", "door-frame",
    "window-glass", "lamp-post", "fence-wood", "grass-patch", "cloud-layer",
    "shadow-mask", "light-oring", "explosion-sheet", "ui-button-primary",
    "ui-button-hover", "font-atlas", "particle-fire", "particle-smoke",
    "ground-shadow", "skybox-top", "skybox-front", "skybox-left",
    "character-walk", "character-jump", "enemy-sprite", "npc-portrait",
    "treasure-chest", "key-icon", "potion-bottle", "map-terrain",
    "bridge-wood", "castle-door", "dungeon-wall", "lava-texture",
    "ice-floor", "sand-dune", "snow-ground", "foliage-bush",
  ];

  for (let i = 0; i < count; i++) {
    const nameIdx = i % names.length;
    const ext = extensions[i % extensions.length];
    const cat = fileCategories[i % fileCategories.length];
    const tagCount = 1 + (i % 4);
    const tags = [];
    tags.push(cat.name);
    if (i % 3 === 0) tags.push("optimized");
    if (i % 5 === 0) tags.push("hd");
    if (i % 2 === 0) tags.push("texture");
    if (i > names.length * 0.3) tags.push("v2");
    if (i > names.length * 0.6) tags.push("final");

    const width = [1920, 2560, 1024, 800, 4096, 512, 2048, 1280][i % 8];
    const height = [1080, 1440, 768, 600, 2160, 512, 2048, 720][i % 8];

    const createdAt = new Date(now - DAY * (3 + i * 1.2)).toISOString();

    files.push({
      id: 1000 + i,
      original_name: `${names[nameIdx]}${ext}`,
      name: `${names[nameIdx]}${ext}`,
      path: `project-assets/${cat.name}/${names[nameIdx]}${ext}`,
      disk: "local",
      size: Math.floor(Math.random() * 50 + 1) * 1024 * 1024,
      mime_type: mimes[ext] || "application/octet-stream",
      type: "file",
      width,
      height,
      created_at: createdAt,
      updated_at: createdAt,
      tags,
      rating: null,
    });
  }
  return files;
}

export function generateDemoData() {
  return { jobs: jobsData, files: generateFiles(48) };
}

export function injectDemoData(store) {
  const data = generateDemoData();

  store.commit("videojobs/SET_LIST", data.jobs);
  store.commit("videojobs/SET_META", { page: { total: data.jobs.length } });

  store.commit("files/SET_LIST", data.files);
  store.commit("files/SET_META", { page: { total: data.files.length } });

  const tagMap = new Map();
  const addTags = (tags) => {
    if (!Array.isArray(tags)) return;
    tags.forEach((tagName) => {
      if (!tagName) return;
      tagMap.set(tagName, (tagMap.get(tagName) || 0) + 1);
    });
  };
  data.jobs.forEach((j) => addTags(j.tags));
  data.files.forEach((f) => addTags(f.tags));

  const tags = Array.from(tagMap.entries()).map(([name, usageCount], idx) => ({
    id: 2000 + idx,
    name,
    usageCount,
    color: null,
  }));

  store.commit("tags/SET_LIST", tags);
  store.commit("tags/SET_META", { page: { total: tags.length } });

  const groupData = {};
  data.files.forEach((f) => {
    const fileTags = Array.isArray(f.tags) ? f.tags : [];
    if (fileTags.length === 0) {
      const key = "untagged";
      if (!groupData[key]) groupData[key] = { tag: { id: "untagged", name: "Untagged" }, files: [] };
      groupData[key].files.push(f);
      return;
    }
    fileTags.forEach((tagName) => {
      const tag = tags.find((t) => t.name === tagName);
      if (!tag) return;
      if (!groupData[tag.id]) groupData[tag.id] = { tag, files: [] };
      groupData[tag.id].files.push(f);
    });
  });

  store.commit("files/SET_GROUPED_BY_TAGS", Object.values(groupData));
};
