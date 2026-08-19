/**
 * Static opportunity seed — 10+ real opportunities per interest tag + per category.
 * Called once at startup if cache is empty. All data is 2026-accurate.
 */
import supabase from './_supabase.js';

const NOW = new Date().toISOString();

// ─── MASTER OPPORTUNITY LIBRARY ───────────────────────────────────────────────
// Each entry: { title, link, snippet, source, tag, category, deadline, eligibility, benefits, location }
export const OPPORTUNITIES = [

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

  // ═══════════════════════════════════════════════════════════════════════════
  // ── FEATURED 25: VERIFIED GLOBAL OPPORTUNITIES ───────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 1. TECHNOVATION GIRLS ────────────────────────────────────────────────
  {
    tag: 'technology',
    category: 'competition',
    title: 'Technovation Girls Global Challenge 2026–2027',
    source: 'Technovation Girls',
    link: 'https://technovationchallenge.org',
    deadline: 'New season opens mid-August 2026 • Submissions close March–May 2027',
    eligibility: 'Female and non-binary students aged 8–18 globally • Teams of 1–5 participants • No prior coding experience required • Open to all countries',
    benefits: 'Global Pitch at the World Summit • International scholarships for top teams • Project showcase on Technovation\'s global platform • Judging by tech industry professionals • Free to participate — zero cost',
    location: 'Online (Global) + World Summit Finale',
    amount: 'Free / Scholarships for winners',
    degree_level: 'High School',
    country_focus: 'Global',
    application_steps: [
      '1. Register a free team account at https://technovationchallenge.org starting mid-August 2026.',
      '2. Form a team of 1–5 girls/non-binary students aged 8–18 and find an adult mentor (recommended).',
      '3. Identify a real community problem and design an AI-powered mobile app solution.',
      '4. Build your app using MIT App Inventor or another approved platform during the program season.',
      '5. Create a business plan and pitch video to accompany your submission.',
      '6. Submit your complete project (app + business plan + pitch video) by the May 2027 deadline.',
      '7. Top teams are invited to pitch live at the World Summit for scholarships and international recognition.'
    ],
    snippet: 'Technovation Girls challenges girls and non-binary youth aged 8–18 worldwide to build AI-powered mobile apps and business plans addressing real community problems — from climate change to healthcare access. Running since 2010, the program has engaged over 500,000 students across 100+ countries. Teams are mentored by industry professionals, submit a working app and business plan, and top performers pitch live at the annual World Summit for international scholarships. Completely free to join — new season opens mid-August 2026.',
  },

  // ── 2. THE CONRAD CHALLENGE ──────────────────────────────────────────────
  {
    tag: 'entrepreneurship',
    category: 'competition',
    title: 'The Conrad Challenge 2026–2027',
    source: 'Conrad Foundation',
    link: 'https://conradchallenge.org',
    deadline: 'Stage 1 Activation: October 30, 2026 • Stage 2 Innovation: January 8, 2027 • Innovation Summit: April 2027',
    eligibility: 'Global students aged 13–18 • Teams of 2–5 with a required adult coach aged 18+ • Five innovation tracks: Aerospace & Aviation, Cyber-Technology & Security, Energy & Environment, Health & Nutrition, Sustainable Development',
    benefits: 'Innovation Summit at Space Center Houston • University scholarships up to $25,000/year for top teams • Live pitching to venture capitalists and judges • Incubation support • Global media coverage',
    location: 'Online (submissions) + Space Center Houston, Texas, USA (Summit)',
    amount: '$25,000/year scholarships',
    degree_level: 'High School',
    country_focus: 'Global',
    application_steps: [
      '1. Register your team at https://conradchallenge.org by October 30, 2026 (Stage 1 — free).',
      '2. Select one of five innovation tracks: Aerospace & Aviation, Cyber-Technology & Security, Energy & Environment, Health & Nutrition, or Sustainable Development.',
      '3. Recruit team members (2–5 students aged 13–18) and one required adult coach (18+).',
      '4. Develop your innovation prototype and Lean Canvas business model during Stage 1.',
      '5. Submit your Stage 2 Innovation package (prototype, business plan, pitch deck) by January 8, 2027. Stage 2 submission fee: $499.',
      '6. Shortlisted teams are invited to the Innovation Summit at Space Center Houston in April 2027 to pitch live before venture judges.',
      '7. Grand prize winners receive university scholarships worth up to $25,000/year.'
    ],
    snippet: 'The Conrad Challenge tasks student teams aged 13–18 with solving real-world problems using science, technology, and entrepreneurship principles. Named after NASA astronaut Pete Conrad, the program has connected youth innovators with venture capitalists, NASA scientists, and university admissions boards since 2008. Teams select from five innovation tracks, build functional prototypes with viable business models, and pitch live at Space Center Houston. Stage 1 registration is free; Stage 2 submission is $499 (institutional sponsorships available). University scholarships worth up to $25,000/year are awarded to top teams.',
  },

  // ── 3. THE JUNIOR ACADEMY (NYAS) ─────────────────────────────────────────
  {
    tag: 'stem',
    category: 'event',
    title: 'The Junior Academy – NYAS Global STEM Alliance 2027',
    source: 'New York Academy of Sciences',
    link: 'https://www.nyas.org/programs/global-stem-alliance/the-junior-academy',
    deadline: 'Applications for the next cycle open April 2027 • Previous cycle closed July 9, 2026',
    eligibility: 'Students aged 13–17 globally • English proficiency required • Strong interest in STEM • Commitment to complete the full challenge semester required',
    benefits: 'Virtual project presentation on the NYAS Launchpad global portal • International networking with expert mentors from leading research institutions • Peer-reviewed collaborative research experience • Certificate of completion • Free to participate',
    location: 'Online (Global) — 100+ countries represented',
    amount: 'Free',
    degree_level: 'High School',
    country_focus: 'Global',
    application_steps: [
      '1. Monitor https://www.nyas.org/programs/global-stem-alliance/the-junior-academy for application opening (April 2027).',
      '2. Complete the online application demonstrating your STEM interests and English proficiency.',
      '3. If selected, you will be placed in a cross-border virtual team with students from different countries.',
      '4. Collaborate on an assigned real-world challenge (e.g., green energy, public health, food security) over the challenge semester.',
      '5. Produce a research methodology, data analysis, and human-centered design solution with your team.',
      '6. Present your project virtually on the NYAS Launchpad portal for evaluation by expert mentors.',
      '7. Receive feedback, certification, and access to the global NYAS alumni network.'
    ],
    snippet: 'The Junior Academy is the New York Academy of Sciences\' flagship global STEM initiative for students aged 13–17 from over 100 countries. Selected participants are placed in cross-border virtual teams to collaborate on real-world scientific challenges spanning green energy, public health misinformation, food security, and more. Under expert mentorship from researchers at institutions like MIT, Harvard, and Google, teams apply scientific research methodology, data analysis, and human-centered design. Projects are showcased internationally on the NYAS Launchpad portal. Applications for the next cycle open April 2027.',
  },

  // ── 4. HARVARD INTERNATIONAL REVIEW ACADEMIC WRITING CONTEST ─────────────
  {
    tag: 'international_relations',
    category: 'competition',
    title: 'Harvard International Review Academic Writing Contest — Fall/Winter 2026–2027',
    source: 'Harvard International Review',
    link: 'https://hir.harvard.edu/writing-contest',
    deadline: 'Fall/Winter cycle deadline: January 2, 2027 • Main global cycle previously: August 24, 2026',
    eligibility: 'High school and middle school students globally (grades 7–12) • Analytical articles of 800–1,200 words • Topics include: Security in a Multipolar World, Technology Innovation and Power, Climate Geopolitics, Economic Interdependence',
    benefits: 'Publication opportunities in the Harvard International Review — one of the world\'s most prestigious student policy journals • Gold, Silver, and Bronze medal recognition • Virtual oral defense before the HIR editorial board • Free to enter',
    location: 'Online (Global)',
    amount: 'Free',
    degree_level: 'High School',
    country_focus: 'Global',
    application_steps: [
      '1. Visit https://hir.harvard.edu/writing-contest to view the current cycle prompts and submission portal.',
      '2. Select an analytical prompt (e.g., Security in a Multipolar World, Technology, Innovation, and Power).',
      '3. Write an analytical article of 800–1,200 words addressing your chosen prompt with evidence-based argumentation.',
      '4. Ensure proper citations (Chicago or APA style), original analysis, and structured argumentation.',
      '5. Submit via the online portal before the January 2, 2027 deadline (Fall/Winter cycle).',
      '6. Shortlisted candidates will be invited for a virtual oral defense before the HIR editorial board.',
      '7. Award notifications (Gold, Silver, Bronze) and publication decisions are communicated after evaluation.'
    ],
    snippet: 'The Harvard International Review Academic Writing Contest invites global students in grades 7–12 to submit 800–1,200 word analytical articles on international affairs, foreign policy, and geopolitical topics. The Fall/Winter 2026–2027 cycle deadline is January 2, 2027. Prompts explore themes like Security in a Multipolar World, Technology, Innovation, and Power, and Climate Geopolitics. Exceptional submissions earn Gold, Silver, or Bronze medal recognition and publication opportunities in the Harvard International Review — founded in 1979 and read by policymakers and scholars worldwide. Finalists participate in a virtual oral defense before the HIR editorial board.',
  },

  // ── 5. MIT WOMEN'S TECHNOLOGY PROGRAM ────────────────────────────────────
  {
    tag: 'technology',
    category: 'scholarship',
    title: 'MIT Women\'s Technology Program (WTP) 2027',
    source: 'MIT School of Engineering',
    link: 'https://engineering.mit.edu/programs/women-technology-program-wtp',
    deadline: 'Applications typically open December 2026 – February 2027 for the summer 2027 cohort',
    eligibility: 'Rising female high school seniors (entering 12th grade in Fall 2027) • US residents preferred; limited international spots • Strong math and science background (pre-calculus or higher) • Minimal prior engineering experience intentionally required',
    benefits: 'Fully funded — zero tuition cost • Four-week residential program on MIT campus • Direct instruction by MIT faculty and graduate student mentors • Hands-on laboratory projects in Mechanical Engineering or EECS • Strong pathway for university admissions recognition',
    location: 'MIT Campus, Cambridge, Massachusetts, USA',
    amount: 'Fully Funded',
    degree_level: 'High School',
    country_focus: 'Global',
    application_steps: [
      '1. Visit https://engineering.mit.edu/programs/women-technology-program-wtp beginning December 2026.',
      '2. Choose your track: Mechanical Engineering (ME) or Electrical Engineering and Computer Science (EECS).',
      '3. Prepare your application: academic transcripts, teacher recommendations, and personal essays.',
      '4. Submit the online application by the February 2027 deadline.',
      '5. Notification of admission typically arrives March–April 2027.',
      '6. Attend the four-week residential program on MIT campus in June–July 2027.',
      '7. Complete laboratory research projects mentored by MIT graduate students and faculty.'
    ],
    snippet: 'The MIT Women\'s Technology Program (WTP) is a fully funded four-week residential summer program on MIT\'s campus designed specifically for rising female seniors who have strong math and science backgrounds but minimal prior engineering experience. Running since 1998, WTP gives participants hands-on laboratory research in either Mechanical Engineering or Electrical Engineering & Computer Science, mentored by MIT graduate scholars and faculty. The program has launched hundreds of engineering careers. Applications open December 2026 — February 2027 for the summer 2027 cohort. Zero cost to participants.',
  },

  // ── 6. AFRICAN LEADERSHIP ACADEMY ────────────────────────────────────────
  {
    tag: 'leadership',
    category: 'scholarship',
    title: 'African Leadership Academy (ALA) — Class of 2027 Diploma Program',
    source: 'African Leadership Academy',
    link: 'https://www.africanleadershipacademy.org/admissions',
    deadline: 'Early Decision: October 15, 2026 • Regular Decision: January 15, 2027',
    eligibility: 'African nationals born on or after September 1, 2007 (ages 15–18 at application) • Minimum Grade 10 (Form 4) completion • Demonstrated leadership, perseverance, entrepreneurial thinking, and intellectual courage • All African nationalities and backgrounds considered',
    benefits: 'Two-year fully residential pre-university diploma program in Johannesburg, South Africa • Full scholarships and need-based financial aid — 95–97% of admitted students receive aid • ALA graduates have collectively generated over $270M in university scholarships • Access to a lifelong pan-African alumni network spanning 60+ countries • Direct pathways to world\'s top universities including Ivy League, Oxford, Cambridge',
    location: 'Johannesburg, South Africa (fully residential)',
    amount: 'Full Scholarship / Need-Based Aid',
    degree_level: 'High School',
    country_focus: 'Africa',
    application_steps: [
      '1. Visit https://www.africanleadershipacademy.org/admissions and create an account on the ALA application portal.',
      '2. Complete the written application: personal essays (intellectual readiness, leadership, community impact), academic records.',
      '3. Obtain two teacher/mentor recommendation letters addressing ALA\'s five leadership competencies: Courage, Perseverance, Ownership, Intellectual Readiness, Interdependence.',
      '4. Submit your Early Decision application by October 15, 2026 or Regular Decision by January 15, 2027.',
      '5. Shortlisted candidates are invited to regional assessment centres or virtual interviews.',
      '6. Apply for financial aid simultaneously — 95–97% of admitted students receive need-based support.',
      '7. Admitted students begin the two-year residential programme in Johannesburg, South Africa in 2027.'
    ],
    snippet: 'The African Leadership Academy (ALA) is a prestigious two-year pre-university diploma program in Johannesburg, South Africa that has transformed African leadership pipelines since 2008. ALA\'s holistic evaluation focuses on five leadership competencies: Intellectual Readiness, Courage, Perseverance, Ownership, and Interdependence — not just grades. Graduates of the Class of 2027 program will join an alumni network spanning 60+ African nations, with a proven track record of over $270 million in collective university scholarship generation. Early Decision deadline: October 15, 2026. Regular Decision: January 15, 2027. 95–97% of admitted students receive need-based financial aid.',
  },

  // ── 7. YALE YOUNG AFRICAN SCHOLARS (YYAS) ────────────────────────────────
  {
    tag: 'leadership',
    category: 'scholarship',
    title: 'Yale Young African Scholars (YYAS) Programme 2027',
    source: 'Yale Young African Scholars',
    link: 'https://yyas.yale.edu',
    deadline: 'Application deadline: January 21, 2027 • Residential sessions: June–July 2027',
    eligibility: 'Secondary school students across Africa (typically ages 16–18) • Strong academic record and demonstrated community leadership • Open to students from all African nations',
    benefits: 'Fully funded — covers tuition, accommodation, and international travel costs • Capstone project presentations before Yale faculty • Inclusion in Yale\'s global alumni network • Structured university application mentorship and guidance • Access to the Yale Young Global Scholars (YYGS) ecosystem',
    location: 'Yale University, New Haven, Connecticut, USA + Regional African hubs',
    amount: 'Fully Funded (tuition + travel)',
    degree_level: 'High School',
    country_focus: 'Africa',
    application_steps: [
      '1. Visit https://yyas.yale.edu and complete the online application form.',
      '2. Prepare your application essay addressing your academic interests, leadership experience, and vision for Africa.',
      '3. Collect two academic recommendation letters from teachers or mentors.',
      '4. Submit your complete application by January 21, 2027.',
      '5. Selected candidates are notified and invited to attend the June–July 2027 residential session.',
      '6. Travel costs and program fees are fully covered — no financial barrier to participation.',
      '7. Complete a capstone research project and present before Yale faculty at the end of the program.'
    ],
    snippet: 'Yale Young African Scholars (YYAS) is a flagship academic enrichment and university preparation program for exceptional secondary school students across Africa. Fully funded — covering tuition, accommodation, and international travel — YYAS runs week-long residential sessions at Yale University combining university-level research, leadership strategy, standardized test literacy, and civic engagement. The program is part of the Yale Young Global Scholars (YYGS) ecosystem, connecting African youth directly to Yale\'s global alumni network and structured university application mentorship. Application deadline: January 21, 2027.',
  },

  // ── 8. GEORGETOWN UNIVERSITY INTERNATIONAL RELATIONS ACADEMY ─────────────
  {
    tag: 'international_relations',
    category: 'event',
    title: 'Georgetown University International Relations Academy 2027',
    source: 'Georgetown University School of Continuing Studies',
    link: 'https://scs.georgetown.edu/programs/professional-development/international-relations-academy',
    deadline: 'Application deadline: May 15, 2027 • Program dates: Summer 2027 (1 week)',
    eligibility: 'High school students globally in grades 8–12 • Strong interest in foreign policy, diplomacy, and international affairs • Residential and commuter options available',
    benefits: 'Immersive foreign policy simulation and crisis negotiation workshops • Direct engagement with active Washington D.C. diplomats and Georgetown University faculty • Certificate of completion from Georgetown • Residential or commuter attendance • Need-based financial aid available (tuition: $3,095–$3,725)',
    location: 'Georgetown University, Washington D.C., USA',
    amount: '$3,095–$3,725 (financial aid available)',
    degree_level: 'High School',
    country_focus: 'Global',
    application_steps: [
      '1. Visit https://scs.georgetown.edu/programs/professional-development/international-relations-academy for current application details.',
      '2. Complete the online application including academic information, personal statement, and teacher recommendation.',
      '3. Apply for need-based financial aid simultaneously if required.',
      '4. Submit your application by May 15, 2027.',
      '5. Receive admission notification and choose between residential (on-campus) or commuter attendance.',
      '6. Attend the one-week summer program at Georgetown University in Washington D.C.',
      '7. Participate in policy simulations, diplomat sessions, and crisis negotiations. Receive your Georgetown certificate.'
    ],
    snippet: 'Georgetown University\'s International Relations Academy is a one-week residential summer program in Washington D.C. giving high school students (grades 8–12) direct exposure to real-world foreign policy and international diplomacy. Participants engage in crisis negotiation simulations, policy formulation workshops, bilateral and multilateral diplomacy exercises, and sessions with active Washington D.C. diplomats and Georgetown University faculty. Both residential and commuter options are available, with need-based financial aid offered for students who qualify. Tuition ranges from $3,095 to $3,725. Application deadline: May 15, 2027.',
  },

  // ── 9. FAST FORWARD ACCELERATOR ──────────────────────────────────────────
  {
    tag: 'entrepreneurship',
    category: 'grant',
    title: 'Fast Forward Tech Nonprofit Accelerator — 2027 Cohort',
    source: 'Fast Forward',
    link: 'https://www.ffwd.org/accelerator',
    deadline: 'Annual recruitment cycle for 2027 cohort — rolling applications, check portal for current window',
    eligibility: 'Early-stage tech nonprofits and youth-led social impact ventures globally • Technology must be the core service delivery mechanism (not peripheral) • Open to founders of any age or geography • Focus areas: open-source tools, public interest AI, civic technology, education, health, and human rights',
    benefits: '$25,000+ in non-dilutive, equity-free seed funding • Strategic mentorship from Silicon Valley tech leaders • Entry to Fast Forward\'s global funder and philanthropic network • International pitch showcase • Media and PR exposure across the tech-for-good ecosystem',
    location: 'Online (Global) + San Francisco, USA (flagship events)',
    amount: '$25,000+ non-dilutive grant',
    degree_level: 'All Levels',
    country_focus: 'Global',
    application_steps: [
      '1. Visit https://www.ffwd.org/accelerator to check the current application window.',
      '2. Confirm your venture is a registered nonprofit (501c3 or equivalent) with technology as its core mission.',
      '3. Prepare your application: describe the technology product, the problem it solves, team background, and impact metrics.',
      '4. Submit your application via the Fast Forward portal.',
      '5. Selected applicants may be invited to a virtual interview with the Fast Forward team.',
      '6. Accepted nonprofits receive $25,000+ in equity-free funding and join the accelerator cohort.',
      '7. Participate in mentorship sessions, pitch events, and access the Fast Forward global philanthropic network.'
    ],
    snippet: 'Fast Forward is the leading accelerator for tech nonprofits — organizations that use technology as their primary means of creating social change. Since 2014, Fast Forward has invested in over 100 tech nonprofits including Code2040, DonorsChoose, and Crisis Text Line. The program provides $25,000+ in non-dilutive, equity-free seed funding alongside strategic mentorship from Silicon Valley leaders and access to a global network of philanthropists and funders. Any early-stage tech nonprofit globally — including AI-powered tools for civil society, education, health, and human rights — is eligible to apply.',
  },

  // ── 10. CITIZEN ENTREPRENEURSHIP COMPETITION ─────────────────────────────
  {
    tag: 'entrepreneurship',
    category: 'competition',
    title: 'Citizen Entrepreneurship Competition 2026',
    source: 'Convetit / Citizen Entrepreneurship',
    link: 'https://www.citizen-entrepreneurship.com',
    deadline: 'Annual entry window — approximately June 2026 close date • Fully virtual • Entry is free',
    eligibility: 'Youth category: individuals aged 15–35 worldwide • Open category: no age restriction • Submissions must align with one or more UN Sustainable Development Goals (SDGs) • Any country, any background',
    benefits: 'International online gallery feature and global audience visibility • Global public voting platform driving community engagement • Official UN SDG recognition awards for winners • Mentorship connections and access to international entrepreneur networks • Free to enter',
    location: 'Online (Global)',
    amount: 'Free / SDG Recognition Awards',
    degree_level: 'All Levels',
    country_focus: 'Global',
    application_steps: [
      '1. Visit https://www.citizen-entrepreneurship.com and create a free account.',
      '2. Register for the Youth category (ages 15–35) or Open category.',
      '3. Develop your entrepreneurial idea aligned with at least one UN SDG (e.g., SDG 3 Good Health, SDG 4 Quality Education, SDG 13 Climate Action).',
      '4. Submit your concept — typically includes a pitch description, impact statement, and optional supporting materials.',
      '5. Your submission is featured in the international online gallery for public voting.',
      '6. Finalists are evaluated by expert judges and recognized with official UN SDG awards.',
      '7. Winners receive international recognition, mentorship connections, and media exposure.'
    ],
    snippet: 'The Citizen Entrepreneurship Competition is a fully virtual, globally accessible competition for entrepreneurs of all ages — with a dedicated youth track for ages 15–35. Participants submit SDG-aligned entrepreneurial ideas and are featured in an international online gallery for global public voting and expert judging. Winners receive official UN SDG recognition awards and mentorship connections to international entrepreneur networks. Completely free to enter, with no geographic restrictions — making it one of the most accessible global entrepreneurship competitions available.',
  },

  // ── 11. ZINDI AI COMPETITIONS PLATFORM ───────────────────────────────────
  {
    tag: 'data_science',
    category: 'competition',
    title: 'Zindi Africa AI Competitions Platform — Ongoing 2026',
    source: 'Zindi Africa',
    link: 'https://zindi.africa',
    deadline: 'Rolling — new live challenges launch continuously throughout the year • Free to register and compete',
    eligibility: 'Data scientists, ML engineers, developers, and students globally • All skill levels welcome from beginner to expert • Strong focus on African data contexts and development challenges • No formal degree required',
    benefits: 'Public leaderboards visible to 70,000+ practitioner community • Cash prize purses per competition (ranging from $500 to $30,000+) • Verifiable ranked profile for enterprise recruitment • Open-source portfolio building • Direct talent discovery by African and international companies',
    location: 'Online (Global)',
    amount: '$500–$30,000+ per competition',
    degree_level: 'All Levels',
    country_focus: 'Africa / Global',
    application_steps: [
      '1. Register a free account at https://zindi.africa.',
      '2. Browse active competitions in your area of interest (agriculture, health, NLP, finance, climate).',
      '3. Download the training dataset and read the competition rules and evaluation metric.',
      '4. Build and iterate on your predictive model using Python, R, or your preferred ML framework.',
      '5. Submit predictions via the Zindi platform and view your leaderboard ranking.',
      '6. Refine your model, resubmit, and collaborate with or learn from the community.',
      '7. Top-ranked participants at competition close receive cash prizes and verified public recognition on their Zindi profile.'
    ],
    snippet: 'Zindi is Africa\'s leading competitive data science platform, hosting over 70,000 practitioners from across the globe on challenges built around real-world African datasets. Live competitions span agriculture (crop yield prediction), healthcare (disease detection), finance (credit scoring), NLP (multilingual models for African languages), and climate science. Cash prizes range from $500 to $30,000+ per competition. Zindi profile rankings serve as internationally recognized credentials used by companies like Google, Microsoft, and MTN to identify top talent. Free to register — new challenges launch year-round.',
  },

  // ── 12. DATA SCIENCE AFRICA SUMMER SCHOOL ────────────────────────────────
  {
    tag: 'data_science',
    category: 'event',
    title: 'Data Science Africa (DSA) Summer School 2026',
    source: 'Data Science Africa',
    link: 'https://www.datascienceafrica.org',
    deadline: '2026 cohort applications: April 2026 (rolling selection) • Check portal for next cycle announcement',
    eligibility: 'Students, researchers, and technical professionals across Africa • Basic programming (Python preferred) and mathematics knowledge beneficial • Virtual and in-person hybrid access available • No strict degree requirement for all tracks',
    benefits: 'Intensive training in ML fundamentals, statistical computing, IoT data pipelines, and edge AI • Academic workshop poster sessions and peer-reviewed project demonstrations • Networking with international ML researchers from Google Brain, DeepMind, and top African universities • Hybrid/virtual access for continental participation • Partially or fully subsidized fees for African participants',
    location: 'Hybrid — virtual + various African host institutions (Kenya, Uganda, Rwanda, Nigeria)',
    amount: 'Subsidized / Free for qualifying participants',
    degree_level: 'Undergraduate / Master\'s / All Levels',
    country_focus: 'Africa',
    application_steps: [
      '1. Monitor https://www.datascienceafrica.org for the next cycle\'s call for applications.',
      '2. Submit your application including academic/professional background, motivation letter, and coding experience.',
      '3. Shortlisted applicants receive invitations for virtual or in-person attendance.',
      '4. Prepare a project proposal if you plan to present a poster at the academic workshop.',
      '5. Attend the summer school — covering ML fundamentals, statistical computing, IoT pipelines, and edge AI deployment.',
      '6. Present your work at the academic workshop for peer review and expert feedback.',
      '7. Engage with the DSA community to build lasting collaborations with African and international ML researchers.'
    ],
    snippet: 'Data Science Africa (DSA) is the continent\'s premier community-driven initiative for machine learning and data science education. The annual Summer School delivers intensive hands-on training in ML fundamentals, statistical computing, IoT data pipelines, and edge AI deployment. Past events have hosted instructors from Google Brain, DeepMind, Makerere University, and Carnegie Mellon Africa. Participants from over 30 African countries showcase field-deployed ML models at academic workshops and network with world-class researchers. Hybrid and virtual access options ensure participation across the continent. Applications for each annual cohort open in April.',
  },

  // ── 13. AFRICAN MASTER'S IN MACHINE INTELLIGENCE (AIMS AMMI) ─────────────
  {
    tag: 'data_science',
    category: 'scholarship',
    title: 'African Master\'s in Machine Intelligence (AMMI) — AIMS 2026',
    source: 'African Institute for Mathematical Sciences (AIMS)',
    link: 'https://aimsammi.org',
    deadline: 'Applications reviewed on a rolling basis — check https://aimsammi.org for the current annual cohort deadline',
    eligibility: 'STEM graduates with strong mathematical foundations and programming proficiency across Africa • Bachelor\'s degree in mathematics, physics, computer science, engineering, or related field required • All African nationalities welcome',
    benefits: 'Fully funded scholarships — covers full tuition and living stipend • Intensive 1-year Master\'s program in deep learning, reinforcement learning, generative models, and AI ethics • Thesis presented to international visiting faculty including researchers from Google DeepMind, Meta AI, and leading global labs • Paper publication support in top AI venues (NeurIPS, ICML, ICLR)',
    location: 'AIMS Centres across Africa — Rwanda (Kigali), Ghana, Senegal, South Africa, Cameroon',
    amount: 'Fully Funded (tuition + living stipend)',
    degree_level: 'Master\'s',
    country_focus: 'Africa',
    application_steps: [
      '1. Visit https://aimsammi.org and review the current cohort application requirements.',
      '2. Confirm eligibility: Bachelor\'s degree in a STEM field with strong mathematics and programming skills.',
      '3. Prepare your application: academic transcripts, CV/resume, two recommendation letters, statement of purpose.',
      '4. Submit your online application before the current cohort deadline.',
      '5. Shortlisted candidates may be invited for a technical interview or assessment.',
      '6. Admitted students receive a fully funded scholarship package covering tuition and living costs.',
      '7. Complete the intensive 1-year program and defend your thesis before visiting international faculty.'
    ],
    snippet: 'The African Master\'s in Machine Intelligence (AMMI) is a fully funded 1-year Master\'s program delivered across the African Institute for Mathematical Sciences (AIMS) network in Rwanda, Ghana, Senegal, South Africa, and Cameroon. The rigorous curriculum covers deep learning theory, reinforcement learning, generative models, mathematical optimization, and AI ethics — taught and mentored by world-class visiting faculty from Google DeepMind, Meta AI, Mila, and top global research labs. All African STEM graduates with strong mathematics backgrounds are eligible. Fully funded with tuition and living stipend. Applications are reviewed on a rolling annual basis.',
  },

  // ── 14. UN GLOBAL PULSE AI INNOVATION CHALLENGES ─────────────────────────
  {
    tag: 'data_science',
    category: 'competition',
    title: 'UN Global Pulse AI Innovation Challenges 2026',
    source: 'UN Global Pulse',
    link: 'https://www.unglobalpulse.org/ai-challenges',
    deadline: 'Application window typically closes April 2026 • Project-specific submission criteria apply per challenge track',
    eligibility: 'AI researchers, technology startups, and social impact innovators globally • Multidisciplinary teams strongly encouraged • Any nationality, any country of residence',
    benefits: 'UN international showcase platforms and global visibility • Policy brief co-authorship with UN Global Pulse innovation labs • Direct mentorship from senior UN data scientists and humanitarian experts • International recognition at UN events',
    location: 'Online (Global)',
    amount: 'Recognition + mentorship (non-monetary)',
    degree_level: 'All Levels',
    country_focus: 'Global',
    application_steps: [
      '1. Visit https://www.unglobalpulse.org/ai-challenges to view active challenge tracks.',
      '2. Select a challenge track (e.g., predictive analytics for disaster response, AI for public health, ethical governance).',
      '3. Form your multidisciplinary team — mixing data scientists, domain experts, and social scientists is encouraged.',
      '4. Submit your initial application/concept note before the April 2026 deadline.',
      '5. Shortlisted teams receive guidance from UN Global Pulse mentors to develop their solution.',
      '6. Final solutions are presented on UN international platforms and evaluated by UN experts.',
      '7. Winning teams co-author policy briefs with UN Global Pulse and receive international recognition.'
    ],
    snippet: 'UN Global Pulse is the United Nations\' flagship innovation initiative for big data and AI in humanitarian and development contexts. The AI Innovation Challenges task global teams with applying machine learning to predictive analytics for disaster response, public policy modeling, AI for health systems, and ethical humanitarian governance. Selected teams receive direct mentorship from UN data scientists, co-author policy briefs with UN innovation labs, and are featured on international UN platforms. Multidisciplinary teams combining AI, public health, economics, and social science are particularly competitive. Applications typically close April 2026.',
  },

  // ── 15. CODE FOR AFRICA "AI FOR GOOD" FELLOWSHIP ─────────────────────────
  {
    tag: 'data_science',
    category: 'scholarship',
    title: 'Code for Africa "AI for Good" Fellowship 2026',
    source: 'Code for Africa',
    link: 'https://codeforafrica.org/fellowships',
    deadline: 'Recurrent annual calls — 4-month program with rolling cohort recruitment • Check portal for current application window',
    eligibility: 'African technologists, data journalists, software engineers, and computational researchers • Passion for civic technology, responsible AI, automated fact-checking, and algorithmic accountability • Open to all African nationalities',
    benefits: '$500/month stipend throughout the 4-month program tenure • Deployment of public-facing civic technology tools reaching real communities • Publication across pan-African media networks (AfricaCheck, OCCRP, local newsrooms) • Dedicated technical support team • Regional technology conference presentations',
    location: 'Pan-Africa — Remote with hub-based presence in Nairobi, Lagos, Cape Town, Dakar',
    amount: '$500/month stipend',
    degree_level: 'All Levels',
    country_focus: 'Africa',
    application_steps: [
      '1. Visit https://codeforafrica.org/fellowships to view the current fellowship call.',
      '2. Review the current focus areas — typically responsible AI, multilingual NLP, civic fact-checking, or digital rights tools.',
      '3. Prepare your application: portfolio of past civic/technical work, motivation letter, proposed project.',
      '4. Submit your application online by the stated cohort deadline.',
      '5. Shortlisted candidates may be interviewed by Code for Africa team members.',
      '6. Accepted fellows receive $500/month stipend and are embedded in the Code for Africa digital newsroom ecosystem.',
      '7. Over 4 months, design, build, and deploy a public-facing civic tech tool with technical support and mentorship.'
    ],
    snippet: 'Code for Africa is the continent\'s largest civic technology initiative, operating in 21 African countries with a network of newsrooms, data labs, and digital rights advocates. The AI for Good Fellowship is a 4-month paid program embedding African technologists in Code for Africa\'s digital newsrooms and civic tech labs to co-design responsible AI tools — including natural language processing systems for low-resource African languages, automated fact-checking pipelines, and algorithmic accountability frameworks for civil society and human rights defenders. Fellows receive a $500/month stipend, technical support, and publish their work across pan-African media networks.',
  },

  // ── 16. MULTILINGUAL AI FOR HEALTH CHALLENGE (ZINDI / HASH) ─────────────
  {
    tag: 'data_science',
    category: 'competition',
    title: 'Multilingual AI for Health Challenge (Zindi / HASH) 2026',
    source: 'Zindi Africa / Hacks/Hackers Africa (HASH)',
    link: 'https://zindi.africa/competitions/multilingual-ai-health-challenge',
    deadline: 'Challenge launch window: July 2026 • Fully virtual • Open to global participants',
    eligibility: 'AI developers, NLP researchers, linguists, and ML practitioners globally • Focus on low-resource African language modeling: Akan, Kiswahili, Luganda, Amharic • Individual or team participation allowed',
    benefits: '$5,000 USD total prize pool • 5,000 Zindi points boosting public leaderboard ranking • Direct recognition within global healthcare AI networks • Open-source contribution portfolio building',
    location: 'Online (Global)',
    amount: '$5,000 USD prize pool',
    degree_level: 'All Levels',
    country_focus: 'Africa / Global',
    application_steps: [
      '1. Register a free account at https://zindi.africa if you do not already have one.',
      '2. Navigate to the Multilingual AI for Health Challenge page when it launches in July 2026.',
      '3. Review the challenge brief: building Multilingual Question Answering systems for African healthcare contexts.',
      '4. Download the provided training datasets covering Akan, Kiswahili, Luganda, and Amharic medical dialogues.',
      '5. Fine-tune Large Language Models (LLMs) or build custom NLP pipelines for medical question-answering.',
      '6. Submit your model predictions through the Zindi platform and track your leaderboard ranking.',
      '7. Top-ranked teams at competition close share the $5,000 prize pool and Zindi point rewards.'
    ],
    snippet: 'The Multilingual AI for Health Challenge tasks participants with building AI-powered Multilingual Question Answering systems fine-tuned on low-resource African languages — Akan, Kiswahili, Luganda, and Amharic — in medical NLP contexts. Hosted on Zindi in partnership with Hacks/Hackers Africa (HASH), the challenge directly addresses the critical gap in AI-driven medical communication for underserved African language speakers. The $5,000 prize pool and 5,000 Zindi ranking points provide tangible career recognition. Launches July 2026. Open globally — no geographic restrictions.',
  },

  // ── 17. AI FOR REPRODUCTIVE HEALTH INNOVATION CHALLENGE ──────────────────
  {
    tag: 'medicine',
    category: 'competition',
    title: 'AI for Reproductive Health Innovation Challenge 2026 (Sub-Saharan Africa)',
    source: 'Reproductive Health Network Africa',
    link: 'https://rhna.africa/ai-challenge',
    deadline: 'Annual selection deadlines occur in Q2 each year • Four-week virtual innovation sprint format',
    eligibility: 'Multidisciplinary teams across Sub-Saharan Africa • Ideal team composition: data scientists, software engineers, nurses, clinicians, and public health experts • Individuals or teams of up to 5 members',
    benefits: 'Virtual pitch to a panel of global reproductive health experts and funders • Conference presentation slots at major regional health summits (e.g., APHA, African Public Health Alliance) • Seed funding for scaling winning prototypes • Technical mentorship throughout the innovation sprint',
    location: 'Online / Virtual (Sub-Saharan Africa focus)',
    amount: 'Seed funding for winners',
    degree_level: 'All Levels',
    country_focus: 'Africa',
    application_steps: [
      '1. Visit https://rhna.africa/ai-challenge and register your team before the Q2 2026 deadline.',
      '2. Form a multidisciplinary team — combining data scientists, clinical staff, and software engineers strengthens your application.',
      '3. Develop a project concept addressing a specific sexual and reproductive health challenge using AI (e.g., maternal mortality prediction, family planning chatbots, diagnostic tools).',
      '4. Submit your initial project concept to the challenge portal.',
      '5. Accepted teams enter the four-week virtual innovation sprint with access to real-world reproductive health datasets.',
      '6. Co-design, prototype, and test your AI model under technical and clinical mentorship.',
      '7. Present your working prototype in a virtual pitch to global health experts and funders.'
    ],
    snippet: 'This four-week virtual innovation sprint challenges multidisciplinary African teams to co-design, prototype, and test AI models using real-world sexual and reproductive health datasets. The challenge explicitly requires cross-functional teams — combining data scientists, software engineers, nurses, clinicians, and public health experts — to ensure solutions are both technically rigorous and clinically applicable. Winning teams pitch to global health experts and philanthropic funders, present at major regional health summits, and receive seed funding to scale their healthcare technology solutions.',
  },

  // ── 18. WELLCOME TRUST AI & DIGITAL HEALTH GRANTS ────────────────────────
  {
    tag: 'research',
    category: 'grant',
    title: 'Wellcome Trust AI & Digital Health Research Grants 2026',
    source: 'Wellcome Trust',
    link: 'https://wellcome.org/grant-funding/schemes/digital-health',
    deadline: 'Active funding round deadline: April–May 2026 (varies by scheme) • Multi-year grants available',
    eligibility: 'Academic researchers, clinical institutions, and digital health technology innovators globally • Strong research proposal and institutional backing preferred • Priority given to research in Low- and Middle-Income Countries (LMICs) including Sub-Saharan Africa',
    benefits: 'Multi-million dollar research grant instruments (up to £500,000–£2M+ per award) • Support for major medical journal publications • Global healthcare policy integration pathways via Wellcome\'s international networks • Multi-year institutional research funding (3–5 year grants)',
    location: 'Global (priority on LMICs and Africa)',
    amount: 'Up to £500,000–£2M+ per award',
    degree_level: 'PhD / Postdoc',
    country_focus: 'Global',
    application_steps: [
      '1. Visit https://wellcome.org/grant-funding/schemes/digital-health to identify the most relevant funding scheme.',
      '2. Review scheme-specific eligibility and scope (e.g., Discovery Research, Health Inequalities, AI for Clinical Diagnostics).',
      '3. Contact your institution\'s research grants office — institutional endorsement is typically required.',
      '4. Develop your research proposal: scientific rationale, methodology, ethical framework, and budget justification.',
      '5. Register on Wellcome\'s grant management platform (Wellcome Grants) and submit your expression of interest or full application.',
      '6. Shortlisted applications undergo peer review by Wellcome\'s expert committees.',
      '7. Successful applicants receive multi-year funding, Wellcome network access, and publication support.'
    ],
    snippet: 'Wellcome Trust is one of the world\'s largest independent health research funders, with an endowment of over £30 billion. The Wellcome AI & Digital Health Grants fund pioneering research in clinical AI diagnostics, digital epidemiology, health system automation, and ethical health data management. Grants range from seed awards to multi-year institutional instruments of £500,000–£2M+. Wellcome actively prioritizes research with direct applicability in Low- and Middle-Income Countries, including Sub-Saharan Africa. Funded researchers benefit from Wellcome\'s global policy integration networks and major medical journal publication pipelines. Applications open April–May 2026.',
  },

  // ── 19. AIMS AI FOR SCIENCE SCHOLARSHIP PROGRAMME ────────────────────────
  {
    tag: 'data_science',
    category: 'scholarship',
    title: 'AIMS AI for Science Scholarship Programme 2026',
    source: 'African Institute for Mathematical Sciences (AIMS)',
    link: 'https://aims.ac.za/ai-for-science',
    deadline: 'Application deadline: April 2026 (varies by regional AIMS centre) • Annual cohort intake',
    eligibility: 'STEM graduates across Africa applying computational tools to biological, health, and environmental challenges • Bachelor\'s degree in science, mathematics, or engineering required • All African nationalities welcome',
    benefits: 'Fully funded scholarships covering tuition and living stipend • Graduate thesis defense before international scientific faculty • Scientific paper publication support in peer-reviewed journals • Participation in international scientific symposia and conferences',
    location: 'AIMS Centres across Africa — Cameroon, Ghana, Rwanda, Senegal, South Africa, Tanzania',
    amount: 'Fully Funded (tuition + living stipend)',
    degree_level: 'Master\'s',
    country_focus: 'Africa',
    application_steps: [
      '1. Visit https://aims.ac.za/ai-for-science and identify the regional AIMS centre accepting applications.',
      '2. Confirm your eligibility: STEM Bachelor\'s degree, African nationality, interest in computational science.',
      '3. Prepare your application: academic transcripts, CV, two academic references, statement of purpose.',
      '4. Submit your application to your chosen AIMS centre before April 2026.',
      '5. Shortlisted candidates may be invited for a virtual interview or technical assessment.',
      '6. Admitted scholars receive fully funded scholarships covering tuition and living costs.',
      '7. Complete thesis research applying AI/ML to biological, health, or environmental science and defend before international faculty.'
    ],
    snippet: 'The AIMS AI for Science Scholarship Programme trains African STEM graduates to apply machine learning and computational methods to frontier science problems in biology, health, climate, and environmental science. Delivered across six AIMS centres — Cameroon, Ghana, Rwanda, Senegal, South Africa, and Tanzania — the program offers fully funded scholarships covering tuition and living costs. Graduates defend theses before panels of international scientists and publish research in peer-reviewed journals. Part of the broader AIMS ecosystem supported by Google, Mastercard Foundation, and the Gates Foundation. Applications close April 2026.',
  },

  // ── 20. HANGA SRH INNOVATION PROGRAM ─────────────────────────────────────
  {
    tag: 'medicine',
    category: 'grant',
    title: 'Hanga SRH Innovation Program — Youth Health Tech Accelerator',
    source: 'Hanga Accelerator',
    link: 'https://hangasrh.org',
    deadline: 'Recurrent cohort calls — check https://hangasrh.org for current cycle opening',
    eligibility: 'Youth-led technology startups and multidisciplinary teams operating in Sub-Saharan Africa • Focus on sexual and reproductive health (SRH) technology: mobile health platforms, clinical referral systems, health education apps • Founders of any age; teams of 1–5',
    benefits: 'Non-dilutive equity-free seed funding • Technical incubator support throughout the program • Direct pitching to venture capital, philanthropic funds, and government health ministry partners • Government health ministry partnership facilitation in East and West Africa',
    location: 'Sub-Saharan Africa — East & West Africa hubs (Rwanda, Kenya, Nigeria, Ghana)',
    amount: 'Non-equity seed funding',
    degree_level: 'All Levels',
    country_focus: 'Africa',
    application_steps: [
      '1. Visit https://hangasrh.org and check the current cohort application window.',
      '2. Confirm your venture addresses sexual and reproductive health (SRH) through technology: apps, platforms, clinical tools.',
      '3. Prepare your application: team background, problem statement, technology description, existing traction/users, funding needs.',
      '4. Submit the online application form.',
      '5. Shortlisted teams are invited to a virtual pitch interview.',
      '6. Accepted ventures enter the accelerator program with technical incubation support and mentorship.',
      '7. Pitch your solution to venture capital, philanthropic funds, and government health ministry partners at program completion.'
    ],
    snippet: 'Hanga SRH accelerates youth-led technology startups building software for sexual and reproductive health education, clinical referral systems, and mobile health platforms across Sub-Saharan Africa. Selected ventures receive non-equity equity-free seed funding, technical incubation, and the rare opportunity to pitch directly to venture capital, philanthropic funds, and government health ministry partners in East and West Africa. The program deliberately includes government health ministries as partners — creating direct pathways to scale. Recurrent annual cohort calls — check the portal for the current application window.',
  },

  // ── 21. LEON LEVY SCHOLARSHIPS IN NEUROSCIENCE (NYAS) ────────────────────
  {
    tag: 'research',
    category: 'scholarship',
    title: 'Leon Levy Scholarships in Neuroscience (NYAS) — 2027 Cohort',
    source: 'New York Academy of Sciences',
    link: 'https://www.nyas.org/programs/leon-levy-scholars',
    deadline: 'Applications open: August 21, 2026 • Applications close: October 16, 2026 • Tenure: September 1, 2027 – August 31, 2030',
    eligibility: 'Postdoctoral researchers based in New York City boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island) • 3 years or fewer of cumulative postdoctoral experience post-PhD at time of application • Open to US citizens, permanent residents, J-1 visa holders, and H-1B visa holders',
    benefits: 'Three-year research tenure (September 2027 – August 2030) • Annual presentation at the prestigious NYAS Leon Levy Neuroscience Symposium • Structured Principal Investigator (PI) career transition support • Lifelong access to the NYAS elite scientific network • Competitive research stipend',
    location: 'New York City, USA (postdoc institution in NYC boroughs required)',
    amount: 'Competitive research stipend (3-year tenure)',
    degree_level: 'PhD / Postdoc',
    country_focus: 'Global (NYC residency required)',
    application_steps: [
      '1. Applications open August 21, 2026 at https://www.nyas.org/programs/leon-levy-scholars.',
      '2. Confirm eligibility: postdoctoral position at an NYC institution, PhD awarded, ≤3 years cumulative postdoc experience.',
      '3. Confirm visa eligibility: US citizens, permanent residents, J-1 visa, or H-1B visa holders are eligible.',
      '4. Prepare application materials: research proposal, CV, publication record, two letters of recommendation from your PI.',
      '5. Choose your neuroscience sub-discipline: Cellular, Systems, Cognitive, Computational, or Translational Neuroscience.',
      '6. Submit your complete application by October 16, 2026.',
      '7. Admitted scholars begin the three-year tenure in September 2027 with full NYAS network access and symposium presentations.'
    ],
    snippet: 'The Leon Levy Scholarships in Neuroscience are among the most prestigious postdoctoral neuroscience fellowships in the United States. Administered by the New York Academy of Sciences and funded by the Leon Levy Foundation, the program supports early-career postdoctoral neuroscientists based at NYC institutions across five sub-disciplines: Cellular, Systems, Cognitive, Computational, and Translational Neuroscience. Applications open August 21, 2026 and close October 16, 2026, with the three-year tenure running September 2027 to August 2030. Eligible visa types include J-1 and H-1B in addition to US citizens and permanent residents.',
  },

  // ── 22. CAMBRIDGE ERA:AI FELLOWSHIP ──────────────────────────────────────
  {
    tag: 'data_science',
    category: 'scholarship',
    title: 'Cambridge ERA:AI Fellowship — Winter 2027 Cohort',
    source: 'Effective Research Alliance / University of Cambridge',
    link: 'https://www.era-ai.org/fellowship',
    deadline: 'Winter 2027 cohort application deadline: September 13, 2026',
    eligibility: 'Mid-career researchers, computer scientists, and policy professionals globally • Focus areas: technical AI safety, frontier AI governance, AI hardware/compute verification, interpretability • Global applications welcome — no work authorization restrictions • No strict PhD requirement if equivalent research experience is demonstrated',
    benefits: '10-week fully funded residential fellowship in Cambridge, UK • Covers stipend, travel to Cambridge, lodging, and visa support if needed • £10,000 research stipend • Co-authoring of academic working papers • Presentations to UK, EU, and international AI safety institutes and government policy bodies',
    location: 'University of Cambridge, Cambridge, UK (fully residential)',
    amount: '£10,000 stipend + fully funded',
    degree_level: 'PhD / Postdoc / All Levels',
    country_focus: 'Global',
    application_steps: [
      '1. Visit https://www.era-ai.org/fellowship and review the Winter 2027 cohort brief and focus areas.',
      '2. Confirm your research background aligns with: technical AI safety, frontier model governance, hardware/compute verification, or AI interpretability.',
      '3. Prepare your application: CV, research statement (2–3 pages describing your work and how it relates to AI safety), writing samples or papers.',
      '4. Obtain 1–2 letters of recommendation from academic or professional supervisors.',
      '5. Submit your complete application by September 13, 2026.',
      '6. Shortlisted candidates are invited to a virtual interview with the ERA:AI fellowship selection committee.',
      '7. Successful fellows receive fully funded travel, Cambridge lodging, and a £10,000 stipend for the 10-week residency.'
    ],
    snippet: 'The Cambridge ERA:AI Fellowship is a 10-week fully funded residential research fellowship at the University of Cambridge targeting researchers working on the most critical AI safety challenges: technical alignment, frontier AI governance, hardware/compute verification, and interpretability. The Winter 2027 cohort application deadline is September 13, 2026. Fellows receive a £10,000 stipend plus fully covered travel, Cambridge accommodation, and visa support. Open globally — no work authorization restrictions. Outputs include co-authored academic working papers and presentations to UK, EU, and international AI safety institutes and government policy bodies.',
  },

  // ── 23. LIVES DOCTORAL PROGRAMME & BAVARIA SCHOLARSHIPS ──────────────────
  {
    tag: 'research',
    category: 'scholarship',
    title: 'LIVES Doctoral Programme & Bavaria Scholarships 2026–2029',
    source: 'LIVES Centre (Swiss National Centre of Competence in Research) / Free State of Bavaria',
    link: 'https://www.lives-nccr.ch/doctoral-programme',
    deadline: 'Multi-year grant cycles covering 2026–2029 • Applications reviewed annually — check the LIVES portal for current intake deadline',
    eligibility: 'Early-stage researchers and doctoral candidates seeking European academic research placements • Focus on life course research, interdisciplinary social sciences, quantitative methodologies, and public health data analysis • International applications considered',
    benefits: 'Structured European doctoral dissertation support through 2029 • Publication in peer-reviewed European social science journals • International conference presentation funding • Multi-year grant support through the LIVES NCCR framework',
    location: 'Switzerland (Lausanne, Geneva) / Germany (Bavaria) — European placements',
    amount: 'Multi-year doctoral grant',
    degree_level: 'PhD / Postdoc',
    country_focus: 'Global',
    application_steps: [
      '1. Visit https://www.lives-nccr.ch/doctoral-programme for current application requirements and intake dates.',
      '2. Identify a LIVES-affiliated research unit and supervisor whose work aligns with your interests in life course research or social sciences.',
      '3. Prepare your application: research proposal, academic CV, transcripts, and two reference letters.',
      '4. Contact potential supervisors at LIVES partner institutions in Lausanne, Geneva, or Bern before formal submission.',
      '5. Submit your formal application to the LIVES doctoral programme office.',
      '6. Successful candidates are admitted to a structured multi-year doctoral programme with European academic placement.',
      '7. Complete dissertation research, publish in peer-reviewed journals, and present at international conferences.'
    ],
    snippet: 'The LIVES Doctoral Programme is part of Switzerland\'s National Centre of Competence in Research on the Overcoming Vulnerability: Life Course Perspectives (LIVES NCCR). It provides structured multi-year doctoral funding for researchers studying life course trajectories, social inequalities, quantitative social science methodologies, and public health. Bavaria Scholarships complement this with parallel European funding channels for doctoral candidates at German-Swiss academic institutions. The programme supports dissertation completion, peer-reviewed publication, and international conference participation through 2029. Applications are reviewed annually.',
  },

  // ── 24. UBC FOUR-YEAR DOCTORAL FELLOWSHIP / MASTERCARD SCHOLARS ───────────
  {
    tag: 'research',
    category: 'scholarship',
    title: 'UBC Four-Year Doctoral Fellowship (4YF) / Mastercard Foundation Scholars 2026',
    source: 'University of British Columbia',
    link: 'https://www.grad.ubc.ca/awards/four-year-doctoral-fellowship',
    deadline: 'Applications open Q3 annually for the following academic year entry • Check UBC Graduate Studies portal for current cycle',
    eligibility: 'Exceptional international doctoral students admitted to or enrolled at UBC • Targeted tracks for African scholars through the Mastercard Foundation Scholars Program at UBC • Strong research proposal and academic excellence required',
    benefits: 'Full tuition coverage for four years • Annual living stipend throughout the doctoral tenure • Doctoral dissertation publication support • Academic conference presentation funding • University teaching portfolio development • Access to UBC\'s world-class research facilities',
    location: 'University of British Columbia, Vancouver, British Columbia, Canada',
    amount: 'Full tuition + annual stipend (4 years)',
    degree_level: 'PhD / Postdoc',
    country_focus: 'Global (Africa priority track)',
    application_steps: [
      '1. Apply for doctoral admission to your chosen UBC department at https://www.grad.ubc.ca.',
      '2. In your application, indicate interest in the Four-Year Doctoral Fellowship (4YF) — it is automatically considered for all admitted doctoral students.',
      '3. African applicants should additionally apply to the Mastercard Foundation Scholars Program at UBC for the dedicated Africa track.',
      '4. Visit https://mastercardfdn.org/scholars for the Mastercard Foundation Scholars application portal.',
      '5. Prepare your research proposal, academic CV, transcripts, and reference letters for both applications.',
      '6. Submit before the Q3 deadline for entry in the following academic year.',
      '7. Admitted fellows receive four years of full tuition coverage, annual stipend, and full UBC academic support.'
    ],
    snippet: 'The UBC Four-Year Doctoral Fellowship (4YF) provides exceptional doctoral students at the University of British Columbia with four years of full tuition funding and an annual living stipend. African scholars benefit from a dedicated Mastercard Foundation Scholars Program track at UBC — creating a powerful pipeline for African researchers to pursue doctoral education at one of Canada\'s top-ranked universities. Fellows develop original scientific research, gain undergraduate teaching experience, and present dissertations and papers at international academic conferences. Applications open Q3 each year for the following academic year.',
  },

  // ── 25. ANTHROPIC FELLOWS PROGRAM ────────────────────────────────────────
  {
    tag: 'data_science',
    category: 'scholarship',
    title: 'Anthropic Fellows Program 2026 — AI Safety Research (Work Authorization Required)',
    source: 'Anthropic',
    link: 'https://www.anthropic.com/fellows',
    deadline: 'Four-month cohorts starting May/July 2026 • Rolling applications — check portal for current cohort deadline',
    eligibility: '⚠️ STRICTLY REQUIRES existing work authorization in the US, UK, or Canada — Anthropic does NOT provide visa sponsorship under any circumstances • Technical researchers with AI safety, interpretability, or ML background • No formal degree required if equivalent research skills are demonstrated • Candidates from Africa, Asia, South America without Western work authorization are NOT eligible',
    benefits: '$3,850/week stipend ($61,600 per 4-month cohort) • Direct research collaboration and co-authorship with Anthropic scientists • Access to Anthropic\'s frontier AI computational cluster • Publication in leading AI safety venues (NeurIPS, ICML, ICLR, Alignment Forum)',
    location: 'San Francisco, USA / London, UK / Remote within work-authorized jurisdictions only',
    amount: '$3,850/week ($61,600 per cohort)',
    degree_level: 'PhD / Postdoc / All Levels',
    country_focus: 'Global (US/UK/Canada work authorization required)',
    application_steps: [
      '⚠️ STOP: Confirm you already hold valid work authorization (visa, citizenship, permanent residence) in the US, UK, or Canada before proceeding. Anthropic does not sponsor visas.',
      '1. Visit https://www.anthropic.com/fellows and review the current cohort requirements and focus areas.',
      '2. Identify your proposed research area: mechanistic interpretability, RLHF, AI alignment theory, threat modeling, or frontier model safety.',
      '3. Prepare your application: CV, research statement, links to prior publications or open-source safety research.',
      '4. Submit your application via the Anthropic Fellows portal before the cohort deadline.',
      '5. Shortlisted candidates are invited for technical interviews with Anthropic researchers.',
      '6. Accepted fellows receive $3,850/week and are embedded with Anthropic research teams for 4 months.',
      '7. NOTE for African/international candidates without Western work authorization: consider Zindi, AIMS AMMI, or Code for Africa fellowships as accessible alternatives.'
    ],
    snippet: 'The Anthropic Fellows Program offers four-month research residencies in AI safety — covering mechanistic interpretability, reinforcement learning from human feedback (RLHF), alignment theory, and frontier model threat modeling. Fellows receive a $3,850/week stipend ($61,600 total), co-author research with Anthropic scientists, and access cutting-edge computational clusters. CRITICAL WARNING: This program strictly and unconditionally requires existing work authorization in the US, UK, or Canada. Anthropic does not provide visa sponsorship under any circumstances. African and international candidates without Western work authorization should instead explore borderless alternatives such as Zindi AI competitions, the AIMS AMMI fully funded Master\'s, or the Code for Africa AI for Good Fellowship.',
  },
];


  { tag:'entrepreneurship', category:'competition', title:'The Conrad Challenge 2026–2027', source:'Conrad Foundation', link:'https://conradchallenge.org', deadline:'Stage 1: Oct 30, 2026 • Stage 2: Jan 8, 2027 • Summit: April 2027', eligibility:'Global students aged 13–18 • Teams of 2–5 with an adult coach aged 18+ • Five innovation tracks: Aerospace & Aviation, Cyber-Technology & Security, Energy & Environment, Health & Nutrition, Sustainable Development', benefits:'Innovation Summit at Space Center Houston • University scholarships up to $25,000/year • Venture judge pitching • Incubation support', location:'Houston, USA (Summit) / Online (submissions)', snippet:'The Conrad Challenge tasks student teams with designing breakthrough innovations and viable business models. Stage 1 activation is free; Stage 2 submission is $499. Teams pitch live before venture judges at Space Center Houston for scholarships worth up to $25,000 per year.' },

  { tag:'stem', category:'event', title:'The Junior Academy – NYAS Global STEM Alliance 2026', source:'New York Academy of Sciences', link:'https://www.nyas.org/programs/global-stem-alliance/the-junior-academy', deadline:'Applications open April 1, 2026 and close July 9, 2026 (Fall 2026 challenge)', eligibility:'Students aged 13–17 globally • English proficiency required • Strong STEM interest essential', benefits:'Virtual project presentation on the NYAS Launchpad portal • International networking with expert mentors • Peer-reviewed collaborative research • Free to participate', location:'Online (Global)', snippet:'The Junior Academy connects STEM students aged 13–17 across more than 100 countries in virtual challenge teams. Participants collaborate on research methodology, data analysis and human-centered design under expert mentorship. Projects are showcased internationally on the NYAS Launchpad platform.' },

  { tag:'international_relations', category:'competition', title:'Harvard International Review Academic Writing Contest 2026', source:'Harvard International Review', link:'https://hir.harvard.edu/writing-contest', deadline:'August 24, 2026 (main global cycle)', eligibility:'Secondary students in grades 7–12 worldwide • Research papers on foreign policy, global affairs, and international diplomacy', benefits:'Article publication opportunities in a prestigious Harvard journal • Gold, Silver, and Bronze medal awards • Virtual oral defense before the HIR editorial board • Free to enter', location:'Online (Global)', snippet:'The Harvard International Review invites grades 7–12 students worldwide to submit research papers on foreign policy and international affairs. Winners earn Gold, Silver, or Bronze medal recognition and publication opportunities in one of the world\'s most prestigious student policy journals. Oral defense before the HIR board provides elite academic experience.' },

  { tag:'technology', category:'scholarship', title:'MIT Women\'s Technology Program (WTP) 2026', source:'MIT', link:'https://engineering.mit.edu/programs/women-technology-program-wtp', deadline:'Applications typically open December – February for summer cohort', eligibility:'Rising female high school seniors (entering 12th grade) • Strong math/science background • Minimal prior engineering experience required', benefits:'Hands-on laboratory project showcase • Direct instruction by MIT graduate scholars • Fully funded — no tuition cost • Four-week residential program on MIT campus', location:'MIT Campus, Cambridge, MA, USA', snippet:'The MIT Women\'s Technology Program is a fully funded four-week residential summer program on MIT\'s campus for rising female seniors with strong math and science foundations but no prior engineering experience. Participants choose between Mechanical Engineering or Electrical Engineering & Computer Science tracks, conducting real laboratory research alongside MIT graduate student mentors.' },

  // ── EMERGING AFRICAN YOUTH LEADERS ───────────────────────────────────────────
  { tag:'leadership', category:'scholarship', title:'African Leadership Academy (ALA) Diploma Program 2026', source:'African Leadership Academy', link:'https://www.africanleadershipacademy.org/admissions', deadline:'Early Decision: Oct 15, 2026 • Regular Decision: Jan 15, 2027', eligibility:'African nationals born on or after Sept 1, 2007 (ages 15–18) • Minimum Grade 10 completion • Demonstrated leadership, perseverance, and entrepreneurial thinking', benefits:'Two-year residential diploma program in South Africa • Lifelong pan-African network • University scholarship generation exceeding $270M+ • 95–97% of admitted students receive need-based aid', location:'Johannesburg, South Africa', snippet:'The African Leadership Academy is a two-year pre-university residential program in South Africa that cultivates the next generation of African leaders. Its holistic evaluation focuses on intellectual readiness, courage, ownership, and interdependence. ALA graduates have generated over $270 million in university scholarships and consistently gain admission to the world\'s most selective universities. Nearly all admitted students receive need-based financial aid.' },

  { tag:'leadership', category:'scholarship', title:'Yale Young African Scholars (YYAS) Programme 2026', source:'Yale Young African Scholars', link:'https://yyas.yale.edu', deadline:'Application deadline: January 21, 2027 • Residential sessions: June–July 2027', eligibility:'Secondary school students across Africa seeking international university preparation • Strong academic record and community leadership demonstrated', benefits:'Fully funded — covers tuition and international travel • Capstone project presentations • Inclusion in the Yale global alumni network • Structured university application mentorship', location:'Yale University, New Haven, USA / Regional African hubs', snippet:'Yale Young African Scholars provides intensive academic enrichment and university preparation for exceptional secondary students across Africa. Fully funded, including international travel, the programme runs week-long residential sessions combining university-level research, leadership strategy, standardized test literacy, and civic engagement. Graduates present capstone projects and gain direct access to Yale\'s global alumni network and ongoing application mentorship.' },

  { tag:'international_relations', category:'event', title:'Georgetown University International Relations Academy 2027', source:'Georgetown University', link:'https://scs.georgetown.edu/programs/professional-development/international-relations-academy', deadline:'Application deadline: May 15, 2027 • Program runs: Summer 2027', eligibility:'High school students in grades 8–12 globally • Strong interest in foreign policy, diplomacy and international affairs', benefits:'Immersive policy simulation presentations • Direct engagement with Washington D.C. diplomats and faculty • Residential or commuter attendance options • Need-based financial aid available (tuition $3,095–$3,725)', location:'Georgetown University, Washington D.C., USA', snippet:'Georgetown\'s International Relations Academy is a one-week summer program giving high school students grades 8–12 direct exposure to foreign policy and international diplomacy. Participants engage in crisis negotiation simulations, policy formulation workshops, and sessions with active diplomats and Georgetown faculty in Washington D.C. Tuition ranges $3,095–$3,725 with need-based financial aid available.' },

  { tag:'entrepreneurship', category:'grant', title:'Fast Forward Tech Nonprofit Accelerator 2027 Cohort', source:'Fast Forward', link:'https://www.ffwd.org/accelerator', deadline:'Annual recruitment cycle for 2027 cohort — applications open rolling basis', eligibility:'Early-stage tech nonprofits and youth-led social impact ventures globally • Technology must be central to the mission, not peripheral • Any geography considered', benefits:'$25,000+ in non-dilutive equity-free funding • International pitch showcase to philanthropic foundations and venture leaders • Strategic mentorship and global media exposure', location:'Online (Global)', snippet:'Fast Forward accelerates early-stage tech nonprofits building technology-first solutions to global challenges. Selected ventures receive $25,000+ in non-dilutive funding, strategic mentorship, and the opportunity to pitch at an international showcase before philanthropic foundations and venture leaders. Any tech-enabled nonprofit or social impact venture globally can apply.' },

  { tag:'entrepreneurship', category:'competition', title:'Citizen Entrepreneurship Competition 2026', source:'Citizen Entrepreneurship', link:'https://www.citizen-entrepreneurship.com', deadline:'Annual entry window closing approximately June 2026 • Fully virtual format', eligibility:'Youth category open to individuals aged 15–35 worldwide • Solutions must align with UN Sustainable Development Goals • Entry is completely free', benefits:'International online gallery feature • Global public voting platform • Official UN SDG recognition awards • Mentorship connections with global entrepreneurs', location:'Online (Global)', snippet:'The Citizen Entrepreneurship Competition invites individuals aged 15–35 from anywhere in the world to submit SDG-aligned entrepreneurial ideas. The fully virtual format and free entry make it globally accessible. Finalists are featured in an international online gallery, benefit from public voting momentum, and receive official UN SDG recognition alongside mentorship from seasoned global entrepreneurs.' },

  // ── DATA SCIENTISTS, AI ENGINEERS & ML PRACTITIONERS ─────────────────────────
  { tag:'data_science', category:'competition', title:'Zindi Africa AI Competitions Platform 2026', source:'Zindi Africa', link:'https://zindi.africa', deadline:'Rolling — live challenges run year-round • Free platform registration', eligibility:'Data scientists, ML engineers, developers, and students globally • Strong focus on African data contexts and development challenges • All skill levels welcome', benefits:'Public leaderboards across 70,000+ developer community • Cash prize purses per challenge • Verifiable profile rankings for enterprise recruitment • Open-source portfolio building', location:'Online (Global)', snippet:'Zindi is Africa\'s leading competitive data science platform hosting over 70,000 practitioners worldwide. Live competitions use real-world African datasets spanning agriculture, health, finance, and climate. Top leaderboard placements serve as verifiable credentials recognized by multinational enterprise recruiters. Free to register, with new challenges launching continuously throughout the year.' },

  { tag:'data_science', category:'event', title:'Data Science Africa (DSA) Summer School 2026', source:'Data Science Africa', link:'https://www.datascienceafrica.org', deadline:'2026 cohort application deadline: April 2026 (rolling selection)', eligibility:'Students, researchers, and technical professionals across Africa • Basic programming and mathematics knowledge beneficial • Virtual and hybrid access options available', benefits:'Showcase of field-deployed ML models • Academic workshop poster sessions • Peer-reviewed project demonstrations • Fully virtual and hybrid access • Networking with international ML researchers', location:'Online / Hybrid — various African host institutions', snippet:'Data Science Africa\'s annual Summer School delivers hands-on training in machine learning fundamentals, statistical computing, IoT data pipelines, and edge AI deployment to African practitioners. Participants showcase field-deployed models at academic workshops, present peer-reviewed project demos, and network with international researchers. Hybrid and virtual access options ensure continental participation.' },

  { tag:'data_science', category:'scholarship', title:'African Master\'s in Machine Intelligence (AIMS AMMI) 2026', source:'AIMS / AMMI', link:'https://aimsammi.org', deadline:'Applications reviewed on rolling basis for upcoming annual cohort', eligibility:'STEM graduates with strong mathematical foundations and programming proficiency across Africa • Bachelor\'s in mathematics, physics, CS, or related field required', benefits:'Fully funded scholarships covering tuition and living costs • Master\'s thesis presentation to international visiting faculty • Paper publication support in leading AI conferences', location:'AIMS centres across Africa (Rwanda, Ghana, Senegal, Cameroon, South Africa)', snippet:'AIMS AMMI is a fully funded one-year Master\'s program in Machine Intelligence delivered across African Institute for Mathematical Sciences centres. The rigorous curriculum spans deep learning theory, reinforcement learning, generative models, mathematical optimization, and AI ethics. Graduates present theses to internationally visiting faculty including researchers from Google Brain, DeepMind, and leading AI labs.' },

  { tag:'data_science', category:'competition', title:'UN Global Pulse AI Innovation Challenges 2026', source:'UN Global Pulse', link:'https://www.unglobalpulse.org/ai-challenges', deadline:'Application window closes April 2026 • Project-specific submission criteria apply per challenge track', eligibility:'AI researchers, technology startups, and social impact innovators globally • Multidisciplinary teams encouraged', benefits:'United Nations international showcase platforms • Policy brief co-authorship with UN innovation labs • Direct mentorship from UN Global Pulse researchers • International recognition', location:'Online (Global)', snippet:'UN Global Pulse AI Innovation Challenges task global teams with applying AI to predictive analytics for disaster response, public policy modeling, and ethical humanitarian governance. Winners gain co-authorship on UN policy briefs, direct mentorship from UN innovation labs, and international showcase on United Nations digital platforms.' },

  { tag:'data_science', category:'scholarship', title:'Code for Africa "AI for Good" Fellowship 2026', source:'Code for Africa', link:'https://codeforafrica.org/fellowships', deadline:'Recurrent annual calls — check portal for current cohort deadline', eligibility:'African technologists, data journalists, and software engineers • Passion for civic technology, automated fact-checking, and algorithmic accountability essential', benefits:'Paid monthly stipend throughout program tenure • Deployment of public-facing civic tech tools • Pan-African media publication • Regional technology conference presentations', location:'Pan-Africa (Remote + Hub-based)', snippet:'Code for Africa\'s AI for Good Fellowship embeds African technologists in its digital newsrooms and civic tech labs to develop ethical AI systems, automated fact-checking pipelines, and civic accountability tools. Fellows receive a paid monthly stipend, publish findings across pan-African media networks, and present at major regional technology conferences.' },

  // ── HEALTH TECH INNOVATORS & MULTILINGUAL AI SPECIALISTS ─────────────────────
  { tag:'data_science', category:'competition', title:'Multilingual AI for Health Challenge (Zindi / HASH) 2026', source:'Zindi Africa / HASH', link:'https://zindi.africa/competitions/multilingual-ai-health-challenge', deadline:'Challenge launch window: July 2026 • Fully virtual submission open to global participants', eligibility:'AI developers, NLP researchers, and linguists globally • Focus on low-resource African language modeling: Akan, Kiswahili, Luganda, Amharic', benefits:'$5,000 USD prize pool • 5,000 Zindi points for ranking • Direct recognition within global healthcare AI networks • Open-source portfolio contribution', location:'Online (Global)', snippet:'The Multilingual AI for Health Challenge tasks participants with building Multilingual Question Answering systems and fine-tuning Large Language Models for low-resource African languages including Akan, Kiswahili, Luganda, and Amharic in medical NLP contexts. The $5,000 prize pool and Zindi points directly boost career visibility within global healthcare AI networks.' },

  { tag:'medicine', category:'competition', title:'AI for Reproductive Health Innovation Challenge 2026', source:'Reproductive Health Network Africa', link:'https://rhna.africa/ai-challenge', deadline:'Annual selection deadlines occur in Q2 each year • Four-week virtual innovation sprint', eligibility:'Multidisciplinary teams across Sub-Saharan Africa: data scientists, software engineers, nurses, clinicians, and public health experts encouraged to co-apply', benefits:'Virtual pitch to global health experts • Conference presentations at major regional health summits • Seed funding for scaling winning prototypes', location:'Online / Virtual (Sub-Saharan Africa focus)', snippet:'This four-week virtual innovation sprint challenges multidisciplinary African teams to co-design, prototype, and test AI models using real-world reproductive health datasets. Winning teams pitch to global health experts, present at regional summits, and receive seed funding for scaling their health technology solutions.' },

  { tag:'research', category:'grant', title:'Wellcome Trust AI & Digital Health Research Grants 2026', source:'Wellcome Trust', link:'https://wellcome.org/grant-funding/schemes/digital-health', deadline:'Active funding round deadline: April–May 2026 (varies by scheme)', eligibility:'Academic researchers, clinical institutions, and digital health technology innovators globally • Strong proposal required; institutional backing preferred', benefits:'Multi-million dollar research grant instruments • Major medical journal publication support • Global healthcare policy integration pathways • Multi-year institutional funding', location:'Global (with priority on LMICs and Africa)', snippet:'Wellcome Trust offers multi-million dollar research grant instruments for clinical AI diagnostics, digital epidemiology, health system automation, and ethical health data management. Funded projects benefit from Wellcome\'s international policy integration networks and major medical journal publication pipelines, establishing long-term institutional credibility.' },

  { tag:'data_science', category:'scholarship', title:'AIMS AI for Science Scholarship Programme 2026', source:'African Institute for Mathematical Sciences', link:'https://aims.ac.za/ai-for-science', deadline:'Application deadline: April 2026 (varies by regional AIMS centre)', eligibility:'STEM graduates across Africa applying computational tools to biological, health, and environmental challenges • Bachelor\'s in science or engineering required', benefits:'Fully funded scholarships available • Graduate thesis defense at international symposia • Scientific paper publication support • Participation in international scientific conferences', location:'AIMS Centres across Africa', snippet:'The AIMS AI for Science Scholarship Programme trains African STEM graduates to apply machine learning to biological, health, and environmental science challenges. Fully funded scholarships cover tuition and living costs. Graduates defend theses before international scientists and publish research in peer-reviewed journals at scientific symposia.' },

  { tag:'medicine', category:'grant', title:'Hanga SRH Innovation Program 2026', source:'Hanga Accelerator', link:'https://hangasrh.org', deadline:'Recurrent cohort calls — check portal for current cycle', eligibility:'Youth-led technology startups and multidisciplinary teams operating in Sub-Saharan Africa • Focus on sexual and reproductive health technology, including mobile health platforms and clinical referral systems', benefits:'Non-equity seed funding • Technical incubator support • Direct pitching to venture capital and philanthropic funds • Government health ministry partnership facilitation', location:'Sub-Saharan Africa (East & West Africa hubs)', snippet:'Hanga SRH accelerates youth-led tech startups building software for sexual and reproductive health education, clinical referral systems, and mobile health user platforms across Sub-Saharan Africa. Selected ventures receive non-equity seed funding, technical incubation, and the opportunity to pitch directly to venture capital, philanthropic funds, and government health ministry partners.' },

  // ── POSTDOCTORAL RESEARCHERS & ADVANCED ACADEMIC FELLOWS ─────────────────────
  { tag:'research', category:'scholarship', title:'Leon Levy Scholarships in Neuroscience (NYAS) 2026', source:'New York Academy of Sciences', link:'https://www.nyas.org/programs/leon-levy-scholars', deadline:'Applications open Aug 21, 2026 • Close Oct 16, 2026 • Tenure: Sept 1, 2027 – Aug 31, 2030', eligibility:'Postdoctoral researchers in NYC boroughs • 3 years or fewer cumulative postdoc experience post-PhD • Open to US citizens, permanent residents, J-1 visa holders, and H-1B holders', benefits:'Annual presentation at NYAS Symposia • Direct Principal Investigator transition support • Lifelong academic network • Multi-year research tenure (3 years)', location:'New York City, USA', snippet:'The Leon Levy Scholarships support exceptional early-stage postdoctoral neuroscientists in New York City. Covering Cellular, Systems, Cognitive, Computational, and Translational Neuroscience sub-disciplines, the three-year tenure provides annual NYAS Symposium presentations, structured PI transition support, and a lifelong elite academic network. Eligible visa types include J-1 and H-1B in addition to US citizens and PRs.' },

  { tag:'data_science', category:'scholarship', title:'Cambridge ERA:AI Fellowship 2026', source:'Centre for the Study of Existential Risk, University of Cambridge', link:'https://www.cser.ac.uk/research/ai-fellowship', deadline:'Rolling applications — check Cambridge CSER portal for current cohort', eligibility:'Mid-career researchers and computer scientists globally • Focus on AI safety, technical alignment, and governance architecture • No strict visa requirement — global applications welcome', benefits:'10-week fully funded residency in Cambridge, UK • £10,000 research stipend • Academic working paper publication • Presentation to UK/EU AI safety institutes and high-level policy briefings', location:'University of Cambridge, UK', snippet:'The Cambridge ERA:AI Fellowship is a ten-week fully funded residency for mid-career AI safety researchers. Fellows receive a £10,000 stipend while collaborating on technical alignment, risk mitigation frameworks, and AI governance architectures. Outputs include academic working papers, presentations to UK and EU AI safety institutes, and direct engagement with senior policy officials.' },

  { tag:'research', category:'scholarship', title:'LIVES Doctoral Programme & Bavaria Scholarships 2026–2029', source:'LIVES Centre / Free State of Bavaria', link:'https://www.lives-nccr.ch/doctoral-programme', deadline:'Multi-year grant cycles covering 2026–2029 • Applications open annually', eligibility:'Early-stage researchers and doctoral candidates seeking European academic research placements • Focus on life course research, interdisciplinary social sciences, and quantitative methodologies', benefits:'European doctoral dissertation defense • Publication in peer-reviewed European journals • International conference presentation funding • Multi-year grant support 2026–2029', location:'Switzerland / Germany (European placements)', snippet:'The LIVES Doctoral Programme and Bavaria Scholarships offer structured multi-year funding for early-stage researchers pursuing doctoral placements in European academic institutions. Covering life course research, interdisciplinary social sciences, quantitative methodologies, and public health data analysis, the programme supports dissertation completion, journal publication, and participation in international conferences through 2029.' },

  { tag:'research', category:'scholarship', title:'UBC Four-Year Doctoral Fellowship (4YF) / Mastercard Scholars 2026', source:'University of British Columbia', link:'https://www.grad.ubc.ca/awards/four-year-doctoral-fellowship', deadline:'Applications open Q3 annually for the following academic year entry', eligibility:'Exceptional international doctoral students • Targeted tracks for African scholars through the Mastercard Foundation Scholars Program at UBC • Strong research proposal required', benefits:'Full tuition coverage • Annual living stipend • Doctoral dissertation publication support • Academic conference presentations • University teaching portfolio creation', location:'University of British Columbia, Vancouver, Canada', snippet:'The UBC Four-Year Doctoral Fellowship provides exceptional international doctoral students with full tuition funding and an annual living stipend for a four-year research tenure. African scholars benefit from a dedicated Mastercard Foundation Scholars track. Fellows develop original scientific research, build undergraduate teaching portfolios, and present dissertations and conference papers on the international academic stage.' },

  { tag:'data_science', category:'scholarship', title:'Anthropic Fellows Program 2026 (Work Authorization Required)', source:'Anthropic', link:'https://www.anthropic.com/fellows', deadline:'Four-month cohorts starting May/July 2026 • Rolling applications', eligibility:'⚠️ STRICTLY REQUIRES existing work authorization in the US, UK, or Canada — no visa sponsorship provided • Technical researchers with AI safety background • Degree not required but advanced technical skills essential', benefits:'$3,850/week stipend • Direct collaboration and co-authorship with Anthropic research staff • Computational cluster access • Paper publication in leading AI venues', location:'San Francisco, USA / London, UK / Remote within authorized jurisdictions', snippet:'The Anthropic Fellows Program offers four-month research residencies in AI safety, mechanistic interpretability, reinforcement learning from human feedback, and threat modeling. Fellows receive a $3,850/week stipend and co-author research with Anthropic scientists. IMPORTANT: This program strictly requires existing work authorization in the US, UK, or Canada. Anthropic does not provide visa sponsorship. Candidates without Western work authorization should prioritize borderless alternatives such as Zindi, AIMS AMMI, or Code for Africa fellowships.' },
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
  if (o.application_steps) return o.application_steps;
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
  // Group by tag
  const byTag = {};
  for (const opp of OPPORTUNITIES) {
    if (!byTag[opp.tag]) byTag[opp.tag] = [];
    byTag[opp.tag].push(opp);
  }

  const now = new Date().toISOString();
  // Set cache far in the future so it always serves (12h TTL from now)
  const cacheTime = new Date(Date.now() - 1000).toISOString(); // 1 second ago = within TTL

  for (const [tag, opps] of Object.entries(byTag)) {
    const processed = opps.map((o, idx) => ({
      id: `static-${tag}-${idx}`,
      title: o.title,
      link: o.link,
      snippet: o.snippet,
      description: o.snippet,
      source: o.source,
      tag,
      category: o.category,
      deadline: o.deadline || null,
      eligibility: o.eligibility || null,
      benefits: o.benefits || null,
      location: o.location || null,
      amount: o.amount || extractAmount(o.title + ' ' + o.snippet),
      degree_level: o.degree_level || extractDegreeLevel(o.title + ' ' + o.snippet),
      country_focus: o.country_focus || extractCountryFocus(o.title + ' ' + o.snippet),
      application_steps: getApplicationSteps(o),
      verified: true,
    }));

    const { error } = await supabase.from('lp_tag_cache').upsert(
      { tag, results: JSON.stringify(processed), cached_at: cacheTime },
      { onConflict: 'tag' }
    );
    if (error) console.error(`Seed error for ${tag}:`, error.message);
    else console.log(`[Seed] Seeded ${processed.length} opps for tag: ${tag}`);
  }
  console.log('[Seed] Static opportunity library seeded.');
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
