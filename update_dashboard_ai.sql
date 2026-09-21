-- ============================================================
-- geohamilton.com career dashboard — bring AI/ML up to date
-- Run in the Supabase SQL editor for project: owgzrwfdmtiaenbumyzo
-- (RLS blocks anon writes, so this must run as the project owner.)
-- Idempotent: safe to re-run. No project/product names used.
-- ============================================================

-- 1) SKILLS — rebuild the AI/ML cluster with real depth -------
delete from resume_skills where category = 'AI/ML';
insert into resume_skills (skill, years, category, sort_order) values
  ('LLM Serving / Inference',  2, 'AI/ML', 15),
  ('RAG / pgvector Memory',    2, 'AI/ML', 16),
  ('Agentic Orchestration',    2, 'AI/ML', 17),
  ('284B MoE / 1M-Context Serving', 2, 'AI/ML', 18),
  ('GPU Infra / Self-Hosting', 2, 'AI/ML', 19),
  ('Claude Code',              2, 'AI/ML', 20);

-- 2) WORK BREAKDOWN (donut) — AI/ML is the LARGEST slice ------
-- (current focus: the majority of new work is AI)
update resume_categories set percentage = 20 where category = 'Cloud Infrastructure';
update resume_categories set percentage = 25 where category = 'BI / Analytics';
update resume_categories set percentage = 15 where category = 'Data Engineering';
update resume_categories set percentage = 10 where category = 'Security / IAM';
update resume_categories set percentage = 30 where category = 'AI / ML';
-- (sum = 100)

-- 3) PROJECT HISTORY — add the self-directed AI builds ---------
-- Type 'AI/ML' so the donut's AI / ML slice filters to these.
delete from resume_projects where client = 'Self-directed';
insert into resume_projects (project, client, role, year_start, year_end, type, impact) values
  ('Frontier-Scale LLM Self-Hosting',      'Self-directed', 'Founder & AI Engineer', 2024, null, 'AI/ML', '284B MoE · 13B active · 1M ctx · FP4/FP8'),
  ('Distributed Agentic AI Infrastructure', 'Self-directed', 'Founder & AI Engineer', 2024, null, 'AI/ML', 'Go multi-agent · encrypted · sovereign'),
  ('LLM Analytics Assistant',               'Self-directed', 'AI Engineer',           2025, null, 'AI/ML', 'LLM over third-party platform APIs'),
  ('Cancel-Sort Agentic Ops Console',       'Self-directed', 'AI Engineer',           2026, null, 'AI/ML', 'Tool-calling agent · self-hosted 7B · live lab');

-- 4) METRIC CARDS — add an AI headline stat -------------------
delete from resume_stats where label = 'Self-Hosted AI Systems';
insert into resume_stats (label, value, sort_order) values
  ('Self-Hosted AI Systems', '4', 9);

-- Verify ------------------------------------------------------
-- select * from resume_skills where category = 'AI/ML' order by sort_order;
-- select * from resume_projects where type = 'AI/ML';
-- select * from resume_categories order by id;
