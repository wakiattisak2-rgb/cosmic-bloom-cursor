export type Specialty =
  | "carbon"
  | "reporting"
  | "materiality"
  | "supply"
  | "training"
  | "climate";

export interface ExpertService {
  title_en: string;
  title_th: string;
  sub_en: string;
  sub_th: string;
  price: number;
  unit_en?: string;
  unit_th?: string;
}

export interface ExpertPortfolio {
  title_en: string;
  title_th: string;
  client: string;
  metric: string;
  seed: string;
}

export interface ExpertReview {
  author: string;
  company: string;
  rating: number;
  quote_en: string;
  quote_th: string;
  date: string;
}

export interface Expert {
  id: string;
  name_en: string;
  name_th: string;
  role_en: string;
  role_th: string;
  bio_en: string;
  bio_th: string;
  long_bio_en: string;
  long_bio_th: string;
  certs: string[];
  specialties: Specialty[];
  rate: number;
  rating: number;
  reviews: number;
  projects: number;
  years: number;
  responseTime_en: string;
  responseTime_th: string;
  languages: string[];
  location: string;
  format_en: string;
  format_th: string;
  industries_en: string[];
  industries_th: string[];
  avatarSeed: string;
  services: ExpertService[];
  portfolio: ExpertPortfolio[];
  reviewsList: ExpertReview[];
}

export function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 70) % 360;
  return `linear-gradient(135deg, hsl(${a} 70% 35%), hsl(${b} 65% 18%))`;
}

const baseServices: ExpertService[] = [
  {
    title_en: "Carbon Footprint Assessment (Scope 1+2)",
    title_th: "ประเมิน Carbon Footprint (Scope 1+2)",
    sub_en: "4–6 weeks · ISO 14064 aligned",
    sub_th: "ระยะเวลา 4–6 สัปดาห์ · อ้างอิง ISO 14064",
    price: 85000,
  },
  {
    title_en: "One Report Drafting (Full)",
    title_th: "จัดทำ One Report (เต็มรูปแบบ)",
    sub_en: "End-to-end + 2 review rounds",
    sub_th: "ครบทุกส่วน + review 2 รอบ",
    price: 180000,
  },
  {
    title_en: "Materiality Workshop (1 day)",
    title_th: "Materiality Workshop (1 วัน)",
    sub_en: "On-site facilitation + matrix output",
    sub_th: "On-site + ผลลัพธ์เป็น matrix",
    price: 45000,
  },
  {
    title_en: "Hourly Consultation",
    title_th: "ปรึกษารายชั่วโมง",
    sub_en: "Minimum 2 hours",
    sub_th: "ขั้นต่ำ 2 ชั่วโมง",
    price: 2500,
    unit_en: "/hr",
    unit_th: "/ชม.",
  },
];

const basePortfolio: ExpertPortfolio[] = [
  {
    title_en: "SET-listed Food Manufacturer — Scope 1+2",
    title_th: "ผู้ผลิตอาหารใน SET — Scope 1+2",
    client: "Confidential",
    metric: "-32% Scope 2",
    seed: "proj-food",
  },
  {
    title_en: "Energy Group One Report 2024",
    title_th: "One Report 2024 กลุ่มพลังงาน",
    client: "Energy Co.",
    metric: "GRI + SASB",
    seed: "proj-energy",
  },
  {
    title_en: "SME Exporter Materiality Refresh",
    title_th: "Materiality SME ส่งออก",
    client: "Export SME",
    metric: "14 topics mapped",
    seed: "proj-sme",
  },
];

const baseReviews: ExpertReview[] = [
  {
    author: "Khun Anya",
    company: "Head of Sustainability, SET-listed",
    rating: 5,
    quote_en:
      "Delivered our One Report two weeks ahead of schedule with audit-ready evidence. Easily the smoothest ESG engagement we've had.",
    quote_th:
      "ส่งงาน One Report เร็วกว่าแผน 2 สัปดาห์ พร้อมหลักฐานสำหรับ audit เป็นโครงการ ESG ที่ราบรื่นที่สุดที่เราเคยทำ",
    date: "2026-04",
  },
  {
    author: "Mr. P.",
    company: "CFO, Energy Group",
    rating: 5,
    quote_en:
      "Clear, pragmatic, and deeply technical. Helped us align Scope 1+2 inventory with both GRI and our group's internal KPI.",
    quote_th:
      "ชัดเจน ลงมือทำได้จริง และเชี่ยวชาญเชิงเทคนิค ช่วยจัด Scope 1+2 ให้ตรงทั้ง GRI และ KPI ของกลุ่ม",
    date: "2026-02",
  },
  {
    author: "Khun Mint",
    company: "ESG Lead, SME Exporter",
    rating: 4.8,
    quote_en:
      "Made materiality feel approachable for our small team. The workshop output is now the backbone of our 3-year ESG plan.",
    quote_th:
      "ทำให้ Materiality เข้าใจง่ายสำหรับทีมเล็กของเรา ผลลัพธ์ workshop กลายเป็นแกนของแผน ESG 3 ปี",
    date: "2026-01",
  },
];

export const EXPERTS: Expert[] = [
  {
    id: "e1",
    name_en: "Wirat S.",
    name_th: "วิรัช ส.",
    role_en: "Senior Sustainability Consultant",
    role_th: "ที่ปรึกษาด้านความยั่งยืนอาวุโส",
    bio_en:
      "Carbon accounting & One Report expert for SET-listed companies. 12 years across food & energy sectors.",
    bio_th:
      "เชี่ยวชาญ Carbon Accounting และ One Report สำหรับบริษัทใน SET 12 ปี กับโรงงานอาหารและพลังงาน",
    long_bio_en:
      "Sustainability and Carbon Accounting consultant with 12 years of experience working with SET 100 companies and export SMEs. Specializes in ESG strategy, Scope 1+2 inventories, and SEC-accepted One Report implementations. Former Big 4, now leads a 6-person practice serving manufacturers across SEA.",
    long_bio_th:
      "ที่ปรึกษาด้าน Sustainability และ Carbon Accounting ประสบการณ์ 12 ปี ทำงานกับบริษัทใน SET 100 และ SME ส่งออก เชี่ยวชาญการวาง ESG strategy การทำ Scope 1+2 inventory และ implement One Report ที่ SEC ยอมรับ อดีต Big 4 ปัจจุบันนำทีม 6 คนให้บริการผู้ผลิตทั่ว SEA",
    certs: ["GRI", "CDP", "★ TOP"],
    specialties: ["carbon", "reporting"],
    rate: 2500,
    rating: 4.9,
    reviews: 42,
    projects: 58,
    years: 12,
    responseTime_en: "Within 4 hrs",
    responseTime_th: "ภายใน 4 ชม.",
    languages: ["TH", "EN"],
    location: "Bangkok, TH",
    format_en: "Remote / On-site",
    format_th: "Remote / On-site",
    industries_en: ["Food & Beverage", "Energy", "Manufacturing", "Logistics"],
    industries_th: ["อาหาร & เครื่องดื่ม", "พลังงาน", "การผลิต", "โลจิสติกส์"],
    avatarSeed: "wirat",
    services: baseServices,
    portfolio: basePortfolio,
    reviewsList: baseReviews,
  },
  {
    id: "e2",
    name_en: "Napa K.",
    name_th: "นภา ก.",
    role_en: "ESG Reporting Specialist",
    role_th: "ผู้เชี่ยวชาญรายงาน ESG",
    bio_en:
      "Delivered GRI & One Report for 30+ Thai listed companies. Materiality & stakeholder engagement.",
    bio_th:
      "ทำ One Report และ GRI ให้บริษัทไทยกว่า 30 แห่ง ถนัด Materiality และ stakeholder engagement",
    long_bio_en:
      "ESG reporting specialist who has delivered GRI Standards and One Report for 30+ Thai listed companies. Deep expertise in double materiality assessment and stakeholder engagement design.",
    long_bio_th:
      "ผู้เชี่ยวชาญรายงาน ESG ที่ส่งมอบ GRI Standards และ One Report ให้บริษัทไทยจดทะเบียนกว่า 30 แห่ง เชี่ยวชาญ double materiality และออกแบบกระบวนการ stakeholder engagement",
    certs: ["GRI", "SASB"],
    specialties: ["reporting", "materiality"],
    rate: 1800,
    rating: 4.8,
    reviews: 31,
    projects: 44,
    years: 9,
    responseTime_en: "Within 6 hrs",
    responseTime_th: "ภายใน 6 ชม.",
    languages: ["TH", "EN"],
    location: "Bangkok, TH",
    format_en: "Remote",
    format_th: "Remote",
    industries_en: ["Banking", "Retail", "Property"],
    industries_th: ["ธนาคาร", "ค้าปลีก", "อสังหาริมทรัพย์"],
    avatarSeed: "napa",
    services: baseServices,
    portfolio: basePortfolio,
    reviewsList: baseReviews,
  },
  {
    id: "e3",
    name_en: "Teerapol M.",
    name_th: "ธีรพล ม.",
    role_en: "Climate Risk Analyst",
    role_th: "นักวิเคราะห์ความเสี่ยงสภาพภูมิอากาศ",
    bio_en:
      "Physical & Transition risk + scenario analysis for banks and energy. Ex-Big 4.",
    bio_th:
      "วิเคราะห์ Physical & Transition Risk และ scenario analysis สำหรับธนาคารและพลังงาน อดีต Big 4",
    long_bio_en:
      "Climate risk analyst focused on physical and transition risk modeling, TCFD-aligned scenario analysis, and climate stress testing for banks and energy companies across SEA.",
    long_bio_th:
      "นักวิเคราะห์ความเสี่ยงสภาพภูมิอากาศ เชี่ยวชาญ physical & transition risk, scenario analysis ตาม TCFD และ climate stress test สำหรับธนาคารและพลังงานทั่ว SEA",
    certs: ["TCFD", "SBTi"],
    specialties: ["climate", "reporting"],
    rate: 3200,
    rating: 5.0,
    reviews: 18,
    projects: 22,
    years: 10,
    responseTime_en: "Within 8 hrs",
    responseTime_th: "ภายใน 8 ชม.",
    languages: ["EN", "TH"],
    location: "Singapore",
    format_en: "Remote",
    format_th: "Remote",
    industries_en: ["Banking", "Energy", "Insurance"],
    industries_th: ["ธนาคาร", "พลังงาน", "ประกันภัย"],
    avatarSeed: "teerapol",
    services: baseServices,
    portfolio: basePortfolio,
    reviewsList: baseReviews,
  },
  {
    id: "e4",
    name_en: "Ploy A.",
    name_th: "พลอย อ.",
    role_en: "Supply Chain ESG Lead",
    role_th: "ผู้นำ ESG สายซัพพลายเชน",
    bio_en:
      "Scope 3 mapping, supplier scorecards, and human-rights due diligence for consumer brands.",
    bio_th:
      "ทำ Scope 3, supplier scorecards และ human-rights due diligence ให้แบรนด์สินค้าอุปโภค",
    long_bio_en:
      "Supply-chain ESG lead specializing in Scope 3 category mapping, supplier scorecards, and human-rights due diligence for consumer brands.",
    long_bio_th:
      "ผู้นำ ESG สายซัพพลายเชน เชี่ยวชาญการ map Scope 3, ออกแบบ supplier scorecard และทำ human-rights due diligence ให้แบรนด์สินค้าอุปโภค",
    certs: ["GRI", "CDP"],
    specialties: ["supply", "carbon"],
    rate: 2200,
    rating: 4.7,
    reviews: 26,
    projects: 33,
    years: 8,
    responseTime_en: "Within 1 day",
    responseTime_th: "ภายใน 1 วัน",
    languages: ["TH", "EN"],
    location: "Chiang Mai, TH",
    format_en: "Remote / On-site",
    format_th: "Remote / On-site",
    industries_en: ["Consumer Goods", "Apparel", "Agriculture"],
    industries_th: ["สินค้าอุปโภค", "เครื่องนุ่งห่ม", "เกษตร"],
    avatarSeed: "ploy",
    services: baseServices,
    portfolio: basePortfolio,
    reviewsList: baseReviews,
  },
  {
    id: "e5",
    name_en: "Daniel R.",
    name_th: "แดเนียล อาร์.",
    role_en: "ESG Trainer & Facilitator",
    role_th: "วิทยากร & โค้ช ESG",
    bio_en:
      "In-house ESG bootcamps for executives. 200+ workshops delivered across SEA.",
    bio_th: "อบรม ESG ให้ผู้บริหารองค์กร 200+ workshop ทั่วเอเชียตะวันออกเฉียงใต้",
    long_bio_en:
      "ESG trainer & facilitator who has delivered 200+ executive bootcamps across SEA. Translates complex frameworks into board-ready decisions.",
    long_bio_th:
      "วิทยากรและโค้ช ESG ส่งมอบ workshop ผู้บริหารกว่า 200 ครั้งทั่ว SEA แปลงเฟรมเวิร์กซับซ้อนให้กลายเป็นการตัดสินใจระดับบอร์ด",
    certs: ["GRI", "★ TOP"],
    specialties: ["training", "reporting"],
    rate: 2800,
    rating: 4.9,
    reviews: 54,
    projects: 71,
    years: 11,
    responseTime_en: "Within 4 hrs",
    responseTime_th: "ภายใน 4 ชม.",
    languages: ["EN", "TH"],
    location: "Bangkok, TH",
    format_en: "On-site / Hybrid",
    format_th: "On-site / Hybrid",
    industries_en: ["Cross-industry", "Public Sector", "Finance"],
    industries_th: ["ข้ามอุตสาหกรรม", "ภาครัฐ", "การเงิน"],
    avatarSeed: "daniel",
    services: baseServices,
    portfolio: basePortfolio,
    reviewsList: baseReviews,
  },
  {
    id: "e6",
    name_en: "Suchart P.",
    name_th: "สุชาติ พ.",
    role_en: "Net-Zero Strategist",
    role_th: "นักวางกลยุทธ์ Net-Zero",
    bio_en:
      "Build science-based targets and decarbonization roadmaps for heavy industry.",
    bio_th: "วางเป้าหมาย SBTi และ decarbonization roadmap ให้อุตสาหกรรมหนัก",
    long_bio_en:
      "Net-zero strategist building SBTi-aligned targets and decarbonization roadmaps for heavy industry, with deep MACC modeling experience.",
    long_bio_th:
      "นักวางกลยุทธ์ Net-Zero สร้างเป้าหมายตาม SBTi และ decarbonization roadmap ให้อุตสาหกรรมหนัก เชี่ยวชาญการทำ MACC modeling",
    certs: ["SBTi", "TCFD"],
    specialties: ["climate", "carbon"],
    rate: 3500,
    rating: 4.8,
    reviews: 19,
    projects: 24,
    years: 14,
    responseTime_en: "Within 1 day",
    responseTime_th: "ภายใน 1 วัน",
    languages: ["EN", "TH"],
    location: "Rayong, TH",
    format_en: "On-site",
    format_th: "On-site",
    industries_en: ["Petrochemical", "Cement", "Steel"],
    industries_th: ["ปิโตรเคมี", "ปูนซีเมนต์", "เหล็ก"],
    avatarSeed: "suchart",
    services: baseServices,
    portfolio: basePortfolio,
    reviewsList: baseReviews,
  },
];

export function getExpert(id: string): Expert | undefined {
  return EXPERTS.find((e) => e.id === id);
}
