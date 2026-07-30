/**
 * Seeds the live Supabase project with demo/dev data.
 *
 * IMPORTANT: victims, lawyers, and cases below are entirely FICTIONAL
 * placeholder personas — July 2024 is a real, sensitive historical event and
 * this project must never present invented data as real victims' identities.
 * Swap these for real, sourced, consented records before any real launch.
 *
 * timeline_events describes the broad public chronology of the July–August
 * 2024 uprising at a neutral, high level (widely documented public history,
 * not personal data) but is still marked as a demo entry pending a real
 * editorial/sourcing pass — see source_citation on each row.
 *
 * Safe to re-run: clears ALL rows in the tables it seeds before re-inserting
 * (fine for a demo/dev project; do not point this at a database that also
 * holds real admin-entered records).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_SOURCE_NOTE = "ডেমো এন্ট্রি — প্রকাশের আগে প্রাথমিক সূত্র যাচাই করুন। Demo entry — verify against primary sources before real publication.";

async function main() {
  console.log("Clearing previously seeded demo rows...");
  // Order matters: children before parents (FK constraints).
  await supabase.from("case_updates").delete().not("id", "is", null);
  await supabase.from("budget_transactions").delete().not("id", "is", null);
  await supabase.from("timeline_events").delete().not("id", "is", null);
  await supabase.from("cases").delete().not("id", "is", null);
  await supabase.from("archive_items").delete().not("id", "is", null);
  await supabase.from("budget_allocations").delete().not("id", "is", null);
  await supabase.from("lawyers").delete().not("id", "is", null);
  await supabase.from("victims").delete().not("id", "is", null);

  console.log("Inserting victims (fictional placeholder personas)...");
  const { data: victims, error: victimsErr } = await supabase
    .from("victims")
    .insert([
      {
        full_name: "Rafiul Islam Rafi",
        full_name_bn: "রফিউল ইসলাম রাফি",
        status: "martyr",
        age: 19,
        gender: "male",
        district: "Dhaka",
        upazila: "Mirpur",
        incident_date: "2024-07-18",
        incident_location: "Mirpur-10, Dhaka",
        incident_location_bn: "মিরপুর-১০, ঢাকা",
        story_summary:
          "A first-year university student, Rafi joined the demonstrations near his home. He is remembered by his family as a quiet, book-loving young man who wanted to become a teacher.",
        story_summary_bn:
          "বিশ্ববিদ্যালয়ের প্রথম বর্ষের শিক্ষার্থী রাফি তার বাড়ির কাছে বিক্ষোভে অংশ নিয়েছিলেন। পরিবার তাকে স্মরণ করে একজন শান্তশিষ্ট, বইপ্রেমী তরুণ হিসেবে, যিনি শিক্ষক হতে চেয়েছিলেন।",
        is_published: true,
        verification_status: "verified",
      },
      {
        full_name: "Nusrat Jahan Mim",
        full_name_bn: "নুসরাত জাহান মিম",
        status: "martyr",
        age: 21,
        gender: "female",
        district: "Dhaka",
        upazila: "Uttara",
        incident_date: "2024-07-19",
        incident_location: "Uttara, Dhaka",
        incident_location_bn: "উত্তরা, ঢাকা",
        story_summary:
          "A final-year student, Mim was known among friends for organizing peaceful study circles. Her family has since become vocal advocates for justice and transparency in the investigation.",
        story_summary_bn:
          "স্নাতক শেষ বর্ষের শিক্ষার্থী মিম বন্ধুমহলে শান্তিপূর্ণ পাঠচক্র সংগঠনের জন্য পরিচিত ছিলেন। তার পরিবার তদন্তে ন্যায়বিচার ও স্বচ্ছতার জন্য সোচ্চার রয়েছে।",
        is_published: true,
        verification_status: "verified",
      },
      {
        full_name: "Shafiqul Alam",
        full_name_bn: "শফিকুল আলম",
        status: "martyr",
        age: 34,
        gender: "male",
        district: "Chattogram",
        upazila: "Panchlaish",
        incident_date: "2024-07-20",
        incident_location: "Panchlaish, Chattogram",
        incident_location_bn: "পাঁচলাইশ, চট্টগ্রাম",
        story_summary:
          "A rickshaw puller and father of two, Shafiqul was on his way home from work when he was caught in the unrest. His family relies on the rehabilitation fund for their children's schooling.",
        story_summary_bn:
          "দুই সন্তানের জনক ও রিকশাচালক শফিকুল কাজ থেকে বাড়ি ফেরার পথে সংঘর্ষে জড়িয়ে পড়েন। তার পরিবার সন্তানদের লেখাপড়ার জন্য পুনর্বাসন তহবিলের উপর নির্ভরশীল।",
        is_published: true,
        verification_status: "verified",
      },
      {
        full_name: "Tania Akter",
        full_name_bn: "তানিয়া আক্তার",
        status: "injured",
        age: 26,
        gender: "female",
        district: "Narayanganj",
        upazila: "Fatullah",
        incident_date: "2024-07-21",
        incident_location: "Fatullah, Narayanganj",
        incident_location_bn: "ফতুল্লা, নারায়ণগঞ্জ",
        story_summary:
          "A garment factory worker, Tania lost vision in one eye during the crackdown near her workplace. She continues rehabilitation and has become a volunteer advocate for other injured workers.",
        story_summary_bn:
          "পোশাক শ্রমিক তানিয়া কর্মস্থলের কাছে দমন-পীড়নের সময় এক চোখের দৃষ্টিশক্তি হারান। তিনি পুনর্বাসন প্রক্রিয়া চালিয়ে যাচ্ছেন এবং অন্য আহত শ্রমিকদের জন্য স্বেচ্ছাসেবী হিসেবে কাজ করছেন।",
        is_published: true,
        verification_status: "verified",
      },
      {
        full_name: "Imran Hossain",
        full_name_bn: "ইমরান হোসেন",
        status: "injured",
        age: 17,
        gender: "male",
        district: "Rajshahi",
        upazila: "Boalia",
        incident_date: "2024-07-22",
        incident_location: "Boalia, Rajshahi",
        incident_location_bn: "বোয়ালিয়া, রাজশাহী",
        story_summary:
          "A secondary school student, Imran sustained a spinal injury and now uses a wheelchair. He has resumed his studies with the help of an accessible-education grant.",
        story_summary_bn:
          "মাধ্যমিক বিদ্যালয়ের শিক্ষার্থী ইমরান মেরুদণ্ডে আঘাত পেয়ে বর্তমানে হুইলচেয়ার ব্যবহার করেন। প্রবেশগম্য-শিক্ষা অনুদানের সহায়তায় তিনি আবার লেখাপড়া শুরু করেছেন।",
        is_published: true,
        verification_status: "verified",
      },
      {
        full_name: "Abdul Kader",
        full_name_bn: "আব্দুল কাদের",
        status: "martyr",
        age: 45,
        gender: "male",
        district: "Sylhet",
        upazila: "Sylhet Sadar",
        incident_date: "2024-07-29",
        incident_location: "Zindabazar, Sylhet",
        incident_location_bn: "জিন্দাবাজার, সিলেট",
        story_summary:
          "A shopkeeper and neighborhood elder, Abdul Kader stepped out to check on his store during the unrest. He is remembered locally for his generosity toward students.",
        story_summary_bn:
          "দোকানদার ও এলাকার প্রবীণ আব্দুল কাদের অস্থিরতার মধ্যে তার দোকান দেখতে বের হয়েছিলেন। শিক্ষার্থীদের প্রতি তার উদারতার জন্য এলাকাবাসী তাকে স্মরণ করেন।",
        is_published: true,
        verification_status: "verified",
      },
    ])
    .select("id, full_name");
  if (victimsErr || !victims) throw victimsErr;
  const v = Object.fromEntries(victims.map((row) => [row.full_name, row.id]));

  console.log("Inserting lawyers...");
  const { data: lawyers, error: lawyersErr } = await supabase
    .from("lawyers")
    .insert([
      {
        full_name: "Barrister Farhana Kabir",
        full_name_bn: "ব্যারিস্টার ফারহানা কবির",
        bar_registration_no: "BD-BAR-04821",
        specialization: ["criminal_law", "human_rights"],
        contact_email: "farhana.kabir@example.com",
        is_active: true,
      },
      {
        full_name: "Advocate Mahmudul Hasan",
        full_name_bn: "অ্যাডভোকেট মাহমুদুল হাসান",
        bar_registration_no: "BD-BAR-03157",
        specialization: ["criminal_law"],
        contact_email: "mahmudul.hasan@example.com",
        is_active: true,
      },
      {
        full_name: "Advocate Shirin Sultana",
        full_name_bn: "অ্যাডভোকেট শিরিন সুলতানা",
        bar_registration_no: "BD-BAR-06290",
        specialization: ["compensation_claims", "civil_law"],
        contact_email: "shirin.sultana@example.com",
        is_active: true,
      },
    ])
    .select("id, full_name");
  if (lawyersErr || !lawyers) throw lawyersErr;
  const l = Object.fromEntries(lawyers.map((row) => [row.full_name, row.id]));

  console.log("Inserting cases + case_updates...");
  const { data: cases, error: casesErr } = await supabase
    .from("cases")
    .insert([
      {
        case_number: "DMP-2024-CR-1187",
        title: "State vs. Unknown — Rafiul Islam Rafi",
        title_bn: "রাষ্ট্র বনাম অজ্ঞাতনামা — রফিউল ইসলাম রাফি",
        description:
          "Criminal investigation into the death of Rafiul Islam Rafi during the July uprising.",
        description_bn:
          "জুলাই অভ্যুত্থানকালে রফিউল ইসলাম রাফির মৃত্যুর ফৌজদারি তদন্ত।",
        case_type: "criminal_prosecution",
        status: "investigation",
        victim_id: v["Rafiul Islam Rafi"],
        assigned_lawyer_id: l["Barrister Farhana Kabir"],
        court_name: "Dhaka Metropolitan Sessions Judge Court",
        filed_date: "2024-08-10",
        is_published: true,
      },
      {
        case_number: "DMP-2024-CR-1203",
        title: "State vs. Unknown — Nusrat Jahan Mim",
        title_bn: "রাষ্ট্র বনাম অজ্ঞাতনামা — নুসরাত জাহান মিম",
        description:
          "Criminal case tracking accountability for the death of Nusrat Jahan Mim.",
        description_bn: "নুসরাত জাহান মিমের মৃত্যুর জবাবদিহিতা সংক্রান্ত ফৌজদারি মামলা।",
        case_type: "criminal_prosecution",
        status: "under_trial",
        victim_id: v["Nusrat Jahan Mim"],
        assigned_lawyer_id: l["Advocate Mahmudul Hasan"],
        court_name: "Dhaka Metropolitan Sessions Judge Court",
        filed_date: "2024-08-15",
        is_published: true,
      },
      {
        case_number: "NGJ-2024-COMP-0442",
        title: "Tania Akter — Medical Rehabilitation Compensation",
        title_bn: "তানিয়া আক্তার — চিকিৎসা পুনর্বাসন ক্ষতিপূরণ",
        description:
          "Compensation claim for ongoing medical rehabilitation following injury sustained in July 2024.",
        description_bn:
          "২০২৪ সালের জুলাইয়ে আঘাতজনিত চিকিৎসা পুনর্বাসনের জন্য ক্ষতিপূরণ দাবি।",
        case_type: "compensation",
        status: "verdict",
        victim_id: v["Tania Akter"],
        assigned_lawyer_id: l["Advocate Shirin Sultana"],
        court_name: "Narayanganj District Judge Court",
        filed_date: "2024-09-02",
        is_published: true,
      },
      {
        case_number: "RAJ-2024-REHAB-0091",
        title: "Imran Hossain — Rehabilitation & Education Support",
        title_bn: "ইমরান হোসেন — পুনর্বাসন ও শিক্ষা সহায়তা",
        description:
          "Rehabilitation case ensuring continued access to accessible education and medical care.",
        description_bn: "প্রবেশগম্য শিক্ষা ও চিকিৎসা সেবা অব্যাহত রাখতে পুনর্বাসন মামলা।",
        case_type: "rehabilitation",
        status: "closed",
        victim_id: v["Imran Hossain"],
        assigned_lawyer_id: l["Advocate Shirin Sultana"],
        court_name: "Rajshahi District Judge Court",
        filed_date: "2024-09-20",
        is_published: true,
      },
    ])
    .select("id, case_number");
  if (casesErr || !cases) throw casesErr;
  const c = Object.fromEntries(cases.map((row) => [row.case_number, row.id]));

  const { error: updatesErr } = await supabase.from("case_updates").insert([
    {
      case_id: c["DMP-2024-CR-1187"],
      update_text: "Case filed with the Dhaka Metropolitan Sessions Judge Court.",
      update_text_bn: "ঢাকা মেট্রোপলিটন দায়রা জজ আদালতে মামলা দায়ের করা হয়েছে।",
      milestone_type: "filed",
      update_date: "2024-08-10",
    },
    {
      case_id: c["DMP-2024-CR-1187"],
      update_text: "Investigating officer submitted a progress report; forensic evidence under review.",
      update_text_bn: "তদন্তকারী কর্মকর্তা অগ্রগতি প্রতিবেদন জমা দিয়েছেন; ফরেনসিক প্রমাণ পর্যালোচনাধীন।",
      milestone_type: "evidence_submitted",
      update_date: "2024-10-05",
    },
    {
      case_id: c["DMP-2024-CR-1203"],
      update_text: "First hearing held; trial proceedings formally began.",
      update_text_bn: "প্রথম শুনানি অনুষ্ঠিত হয়েছে; বিচারিক কার্যক্রম আনুষ্ঠানিকভাবে শুরু হয়েছে।",
      milestone_type: "hearing",
      update_date: "2024-11-12",
    },
    {
      case_id: c["NGJ-2024-COMP-0442"],
      update_text: "Court approved the compensation claim in full.",
      update_text_bn: "আদালত ক্ষতিপূরণ দাবি সম্পূর্ণরূপে অনুমোদন করেছে।",
      milestone_type: "verdict",
      update_date: "2025-01-18",
    },
  ]);
  if (updatesErr) throw updatesErr;

  console.log("Inserting budget allocations + transactions...");
  const { data: allocations, error: allocErr } = await supabase
    .from("budget_allocations")
    .insert([
      {
        title: "Medical Emergency Fund",
        title_bn: "চিকিৎসা জরুরি তহবিল",
        category: "medical",
        allocated_amount: 15000000,
        source: "July Memorial Foundation",
        fiscal_period: "2024-2025",
        description: "Emergency and ongoing medical care for the injured.",
        description_bn: "আহতদের জরুরি ও চলমান চিকিৎসা সেবার জন্য তহবিল।",
      },
      {
        title: "Martyrs' Family Support",
        title_bn: "শহীদ পরিবার সহায়তা তহবিল",
        category: "livelihood",
        allocated_amount: 20000000,
        source: "July Memorial Foundation",
        fiscal_period: "2024-2025",
        description: "Livelihood support for families of martyrs.",
        description_bn: "শহীদ পরিবারগুলোর জীবিকা নির্বাহে সহায়তা।",
      },
      {
        title: "Education Continuity Fund",
        title_bn: "শিক্ষা ধারাবাহিকতা তহবিল",
        category: "education",
        allocated_amount: 8000000,
        source: "Donor Consortium",
        fiscal_period: "2024-2025",
        description: "Tuition and accessible-education support.",
        description_bn: "শিক্ষা ব্যয় ও প্রবেশগম্য-শিক্ষা সহায়তা।",
      },
      {
        title: "Housing Assistance",
        title_bn: "আবাসন সহায়তা তহবিল",
        category: "housing",
        allocated_amount: 12000000,
        source: "July Memorial Foundation",
        fiscal_period: "2024-2025",
        description: "Housing repair and relocation assistance.",
        description_bn: "আবাসন মেরামত ও স্থানান্তর সহায়তা।",
      },
      {
        title: "Legal Aid Fund",
        title_bn: "আইনি সহায়তা তহবিল",
        category: "legal_aid",
        allocated_amount: 5000000,
        source: "Donor Consortium",
        fiscal_period: "2024-2025",
        description: "Legal counsel fees for victims' families and false-case defendants.",
        description_bn: "ভুক্তভোগী পরিবার ও মিথ্যা মামলার আসামিদের আইনি সহায়তার ব্যয়।",
      },
    ])
    .select("id, title");
  if (allocErr || !allocations) throw allocErr;
  const a = Object.fromEntries(allocations.map((row) => [row.title, row.id]));

  const { error: txErr } = await supabase.from("budget_transactions").insert([
    {
      allocation_id: a["Medical Emergency Fund"],
      victim_id: v["Tania Akter"],
      recipient_name: "Tania Akter",
      recipient_name_bn: "তানিয়া আক্তার",
      amount: 180000,
      transaction_type: "disbursement",
      disbursement_date: "2024-08-05",
      description: "Eye surgery and follow-up care.",
      description_bn: "চোখের অস্ত্রোপচার ও ফলো-আপ চিকিৎসা।",
    },
    {
      allocation_id: a["Medical Emergency Fund"],
      victim_id: v["Imran Hossain"],
      recipient_name: "Imran Hossain",
      recipient_name_bn: "ইমরান হোসেন",
      amount: 320000,
      transaction_type: "disbursement",
      disbursement_date: "2024-08-12",
      description: "Spinal injury treatment and wheelchair.",
      description_bn: "মেরুদণ্ডের আঘাতের চিকিৎসা ও হুইলচেয়ার।",
    },
    {
      allocation_id: a["Martyrs' Family Support"],
      victim_id: v["Rafiul Islam Rafi"],
      recipient_name: "Rafi's family",
      recipient_name_bn: "রাফির পরিবার",
      amount: 500000,
      transaction_type: "disbursement",
      disbursement_date: "2024-08-20",
      description: "Initial livelihood support disbursement.",
      description_bn: "প্রাথমিক জীবিকা সহায়তা বিতরণ।",
    },
    {
      allocation_id: a["Martyrs' Family Support"],
      victim_id: v["Abdul Kader"],
      recipient_name: "Abdul Kader's family",
      recipient_name_bn: "আব্দুল কাদেরের পরিবার",
      amount: 500000,
      transaction_type: "disbursement",
      disbursement_date: "2024-09-01",
      description: "Initial livelihood support disbursement.",
      description_bn: "প্রাথমিক জীবিকা সহায়তা বিতরণ।",
    },
    {
      allocation_id: a["Martyrs' Family Support"],
      victim_id: v["Nusrat Jahan Mim"],
      recipient_name: "Mim's family",
      recipient_name_bn: "মিমের পরিবার",
      amount: 500000,
      transaction_type: "disbursement",
      disbursement_date: "2024-09-01",
      description: "Initial livelihood support disbursement.",
      description_bn: "প্রাথমিক জীবিকা সহায়তা বিতরণ।",
    },
    {
      allocation_id: a["Education Continuity Fund"],
      victim_id: v["Imran Hossain"],
      recipient_name: "Imran Hossain",
      recipient_name_bn: "ইমরান হোসেন",
      amount: 60000,
      transaction_type: "disbursement",
      disbursement_date: "2024-10-01",
      description: "One year's tuition and accessible learning materials.",
      description_bn: "এক বছরের বেতন ও প্রবেশগম্য শিক্ষা উপকরণ।",
    },
    {
      allocation_id: a["Housing Assistance"],
      victim_id: v["Shafiqul Alam"],
      recipient_name: "Shafiqul Alam's family",
      recipient_name_bn: "শফিকুল আলমের পরিবার",
      amount: 250000,
      transaction_type: "disbursement",
      disbursement_date: "2024-09-15",
      description: "Housing repair assistance.",
      description_bn: "আবাসন মেরামত সহায়তা।",
    },
    {
      allocation_id: a["Legal Aid Fund"],
      victim_id: v["Tania Akter"],
      recipient_name: "Advocate Shirin Sultana",
      recipient_name_bn: "অ্যাডভোকেট শিরিন সুলতানা",
      amount: 45000,
      transaction_type: "disbursement",
      disbursement_date: "2024-09-10",
      description: "Legal counsel fees for compensation claim.",
      description_bn: "ক্ষতিপূরণ দাবির আইনি পরামর্শ ফি।",
    },
  ]);
  if (txErr) throw txErr;

  console.log("Inserting archive items (JulyStories)...");
  const { error: archiveErr } = await supabase.from("archive_items").insert([
    {
      title: "Voices of July: A Compiled Oral History",
      title_bn: "জুলাইয়ের কণ্ঠস্বর: একটি সংকলিত মৌখিক ইতিহাস",
      item_type: "book",
      description:
        "A compiled collection of first-hand accounts from participants and witnesses of the July uprising.",
      description_bn:
        "জুলাই অভ্যুত্থানের অংশগ্রহণকারী ও প্রত্যক্ষদর্শীদের প্রত্যক্ষ বিবরণের একটি সংকলন।",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
      verification_status: "verified",
      published_date: "2024-12-01",
    },
    {
      title: "History Before Our Eyes: The First Week",
      title_bn: "চোখের সামনে ইতিহাস: প্রথম সপ্তাহ",
      item_type: "video",
      description:
        "A video compilation documenting the first week of demonstrations.",
      description_bn: "বিক্ষোভের প্রথম সপ্তাহের একটি ভিডিও সংকলন।",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
      verification_status: "verified",
      published_date: "2024-08-20",
    },
    {
      title: "News Archive: July–August 2024",
      title_bn: "সংবাদ সংরক্ষণাগার: জুলাই–আগস্ট ২০২৪",
      item_type: "news_clipping",
      description: "A compiled archive of contemporaneous news coverage.",
      description_bn: "সমকালীন সংবাদ প্রতিবেদনের একটি সংরক্ষিত সংগ্রহ।",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
      verification_status: "verified",
      published_date: "2024-09-01",
    },
    {
      title: "Photo Archive: Faces of the Movement",
      title_bn: "ছবি সংরক্ষণাগার: আন্দোলনের মুখ",
      item_type: "image",
      description: "A verified photo collection from the demonstrations.",
      description_bn: "বিক্ষোভ থেকে যাচাইকৃত ছবির সংগ্রহ।",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
      verification_status: "verified",
      published_date: "2024-08-10",
    },
    {
      title: "First-Person Accounts: Students and Workers",
      title_bn: "প্রত্যক্ষ বিবরণ: শিক্ষার্থী ও শ্রমিক",
      item_type: "story",
      description: "Written testimonies collected from students and workers.",
      description_bn: "শিক্ষার্থী ও শ্রমিকদের কাছ থেকে সংগৃহীত লিখিত সাক্ষ্য।",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
      verification_status: "verified",
      published_date: "2024-10-15",
    },
  ]);
  if (archiveErr) throw archiveErr;

  console.log("Inserting timeline events...");
  const { error: timelineErr } = await supabase.from("timeline_events").insert([
    {
      event_date: "2024-07-01",
      title: "Quota reform protests begin",
      title_bn: "কোটা সংস্কার আন্দোলনের সূচনা",
      description: "Students begin organizing demonstrations calling for civil service quota reform.",
      description_bn: "সরকারি চাকরিতে কোটা সংস্কারের দাবিতে শিক্ষার্থীরা বিক্ষোভ সংগঠিত করতে শুরু করে।",
      category: "protest",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
    },
    {
      event_date: "2024-07-15",
      title: "Clashes escalate on university campuses",
      title_bn: "বিশ্ববিদ্যালয় ক্যাম্পাসে সংঘর্ষ বৃদ্ধি পায়",
      description: "Confrontations intensify at several university campuses.",
      description_bn: "বেশ কয়েকটি বিশ্ববিদ্যালয় ক্যাম্পাসে সংঘর্ষ তীব্র হয়।",
      category: "crackdown",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
    },
    {
      event_date: "2024-07-18",
      title: "First reported casualties",
      title_bn: "প্রথম হতাহতের খবর",
      description: "The first deaths amid the unrest are reported nationwide.",
      description_bn: "সারাদেশে অস্থিরতার মধ্যে প্রথম মৃত্যুর খবর পাওয়া যায়।",
      category: "casualty",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
    },
    {
      event_date: "2024-07-19",
      title: "Nationwide curfew declared",
      title_bn: "সারাদেশে কারফিউ জারি",
      description: "The government declares a nationwide curfew and mobile internet is restricted.",
      description_bn: "সরকার সারাদেশে কারফিউ জারি করে এবং মোবাইল ইন্টারনেট সীমিত করা হয়।",
      category: "political",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
    },
    {
      event_date: "2024-07-21",
      title: "International calls for restraint",
      title_bn: "সংযমের আহ্বান জানায় আন্তর্জাতিক মহল",
      description: "International bodies and foreign governments call for restraint and dialogue.",
      description_bn: "আন্তর্জাতিক সংস্থা ও বিদেশি সরকারগুলো সংযম ও সংলাপের আহ্বান জানায়।",
      category: "international",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
    },
    {
      event_date: "2024-07-25",
      title: "Mass protests resume despite restrictions",
      title_bn: "বিধিনিষেধ সত্ত্বেও গণবিক্ষোভ পুনরায় শুরু",
      description: "Demonstrations resume at scale across major cities.",
      description_bn: "প্রধান শহরগুলোতে ব্যাপক আকারে বিক্ষোভ পুনরায় শুরু হয়।",
      category: "protest",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
    },
    {
      event_date: "2024-08-04",
      title: "Non-cooperation movement declared",
      title_bn: "অসহযোগ আন্দোলনের ঘোষণা",
      description: "Organizers call for a nationwide non-cooperation movement.",
      description_bn: "আয়োজকরা সারাদেশে অসহযোগ আন্দোলনের ডাক দেন।",
      category: "political",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
    },
    {
      event_date: "2024-08-05",
      title: "Political transition",
      title_bn: "রাজনৈতিক পটপরিবর্তন",
      description: "A major political transition takes place following weeks of mass mobilization.",
      description_bn: "কয়েক সপ্তাহের গণআন্দোলনের পর একটি বড় রাজনৈতিক পটপরিবর্তন ঘটে।",
      category: "political",
      source_citation: DEMO_SOURCE_NOTE,
      is_published: true,
    },
  ]);
  if (timelineErr) throw timelineErr;

  console.log("\nDemo data seeded successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
