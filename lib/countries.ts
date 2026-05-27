import type { CountryMeta, RelationshipStatus } from "./types";

export const COUNTRIES: CountryMeta[] = [
  {
    code: "us", numericCode: "840", name: "United States", flag: "🇺🇸",
    status: "strategic-partner", statusLabel: "Strategic Partner",
    summary: "India's most consequential strategic partnership of the 21st century. The US-India relationship has grown from post-Cold War estrangement to a comprehensive global partnership covering defence, technology, trade and the Quad. The 2026 bilateral trade deal marks a structural shift.",
    region: "Americas",
  },
  {
    code: "cn", numericCode: "156", name: "China", flag: "🇨🇳",
    status: "complex", statusLabel: "Complex",
    summary: "India's most complex bilateral relationship — simultaneously Asia's largest trade partnership and a live territorial dispute along 3,488 km of contested border. The 2020 Galwan Valley clash killed 20 Indian soldiers and froze the relationship for four years; LAC disengagement in late 2024 began a tentative reset.",
    region: "Asia",
  },
  {
    code: "pk", numericCode: "586", name: "Pakistan", flag: "🇵🇰",
    status: "adversary", statusLabel: "Adversary",
    summary: "India's most adversarial bilateral relationship, defined by three wars, a nuclear standoff, and persistent cross-border terrorism. Operation Sindoor in May 2025 — India's most significant military strike since 1971 — fundamentally changed the deterrence calculus.",
    region: "South Asia",
  },
  {
    code: "ru", numericCode: "643", name: "Russia", flag: "🇷🇺",
    status: "complex", statusLabel: "Complex",
    summary: "A decades-long defence and energy partnership under strategic stress. Russia remains India's largest arms supplier but the Ukraine war, Western sanctions, and the 2026 US trade deal are forcing India to diversify. The S-400 proved decisive in Operation Sindoor.",
    region: "Europe/Asia",
  },
  {
    code: "gb", numericCode: "826", name: "United Kingdom", flag: "🇬🇧",
    status: "partner", statusLabel: "Partner",
    summary: "A 'Living Bridge' partnership anchored by the large Indian diaspora in the UK. Post-Brexit London has sought an FTA with India since 2022; negotiations have been slow but ongoing. Defence and technology ties are growing via the Tempest fighter programme.",
    region: "Europe",
  },
  {
    code: "fr", numericCode: "250", name: "France", flag: "🇫🇷",
    status: "strategic-partner", statusLabel: "Strategic Partner",
    summary: "India's closest European strategic partner. France supported India's nuclear programme post-1998, has sold Rafale jets (36 IAF, 26 IN), and is the only Western power to share India's vision of a multipolar world. The Indo-Pacific partnership deepens through joint naval patrols.",
    region: "Europe",
  },
  {
    code: "de", numericCode: "276", name: "Germany", flag: "🇩🇪",
    status: "partner", statusLabel: "Partner",
    summary: "India's largest European trade partner and a key tech-and-manufacturing ally. The 2023 India-Germany Inter-Governmental Consultations elevated the relationship; Germany is a major investor in India's green energy transition and a critical supplier of industrial machinery.",
    region: "Europe",
  },
  {
    code: "jp", numericCode: "392", name: "Japan", flag: "🇯🇵",
    status: "strategic-partner", statusLabel: "Strategic Partner",
    summary: "A 'Special Strategic and Global Partnership' built on shared democratic values and complementary strategic interests in the Indo-Pacific. Japan is funding the Mumbai-Ahmedabad High-Speed Rail (₹1.1 lakh crore) and is a founding Quad member.",
    region: "Asia",
  },
  {
    code: "au", numericCode: "036", name: "Australia", flag: "🇦🇺",
    status: "strategic-partner", statusLabel: "Strategic Partner",
    summary: "A Comprehensive Strategic Partnership elevated in 2020. Australia is a fellow Quad member, key uranium supplier, and growing defence partner. AUSFTA-India trade talks are underway; AUKUS nuclear submarines raise new strategic questions for India's neighbourhood.",
    region: "Asia-Pacific",
  },
  {
    code: "ae", numericCode: "784", name: "UAE", flag: "🇦🇪",
    status: "strategic-partner", statusLabel: "Strategic Partner",
    summary: "India's third-largest trade partner and home to 3.5 million Indian workers. The 2022 CEPA was India's fastest-ever trade deal. UAE is a critical energy supplier, investment hub, and financial corridor for the Indian diaspora.",
    region: "Middle East",
  },
  {
    code: "sa", numericCode: "682", name: "Saudi Arabia", flag: "🇸🇦",
    status: "strategic-partner", statusLabel: "Strategic Partner",
    summary: "India's fourth-largest trade partner and top crude oil supplier. 2.4 million Indian workers send $11+ billion in remittances annually. Vision 2030 aligns with Make in India; PM Modi's 2023 visit produced a comprehensive economic partnership.",
    region: "Middle East",
  },
  {
    code: "il", numericCode: "376", name: "Israel", flag: "🇮🇱",
    status: "strategic-partner", statusLabel: "Strategic Partner",
    summary: "A quiet but deepening strategic partnership, especially in defence. Israel is India's third-largest arms supplier; the relationship survived the Gaza crisis through studied Indian neutrality. Agricultural and water-tech cooperation runs deep at the state level.",
    region: "Middle East",
  },
  {
    code: "bd", numericCode: "050", name: "Bangladesh", flag: "🇧🇩",
    status: "complex", statusLabel: "Complex",
    summary: "India's most important neighbour after 1971. The relationship soured after PM Hasina's ouster in August 2024 and her asylum in India. The interim Yunus government has recalibrated toward China and Pakistan, creating fresh anxiety in New Delhi.",
    region: "South Asia",
  },
  {
    code: "lk", numericCode: "144", name: "Sri Lanka", flag: "🇱🇰",
    status: "neighbour", statusLabel: "Neighbour",
    summary: "A critical neighbourhood relationship under constant China-India competition. India's 2022 economic lifeline during Sri Lanka's currency crisis — $4 billion credit line — restored goodwill. The Adani Colombo port deal and China's Hambantota presence remain strategic flashpoints.",
    region: "South Asia",
  },
  {
    code: "np", numericCode: "524", name: "Nepal", flag: "🇳🇵",
    status: "neighbour", statusLabel: "Neighbour",
    summary: "A historically intertwined relationship growing more complex. Nepal's 2020 new map claiming Indian territory, the open border, Gurkha recruitment tensions, and China's BRI investments create a three-way dynamic. PM Prachanda's Delhi visits have partly stabilised ties.",
    region: "South Asia",
  },
  {
    code: "bt", numericCode: "064", name: "Bhutan", flag: "🇧🇹",
    status: "neighbour", statusLabel: "Neighbour",
    summary: "India's closest bilateral relationship — a special friendship treaty governs defence and foreign policy. Bhutan's China border settlement talks (Doklam triangle) are the single biggest anxiety for Indian strategic planners. India is Bhutan's primary development partner.",
    region: "South Asia",
  },
  {
    code: "ca", numericCode: "124", name: "Canada", flag: "🇨🇦",
    status: "complex", statusLabel: "Complex",
    summary: "A relationship in acute crisis since September 2023 when Canada alleged Indian government involvement in the killing of Khalistani activist Hardeep Singh Nijjar. Diplomatic expulsions, intelligence disputes, and the large Punjabi-Canadian community create a uniquely charged atmosphere.",
    region: "Americas",
  },
  {
    code: "za", numericCode: "710", name: "South Africa", flag: "🇿🇦",
    status: "partner", statusLabel: "Partner",
    summary: "A fellow BRICS member and key Global South partner. South Africa hosted the 2023 BRICS summit that admitted new members. India-South Africa trade is growing through the bilateral investment treaty; both share a non-aligned tradition.",
    region: "Africa",
  },
  {
    code: "br", numericCode: "076", name: "Brazil", flag: "🇧🇷",
    status: "partner", statusLabel: "Partner",
    summary: "A BRICS and IBSA partner with converging Global South positions at the G20 and UN. Brazil hosted the 2024 G20 where PM Modi met President Lula. Defence and pharmaceutical trade are growing vectors.",
    region: "Americas",
  },
  {
    code: "sg", numericCode: "702", name: "Singapore", flag: "🇸🇬",
    status: "strategic-partner", statusLabel: "Strategic Partner",
    summary: "India's premier gateway to Southeast Asia — 26% of Singapore's non-oil trade flows through the Indian connection. The UPI-PayNow linkage is a world-first cross-border payment bridge. Singapore is the top source of FDI into India.",
    region: "Asia",
  },
  {
    code: "kr", numericCode: "410", name: "South Korea", flag: "🇰🇷",
    status: "partner", statusLabel: "Partner",
    summary: "A Comprehensive Economic Partnership anchored by Samsung, Hyundai, POSCO and LG's manufacturing footprint in India. Korea is a key semiconductor and shipbuilding partner as India builds its defence-industrial base.",
    region: "Asia",
  },
  {
    code: "it", numericCode: "380", name: "Italy", flag: "🇮🇹",
    status: "partner", statusLabel: "Partner",
    summary: "A partnership recovering from the 2012 Italian Marines case that froze bilateral ties for a decade. Italy is now a key defence partner through the GCAP/Tempest fighter consortium and luxury-goods-to-India trade. PM Modi visited Rome for Nordic+Italy outreach in 2026.",
    region: "Europe",
  },
  {
    code: "nl", numericCode: "528", name: "Netherlands", flag: "🇳🇱",
    status: "partner", statusLabel: "Partner",
    summary: "An outsized strategic partner for its size. ASML's monopoly on EUV chipmaking machines makes the Netherlands a critical node in India's semiconductor ambitions. The port of Rotterdam is India's primary European trade gateway. Water management and agri-tech cooperation is deep.",
    region: "Europe",
  },
  {
    code: "ir", numericCode: "364", name: "Iran", flag: "🇮🇷",
    status: "complex", statusLabel: "Complex",
    summary: "A strategically vital but sanctions-constrained relationship. Iran's Chabahar port is India's only land access to Afghanistan and Central Asia, exempted from US sanctions since 2018. India-Iran oil trade collapsed after 2019 sanctions reimposition; the corridor remains the core interest.",
    region: "Middle East",
  },
  {
    code: "id", numericCode: "360", name: "Indonesia", flag: "🇮🇩",
    status: "partner", statusLabel: "Partner",
    summary: "India's most important Southeast Asian partner and fellow G20 member. The 2018 Comprehensive Strategic Partnership covers defence, trade, and digital. Indonesia is a key voice in the Indian Ocean regional architecture India is trying to build.",
    region: "Asia",
  },
];

export const COUNTRIES_BY_CODE: Record<string, CountryMeta> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c])
);
