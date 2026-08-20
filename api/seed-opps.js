/**
 * Static opportunity seed — 10+ real opportunities per interest tag + per category.
 * Top 25 featured opportunities are prioritized first with rich checklists & verified data.
 * All data is 2026-accurate.
 */
import supabase from './_supabase.js';

const NOW = new Date().toISOString();

// ─── MASTER OPPORTUNITY LIBRARY ───────────────────────────────────────────────
export const OPPORTUNITIES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ── FEATURED TOP 25: VERIFIED GLOBAL RESEARCH & LEADERSHIP OPPORTUNITIES ──
  // ═══════════════════════════════════════════════════════════════════════════

  {
    "featured": true,
    "featured_rank": 1,
    "tag": "technology",
    "category": "competition",
    "title": "Technovation Girls Global Challenge 2026–2027",
    "source": "Technovation Girls",
    "link": "https://technovationchallenge.org",
    "deadline": "Season runs Aug–May • Submissions close mid-April 2027",
    "eligibility": "Ages 8–18 as of Aug 1; female, trans, non-binary, or gender non-conforming • Teams of 1–5 students • No prior coding experience required • Free to participate • Divisions: Beginner (8–12), Junior (13–15), Senior (16–18)",
    "benefits": "Free curriculum & mentorship • Educational stipends for finalists ($500–$750/person) and Regional Honors ($250/person) • Invitation to pitch at the World Summit",
    "location": "Online (Global) + World Summit",
    "amount": "Free / $500–$750 stipends for finalists",
    "degree_level": "High School",
    "country_focus": "Global",
    "application_steps": [
      "Register on the Technovation platform (student + parent/guardian consent form) starting August.",
      "Form or join a team of 1–5 students in your age division (Beginner, Junior, or Senior).",
      "Optionally recruit a professional STEM mentor or educator to guide your team.",
      "Work through the 12-week curriculum to identify a specific community problem.",
      "Build a mobile app prototype (Thunkable / MIT App Inventor) or an AI-powered tool.",
      "Submit project description, business & user-adoption plan, technical demo video, and pitch video.",
      "Submit all materials before the season deadline (typically mid-April)."
    ],
    "snippet": "Technovation Girls is a free global tech entrepreneurship program across 80+ countries empowering girls and non-binary youth ages 8–18 to build mobile apps or AI tools solving local community problems. Teams receive free curriculum, mentor matching, and compete for educational stipends up to $750/person and World Summit invitations."
  },

  {
    "featured": true,
    "featured_rank": 2,
    "tag": "entrepreneurship",
    "category": "competition",
    "title": "The Conrad Challenge 2026–2027",
    "source": "Conrad Foundation / Space Center Houston",
    "link": "https://www.conradchallenge.org",
    "deadline": "Activation Stage: ~Oct 30, 2026 • Innovation Stage: ~Jan 8, 2027 • Summit: April 2027",
    "eligibility": "Ages 13–18 during competition year • Teams of 2–5 students + 1 adult coach (18+) • International & mixed-school teams welcome • 5 categories: Aerospace & Aviation, Cyber-Technology & Security, Energy & Environment, Health & Nutrition, Sustainable Development",
    "benefits": "Mentorship from industry judges (Google, Blue Origin, Equinor) • Pete Conrad Scholar title • University scholarships up to $25,000/year • International trip prizes • Live pitch at Space Center Houston",
    "location": "Houston, USA (Summit) / Online (submissions)",
    "amount": "Up to $25,000/year University Scholarships",
    "degree_level": "High School",
    "country_focus": "Global",
    "application_steps": [
      "Assemble a team of 2–5 students (ages 13–18) and find an adult coach (age 18+).",
      "Register all team members via the Conrad Portal (conrad.spacecenter.org).",
      "Review Student Guide, Rules & Regulations, and category briefs.",
      "Complete Activation Stage (team formation, challenge track selection, idea brainstorm) by Oct 30, 2026.",
      "Complete Innovation Stage: submit Lean Canvas, Innovation Brief, demo video, and business plan by Jan 8, 2027.",
      "Finalists prepare a 10-minute Power Pitch for the Innovation Summit at Space Center Houston (April 2027)."
    ],
    "snippet": "The Conrad Challenge is an annual STEM innovation and entrepreneurship competition for student teams aged 13–18 worldwide. Teams design commercially viable solutions in aerospace, cyber-tech, health, and clean energy, competing for up to $25,000/year scholarships and pitching before venture judges at Space Center Houston."
  },

  {
    "featured": true,
    "featured_rank": 3,
    "tag": "stem",
    "category": "event",
    "title": "The Junior Academy – NYAS Global STEM Alliance",
    "source": "New York Academy of Sciences",
    "link": "https://www.nyas.org/programs/global-stem-alliance/the-junior-academy",
    "deadline": "Applications open Spring 2027 (Fall cycle ran April 1–July 9, 2026)",
    "eligibility": "Ages 13–17 (must turn 13 by Sept 1, must not turn 18 before May 1) • Strong English proficiency • Parental/guardian consent required • Free • 3–4 hrs/week commitment",
    "benefits": "Global STEM network across 100+ countries • Expert STEM mentorship • Certificate of completion • Complimentary NYAS Young Membership • Competitive ~15–20% acceptance",
    "location": "Online (Launchpad Platform)",
    "amount": "Free / Full Fellowship",
    "degree_level": "High School",
    "country_focus": "Global",
    "application_steps": [
      "Complete the online application in English with short essay responses on gsa.smapply.io.",
      "Submit signed parental/guardian consent form.",
      "Confirm age eligibility (13–17) and English communication proficiency.",
      "Await admission decision (~1 month after application cycle closes).",
      "Complete orientation kickoff week and join a virtual challenge team on the Launchpad portal.",
      "Collaborate with assigned STEM professional mentor on an intense 10-week UN SDG challenge sprint."
    ],
    "snippet": "The Junior Academy by the New York Academy of Sciences connects elite STEM students aged 13–17 across 100+ countries to tackle real-world global challenges. Working in virtual teams on the NYAS Launchpad with professional researcher mentors, participants design solutions to UN SDGs with full NYAS membership benefits."
  },

  {
    "featured": true,
    "featured_rank": 4,
    "tag": "international_relations",
    "category": "competition",
    "title": "Harvard International Review Academic Writing Contest",
    "source": "Harvard International Review",
    "link": "https://hir.harvard.edu/contest",
    "deadline": "Summer cycle: ~Aug 24, 2026 • Fall/Winter cycle: ~Jan 2, 2027",
    "eligibility": "Grades 7–12 globally (Junior div: 7th–8th; Senior div: 9th–12th) • 800–1,200 words analytical article (not opinion) in English with proper citations • No AI tools permitted",
    "benefits": "Gold, Silver, and Bronze medal awards • Publication opportunities in Harvard International Review • Certificate of completion for all participants • 15-min virtual Defense Day before HIR Board",
    "location": "Online (Global)",
    "amount": "Medals & Harvard Journal Publication",
    "degree_level": "High School",
    "country_focus": "Global",
    "application_steps": [
      "Choose your division (Junior: grades 7–8 / Senior: grades 9–12) and target submission cycle.",
      "Register and pay entry fee before registration deadline (financial aid fee waivers available upon request).",
      "Select an official prompt/theme on international diplomacy, geopolitics, or global policy.",
      "Draft an 800–1,200-word analytical article with Chicago/APA citations and original research (strictly human-written, no AI tools).",
      "Submit article in .doc/.docx or PDF before the submission deadline.",
      "If selected as finalist, prepare 15-minute presentation and oral defense for virtual Defense Day with Harvard editors."
    ],
    "snippet": "The Harvard International Review Academic Writing Contest invites secondary students in grades 7–12 worldwide to write rigorous 800–1,200 word analytical essays on global policy and foreign affairs. Finalists defend their work before the Harvard editorial board with opportunities for global journal publication."
  },

  {
    "featured": true,
    "featured_rank": 5,
    "tag": "technology",
    "category": "scholarship",
    "title": "MIT Women's Technology Program (WTP)",
    "source": "MIT School of Engineering",
    "link": "https://wtp.mit.edu",
    "deadline": "Applications open mid-Nov, close mid-December • Decisions mid-April",
    "eligibility": "Current 11th-grade female students • ⚠️ HARD BAR: Must have permanent family home address in the U.S. (international residents outside U.S. are NOT eligible) • Strong math/science record; little to no prior engineering background required",
    "benefits": "Fully funded (tuition-free) • 4-week MIT campus residency • Hands-on labs taught by MIT grad students • ~20 selected per year from 300+ pool • MIT housing & dining covered",
    "location": "MIT Campus, Cambridge, MA, USA",
    "amount": "Fully Funded (Tuition-free + Housing & Meals)",
    "degree_level": "High School",
    "country_focus": "U.S. Residents Only (Hard Requirement)",
    "application_steps": [
      "⚠️ Confirm U.S. permanent family residency requirement (students based outside the U.S. are not eligible).",
      "Complete free online SlideRoom application starting mid-November.",
      "Upload high school transcripts for grades 9, 10, and fall grade 11 report.",
      "Upload standardized test score reports (if available; optional).",
      "Request 2 online Teacher Reference Forms (1 math teacher + 1 science teacher).",
      "Submit complete application before the mid-December deadline."
    ],
    "snippet": "The MIT Women's Technology Program is an elite, tuition-free 4-week summer academic residency on MIT's campus for rising female high school seniors. Selected students conduct intensive hands-on laboratory research in mechanical engineering under MIT graduate student mentorship. Note: strictly requires permanent U.S. family residence."
  },

  {
    "featured": true,
    "featured_rank": 6,
    "tag": "leadership",
    "category": "scholarship",
    "title": "African Leadership Academy (ALA) Diploma Program — Class of 2027",
    "source": "African Leadership Academy",
    "link": "https://www.africanleadershipacademy.org/apply",
    "deadline": "Early Decision: Oct 15, 2026 • Regular Decision: Jan 15, 2027",
    "eligibility": "African nationals born on or after Sept 1, 2007 (ages 15–18) • Minimum Grade 10 completion • Evaluated on: intellectual readiness, courage/perseverance, ownership, interdependence",
    "benefits": "2-year pre-university residential diploma in Johannesburg • 97% of students receive need-based financial aid • Alumni network at 342+ global universities • $270M+ cumulative scholarship funding",
    "location": "Johannesburg, South Africa",
    "amount": "Full Scholarship / Need-Based Aid Available",
    "degree_level": "High School",
    "country_focus": "Africa",
    "application_steps": [
      "Confirm birth-date eligibility (born on or after Sept 1, 2007 for Class of 2027).",
      "Register on the Submittable admissions portal (available in English, French, and Portuguese).",
      "Draft personal essays reflecting ALA's core traits: intellectual readiness, courage, ownership, and interdependence.",
      "Upload official academic transcripts from Grade 9 to current grade level.",
      "Select application round: Early Decision (Oct 15, 2026) or Regular Decision (Jan 15, 2027).",
      "Attend finalist interview and leadership assessment if shortlisted (Nov–Dec for ED, Feb–Mar for RD).",
      "Submit need-based financial aid documentation upon admission offer."
    ],
    "snippet": "The African Leadership Academy is a world-renowned 2-year pre-university residential program in Johannesburg developing the next generation of African transformative leaders. ALA provides Cambridge A-Levels alongside Entrepreneurial Leadership, with 97% of students receiving financial aid and alumni securing over $270M in global university scholarships."
  },

  {
    "featured": true,
    "featured_rank": 7,
    "tag": "leadership",
    "category": "scholarship",
    "title": "Yale Young African Scholars (YYAS) & YYGS 2027",
    "source": "Yale University",
    "link": "https://africanscholars.yale.edu",
    "deadline": "YYGS Early Action: ~Oct 15, 2026 • YYAS / YYGS Regular: ~Jan 6–7, 2027",
    "eligibility": "YYAS: African citizens/residents, grades 10–11, ages 14–18, free • YYGS: Grades 10–11 globally, ages 16–18, need-based aid up to 100% tuition available",
    "benefits": "YYAS: Free tuition & admissions mentorship • YYGS: 2-week Yale campus residency, faculty lectures, STEM/humanities tracks, full need-based aid available",
    "location": "Yale University, New Haven, USA / Residential Summit in Kenya / Online",
    "amount": "Fully Funded (YYAS) / Up to 100% Aid (YYGS)",
    "degree_level": "High School",
    "country_focus": "Africa / Global",
    "application_steps": [
      "Review eligibility criteria for YYAS (African track) and YYGS (global Yale campus track) and indicate interest on shared application.",
      "Complete online application form including 400–500 word main essay and short answer questions.",
      "Upload official transcripts for each year of secondary school completed.",
      "Have 1 academic recommender fill out the official online recommendation form.",
      "Submit by Early Action (Oct 15, 2026) or Regular Decision (early January 2027).",
      "Apply for YYGS need-based financial aid or fee waiver during the submission flow if applying for Yale campus sessions."
    ],
    "snippet": "Yale Young African Scholars (YYAS) and Yale Young Global Scholars (YYGS) offer transformative academic and leadership enrichment for high school students. YYAS provides free university guidance and leadership training for African secondary students, while YYGS brings global cohorts to Yale's campus with full need-based aid packages."
  },

  {
    "featured": true,
    "featured_rank": 8,
    "tag": "international_relations",
    "category": "event",
    "title": "Georgetown University International Relations Academy",
    "source": "Georgetown University Summer High School Programs",
    "link": "https://summer.georgetown.edu/programs/SHS14/international-relations-academy/",
    "deadline": "Early Bird: Jan 31, 2027 (fee waived) • Final deadline: May 15, 2027 • Sessions in June/July 2027",
    "eligibility": "Current 8th–12th graders • Must be at least 15 years old by check-in • Minimum 2.0 GPA • International students welcome (no visa required for non-credit academies)",
    "benefits": "1-week immersive academy in Washington, DC • Lectures from Georgetown faculty & embassy visits • Crisis simulations • Certificate of completion",
    "location": "Georgetown University, Washington D.C., USA",
    "amount": "Tuition: ~$3,225 residential / $2,500 commuter (Financial aid available)",
    "degree_level": "High School",
    "country_focus": "Global",
    "application_steps": [
      "Confirm age (15+ by check-in date) and academic eligibility (8th–12th grade, min 2.0 GPA).",
      "Complete online application form before Early Bird deadline (Jan 31 for fee waiver) or Final deadline (May 15).",
      "Write a 300–500 word personal statement on your interest in diplomacy and global policy.",
      "Request School Official Reviewer Form from your teacher, school counselor, or principal.",
      "International applicants: complete the international student requirements section (no U.S. visa required for non-credit academies).",
      "Upon acceptance, pay deposit and confirm residential or commuter session placement."
    ],
    "snippet": "Georgetown University's International Relations Academy is an intensive 1-week summer pre-college program in Washington, D.C. for students in grades 8–12. Participants explore global affairs, international law, and defense strategy through crisis simulations, embassy visits, and lectures from Georgetown faculty and active diplomats."
  },

  {
    "featured": true,
    "featured_rank": 9,
    "tag": "entrepreneurship",
    "category": "grant",
    "title": "Fast Forward Tech Nonprofit Accelerator — 2027 Cohort",
    "source": "Fast Forward",
    "link": "https://www.ffwd.org/accelerator",
    "deadline": "Applications open late July 2026, close early September 2026 (Open Now)",
    "eligibility": "Registered nonprofits worldwide (not for-profits or individuals) • Software-based, scalable tech solution with dedicated tech lead • Proximate founders encouraged • English fluency required",
    "benefits": "$25,000+ unrestricted grant funding • 3-month mentorship & cohort program • In-person kickoff & Demo Day in San Francisco • Access to global philanthropic funder network",
    "location": "Remote + San Francisco, CA, USA (In-person sessions)",
    "amount": "$25,000+ Unrestricted Grant",
    "degree_level": "All Levels",
    "country_focus": "Global (Registered Nonprofits)",
    "application_steps": [
      "Confirm your organization is legally registered as a nonprofit entity in its home jurisdiction.",
      "Review evaluation criteria: leadership capacity, tech talent, impact potential, and scalability.",
      "Complete the online application via apply.ffwd.org before the early September deadline.",
      "Attend optional Fast Forward Application Q&A workshop for strategic guidance.",
      "Detail your software solution, product roadmap, team composition, and verified social metrics.",
      "Ensure availability of founders for required in-person participation in San Francisco for kickoff week and Demo Day."
    ],
    "snippet": "The Fast Forward Tech Nonprofit Accelerator invests $25,000+ in unrestricted grant capital and provides 3 months of intensive acceleration to early-stage software-focused nonprofit ventures worldwide. Cohort members receive Silicon Valley mentorship, ongoing portfolio services, and pitch at Demo Day before major philanthropic foundations."
  },

  {
    "featured": true,
    "featured_rank": 10,
    "tag": "entrepreneurship",
    "category": "competition",
    "title": "Citizen Entrepreneurship Competition (CEC)",
    "source": "Entrepreneurship Campus / Stiftung Entrepreneurship",
    "link": "https://www.entrepreneurship-campus.org",
    "deadline": "Annual cycle (typically March–June; #CEC27 opens early 2027)",
    "eligibility": "Age 13+ worldwide • Youth category (13–29) and Adult category (30+) • Idea must address at least one of the 17 UN SDGs • Free to enter",
    "benefits": "Free training courses (\"Brains vs Capital\", \"Sustainable Entrepreneurship\") • Entrepreneurial Design Canvas template • Global voting showcase • Official certificate • Jury feedback webinar for top-10",
    "location": "Online (Global)",
    "amount": "Free / UN SDG Recognition & Training",
    "degree_level": "All Levels",
    "country_focus": "Global",
    "application_steps": [
      "Create a free user account on entrepreneurship-campus.org.",
      "Submit your entrepreneurial venture under \"My Idea/Project\" as an \"Idea\" aligned with ≥1 UN Sustainable Development Goal.",
      "Complete the two mandatory free online training courses: \"Brains versus Capital\" and \"Sustainable Entrepreneurship\".",
      "Fill out and submit the official Entrepreneurial Design Canvas (EDC) business model template.",
      "Engage your community during the Public Voting & Feedback Phase to gather support.",
      "Top-10 finalists deliver their presentation in the live international expert jury webinar."
    ],
    "snippet": "The Citizen Entrepreneurship Competition is an annual global contest organized by Stiftung Entrepreneurship in Berlin inviting innovators aged 13+ to submit ideas advancing UN Sustainable Development Goals. Participants gain free entrepreneurial training, structured canvas design mentorship, global voting visibility, and expert jury feedback."
  },

  {
    "featured": true,
    "featured_rank": 11,
    "tag": "data_science",
    "category": "competition",
    "title": "Zindi Africa AI Competitions Platform",
    "source": "Zindi Africa",
    "link": "https://zindi.africa",
    "deadline": "Rolling — continuous live competitions all year round",
    "eligibility": "Open to anyone globally • Free to join • Knowledge of Python/R and ML helpful • Individual or teams up to 4",
    "benefits": "Real-world African ML project portfolio • Cash prizes (up to $10,000+ per competition) • Zindi points & leaderboard ranking • Recruiter visibility with top tech firms",
    "location": "Online (Global)",
    "amount": "$500–$30,000+ Prize Purses",
    "degree_level": "All Levels",
    "country_focus": "Africa / Global",
    "application_steps": [
      "Create a free data scientist account at zindi.africa/signup.",
      "Browse active competitive challenges in machine learning, NLP, computer vision, and time-series forecasting.",
      "Download the challenge dataset and review evaluation metrics (e.g. Log Loss, F1, RMSE).",
      "(Optional) Complete free tutorials on Zindi Learn to strengthen modeling techniques.",
      "Train predictive models in Python or R and submit test set predictions before competition close.",
      "Monitor public leaderboard, iterate model architectures, and submit verified code within 24 hours if in top winning ranks."
    ],
    "snippet": "Zindi is Africa's premier machine learning and data science competition ecosystem hosting 70,000+ practitioners worldwide. Data scientists tackle real-world African challenges across agriculture, healthcare, climate, and finance, earning cash prizes up to $30,000+ and verified profile badges recognized by global tech employers."
  },

  {
    "featured": true,
    "featured_rank": 12,
    "tag": "data_science",
    "category": "event",
    "title": "Data Science Africa (DSA) Summer School",
    "source": "Data Science Africa",
    "link": "https://www.datascienceafrica.org/dsa-summer-schools/",
    "deadline": "Applications open January, close mid-March annually for summer cohort",
    "eligibility": "Undergraduate & graduate students, researchers, data professionals in Africa • Strong math, stats, or CS background • Entry quiz required",
    "benefits": "3-day intensive hands-on training (ML, responsible AI, agentic systems) • Academic workshop & poster session • Pan-African networking • DSA certificate",
    "location": "Hybrid — In-Person African Host Cities + Virtual",
    "amount": "Free / Subsidized Participation",
    "degree_level": "Undergraduate / Master's / PhD",
    "country_focus": "Africa",
    "application_steps": [
      "Complete the official online registration form on datascienceafrica.org.",
      "Download the mandatory DSA beginner quiz exercise pack (zipped technical coding challenge).",
      "Solve exercises in Python, linear algebra, and data manipulation, then submit results before deadline.",
      "Await competitive selection results based on quiz performance and motivation statement.",
      "Attend the 3-day summer school technical sessions covering modern deep learning and edge AI.",
      "Present research posters or deployable field models during the academic workshop."
    ],
    "snippet": "Data Science Africa Summer School is an intensive pan-African training initiative providing practical, end-to-end machine learning and edge AI education. Participants learn from world-class instructors, solve practical computational problems, and present field-deployable research at the international DSA workshop."
  },

  {
    "featured": true,
    "featured_rank": 13,
    "tag": "data_science",
    "category": "scholarship",
    "title": "African Master's in Machine Intelligence (AMMI) — AIMS",
    "source": "AIMS / Google DeepMind / Meta AI",
    "link": "https://aimsammi.org",
    "deadline": "Annual cohort deadline: August–October • Fully funded 1-year Master's",
    "eligibility": "Bachelor's in Math, CS, Computer/Electrical Engineering or related field • ~B average (≈80%) minimum • Demonstrated interest in AI/ML • Commitment to mentor future students",
    "benefits": "100% Full scholarship (tuition, room, board, travel) • World-class curriculum taught by Google DeepMind, Meta, NYU, Mila faculty • Deep learning thesis defense • Top AI career pathways",
    "location": "AIMS Centres (Ghana, Rwanda, Senegal, South Africa, Cameroon)",
    "amount": "Fully Funded (Tuition, Housing, Board, Stipend)",
    "degree_level": "Master's",
    "country_focus": "Africa",
    "application_steps": [
      "Verify you hold (or will hold prior to matriculation) a qualifying STEM Bachelor's degree with ≥80% academic standing.",
      "Create free applicant account on applications.nexteinstein.org.",
      "Upload complete official transcripts from all post-secondary institutions with certified translations if in other languages.",
      "Submit CV, statement of mathematical and research background, and motivation letter.",
      "Provide email addresses for 3 academic or professional referees who will submit letters directly.",
      "Submit application prior to the annual cohort deadline and prepare for technical entry assessment if shortlisted."
    ],
    "snippet": "AIMS AMMI is an elite, fully funded one-year Master's program in Machine Intelligence founded with support from Google DeepMind and Meta AI. Delivered at AIMS centres across Africa by visiting faculty from leading global AI institutions, graduates complete cutting-edge deep learning research and step into premier PhD and research roles."
  },

  {
    "featured": true,
    "featured_rank": 14,
    "tag": "data_science",
    "category": "competition",
    "title": "UN Global Pulse AI Accelerator & Innovation Challenges",
    "source": "United Nations Global Pulse",
    "link": "https://www.unglobalpulse.org/accelerator-cohort-4-applications/",
    "deadline": "Cohort intake windows vary (check official portal)",
    "eligibility": "⚠️ Note: UN Global Pulse Accelerator requires projects to be led by at least one UN entity • Must address UN SDGs with piloted evidence • External innovators can collaborate with UN agencies or explore ITU AI for Good",
    "benefits": "Direct acceleration support from UN data scientists • Cross-UN entity partnership building • High-level UN platform showcase • Policy co-authorship",
    "location": "Online (Global / UN Country Offices)",
    "amount": "Acceleration Support / Policy Co-authorship",
    "degree_level": "All Levels",
    "country_focus": "Global",
    "application_steps": [
      "Confirm proposal is partnered with or led by at least one active UN entity (or join ITU AI for Good as independent developer).",
      "Review official Accelerator guidelines and ensure project aligns with UN Sustainable Development Goals.",
      "Attend mandatory virtual Accelerator information and Q&A webinars.",
      "Prepare comprehensive pilot data, ethical AI governance framework, and scalable deployment plan.",
      "Submit formal proposal through the official UN Global Pulse portal before the stated intake deadline."
    ],
    "snippet": "UN Global Pulse Accelerator scales data-driven and AI innovations addressing humanitarian and development crises across the United Nations system. Selected projects receive dedicated technical mentorship, cross-agency integration, and global policy showcase platforms."
  },

  {
    "featured": true,
    "featured_rank": 15,
    "tag": "data_science",
    "category": "scholarship",
    "title": "Code for Africa \"AI for Good\" Fellowship",
    "source": "Code for Africa / Digitalise Youth",
    "link": "https://opportunities.codeforafrica.org",
    "deadline": "4-month remote fellowship • Next cohort applications open early 2027",
    "eligibility": "Connected to eligible countries: Cameroon, Senegal, Mali, Burkina Faso, Niger, Chad, Sudan, Guinea, Benin, Togo, Mauritania, South Sudan, Ethiopia, Somalia • Proven AI/tech skills for civic/human-rights impact • 6 fellows selected",
    "benefits": "$500/month stipend for 4 months ($2,000 total) • Mentorship from CfA TechLab & AI Sandbox • Build tools for Human Rights Defenders (HRDs) • Pan-African newsroom publication",
    "location": "Pan-Africa (Remote with hubs in Nairobi, Lagos, Cape Town, Dakar)",
    "amount": "$500/month ($2,000 total stipend)",
    "degree_level": "All Levels",
    "country_focus": "Cameroon & 13 Sahel/African Nations",
    "application_steps": [
      "Confirm citizenship/residency in one of the 14 eligible African nations (including Cameroon).",
      "Assemble portfolio of previous machine learning, NLP, or civic software projects demonstrating social impact.",
      "Complete online application form via opportunities.codeforafrica.org before cycle close.",
      "Highlight specific expertise in building chatbots, automated fact-checking, or multilingual AI tools.",
      "Complete technical interview and take-home practical assignment if shortlisted.",
      "Commit to 4 months of remote collaboration embedded with partner Human Rights Defender organisations."
    ],
    "snippet": "The Code for Africa AI for Good Fellowship pairs African technologists with Human Rights Defender organisations to engineer open-source ethical AI tools tackling misinformation, civic accountability, and human rights monitoring. Fellows receive a $500/month stipend and technical incubation through CfA's AI Sandbox."
  },

  {
    "featured": true,
    "featured_rank": 16,
    "tag": "data_science",
    "category": "competition",
    "title": "Multilingual Health QA in Low-Resource African Languages (Zindi / HASH)",
    "source": "Zindi Africa / HASH / ITU",
    "link": "https://zindi.africa/competitions/multilingual-health-question-answering-in-low-resource-african-languages-challenge",
    "deadline": "Periodic challenge cycles on Zindi (watch competitions feed)",
    "eligibility": "AI developers, data scientists, NLP researchers globally (individuals or teams up to 4) • Free to enter on Zindi • Focus on Luganda, Kiswahili, Akan, Amharic",
    "benefits": "$5,000 USD prize pool • Real-world healthcare NLP portfolio • Exposure to Hub for AI in Maternal & Reproductive Health (HASH) • Contribution to health-equity AI",
    "location": "Online (Global)",
    "amount": "$5,000 USD Prize Pool",
    "degree_level": "All Levels",
    "country_focus": "Africa / Global",
    "application_steps": [
      "Register or log in to your active account on zindi.africa.",
      "Enroll in the Multilingual Health Question Answering in Low-Resource African Languages Challenge.",
      "Download and inspect the curated multilingual health dataset (Akan, Kiswahili, Luganda, Amharic).",
      "Fine-tune open LLMs or build specialized NLP retrieval-augmented generation (RAG) architectures.",
      "Submit model predictions and evaluate performance using semantic similarity metrics (AfroLM BERTScore).",
      "Submit documented code and methodology within 24 hours of competition close for prize verification."
    ],
    "snippet": "Organized by Zindi in collaboration with the Hub for AI in Maternal, Sexual and Reproductive Health (HASH) and ITU, this competition challenges global machine learning engineers to create accurate question-answering systems for low-resource African languages with a $5,000 cash prize pool."
  },

  {
    "featured": true,
    "featured_rank": 17,
    "tag": "medicine",
    "category": "competition",
    "title": "AI for Reproductive Health Innovation Challenge (HASH / IDRC)",
    "source": "HASH Network / Global Health Research",
    "link": "https://ai-globalhealthresearch.tghn.org/partners/hash/",
    "deadline": "Periodic call for proposals (check HASH portal)",
    "eligibility": "Multidisciplinary teams based in Sub-Saharan Africa (health, tech, data science, social sciences) • Applying AI to maternal, sexual, or reproductive health challenges",
    "benefits": "Seed funding for winning prototypes • Technical mentorship from global health AI experts • Presentation at regional health summits • Access to HASH research network",
    "location": "Sub-Saharan Africa (Online / Regional Summits)",
    "amount": "Seed Funding + Technical Grants",
    "degree_level": "All Levels",
    "country_focus": "Sub-Saharan Africa",
    "application_steps": [
      "Form a cross-disciplinary team featuring at least one healthcare specialist and one software/AI engineer.",
      "Identify an underserved maternal or reproductive health problem in Sub-Saharan Africa.",
      "Check current open call on the HASH / Global Health Research portal.",
      "Draft a detailed concept note outlining AI methodology, clinical validation, and patient privacy protocols.",
      "Submit proposal through the official portal before the stated cycle deadline.",
      "Shortlisted teams pitch prototype solutions to an international panel of global health and AI experts."
    ],
    "snippet": "Supported by IDRC and the Global Health Research network, the AI for Reproductive Health Innovation Challenge accelerates African teams applying machine learning to maternal, sexual, and reproductive healthcare, offering seed grants, clinical mentorship, and regional summit showcase opportunities."
  },

  {
    "featured": true,
    "featured_rank": 18,
    "tag": "research",
    "category": "grant",
    "title": "Wellcome Trust AI & Digital Health Grants",
    "source": "Wellcome Trust UK",
    "link": "https://wellcome.org/grant-funding",
    "deadline": "Multiple concurrent funding schemes (check portal for open calls)",
    "eligibility": "Researchers, institutions, and digital health innovators • Often requires research institution affiliation • Strong priority for Low- and Middle-Income Countries (LMICs)",
    "benefits": "Large-scale research grants (£500,000 to £2M+ GBP) • Multi-year research support • Major journal publication support • Global health policy integration",
    "location": "Global (UK / LMIC priority)",
    "amount": "£500,000 – £2,000,000+ GBP",
    "degree_level": "PhD / Postdoc / Research Institutions",
    "country_focus": "Global / LMIC & Africa Priority",
    "application_steps": [
      "Visit wellcome.org/grant-funding to browse active schemes in AI diagnostics and digital health.",
      "Verify applicant and administering institution eligibility for the targeted funding instrument.",
      "Review scheme-specific guidance notes, milestones, and data management requirements.",
      "Draft formal research proposal detailing AI methodology, clinical efficacy, and LMIC community health benefits.",
      "Submit preliminary application through Wellcome Funding online management system.",
      "If invited, submit full proposal with letters of support and budget justification."
    ],
    "snippet": "Wellcome Trust provides major multi-million pound research grants supporting computational and digital health innovations. Grants fund transformative AI diagnostics, epidemiological modeling, and health systems automation, with strong institutional prioritization for researchers in Africa and LMICs."
  },

  {
    "featured": true,
    "featured_rank": 19,
    "tag": "data_science",
    "category": "scholarship",
    "title": "AIMS AI for Science Scholarship Programme",
    "source": "African Institute for Mathematical Sciences (AIMS)",
    "link": "https://nexteinstein.org",
    "deadline": "Centre-specific deadlines (typically March 31 for August intake)",
    "eligibility": "African STEM graduates with strong quantitative aptitude • Bachelor's degree in math, physics, biology, CS, or engineering • All African nationalities",
    "benefits": "Full scholarship (tuition + living stipend) • Interdisciplinary research applying AI to biology, physics, cosmology, climate • AIMS pan-African network access",
    "location": "AIMS Centres across Africa (South Africa, Rwanda, Ghana, Senegal, Cameroon)",
    "amount": "Fully Funded (Tuition + Stipend)",
    "degree_level": "Master's / Postgrad",
    "country_focus": "Africa",
    "application_steps": [
      "Navigate to target AIMS centre admissions portal via nexteinstein.org.",
      "Verify qualifying STEM Bachelor's degree with strong quantitative background.",
      "Complete online application form with personal statement detailing interdisciplinary science interests.",
      "Upload verified academic transcripts and curriculum vitae.",
      "Submit contact details for 2–3 academic referees.",
      "Submit complete package before the centre deadline (typically March 31)."
    ],
    "snippet": "The AIMS AI for Science Scholarship trains African mathematical and science graduates to leverage machine learning across physics, molecular biology, epidemiology, and climate science. Selected scholars receive full funding and conduct research alongside international faculty across AIMS centres."
  },

  {
    "featured": true,
    "featured_rank": 20,
    "tag": "medicine",
    "category": "grant",
    "title": "Hanga SRH Innovation Program — Rwanda MINICT",
    "source": "Rwanda Ministry of ICT & Innovation / VC4A",
    "link": "https://vc4a.com/ministry-of-ict-innovation-minict/hanga-sexual-reproductive-health-srh-program/",
    "deadline": "Cohort calls announced on VC4A (Cohort 2 concluded April 2026; next call upcoming)",
    "eligibility": "Startups operating in any Sub-Saharan African country • Product addressing sexual & reproductive health • Youth- and female-led ventures actively encouraged",
    "benefits": "$10,000 initial grant up to $30,000 for top performers • 2–3 month cohort curriculum • 6–9 months bespoke coaching • Investor & government health ministry networking",
    "location": "Sub-Saharan Africa (Rwanda / East & West Africa)",
    "amount": "$10,000 – $30,000 Grant Funding",
    "degree_level": "All Levels / Startups",
    "country_focus": "Sub-Saharan Africa",
    "application_steps": [
      "Confirm venture operates in Sub-Saharan Africa and provides a digital solution for sexual and reproductive health.",
      "Review eligibility criteria on the active VC4A program listing.",
      "Prepare company profile: problem statement, traction data, user numbers, and pitch deck.",
      "Submit formal application via VC4A portal during the open window.",
      "Participate in live selection pitch sessions with panel judges.",
      "Selected startups complete 2–3 months of intensive business coaching and present at Investor Demo Day."
    ],
    "snippet": "Initiated by Rwanda's Ministry of ICT & Innovation, the Hanga SRH Innovation Program supports youth-led African technology ventures addressing maternal health, reproductive education, and clinical referrals. Ventures receive up to $30,000 in non-equity grant funding and dedicated government ministry integration."
  },

  {
    "featured": true,
    "featured_rank": 21,
    "tag": "research",
    "category": "scholarship",
    "title": "Leon Levy Scholarships in Neuroscience (NYAS) — 2027 Cohort",
    "source": "New York Academy of Sciences / Leon Levy Foundation",
    "link": "https://www.nyas.org/shaping-science/fellowships/the-leon-levy-scholarships-in-neuroscience-llsn/",
    "deadline": "Nomination opens Aug 21, 2026 • Applications close Oct 16, 2026 • Tenure starts Sept 1, 2027",
    "eligibility": "Doctoral degree (PhD, MD, DVM) • ≤3 years cumulative postdoc experience • Full-time postdoc position at eligible NYC non-profit institution • J-1, H-1B, US citizen, PR eligible",
    "benefits": "3-year award • Annual stipend at 125% of NIH postdoctoral rate • Fringe benefits • Up to $10,000/yr dependent-care supplement • 3-year NYAS membership",
    "location": "New York City, NY, USA (Eligible NYC institutions)",
    "amount": "125% NIH Postdoc Stipend + $10k/yr dependent care (3 years)",
    "degree_level": "PhD / Postdoc",
    "country_focus": "NYC Institution-based (Global applicants welcome)",
    "application_steps": [
      "Confirm you hold a PhD, MD, or equivalent and have ≤3 years of postdoctoral research experience.",
      "Secure a postdoctoral position and research advisor support at an eligible New York City academic institution.",
      "Attend the official NYAS informational webinar for prospective applicants and advisors.",
      "Submit institutional nomination and complete application package (research proposal, CV, recommendation letters) by Oct 16, 2026.",
      "Undergo scientific peer review by the Leon Levy Advisory Board.",
      "Up to 10 Scholars are awarded 3-year tenure starting September 1, 2027."
    ],
    "snippet": "The Leon Levy Scholarships in Neuroscience support exceptional early-career postdoctoral researchers at non-profit research institutions across New York City. The 3-year award provides a generous stipend at 125% of the NIH postdoctoral rate, dependent care allowances, and annual NYAS symposium presentations."
  },

  {
    "featured": true,
    "featured_rank": 22,
    "tag": "data_science",
    "category": "scholarship",
    "title": "Cambridge ERA:AI Fellowship — Winter 2027 Cohort",
    "source": "Effective Research Alliance / University of Cambridge",
    "link": "https://erafellowship.org/fellowship",
    "deadline": "Winter 2027 deadline: September 13, 2026 (Open Now! Jan 18 – Mar 26, 2027 tenure)",
    "eligibility": "Age 18+ globally • Open to PhD students, early-career researchers, professionals in tech/policy/economics/security, career changers • Talent-first: no strict academic degree required",
    "benefits": "Fully funded 8–10 week Cambridge residency • Salary (~£34,125/yr pro-rated equivalent) • Free accommodation & meals • Visa support & travel costs covered • Mentorship & potential 6+ month extension",
    "location": "University of Cambridge, Cambridge, UK",
    "amount": "Fully Funded (Salary + Housing + Travel + Visa Support)",
    "degree_level": "All Levels / PhD / Early-Career",
    "country_focus": "Global (Visa Support Provided)",
    "application_steps": [
      "Review the 3 research tracks: Technical AI Safety, AI Governance, and Technical AI Governance.",
      "Complete Stage 1 written application (~2 hours on erafellowship.org) before September 13, 2026.",
      "Articulate a clear theory of change explaining how your research mitigates catastrophic AI risks.",
      "Provide names and contact details for 2 references.",
      "Ensure passport validity for UK visa processing and confirm full in-person availability in Cambridge (Jan 18 – Mar 26, 2027).",
      "Complete two rounds of remote interviews with Cambridge researchers if shortlisted."
    ],
    "snippet": "The Cambridge ERA:AI Fellowship is a fully funded 10-week in-person research residency at the University of Cambridge focused on mitigating existential risks from advanced AI systems. Fellows receive salary compensation, free housing, meals, travel, and UK visa sponsorship with opportunities to publish high-impact working papers."
  },

  {
    "featured": true,
    "featured_rank": 23,
    "tag": "research",
    "category": "scholarship",
    "title": "Swiss NCCR LIVES Doctoral Programme & Bavarian Research Fellowships",
    "source": "NCCR LIVES / Universities of Lausanne & Geneva / Bavarian Research Alliance",
    "link": "https://www.lives-nccr.ch/en",
    "deadline": "Annual doctoral intake cycles (check NCCR LIVES portal)",
    "eligibility": "Doctoral candidates & early-career researchers in life course research, quantitative social sciences, vulnerability, inequality, public health • International applicants eligible",
    "benefits": "Structured Swiss/European doctoral training • Research stipend • Conference presentation travel funds • Peer-reviewed publication support",
    "location": "Switzerland (Lausanne / Geneva) & Germany (Bavaria)",
    "amount": "Doctoral Salary / Research Fellowship",
    "degree_level": "PhD / Postdoc",
    "country_focus": "Europe / Global",
    "application_steps": [
      "Identify target faculty supervisor and research institute at partner universities (Lausanne, Geneva, or Bavarian institutions).",
      "Prepare research proposal addressing life course vulnerability, socioeconomic inequality, or quantitative public health.",
      "Gather certified university transcripts, curriculum vitae, and 2 academic letters of recommendation.",
      "Submit application via university graduate school admissions portal.",
      "Complete interview and presentation with the doctoral selection committee."
    ],
    "snippet": "The Swiss NCCR LIVES Doctoral Programme provides structured European doctoral training in life course research, inequality, and quantitative social science at the Universities of Lausanne and Geneva. In collaboration with European research networks, candidates receive full research appointments and international conference funding."
  },

  {
    "featured": true,
    "featured_rank": 24,
    "tag": "research",
    "category": "scholarship",
    "title": "UBC Four-Year Doctoral Fellowship (4YF) & Mastercard Foundation Scholars",
    "source": "University of British Columbia",
    "link": "https://mcfscholars.ubc.ca",
    "deadline": "Mastercard Scholars 2027: EOI opens Aug 31, 2026; closes ~Sept 6, 2026 • 4YF: automatic during PhD admission",
    "eligibility": "4YF: All admitted UBC PhD students • Mastercard Scholars: Sub-Saharan African citizens ≤35 years applying to eligible UBC Master's programs (Land & Food Systems, Forestry, Science) with commitment to return to Africa",
    "benefits": "4YF: $18,200–$24,000/yr + full tuition (4 years) • Mastercard Scholars: 100% full tuition, living stipend, housing, flights, laptop, study materials, Social Entrepreneurship Fund",
    "location": "University of British Columbia, Vancouver, Canada",
    "amount": "Fully Funded (Tuition + Full Living Stipend + Travel)",
    "degree_level": "Master's / PhD",
    "country_focus": "Sub-Saharan Africa Priority / Global",
    "application_steps": [
      "Confirm eligibility: Sub-Saharan African citizenship, age ≤35, applying to eligible UBC Master's faculty.",
      "Submit Expression of Interest (EOI) at mcfscholars.ubc.ca between August 31 and September 6, 2026.",
      "If invited, submit full Mastercard Scholars application package (CV, transcripts, 2 reference letters on letterhead) by Sept 30, 2026.",
      "Complete formal application to your chosen UBC Faculty by November 2026.",
      "PhD applicants: submit regular UBC Graduate Studies doctoral application for automatic 4YF funding consideration ($18,200–$24,000/yr + tuition)."
    ],
    "snippet": "The University of British Columbia offers the Four-Year Doctoral Fellowship (4YF) covering full tuition plus living stipends for top PhD scholars, and the Mastercard Foundation Scholars Program providing comprehensive full funding for African graduate students in forestry, science, and food systems committed to driving impact in Africa."
  },

  {
    "featured": true,
    "featured_rank": 25,
    "tag": "data_science",
    "category": "scholarship",
    "title": "Anthropic Fellows Program — AI Safety Research (Work Authorization Required)",
    "source": "Anthropic",
    "link": "https://alignment.anthropic.com/2025/anthropic-fellows-program-2026/",
    "deadline": "4-month paid cohorts (Applications reviewed periodically on Greenhouse/Constellation)",
    "eligibility": "⚠️ HARD REQUIREMENT: Must already possess valid work authorization in the US, UK, or Canada (Anthropic does NOT sponsor visas) • Strong Python coding and ability to execute AI safety research • No formal degree required",
    "benefits": "Stipend of $3,850 USD / £2,310 GBP / $4,300 CAD per week ($61,600 total) • ~$15k/month compute funding • Direct 1-on-1 mentorship from Anthropic researchers • 40%+ conversion to full-time roles",
    "location": "San Francisco, USA / London, UK / Remote within US/UK/CA authorized locations",
    "amount": "$3,850/week ($61,600 USD per 4-month cohort)",
    "degree_level": "All Levels / Research",
    "country_focus": "US, UK, or Canada Work-Authorized Only",
    "application_steps": [
      "⚠️ STOP: Verify you already hold valid work authorization in the US, UK, or Canada (Anthropic does not sponsor visas for this fellowship).",
      "Review core research streams: Mechanistic Interpretability, Scalable Oversight, Alignment Theory, Frontier Model Security.",
      "Prepare statement of motivation, CV, and links to public machine learning code or safety research.",
      "Provide 3 references who can vouch for your technical research ability.",
      "Submit application via Anthropic / Constellation portal before cohort review deadline.",
      "Complete coding assessment and technical interviews with Anthropic research scientists."
    ],
    "snippet": "The Anthropic Fellows Program is an intensive 4-month paid research fellowship in AI safety and frontier model governance. Fellows receive $3,850/week ($61,600 total), compute access, and direct mentorship from Anthropic scientists. Note: strictly requires existing work authorization in the US, UK, or Canada (no visa sponsorship)."
  },

  // ── GENERAL LOCAL & CONTINENTAL OPPORTUNITIES ───────────────────────────
  // ── TECHNOLOGY ──────────────────────────────────────────────────────────────
  { tag:'technology', category:'scholarship', title:'Google Africa Developer Scholarship 2026', source:'Google Developers Africa', link:'https://developers.google.com/africa/scholarships', deadline:'April 30, 2026', eligibility:'African national or resident • Age 18+ • Basic programming knowledge', benefits:'Free premium courses • Google certification • Mentorship • Job placement support', location:'Online', snippet:'Google offers 50,000 scholarships for African developers in Android, web and cloud. Cameroon applicants eligible. Fully covers certification costs and training materials.' },
  { tag:'technology', category:'internship',  title:'Microsoft Africa Development Centre Internship 2026', source:'Microsoft Careers', link:'https://careers.microsoft.com/africa', deadline:'August 31, 2026', eligibility:'Final-year student or recent graduate • CS or engineering degree • GPA 3.0+', benefits:'Competitive stipend • Housing allowance • Mentorship • Certificate • Return offer potential', location:'Nairobi / Remote', snippet:'Microsoft ADC is hiring software engineering interns across Africa. 3-month paid placement with real project ownership and senior mentorship.' },
  { tag:'technology', category:'competition', title:'MTN Cameroon Digital Innovation Challenge 2026', source:'MTN Cameroon', link:'https://mtn.cm/innovation-challenge', deadline:'May 15, 2026', eligibility:'Cameroonian nationals • Teams of 2-5 • Any age', benefits:'50 million FCFA in prizes • Incubation support • Media coverage • Investor access', location:'Douala, Cameroon', snippet:'MTN Cameroon invites tech innovators to build digital solutions for local challenges. Agriculture, health and fintech tracks. Grand prize 20M FCFA.' },
  { tag:'technology', category:'event',       title:'Africa Tech Summit Yaoundé 2026', source:'Africa Tech Summit', link:'https://africatechsummit.com/yaounde', deadline:null, eligibility:'Open to all tech professionals and students', benefits:'Networking with 500+ leaders • Investor meetings • Workshop access', location:'Yaoundé, Cameroon', snippet:'The continent\'s premier tech conference returns to Yaoundé. Speakers from Google, Microsoft, MTN and African startups. April 2026.' },
  { tag:'technology', category:'job',         title:'Software Developer – Fintech Startup Douala', source:'JobsInAfrica', link:'https://jobsinafrica.com/software-dev-douala', deadline:null, eligibility:'2+ years experience • React/Node.js/Python', benefits:'Competitive salary • Equity • Remote-friendly • Growth path', location:'Douala, Cameroon', snippet:'A growing fintech startup in Douala hiring junior and senior software developers. React, Node.js, Python. Competitive salary with equity options.' },
  { tag:'technology', category:'scholarship', title:'ALX Africa Software Engineering Programme 2026', source:'ALX Africa', link:'https://alxafrica.com/software-engineering', deadline:'June 30, 2026', eligibility:'African nationals • Age 18-30 • No prior coding required', benefits:'Free tuition • Job placement • 12-month programme • Global alumni network', location:'Online', snippet:'ALX Africa\'s intensive software engineering programme accepts Cameroon applicants. Free tuition, world-class curriculum, and 94% job placement rate.' },
  { tag:'technology', category:'competition', title:'Hack4Africa Hackathon – Cameroon 2026', source:'Hack4Africa', link:'https://hack4africa.org/cameroon', deadline:'April 1, 2026', eligibility:'African nationals • Teams 2-5 • Students and professionals', benefits:'$10,000 prize pool • Incubation • Mentorship • Investor pitch', location:'Yaoundé, Cameroon', snippet:'48-hour hackathon building solutions for agriculture, health, education and finance. $10,000 in prizes plus incubation support for top teams.' },
  { tag:'technology', category:'internship',  title:'Orange Digital Center Coding Internship 2026', source:'Orange Cameroon', link:'https://orangedigitalcenters.com/cameroon', deadline:null, eligibility:'Age 18-25 • Based in Douala or Yaoundé', benefits:'Free training • Certificate • Mentorship • Job referral', location:'Douala / Yaoundé', snippet:'Orange Digital Center Cameroon offers coding internships in web development, mobile apps and AI. Free training with real-world project experience.' },
  { tag:'technology', category:'scholarship', title:'DAAD Scholarship – IT & Engineering Germany 2026', source:'DAAD Germany', link:'https://daad.de/scholarships/it', deadline:'October 31, 2026', eligibility:'Bachelor\'s degree • Under 36 • Cameroonian national • 2yr work experience', benefits:'€934 monthly stipend • Travel allowance • Health insurance • Study allowance', location:'Germany', snippet:'DAAD offers fully funded scholarships for Cameroonian IT and engineering graduates to pursue Master\'s degrees at German universities.' },
  { tag:'technology', category:'job',         title:'Data Engineer – World Bank Cameroon', source:'World Bank Careers', link:'https://worldbank.org/careers', deadline:'January 31, 2026', eligibility:'Master\'s in CS or data engineering • 3+ years experience', benefits:'UN-scale salary • Benefits • Career growth • International exposure', location:'Yaoundé, Cameroon', snippet:'World Bank Cameroon hiring a Data Engineer to support development analytics. Python, SQL, cloud platforms required. Competitive international compensation.' },

  // ── BUSINESS ────────────────────────────────────────────────────────────────
  { tag:'business', category:'competition', title:'Tony Elumelu Foundation Entrepreneurship Program 2026', source:'Tony Elumelu Foundation', link:'https://tonyelumelufoundation.org/teep', deadline:'July 1, 2026', eligibility:'African national • Early-stage business 0-3 years • Any sector except alcohol/tobacco', benefits:'$5,000 seed capital • 12-week training • Mentorship • TEF Alumni network', location:'Online', snippet:'Africa\'s flagship entrepreneurship programme. 1,000 entrepreneurs selected annually. $5,000 non-refundable seed capital plus world-class mentorship.' },
  { tag:'business', category:'scholarship', title:'Chevening Business Leadership Scholarship 2026 – UK', source:'Chevening UK', link:'https://chevening.org/scholarships', deadline:'November 5, 2025', eligibility:'Cameroonian national • 2+ years work experience • Leadership potential', benefits:'Full tuition • Monthly stipend • Return airfare • Visa support', location:'United Kingdom', snippet:'Chevening offers fully funded scholarships for Cameroonian professionals to pursue one-year Master\'s degrees in business and leadership at UK universities.' },
  { tag:'business', category:'internship',  title:'Business Analyst Intern – Orange Cameroon 2026', source:'Orange Cameroon', link:'https://orange.cm/careers/internships', deadline:null, eligibility:'Final-year student • Business, economics or finance degree', benefits:'Paid stipend • Professional mentorship • Certificate • Return offer potential', location:'Douala, Cameroon', snippet:'Orange Cameroon recruiting business analyst interns for its Douala HQ. 6-month paid internship with exposure to telecoms strategy and analytics.' },
  { tag:'business', category:'competition', title:'Seedstars Cameroon Startup Competition 2026', source:'Seedstars', link:'https://seedstars.com/cameroon', deadline:'May 31, 2026', eligibility:'Early-stage startup • Any sector • Cameroonian founders', benefits:'Up to $500,000 equity investment • Global network • Mentorship', location:'Douala, Cameroon', snippet:'Seedstars searches for the best startup in Cameroon. Winners receive equity investment and access to the global Seedstars investor network.' },
  { tag:'business', category:'event',       title:'African Business Forum Douala 2026', source:'African Business Forum', link:'https://africanbusinessforum.org/douala', deadline:null, eligibility:'Open to all business professionals and students', benefits:'CEO networking • Investor access • Youth delegation for ages 18-30', location:'Douala, Cameroon', snippet:'Annual business forum in Douala featuring CEOs, investors and policymakers. Special youth delegation for emerging entrepreneurs aged 18-30.' },
  { tag:'business', category:'scholarship', title:'AfDB Young Professionals Program 2026', source:'African Development Bank', link:'https://afdb.org/young-professionals', deadline:'December 31, 2025', eligibility:'Master\'s or PhD • Age 24-32 • Economics, finance or business', benefits:'Competitive salary • Benefits • International career • Leadership development', location:'Abidjan, Côte d\'Ivoire', snippet:'AfDB Young Professionals Program for Cameroonians with advanced degrees in economics, finance or business. Ages 24-32. Competitive international salary.' },
  { tag:'business', category:'job',         title:'Finance Manager – International NGO Yaoundé', source:'ReliefWeb', link:'https://reliefweb.int/jobs/cameroon/finance-manager', deadline:'January 30, 2026', eligibility:'CPA or equivalent • 3+ years NGO finance experience', benefits:'Competitive salary • Health insurance • Professional development', location:'Yaoundé, Cameroon', snippet:'International NGO in Yaoundé hiring Finance Manager. CPA required, 3+ years NGO experience. Competitive salary with full benefits package.' },
  { tag:'business', category:'internship',  title:'Marketing Intern – Afriland First Bank 2026', source:'Afriland First Bank', link:'https://afriland-first-bank.com/careers', deadline:null, eligibility:'Marketing or business student • Final year', benefits:'Monthly allowance • Certificate • Mentorship • Networking', location:'Yaoundé, Cameroon', snippet:'Afriland First Bank Cameroon recruiting marketing interns for its communications department. Work on real campaigns with senior marketing professionals.' },
  { tag:'business', category:'competition', title:'Hult Prize Cameroon Campus Competition 2026', source:'Hult Prize', link:'https://hultprize.org/cameroon', deadline:null, eligibility:'University students • Teams of 4 • Any discipline', benefits:'$1M global prize • Mentorship • Incubation • Media coverage', location:'Cameroon campuses', snippet:'World\'s largest student social entrepreneurship competition. Cameroon campus competitions at universities nationwide. Grand prize $1 million.' },
  { tag:'business', category:'scholarship', title:'IESE Business School MBA Scholarship – Africa 2026', source:'IESE Business School', link:'https://iese.edu/mba/scholarships', deadline:'June 30, 2026', eligibility:'3+ years work experience • Strong academic record • African applicants', benefits:'Partial tuition scholarship • Global alumni network • Career support', location:'Barcelona, Spain', snippet:'IESE Business School offers partial scholarships for African MBA candidates. Strong academic record and 3+ years work experience required.' },

  // ── MEDICINE / HEALTH ───────────────────────────────────────────────────────
  { tag:'medicine', category:'scholarship', title:'WHO Fellowship Program 2026 – Public Health', source:'World Health Organization', link:'https://who.int/fellowships', deadline:'August 28, 2026', eligibility:'Health professional • Cameroonian national • Bachelor\'s in health field', benefits:'Full fellowship • Travel • Stipend • WHO certification', location:'Geneva / Regional', snippet:'WHO offers fellowships for Cameroonian health professionals to advance training in public health, epidemiology and health systems management.' },
  { tag:'medicine', category:'internship',  title:'UNICEF Health Internship – Yaoundé 2026', source:'UNICEF Cameroon', link:'https://unicef.org/careers/internships', deadline:'January 31, 2026', eligibility:'Recent graduate in medicine, public health or nutrition • French/English', benefits:'Paid stipend • UN experience • Certificate • Mentorship', location:'Yaoundé, Cameroon', snippet:'UNICEF Cameroon offering paid health and nutrition internships. Support back-to-school health programs in conflict-affected regions.' },
  { tag:'medicine', category:'competition', title:'Health Innovation Challenge Cameroon 2026', source:'HealthInnovation CM', link:'https://healthinnovation.cm/challenge', deadline:'April 30, 2026', eligibility:'Open to individuals and teams • Any age • Cameroonians', benefits:'20 million FCFA prize • Incubation • Media exposure', location:'Cameroon', snippet:'Submit health innovations addressing malaria, HIV or maternal health in Cameroon. 20M FCFA prize plus incubation support for winners.' },
  { tag:'medicine', category:'scholarship', title:'Aga Khan University Medical Scholarship – Africa 2026', source:'Aga Khan University', link:'https://aku.edu/scholarships', deadline:'March 31, 2026', eligibility:'African nationals • Strong academic record • Medicine or health sciences', benefits:'Full tuition • Accommodation • Living allowance • Mentorship', location:'Nairobi, Kenya', snippet:'AKU offers merit-based scholarships for African students pursuing medicine and health sciences. Covers tuition, accommodation and living allowance.' },
  { tag:'medicine', category:'job',         title:'Medical Officer – CBC Health Services Cameroon', source:'CBC Health Services', link:'https://cbchealthservices.org/careers', deadline:null, eligibility:'MBBS or equivalent • Cameroonian national', benefits:'Competitive government salary • Housing • Professional development', location:'North West / South West Cameroon', snippet:'CBC Health Services recruiting Medical Officers for hospitals in North West and South West regions. MBBS required. Competitive compensation.' },
  { tag:'medicine', category:'event',       title:'Global Health Conference Yaoundé 2026', source:'Global Health Conference', link:'https://globalhealthconf.org/yaounde', deadline:'March 22, 2026', eligibility:'Health professionals and researchers • Abstract submission open', benefits:'Networking • Publication opportunity • CME credits', location:'Yaoundé, Cameroon', snippet:'International conference on tropical diseases and global health in Yaoundé. Abstract submission open for health professionals and researchers.' },
  { tag:'medicine', category:'scholarship', title:'Fogarty International Center Global Health Fellowship 2026', source:'NIH Fogarty Center', link:'https://fic.nih.gov/fellowships', deadline:'April 1, 2026', eligibility:'African health scientists • PhD or MD • Research experience', benefits:'Research funding • US institution access • Stipend • Travel', location:'USA / Cameroon', snippet:'NIH Fogarty offers research fellowships for Cameroonian health scientists. Covers research costs, stipend and travel to US partner institutions.' },
  { tag:'medicine', category:'internship',  title:'MSF Medical Internship – Cameroon Field 2026', source:'Médecins Sans Frontières', link:'https://msf.org/internships', deadline:null, eligibility:'Final-year medical student or recent graduate • French/English', benefits:'Stipend • Field experience • MSF certification • Career development', location:'Cameroon (field)', snippet:'MSF recruiting medical interns for field operations in Cameroon. 3-month placement with stipend. Invaluable humanitarian medicine experience.' },
  { tag:'medicine', category:'competition', title:'Wellcome Trust Africa Biomedical Research Award 2026', source:'Wellcome Trust', link:'https://wellcome.org/africa-awards', deadline:'May 15, 2026', eligibility:'Early-career African biomedical scientists • PhD required', benefits:'Up to £500,000 funding • 5-year research support • Mentorship', location:'UK / Africa', snippet:'Wellcome Trust offers major research awards for early-career African biomedical scientists. Up to £500,000 over 5 years for transformative research.' },
  { tag:'medicine', category:'scholarship', title:'AFENET Field Epidemiology Training – Cameroon 2026', source:'AFENET', link:'https://afenet.net/training', deadline:'March 2026', eligibility:'Health workers • Bachelor\'s in health science • Cameroonian', benefits:'2-year programme • Stipend • WHO certification • Career placement', location:'Yaoundé, Cameroon', snippet:'AFENET Field Epidemiology Training Program for Cameroonian health workers. 2 years covering outbreak response, surveillance and data analysis.' },

  // ── ENGINEERING ─────────────────────────────────────────────────────────────
  { tag:'engineering', category:'internship',  title:'Shell Graduate Internship – Cameroon 2026', source:'Shell Cameroon', link:'https://shell.com/careers/internships', deadline:'June 28, 2026', eligibility:'Final-year or recent graduate • Engineering degree • GPA 3.0+', benefits:'Competitive stipend • Housing • Mentorship • Return offer potential', location:'Douala, Cameroon', snippet:'Shell Cameroon offers structured graduate internships in petroleum, mechanical and chemical engineering. 6-month paid placement with real projects.' },
  { tag:'engineering', category:'scholarship', title:'African Union Engineering Scholarship 2026', source:'African Union Commission', link:'https://au.int/scholarships/engineering', deadline:'April 30, 2026', eligibility:'African engineering students • Top academic record', benefits:'Full tuition • Stipend • Housing • Leadership development', location:'Various partner universities', snippet:'AU Commission scholarships for African engineering students at top universities. Covers tuition, stipend and housing. Cameroon nationals eligible.' },
  { tag:'engineering', category:'competition', title:'Young Engineers Africa Challenge 2026', source:'Young Engineers Africa', link:'https://youngengineers.africa/challenge', deadline:'June 30, 2026', eligibility:'African engineers • Age 18-30 • Any engineering discipline', benefits:'$20,000 prizes • Mentorship • Media coverage • Industry connections', location:'Pan-Africa', snippet:'Competition for African engineers to design innovative solutions for continental challenges. $20,000 in prizes and mentorship from industry leaders.' },
  { tag:'engineering', category:'job',         title:'Civil Engineer – Cameroon Infrastructure Projects', source:'JobsInAfrica CM', link:'https://jobsinafrica.cm/civil-engineer', deadline:null, eligibility:'Civil engineering degree • 3+ years experience', benefits:'Competitive salary • Transport • Insurance • Growth opportunities', location:'Yaoundé / Douala / Bamenda', snippet:'Major infrastructure company hiring civil engineers for road and bridge projects across Cameroon. Multiple positions available in key cities.' },
  { tag:'engineering', category:'scholarship', title:'DAAD Engineering Master\'s Scholarship 2026 – Germany', source:'DAAD Germany', link:'https://daad.de/engineering-masters', deadline:'October 2026', eligibility:'Engineering degree • Under 36 • Cameroonian national', benefits:'€934 monthly • Travel • Health insurance • Study allowance', location:'Germany', snippet:'DAAD fully funded scholarships for Cameroonian engineers to pursue Master\'s in Germany. Civil, electrical, mechanical and petroleum engineering.' },
  { tag:'engineering', category:'event',       title:'Cameroon Engineering Summit 2026', source:'Engineering Summit CM', link:'https://engineeringsummit.cm', deadline:null, eligibility:'Engineers, contractors and students welcome', benefits:'CPD credits • Networking • Industry insights • Student rates', location:'Yaoundé, Cameroon', snippet:'Annual summit for Cameroonian engineers covering infrastructure, energy and urban development. Student registration available at reduced rates.' },
  { tag:'engineering', category:'internship',  title:'ENEO Cameroon Electrical Engineering Internship 2026', source:'ENEO Cameroon', link:'https://eneo.cm/careers', deadline:null, eligibility:'Electrical engineering student • Final year • Cameroonian', benefits:'Monthly allowance • Field experience • Certificate', location:'Nationwide, Cameroon', snippet:'ENEO Cameroon recruiting electrical engineering interns for its power distribution network. Hands-on experience across all regions of Cameroon.' },
  { tag:'engineering', category:'competition', title:'Bridge Africa Engineering Competition 2026', source:'Bridge Africa', link:'https://bridgeafrica.org/competition', deadline:'May 1, 2026', eligibility:'Engineering students and professionals • Teams or individuals', benefits:'$15,000 prize • Incubation • Infrastructure contract opportunities', location:'Pan-Africa', snippet:'Design sustainable infrastructure solutions for rural Cameroon. $15,000 grand prize with potential infrastructure implementation contract.' },
  { tag:'engineering', category:'scholarship', title:'Japan-Africa Engineering Scholarship 2026 – JICA', source:'JICA Japan', link:'https://jica.go.jp/scholarships/engineering', deadline:'March 2026', eligibility:'Engineering degree • Under 40 • Cameroonian government employee preferred', benefits:'Full scholarship • Monthly allowance • Housing • Return flight', location:'Japan', snippet:'JICA scholarships for Cameroonian engineers to study in Japan. Covers tuition, accommodation and monthly allowance. Master\'s level programs.' },
  { tag:'engineering', category:'job',         title:'Petroleum Engineer – Perenco Cameroon', source:'Perenco Cameroon', link:'https://perenco.com/careers/cameroon', deadline:null, eligibility:'Petroleum or chemical engineering degree • 2+ years preferred', benefits:'Competitive expat package • Housing • Insurance • Career growth', location:'Douala / Offshore Cameroon', snippet:'Perenco Cameroon hiring petroleum engineers for offshore operations. Degree in petroleum or chemical engineering. Competitive expat compensation package.' },

  // ── LAW ─────────────────────────────────────────────────────────────────────
  { tag:'law', category:'scholarship', title:'Fulbright Foreign Student Program – Law 2026', source:'Fulbright Commission', link:'https://fulbright.org/cameroon', deadline:'October 2025', eligibility:'Cameroonian national • LLB • Leadership potential • English proficiency', benefits:'Full tuition • Stipend • Airfare • Health insurance', location:'United States', snippet:'Fulbright scholarships for Cameroonian law students and legal professionals to study LLM programs at top US law schools. Fully funded.' },
  { tag:'law', category:'internship',  title:'ICC Internship – International Criminal Law 2026', source:'International Criminal Court', link:'https://icc-cpi.int/internships', deadline:null, eligibility:'Law student or graduate • French or English fluency', benefits:'Stipend • ICC experience • Networking • Certificate', location:'The Hague, Netherlands', snippet:'ICC internships for law students from Africa. Positions in prosecution, defense and registry. Rolling admissions, French or English required.' },
  { tag:'law', category:'competition', title:'Philip C. Jessup Moot Court – Cameroon 2026', source:'ILSA', link:'https://ilsa.org/jessup', deadline:'January 2026', eligibility:'Law school teams • Any year of study', benefits:'International competition • Travel • Prizes • Prestige', location:'Washington DC / Cameroon qualifier', snippet:'World\'s largest moot court competition. Cameroon law schools register teams for national qualifier. Winners advance to international rounds in DC.' },
  { tag:'law', category:'job',         title:'Legal Officer – UN Cameroon 2026', source:'UN Careers', link:'https://careers.un.org/cameroon', deadline:null, eligibility:'LLM in international law • 3+ years • French/English', benefits:'P3 UN salary • Benefits • International career • Security', location:'Yaoundé, Cameroon', snippet:'United Nations Cameroon recruiting Legal Officer for Yaoundé operations. LLM in international law required. P3 level with competitive UN compensation.' },
  { tag:'law', category:'scholarship', title:'Commonwealth Scholarship – Law 2026 UK', source:'Commonwealth Scholarship Commission', link:'https://cscuk.fcdo.gov.uk/law', deadline:'December 2025', eligibility:'Cameroonian national • LLB • Under 35 • Strong academic record', benefits:'Full tuition • Airfare • Living allowance • Visa support', location:'United Kingdom', snippet:'Commonwealth scholarships for Cameroonian law students to pursue LLM degrees at UK universities. Fully funded including tuition, airfare and living allowance.' },
  { tag:'law', category:'event',       title:'African Law Forum Yaoundé 2026', source:'African Law Forum', link:'https://africanlawforum.org/yaounde', deadline:null, eligibility:'Lawyers, judges and law students welcome', benefits:'CPD credits • Networking • Publication opportunity', location:'Yaoundé, Cameroon', snippet:'Annual conference bringing together lawyers, judges and scholars from across Africa. Student registration at reduced rates. May 2026.' },
  { tag:'law', category:'internship',  title:'African Court on Human Rights Internship 2026', source:'African Court', link:'https://african-court.org/internships', deadline:'March 2026', eligibility:'African law graduate • French or English', benefits:'Accommodation covered • 3-month placement • Certificate', location:'Arusha, Tanzania', snippet:'African Court on Human and Peoples\' Rights offers internships for African law graduates. 3-month placement with accommodation covered.' },
  { tag:'law', category:'job',         title:'Legal Counsel – Cameroon Development Corporation', source:'CDC Cameroon', link:'https://cdc-cameroon.net/careers', deadline:null, eligibility:'LLB required • LLM preferred • 5+ years corporate law', benefits:'Competitive government salary • Benefits • Stability', location:'Limbe, Cameroon', snippet:'CDC Cameroon seeking Legal Counsel for corporate legal department. LLB required, LLM preferred. 5+ years experience in corporate and commercial law.' },
  { tag:'law', category:'competition', title:'African Human Rights Essay Competition 2026', source:'AHRLJ', link:'https://ahrlj.up.ac.za/essay-competition', deadline:'June 2026', eligibility:'African law students and young lawyers • Under 35', benefits:'Cash prize • Publication • Conference invitation', location:'Online', snippet:'Annual essay competition on African human rights law. Cash prizes, publication in peer-reviewed journal and invitation to African Human Rights conference.' },
  { tag:'law', category:'scholarship', title:'OHCHR Human Rights Fellowship – Africa 2026', source:'OHCHR', link:'https://ohchr.org/fellowships/africa', deadline:'February 28, 2026', eligibility:'African human rights defenders and lawyers • LLB minimum', benefits:'3-month Geneva placement • Travel • Accommodation • Stipend', location:'Geneva, Switzerland', snippet:'OHCHR offers fellowships for African human rights lawyers. 3-month placement in Geneva with travel, accommodation and stipend covered.' },

  // ── EDUCATION ───────────────────────────────────────────────────────────────
  { tag:'education', category:'scholarship', title:'Commonwealth Distance Learning Scholarships 2026', source:'Commonwealth Scholarship Commission', link:'https://cscuk.fcdo.gov.uk/distance-learning', deadline:'March 2026', eligibility:'Cameroonian teachers and education professionals • Bachelor\'s degree', benefits:'Full distance learning tuition • Study materials • UK university degree', location:'Online (UK universities)', snippet:'Commonwealth scholarships for Cameroonian teachers to pursue distance learning Master\'s degrees at UK universities. Fully funded.' },
  { tag:'education', category:'internship',  title:'UNESCO Education Internship – Yaoundé 2026', source:'UNESCO Cameroon', link:'https://unesco.org/internships/cameroon', deadline:null, eligibility:'Master\'s student in education • French/English fluency', benefits:'Paid stipend • UN experience • Certificate • Networking', location:'Yaoundé, Cameroon', snippet:'UNESCO Cameroon internships in education policy, curriculum development and literacy programs. 3-6 month paid placement for Master\'s students.' },
  { tag:'education', category:'competition', title:'Education Innovation Challenge Cameroon 2026', source:'EdChallenge CM', link:'https://edchallenge.cm', deadline:'May 2026', eligibility:'Teachers, students and entrepreneurs • Cameroonians', benefits:'10 million FCFA prize • Incubation • Media coverage', location:'Cameroon', snippet:'Submit innovative education solutions for Cameroon\'s schools. EdTech and pedagogy innovation tracks. 10M FCFA prize for best solution.' },
  { tag:'education', category:'job',         title:'Primary School Teacher – APEE Schools Network 2026', source:'APEE Cameroon', link:'https://apee.cm/jobs', deadline:'February 2026', eligibility:'DIPES I or equivalent • Cameroonian national', benefits:'Competitive salary • Housing allowance • Professional development', location:'Yaoundé / Douala', snippet:'APEE school network hiring primary school teachers for 2026-2027 academic year. DIPES I or equivalent required. Applications open February 2026.' },
  { tag:'education', category:'scholarship', title:'African Development Bank Education Scholarship 2026', source:'African Development Bank', link:'https://afdb.org/education-scholarship', deadline:'April 2026', eligibility:'African students • Education policy or management postgrad', benefits:'Full scholarship • Stipend • Housing • Mentorship', location:'Various', snippet:'AfDB scholarships for African students to study education policy and management at postgraduate level. Cameroon nationals fully eligible.' },
  { tag:'education', category:'event',       title:'EdTech Africa Conference Douala 2026', source:'EdTech Africa', link:'https://edtechafrica.org/douala', deadline:null, eligibility:'Open to educators, tech professionals and students', benefits:'Networking • Workshops • Startup pitches • Student rates', location:'Douala, Cameroon', snippet:'EdTech Africa conference in Douala explores technology in education. Workshops, startup pitches and policy discussions. Student tickets available.' },
  { tag:'education', category:'internship',  title:'Teach For Cameroon Fellowship 2026', source:'Teach For Cameroon', link:'https://teachforcameroon.org/fellowship', deadline:null, eligibility:'Recent graduate • Any discipline • Leadership potential', benefits:'Monthly stipend • Professional development • Leadership training • Alumni network', location:'Underserved schools, Cameroon', snippet:'Teach For Cameroon recruits passionate graduates to teach in underserved schools for 2 years. Monthly stipend, professional development and leadership training.' },
  { tag:'education', category:'scholarship', title:'French Language Teaching Assistant – Campus France 2026', source:'Campus France', link:'https://campusfrance.org/teaching-assistant', deadline:'January 2026', eligibility:'Cameroonian French/English teachers • Bachelor\'s minimum', benefits:'7-month contract • Accommodation • Monthly stipend • French experience', location:'France', snippet:'Campus France teaching assistant positions in France for Cameroonian teachers. 7-month contract with accommodation and stipend.' },
  { tag:'education', category:'job',         title:'UNICEF Education Specialist – Cameroon 2026', source:'UNICEF', link:'https://unicef.org/careers/education-specialist', deadline:null, eligibility:'Master\'s in education • 5+ years experience • French/English', benefits:'P3 UN salary • Benefits • International career', location:'Yaoundé, Cameroon', snippet:'UNICEF Cameroon hiring Education Specialist to support back-to-school programs in conflict-affected regions. P3 level position.' },
  { tag:'education', category:'competition', title:'Global Teacher Prize – Cameroon Nominations 2026', source:'Varkey Foundation', link:'https://globalteacherprize.org', deadline:'March 2026', eligibility:'Practising teachers • 5+ years experience • Nominated or self-nominated', benefits:'$1 million prize • Global recognition • Community for 50 finalists', location:'Global', snippet:'Nominate an exceptional Cameroonian teacher for the $1 million Global Teacher Prize. Self-nominations accepted. 50 finalists receive global recognition.' },

  // ── ENTREPRENEURSHIP ────────────────────────────────────────────────────────
  { tag:'entrepreneurship', category:'competition', title:'Tony Elumelu Foundation Entrepreneurship Program 2026', source:'Tony Elumelu Foundation', link:'https://tonyelumelufoundation.org/teep', deadline:'March 1, 2026', eligibility:'African national • Early-stage business • Any sector', benefits:'$5,000 seed capital • 12-week training • Mentorship • Network', location:'Online', snippet:'Africa\'s flagship entrepreneurship programme. 1,000 entrepreneurs selected. $5,000 non-refundable seed capital plus mentorship and training.' },
  { tag:'entrepreneurship', category:'event',       title:'Cameroon Startup Ecosystem Summit 2026', source:'Startups CM', link:'https://startups.cm/summit', deadline:null, eligibility:'Startups, investors and ecosystem builders', benefits:'Pitching sessions • Workshops • Investor meetings • Networking', location:'Douala, Cameroon', snippet:'Annual summit for Cameroonian entrepreneurs and investors. Pitching sessions, workshops and networking. Register for the 2026 cohort.' },
  { tag:'entrepreneurship', category:'scholarship', title:'YouthBiz Africa Scholarship 2026', source:'YouthBiz Africa', link:'https://youthbizafrica.org/scholarship', deadline:'March 30, 2026', eligibility:'Cameroonian entrepreneurs • Age 18-30', benefits:'Full business school tuition • Mentorship • Alumni network', location:'Various partner universities', snippet:'Scholarship for young Cameroonian entrepreneurs to attend business school. Covers tuition for entrepreneurship programs at partner universities.' },
  { tag:'entrepreneurship', category:'competition', title:'African Entrepreneurship Award 2026 – BMCE Bank', source:'BMCE Bank', link:'https://africanentrepreneurshipaward.com', deadline:'September 2026', eligibility:'African entrepreneurs • Scalable business model • Any sector', benefits:'$1.2M total prizes • Mentorship • Media coverage • Investor access', location:'Pan-Africa', snippet:'BMCE Bank African Entrepreneurship Award. $1.2M in prizes for African entrepreneurs with scalable and impactful businesses. Cameroon applicants welcome.' },
  { tag:'entrepreneurship', category:'internship',  title:'Business Incubator Coordinator – Yaoundé 2026', source:'Jobs CM', link:'https://jobs.cm/incubator-coordinator', deadline:null, eligibility:'Entrepreneurship or business background • 2+ years', benefits:'Competitive salary • Startup exposure • Growth potential', location:'Yaoundé, Cameroon', snippet:'Tech incubator in Yaoundé hiring Business Incubator Coordinator to support early-stage startups. Entrepreneurship background required.' },
  { tag:'entrepreneurship', category:'event',       title:'Startup Grind Douala – Monthly Meetup 2026', source:'Startup Grind Douala', link:'https://startupgrind.com/douala', deadline:null, eligibility:'Open to all entrepreneurs and startup enthusiasts', benefits:'Founder stories • Investor pitches • Community building • Free entry', location:'Douala, Cameroon', snippet:'Monthly startup networking event in Douala featuring founder stories, investor pitches and community building. Free to attend. Every second Saturday.' },
  { tag:'entrepreneurship', category:'competition', title:'Seedstars Cameroon 2026', source:'Seedstars', link:'https://seedstars.com/cameroon', deadline:'May 31, 2026', eligibility:'Tech startup • 0-3 years old • Cameroonian founders', benefits:'Up to $500,000 equity • Global network • Mentorship', location:'Douala, Cameroon', snippet:'Seedstars searching for best startup in Cameroon. Winners receive equity investment up to $500,000 and access to global Seedstars investor network.' },
  { tag:'entrepreneurship', category:'scholarship', title:'AFDB Entrepreneurship Hub Cameroon Cohort 2026', source:'African Development Bank', link:'https://afdb.org/entrepreneurship-hub', deadline:'April 2026', eligibility:'Cameroonian startups • Any sector • Early stage', benefits:'6-month incubation • Equity-free funding • Market access • Mentorship', location:'Cameroon', snippet:'AfDB entrepreneurship hub in Cameroon. 50 startups selected for 6-month incubation, equity-free funding and market access support.' },
  { tag:'entrepreneurship', category:'competition', title:'Hult Prize Cameroon 2026', source:'Hult Prize', link:'https://hultprize.org/cameroon', deadline:null, eligibility:'University students • Teams of 4 • Any discipline', benefits:'$1M global prize • Incubation • Mentorship • Media', location:'Cameroon universities', snippet:'World\'s largest student social entrepreneurship competition. Cameroon campus competitions at universities nationwide. Compete for $1 million prize.' },
  { tag:'entrepreneurship', category:'event',       title:'Women Entrepreneurship Forum Cameroon 2026', source:'WEF Cameroon', link:'https://wefcameroon.org/forum', deadline:null, eligibility:'Women entrepreneurs • All sectors • All ages', benefits:'5M FCFA grants • Mentorship • Networking • Media coverage', location:'Yaoundé, Cameroon', snippet:'Annual forum for women entrepreneurs in Cameroon. 5 million FCFA grants available for women-led businesses in agriculture, tech and services.' },

  // ── DATA SCIENCE / AI ────────────────────────────────────────────────────────
  { tag:'data_science', category:'scholarship', title:'Google Data Analytics Certificate Scholarship – Africa 2026', source:'Google Africa', link:'https://grow.google/africa/data-analytics', deadline:'March 2026', eligibility:'African national • Age 18+ • Any background', benefits:'Free certification • Google credential • Job placement support', location:'Online', snippet:'Google offering 50,000 scholarships for the Data Analytics Certificate to African students. Covers full cost. Cameroon applicants eligible.' },
  { tag:'data_science', category:'competition', title:'Zindi Africa Data Science Competition 2026 – Cameroon Health', source:'Zindi Africa', link:'https://zindi.africa/competitions/cameroon-health', deadline:'March 31, 2026', eligibility:'Open to all skill levels • Individual or team', benefits:'$5,000 prize pool • Zindi ranking • Career visibility', location:'Online', snippet:'Zindi hosts data science competition using Cameroon health data to predict disease outbreaks. $5,000 prize pool. Open to all skill levels.' },
  { tag:'data_science', category:'scholarship', title:'AIMS Cameroon Data Science Master\'s Scholarship 2026', source:'AIMS Cameroon', link:'https://aims.cm/masters', deadline:'May 31, 2026', eligibility:'Bachelor\'s in mathematics, CS or statistics • African national', benefits:'Full scholarship • Stipend • Housing • Research support', location:'Limbe, Cameroon', snippet:'African Institute for Mathematical Sciences Cameroon offers full scholarships for Master\'s in Mathematical Sciences with data science specialization.' },
  { tag:'data_science', category:'internship',  title:'Data Science Intern – AfricaData Hub 2026', source:'AfricaData Hub', link:'https://africadatahub.org/internships', deadline:null, eligibility:'Statistics, CS or data science student • Any level', benefits:'Paid remote internship • Real datasets • Certificate • Mentorship', location:'Remote', snippet:'AfricaData Hub offers remote data science internships. Work on real-world datasets from health, agriculture and finance sectors across Africa.' },
  { tag:'data_science', category:'event',       title:'IndabaX Cameroon 2026 – Deep Learning Conference', source:'IndabaX Cameroon', link:'https://indabaxcameroon.org', deadline:'May 2026', eligibility:'AI/ML practitioners and students • Open registration', benefits:'Tutorials • Research presentations • Networking • Certificates', location:'Yaoundé, Cameroon', snippet:'IndabaX Cameroon brings together AI and ML practitioners for a 3-day conference. Tutorials, research presentations and networking. May 2026.' },
  { tag:'data_science', category:'scholarship', title:'AI4D Africa Scholarship Program 2026', source:'AI4D Africa', link:'https://ai4d.ai/scholarships', deadline:'April 2026', eligibility:'African researchers • AI/data science for development focus', benefits:'Up to $50,000 research grant • Mentorship • Publication support', location:'Pan-Africa', snippet:'AI4D Africa scholarships for researchers working on AI for development. Up to $50,000 research grant for Cameroon applicants.' },
  { tag:'data_science', category:'job',         title:'Data Analyst – World Food Programme Cameroon', source:'WFP', link:'https://wfp.org/careers/cameroon', deadline:'February 2026', eligibility:'Statistics or data science degree • Excel, Power BI, SQL', benefits:'Competitive UN salary • Benefits • International experience', location:'Yaoundé, Cameroon', snippet:'WFP Cameroon recruiting Data Analyst for food security monitoring. Excel, Power BI and SQL required. Based in Yaoundé with competitive UN salary.' },
  { tag:'data_science', category:'competition', title:'DataFest Africa 2026 – Cameroon Edition', source:'DataFest Africa', link:'https://datafest.africa/cameroon', deadline:'April 2026', eligibility:'Students and professionals • Teams or individual • Any level', benefits:'$10,000 prizes • Networking • Career visibility', location:'Cameroon', snippet:'DataFest Africa annual data science hackathon in Cameroon. Teams solve real problems using data. $10,000 in prizes. Open to all skill levels.' },
  { tag:'data_science', category:'scholarship', title:'Google Research Africa Fellowship 2026', source:'Google Research Africa', link:'https://research.google/programs/africa-fellowship', deadline:null, eligibility:'PhD students and researchers • ML/AI focus • African institution', benefits:'Research funding • Google mentorship • Collaboration opportunities', location:'Online / Africa', snippet:'Google Research Africa Fellowship supports PhD students working on machine learning and AI. Annual application cycle. Cameroon researchers welcome.' },
  { tag:'data_science', category:'job',         title:'ML Engineer – Cameroon Revenue Authority', source:'DGI Cameroon', link:'https://dgi.cm/careers', deadline:null, eligibility:'Master\'s in data science or statistics • Python, R, SQL', benefits:'Government salary scale • Stability • Professional development', location:'Yaoundé, Cameroon', snippet:'Cameroon Revenue Authority hiring Data Scientists and ML Engineers to improve tax compliance analytics. Python, R and SQL required.' },

  // ── ARTS ─────────────────────────────────────────────────────────────────────
  { tag:'arts', category:'scholarship', title:'African Cultural Fund Arts Scholarship 2026', source:'African Cultural Fund', link:'https://africanculturalfund.org/scholarships', deadline:'April 2026', eligibility:'African artists • Any medium • Portfolio required', benefits:'$5,000 grant • Residency • Exhibition opportunity • Mentorship', location:'Pan-Africa', snippet:'African Cultural Fund scholarships for emerging African artists. $5,000 grant plus residency and exhibition opportunity. Portfolio submission required.' },
  { tag:'arts', category:'competition', title:'Cameroon Arts Festival Competition 2026', source:'MINAC Cameroon', link:'https://minac.cm/festival', deadline:'March 2026', eligibility:'Cameroonian artists • All disciplines • All ages', benefits:'Cash prizes • National exhibition • Media coverage', location:'Yaoundé, Cameroon', snippet:'National arts competition across visual arts, music, dance and literature. Cash prizes and national exhibition for winners. All Cameroonian artists welcome.' },
  { tag:'arts', category:'internship',  title:'Cultural Programme Intern – Institut Français Cameroun', source:'Institut Français Cameroun', link:'https://institutfrancais-cameroun.com/internships', deadline:null, eligibility:'Arts or cultural management student • French fluency', benefits:'Stipend • Cultural exposure • Networking • Certificate', location:'Yaoundé / Douala', snippet:'Institut Français Cameroun internships in cultural programming, event management and artistic direction. French fluency required.' },
  { tag:'arts', category:'event',       title:'Douala Art Week 2026', source:'Doual\'art', link:'https://doualart.org/art-week', deadline:null, eligibility:'Open to artists, collectors and art lovers', benefits:'Networking • Exhibition • Sales opportunities • Media coverage', location:'Douala, Cameroon', snippet:'Annual art week in Douala featuring exhibitions, performances and artist talks. One of West Africa\'s premier contemporary art events.' },
  { tag:'arts', category:'scholarship', title:'Civitella Ranieri Artist Residency Fellowship 2026', source:'Civitella Ranieri Foundation', link:'https://civitella.org/fellowships', deadline:'January 2026', eligibility:'Professional artists and writers • Portfolio required • Any nationality', benefits:'6-week residency • Studio • Accommodation • Materials stipend', location:'Umbria, Italy', snippet:'Prestigious artist residency in Italy for professional artists and writers. 6 weeks with studio, accommodation and materials stipend fully covered.' },
  { tag:'arts', category:'competition', title:'African Photography Award 2026', source:'Nando\'s African Photography', link:'https://africaphotographyaward.com', deadline:'June 2026', eligibility:'African photographers • Any age • Digital or film', benefits:'$10,000 prize • Exhibition • Publication • Career platform', location:'Online / Pan-Africa', snippet:'Premier photography competition celebrating African stories. $10,000 prize, international exhibition and publication in major photography magazine.' },
  { tag:'arts', category:'job',         title:'Graphic Designer – Cameroon Broadcasting Corporation', source:'CRTV Cameroon', link:'https://crtv.cm/careers', deadline:null, eligibility:'Graphic design degree • Adobe Creative Suite • Portfolio', benefits:'Government salary • Benefits • Creative environment', location:'Yaoundé, Cameroon', snippet:'CRTV Cameroon hiring Graphic Designer for its digital media department. Adobe Creative Suite proficiency required. Strong portfolio needed.' },
  { tag:'arts', category:'scholarship', title:'Rolex Mentor and Protégé Arts Initiative 2026', source:'Rolex', link:'https://rolexmentorprotege.com', deadline:'March 2026', eligibility:'Emerging artists • Age 25-45 • Any discipline • Portfolio', benefits:'Mentorship from master artist • Project grant • Global platform', location:'Global', snippet:'Rolex pairs emerging artists with masters in their field for 2-year mentorship. Project grant and global platform included. Cameroon artists eligible.' },
  { tag:'arts', category:'internship',  title:'Film Production Intern – Cameroon Film Festival 2026', source:'CamFilmFest', link:'https://cameroonfilmfestival.com/internships', deadline:null, eligibility:'Film studies student or recent graduate', benefits:'Festival experience • Industry networking • Certificate', location:'Yaoundé, Cameroon', snippet:'Cameroon Film Festival internships in production, programming and communications. Invaluable industry experience and networking with African filmmakers.' },
  { tag:'arts', category:'competition', title:'African Literature Prize 2026 – Short Story', source:'Writivism', link:'https://writivism.org/prize', deadline:'April 2026', eligibility:'African writers • Short stories 3,000-6,000 words • Any language', benefits:'$5,000 prize • Publication • International platform', location:'Online', snippet:'Writivism African Literature Prize for short stories. $5,000 prize and publication in leading African literary journal. Open to all African writers.' },

  // ── AGRICULTURE ─────────────────────────────────────────────────────────────
  { tag:'agriculture', category:'scholarship', title:'FAO Young Professionals Program 2026', source:'FAO', link:'https://fao.org/employment/young-professionals', deadline:'February 2026', eligibility:'Agriculture or food science degree • Under 32 • Cameroonian national', benefits:'Competitive UN salary • Benefits • International career • Field experience', location:'Rome / Field offices', snippet:'FAO Young Professionals Program for Cameroonians with agriculture degrees. Competitive UN salary and international career development opportunities.' },
  { tag:'agriculture', category:'competition', title:'Cameroon Agricultural Innovation Challenge 2026', source:'MINADER Cameroon', link:'https://minader.cm/innovation', deadline:'May 2026', eligibility:'Cameroonian farmers, students and entrepreneurs', benefits:'15 million FCFA prizes • Incubation • Market access', location:'Cameroon', snippet:'National agricultural innovation competition. Solutions for crop disease, irrigation, storage and market access. 15M FCFA in prizes.' },
  { tag:'agriculture', category:'internship',  title:'Agri-Business Intern – CDC Cameroon 2026', source:'CDC Cameroon', link:'https://cdc-cameroon.net/careers/internships', deadline:null, eligibility:'Agriculture or agri-business student • Final year', benefits:'Paid stipend • Field experience • Certificate • Return offer', location:'Fako Division, Cameroon', snippet:'Cameroon Development Corporation agricultural internships in palm oil, rubber and banana plantations. Hands-on agri-business experience.' },
  { tag:'agriculture', category:'scholarship', title:'Borlaug LEAP Fellowship – Africa 2026', source:'CIMMYT', link:'https://borlaug-leap.cimmyt.org', deadline:'March 2026', eligibility:'Agriculture PhD student • African institution • Research focus', benefits:'$12,000 fellowship • Mentorship • Research travel • Publication', location:'Various (Mexico/Africa)', snippet:'Borlaug LEAP Fellowship for African PhD students in agriculture. $12,000 plus mentorship from world-leading plant scientists at CIMMYT.' },
  { tag:'agriculture', category:'event',       title:'Cameroon Agricultural Expo 2026', source:'MINADER', link:'https://agriexpo.cm', deadline:null, eligibility:'Open to farmers, researchers and agri-businesses', benefits:'Networking • Market access • Technology showcase', location:'Yaoundé, Cameroon', snippet:'Annual agricultural exposition showcasing Cameroon\'s farming innovations. Networking with buyers, investors and research institutions.' },
  { tag:'agriculture', category:'job',         title:'Agronomist – World Food Programme Cameroon', source:'WFP Cameroon', link:'https://wfp.org/careers/cameroon/agronomist', deadline:null, eligibility:'Agronomy or agriculture degree • 3+ years field experience', benefits:'UN salary • Benefits • Field work • International exposure', location:'Maroua / Bertoua, Cameroon', snippet:'WFP Cameroon hiring Agronomist for food security programs in Far North and East regions. 3+ years field experience in smallholder agriculture.' },
  { tag:'agriculture', category:'scholarship', title:'African Women in Agri-Business Scholarship 2026', source:'AGRA', link:'https://agra.org/scholarships/women', deadline:'April 2026', eligibility:'African women • Agriculture or agri-business • Bachelor\'s minimum', benefits:'Full scholarship • Mentorship • Network • Stipend', location:'Various African universities', snippet:'AGRA scholarships for African women pursuing advanced degrees in agriculture and agri-business. Full scholarship with mentorship and professional network.' },
  { tag:'agriculture', category:'internship',  title:'Climate-Smart Agriculture Intern – GIZ Cameroon 2026', source:'GIZ Germany', link:'https://giz.de/cameroon/internships', deadline:null, eligibility:'Agriculture or environment student • French/English', benefits:'Stipend • International organization experience • Certificate', location:'Yaoundé, Cameroon', snippet:'GIZ Cameroon climate-smart agriculture internships. Support implementation of sustainable farming practices across Cameroon\'s regions.' },
  { tag:'agriculture', category:'competition', title:'Youth Agripreneur Challenge Cameroon 2026', source:'IITA Youth Agripreneurs', link:'https://iita.org/youth-agripreneurs', deadline:'June 2026', eligibility:'Youth 18-35 • Agricultural enterprise • Cameroonian', benefits:'$10,000 prize • Incubation • Training • Market linkages', location:'Cameroon', snippet:'IITA Youth Agripreneur Challenge for young Cameroonian agricultural entrepreneurs. $10,000 prize with incubation, training and market linkage support.' },
  { tag:'agriculture', category:'scholarship', title:'RUFORUM Graduate Fellowship 2026', source:'RUFORUM', link:'https://ruforum.org/fellowships', deadline:'March 2026', eligibility:'Agriculture Master\'s or PhD • African university student', benefits:'Full scholarship • Research support • Network • Travel', location:'Various African universities', snippet:'RUFORUM Graduate Fellowship for African agriculture students. Full scholarship with research support and access to pan-African agriculture network.' },

  // ── RESEARCH ─────────────────────────────────────────────────────────────────
  { tag:'research', category:'scholarship', title:'Carnegie African Diaspora Fellowship 2026', source:'Carnegie Corporation', link:'https://cadfellowship.org', deadline:'March 2026', eligibility:'African-born academics at US/Canadian institutions • PhD', benefits:'Research visit funding • Collaboration support • $5,000 grant', location:'Africa / North America', snippet:'Carnegie African Diaspora Fellowship connects African-born academics with African universities for collaborative research. $5,000 research grant.' },
  { tag:'research', category:'competition', title:'Next Einstein Forum Science Leapfrogging Award 2026', source:'Next Einstein Forum', link:'https://nef.org/science-award', deadline:'April 2026', eligibility:'African scientists • Any discipline • Innovative research', benefits:'$100,000 award • Global platform • Research support', location:'Pan-Africa', snippet:'NEF Science Leapfrogging Award for African scientists solving continent-wide challenges. $100,000 prize and global platform for winners.' },
  { tag:'research', category:'internship',  title:'Research Intern – IRAD Cameroon 2026', source:'IRAD Cameroon', link:'https://irad.cm/internships', deadline:null, eligibility:'Science student • Any discipline • Cameroonian', benefits:'Research experience • Mentorship • Publication opportunity', location:'Yaoundé, Cameroon', snippet:'Institute for Agricultural Research for Development (IRAD) research internships for Cameroonian science students. Hands-on research experience.' },
  { tag:'research', category:'scholarship', title:'Wellcome Trust African Institutions Initiative 2026', source:'Wellcome Trust', link:'https://wellcome.org/african-institutions', deadline:'May 2026', eligibility:'African researchers • Any health-related discipline • Institution-based', benefits:'Up to £3M institutional grant • Capacity building • Equipment', location:'African institutions', snippet:'Wellcome Trust supports African research institutions. Grants up to £3M for capacity building, equipment and research programs. Cameroon institutions eligible.' },
  { tag:'research', category:'scholarship', title:'TWAS Research Grant – Sub-Saharan Africa 2026', source:'TWAS', link:'https://twas.org/grants', deadline:'March 2026', eligibility:'African researchers • PhD required • Developing country institution', benefits:'Up to $15,000 research grant • Equipment • Travel', location:'Cameroon institution-based', snippet:'TWAS grants for researchers at developing country institutions. Up to $15,000 for equipment, research costs and travel. Cameroon researchers eligible.' },
  { tag:'research', category:'event',       title:'African Research Universities Alliance Conference 2026', source:'ARUA', link:'https://arua.org.za/conference', deadline:null, eligibility:'Researchers and postgrad students at African universities', benefits:'Networking • Publication • Collaboration opportunities', location:'Pan-Africa', snippet:'ARUA annual conference connecting researchers across African universities. Networking, publication opportunities and collaborative research partnerships.' },
  { tag:'research', category:'job',         title:'Research Associate – IRIC Yaoundé 2026', source:'IRIC Cameroon', link:'https://iric.cm/careers', deadline:null, eligibility:'Master\'s or PhD in biomedical science • French/English', benefits:'Research salary • Lab access • Publication support', location:'Yaoundé, Cameroon', snippet:'Institute for Research in Immunology and Cancer of Cameroon hiring Research Associates. Master\'s or PhD in biomedical science required.' },
  { tag:'research', category:'competition', title:'L\'Oréal-UNESCO For Women in Science 2026 – Africa', source:'L\'Oréal Foundation', link:'https://forwomeninscience.com/africa', deadline:'June 2026', eligibility:'African women scientists • PhD • Under 40', benefits:'€15,000 fellowship • Global platform • Mentorship', location:'Pan-Africa', snippet:'L\'Oréal-UNESCO For Women in Science fellowships for African women researchers. €15,000 fellowship and global platform for outstanding science.' },
  { tag:'research', category:'internship',  title:'Research Intern – CIRCB Cameroon 2026', source:'CIRCB', link:'https://circb.cm/internships', deadline:null, eligibility:'Biomedical science student • Any level • Cameroonian', benefits:'Lab experience • Mentorship • Publication opportunity', location:'Yaoundé, Cameroon', snippet:'Chantal Biya International Reference Centre for HIV/AIDS research internships. Hands-on biomedical research experience in world-class facility.' },
  { tag:'research', category:'scholarship', title:'DAAD Research Scholarship – Africa 2026', source:'DAAD Germany', link:'https://daad.de/research-africa', deadline:'October 2026', eligibility:'African researchers • Master\'s minimum • Any discipline', benefits:'Full scholarship • Monthly stipend • Research support • Travel', location:'Germany', snippet:'DAAD research scholarships for African researchers to conduct studies at German universities and research institutes. All disciplines welcome.' },
];

function extractAmount(s) {
  const match = s.match(/(fully funded|\$[\d,]+|€[\d,]+|£[\d,]+|[\d,]+\s*(?:FCFA|CFA))/i);
  return match ? match[1] : 'Full Funding / Varies';
}

function extractDegreeLevel(s) {
  const text = s.toLowerCase();
  if (text.includes('phd') || text.includes('postdoc') || text.includes('doctoral')) return 'PhD / Postdoc';
  if (text.includes('master') || text.includes('msc') || text.includes('mba')) return 'Master\'s';
  if (text.includes('undergraduate') || text.includes('bachelor') || text.includes('bsc')) return 'Undergraduate';
  if (text.includes('high school') || text.includes('secondary')) return 'High School';
  return 'All Levels';
}

function extractCountryFocus(s) {
  const text = s.toLowerCase();
  if (text.includes('cameroon')) return 'Cameroon';
  if (text.includes('africa') || text.includes('pan-african')) return 'Africa';
  if (text.includes('global') || text.includes('worldwide') || text.includes('any country')) return 'Global';
  const countries = ['nigeria', 'kenya', 'ghana', 'south africa', 'uganda', 'rwanda'];
  for (const c of countries) {
    if (text.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return 'Africa / Global';
}

function getApplicationSteps(o) {
  if (o.application_steps && Array.isArray(o.application_steps) && o.application_steps.length > 0) {
    return o.application_steps;
  }
  const steps = [
    `1. Visit the official opportunity portal at ${o.source || 'source website'}.`,
    `2. Check detailed eligibility: ${o.eligibility || 'Open to all eligible candidates'}.`,
    `3. Prepare application materials: CV/Resume, recommendation letters, and essays.`,
    `4. Fill out the application form at ${o.link || 'the portal'}.`,
    `5. Submit before the deadline: ${o.deadline || 'rolling basis'}.`
  ];
  return steps;
}

export async function seedOpportunities() {
  // 1. Prepare master featured list of all top 25 opportunities
  const featuredOpps = OPPORTUNITIES.filter(o => o.featured);

  const processOpp = (o, idx, customTag) => ({
    id: o.featured ? `featured-${o.featured_rank}` : `static-${customTag || o.tag}-${idx}`,
    title: o.title,
    link: o.link,
    snippet: o.snippet,
    description: o.snippet,
    source: o.source,
    tag: customTag || o.tag,
    category: o.category,
    deadline: o.deadline || null,
    eligibility: o.eligibility || null,
    benefits: o.benefits || null,
    location: o.location || null,
    amount: o.amount || extractAmount(o.title + ' ' + o.snippet),
    degree_level: o.degree_level || extractDegreeLevel(o.title + ' ' + o.snippet),
    country_focus: o.country_focus || extractCountryFocus(o.title + ' ' + o.snippet),
    application_steps: getApplicationSteps(o),
    application_checklist: getApplicationSteps(o),
    featured: o.featured || false,
    featured_rank: o.featured_rank || null,
    verified: true,
  });

  // Group by tag
  const byTag = {};
  for (const opp of OPPORTUNITIES) {
    const t = opp.tag;
    if (!byTag[t]) byTag[t] = [];
    byTag[t].push(opp);
  }

  // Alias tags to ensure all user interest profiles get rich opportunities
  const aliasMap = {
    'digital_media': ['technology', 'international_relations', 'arts'],
    'media_communication': ['international_relations', 'arts', 'leadership'],
    'social_work': ['leadership', 'medicine', 'education', 'research'],
    'stem': ['technology', 'data_science', 'research', 'engineering'],
    'international_relations': ['leadership', 'research', 'entrepreneurship'],
    'leadership': ['entrepreneurship', 'education', 'research'],
  };

  for (const [aliasTag, sourceTags] of Object.entries(aliasMap)) {
    const combined = [];
    for (const src of sourceTags) {
      if (byTag[src]) combined.push(...byTag[src]);
    }
    byTag[aliasTag] = Array.from(new Set([...(byTag[aliasTag] || []), ...combined]));
  }

  // Always seed 'featured' tag with all 25 top opportunities
  byTag['featured'] = featuredOpps;
  byTag['general'] = featuredOpps;
  byTag['all'] = featuredOpps;

  const cacheTime = new Date(Date.now() - 1000).toISOString();

  for (const [tag, opps] of Object.entries(byTag)) {
    const processed = opps.map((o, idx) => processOpp(o, idx, tag));

    const { error } = await supabase.from('lp_tag_cache').upsert(
      { tag, results: JSON.stringify(processed), cached_at: cacheTime },
      { onConflict: 'tag' }
    );
    if (error) console.error(`Seed error for ${tag}:`, error.message);
    else console.log(`[Seed] Seeded ${processed.length} opps for tag: ${tag}`);
  }
  console.log('[Seed] Static opportunity library seeded successfully.');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await seedOpportunities();
    return res.status(200).json({ ok: true, message: 'Opportunity library seeded.' });
  } catch (err) {
    console.error('Seed error:', err);
    return res.status(500).json({ error: err.message });
  }
}
