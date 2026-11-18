-- ClarityOS Check: Bereiche, Führungskraft je Team, Soll-Link je Team (nur Ergänzungen)
alter table team add column if not exists area text;
alter table team add column if not exists leader_name text;
alter table team add column if not exists leader_token text unique default encode(gen_random_bytes(12),'hex');
update team set leader_token = encode(gen_random_bytes(12),'hex') where leader_token is null;
alter table team alter column leader_token set not null;
alter table soll add column if not exists team_id uuid references team(id) on delete cascade;

create or replace function public.admin_create_wave(p_secret text, p_org text, p_wave text, p_teams jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_org uuid; v_wave uuid; t jsonb;
begin
  perform _check_admin(p_secret);
  insert into org(name) values (p_org) returning id into v_org;
  insert into wave(org_id, name) values (v_org, p_wave) returning id into v_wave;
  for t in select * from jsonb_array_elements(p_teams) loop
    insert into team(wave_id, name, headcount, area, leader_name)
    values (v_wave, left(t->>'name',80), nullif(t->>'headcount','')::int, nullif(left(trim(coalesce(t->>'area','')),80),''), nullif(left(trim(coalesce(t->>'leader','')),80),''));
  end loop;
  return jsonb_build_object('wave_id', v_wave);
end $$;

create or replace function public.admin_wave(p_secret text, p_wave uuid)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  perform _check_admin(p_secret);
  return (select jsonb_build_object(
    'wave', jsonb_build_object('id', w.id, 'name', w.name, 'org', o.name, 'min_n', w.min_n, 'lead_token', w.lead_token, 'status', w.status),
    'teams', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'headcount', t.headcount, 'token', t.token, 'area', t.area, 'leader_name', t.leader_name, 'leader_token', t.leader_token) order by t.created_at) from team t where t.wave_id=w.id),'[]'::jsonb),
    'responses', coalesce((select jsonb_agg(jsonb_build_object('team_id', r.team_id, 'answers', r.answers, 'felt', r.felt, 'comments', r.comments)) from response r where r.wave_id=w.id),'[]'::jsonb),
    'soll', coalesce((select jsonb_agg(jsonb_build_object('label', s.leader_label, 'answers', s.answers, 'team_id', s.team_id)) from soll s where s.wave_id=w.id),'[]'::jsonb),
    'clusters', (select c.payload from clusters c where c.wave_id=w.id)
  ) from wave w join org o on o.id=w.org_id where w.id=p_wave);
end $$;

create or replace function public.get_lead(p_token text)
 returns jsonb language sql security definer set search_path to 'public' as $$
  select coalesce(
    (select jsonb_build_object('org', o.name, 'wave', w.name, 'status', w.status, 'scope', 'org')
       from wave w join org o on o.id=w.org_id where w.lead_token = p_token),
    (select jsonb_build_object('org', o.name, 'wave', w.name, 'status', w.status, 'scope', 'team', 'team', t.name, 'area', t.area, 'leader', t.leader_name)
       from team t join wave w on w.id=t.wave_id join org o on o.id=w.org_id where t.leader_token = p_token));
$$;

create or replace function public.submit_soll(p_token text, p_label text, p_answers jsonb)
 returns boolean language plpgsql security definer set search_path to 'public' as $$
declare v_wave wave%rowtype; v_team team%rowtype;
begin
  select * into v_wave from wave where lead_token = p_token;
  if found then
    insert into soll(wave_id, leader_label, answers) values (v_wave.id, nullif(trim(p_label),''), p_answers);
    return true;
  end if;
  select * into v_team from team where leader_token = p_token;
  if not found then raise exception 'invalid token'; end if;
  delete from soll where team_id = v_team.id;
  insert into soll(wave_id, team_id, leader_label, answers) values (v_team.wave_id, v_team.id, coalesce(nullif(trim(p_label),''), v_team.leader_name), p_answers);
  return true;
end $$;
