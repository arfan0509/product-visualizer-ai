export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface Medium {
  id: string;
  name: string;
  icon: string; // Used for dynamic Lucide icons
  description: string;
  category: "Merchandise" | "Outdoor Media" | "Digital & Print" | "Lifestyle Accessories";
  defaultPrompt: string;
}

export interface Product {
  name: string;
  image: string; // base64 string
  type: "uploaded" | "ai-generated";
  prompt?: string;
}

export interface Visualization {
  id: string;
  mediumId: string;
  mediumName: string;
  image: string;
  stylePrompt: string;
  aspectRatio: AspectRatio;
  status: "pending" | "success" | "error";
  error?: string;
  feedback?: string;
  timestamp: number;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  promptAddon: string;
}

export const MARKETING_MEDIUMS: Medium[] = [
  {
    id: "coffee_mug",
    name: "Ceramic Coffee Mug",
    icon: "Coffee",
    description: "Visualized on a premium ceramic mug sitting on a cozy table.",
    category: "Merchandise",
    defaultPrompt: "resting on a rustic wooden table in a sunlit kitchen, cozy morning mood, shallow depth of field, professional branding photography"
  },
  {
    id: "billboard",
    name: "Urban Giant Billboard",
    icon: "MonitorPlay",
    description: "Displayed on a massive high-contrast city billboard.",
    category: "Outdoor Media",
    defaultPrompt: "giant premium digital billboard mounted on a modern concrete skyscraper in Times Square at dusk, cinematic blue hour lighting, bustling street below"
  },
  {
    id: "t_shirt",
    name: "Crewneck Cotton T-Shirt",
    icon: "Shirt",
    description: "Printed on a clean, styled cotton t-shirt layout.",
    category: "Merchandise",
    defaultPrompt: "worn by a model walking in a bright minimalist urban studio, professional fashion editorial shot, soft front studio lighting"
  },
  {
    id: "tote_bag",
    name: "Eco-Friendly Tote Bag",
    icon: "ShoppingBag",
    description: "Mocked up on a hanging minimalist canvas tote bag.",
    category: "Merchandise",
    defaultPrompt: "hanging on a modern wooden peg in a chic organic grocery boutique, aesthetic shadows, warm cream linen texture"
  },
  {
    id: "phone_case",
    name: "Premium Phone Case",
    icon: "Smartphone",
    description: "Wrapped around a modern smartphone cover design.",
    category: "Lifestyle Accessories",
    defaultPrompt: "lying flat on a premium terrazzo table, surrounded by minimalist accessories like sunglasses and a designer notebook, soft overhead natural lighting"
  },
  {
    id: "bus_shelter",
    name: "Bus Shelter Poster",
    icon: "Image",
    description: "Framed in an illuminated bus stop advertising cabinet.",
    category: "Outdoor Media",
    defaultPrompt: "sleek illuminated bus stop poster cabinet at night in a rainy futuristic city, beautiful wet ground reflections, glowing ambient neon colors"
  },
  {
    id: "notebook",
    name: "Hardcover Notebook",
    icon: "BookOpen",
    description: "Printed on a classy hardbound notebook cover.",
    category: "Digital & Print",
    defaultPrompt: "laying open on a modern marble desk next to a gold fountain pen and a glass of matcha, elegant workspace layout, dramatic side window lighting"
  },
  {
    id: "delivery_box",
    name: "Cardboard Delivery Box",
    icon: "Box",
    description: "Printed on an eco-friendly shipping or product box.",
    category: "Lifestyle Accessories",
    defaultPrompt: "sitting on a modern clean doorstep surrounded by potted eucalyptus plants, clean shipping box, bright morning sunshine"
  }
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "clean_commercial",
    name: "Studio Commercial",
    description: "Standard clean advertising aesthetic with perfect professional lighting.",
    promptAddon: "commercial studio photography, crisp lighting, high contrast, elegant presentation, minimalist aesthetic"
  },
  {
    id: "cozy_lifestyle",
    name: "Warm Lifestyle",
    description: "Warm, cozy, and organic environment with beautiful natural shadows.",
    promptAddon: "cozy warm lifestyle atmosphere, organic feel, soft sun rays, natural afternoon lighting, authentic look"
  },
  {
    id: "cyberpunk_neon",
    name: "Cyberpunk Neon",
    description: "Vibrant synthwave nighttime setting with colorful reflections.",
    promptAddon: "moody cyberpunk city environment, vibrant blue and magenta neon lights, glowing reflections, futuristic night photography"
  },
  {
    id: "scandinavian_minimal",
    name: "Nordic Minimalist",
    description: "Bright, airy, calm setup with soft woods and light stones.",
    promptAddon: "bright airy Scandinavian minimalist design, light wooden textures, raw linen, soft shadows, neutral color palette"
  },
  {
    id: "editorial_luxury",
    name: "Luxury Editorial",
    description: "Moody, high-end magazine shoot styling with deep rich tones.",
    promptAddon: "high-end luxury editorial, moody dramatic shadows, rich dark textures, gold accents, sophisticated composition"
  }
];
