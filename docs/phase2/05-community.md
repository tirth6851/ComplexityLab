# Phase 2 · Feature 5 — Community (share · feed · likes · comments · moderation)

> **Complexity: XL (~4–5 days).** Largest surface: four tables, the first
> **cross-user reads** in the app, search, feed, pagination, moderation. Build
> **last** — it benefits from Progress (author level badge) and reuses the
> Save-Flow dialog.

---

## Product assumptions (resolved — surface, don't bury)

- **Community is authenticated-only.** The whole app is auth-gated today; posts
  are visible to *signed-in users*, not the public web. *(Confirm in index
  "Decisions"; if public-web is wanted later, it's an RLS/route change, not a
  schema change.)*
- **Posts are immutable snapshots, not live references.** Sharing an analysis
  copies its code + Big-O + result into the post. Deleting/editing the source
  analysis does not change the post. (Simpler, safe, no dangling FKs.)
- **Author identity is denormalized onto the post** (`author_name` captured at
  post time) with an **"Anonymous"** fallback when `display_name` is null. This
  is required because the feed shows *other* users' content and the existing
  `getOrCreateProfile()` owner-scoping pattern doesn't cover cross-user joins.

---

## The cross-user read break (most important architectural note)

Every existing `lib/db` read is scoped `eq('profile_id', me)`. Community reads
must return **other** users' public posts. Resolution, consistent with the
established model:

- Reads still go through the **server-only service-role client** (same as today).
- **Feed/detail reads filter by `status='visible'`**, NOT by owner.
- **Mutations remain owner-scoped:** edit/delete post → `eq('author_id', me)`;
  like/comment → actor = me; delete-comment → comment author OR post author.
- This keeps the "service-role + app-level scoping" invariant — the scope key
  just changes from *ownership* to *visibility* for reads. Document it loudly in
  `lib/db/community.ts` so the next reviewer doesn't "fix" it.

---

## Database

### Migration `supabase/migrations/20260616000400_community.sql`

```sql
create table if not exists public.community_posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles(id) on delete cascade,
  author_name  text not null,                 -- denormalized snapshot ('Anonymous' fallback)
  title        text not null,
  description  text not null default '',
  language     text not null,
  code         text not null,                 -- immutable snapshot
  time_complexity  text not null,
  space_complexity text not null,
  result       jsonb,                         -- snapshot of CodeAnalysis
  status       text not null default 'visible', -- 'visible' | 'hidden' | 'removed'
  like_count   integer not null default 0,    -- denormalized counter
  comment_count integer not null default 0,   -- denormalized counter
  search       tsvector,                      -- maintained by trigger (title+description)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists community_posts_status_created_idx
  on public.community_posts (status, created_at desc);
create index if not exists community_posts_status_likes_idx
  on public.community_posts (status, like_count desc, created_at desc);
create index if not exists community_posts_search_idx
  on public.community_posts using gin (search);

create table if not exists public.post_likes (
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)           -- one like per user per post
);

create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  body       text not null,
  status     text not null default 'visible',
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_created_idx
  on public.post_comments (post_id, created_at asc);

create table if not exists public.post_reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.community_posts(id) on delete cascade,
  comment_id  uuid references public.post_comments(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  status      text not null default 'open',   -- 'open' | 'reviewed' | 'dismissed'
  created_at  timestamptz not null default now()
);
create index if not exists post_reports_status_idx on public.post_reports (status, created_at desc);

alter table public.community_posts enable row level security;  -- service-role only
alter table public.post_likes      enable row level security;
alter table public.post_comments   enable row level security;
alter table public.post_reports    enable row level security;

-- search vector maintenance
create or replace function public.community_posts_search_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.search := setweight(to_tsvector('english', coalesce(new.title,'')), 'A')
             || setweight(to_tsvector('english', coalesce(new.description,'')), 'B');
  return new;
end $$;
drop trigger if exists community_posts_search_tg on public.community_posts;
create trigger community_posts_search_tg before insert or update
  on public.community_posts for each row execute function public.community_posts_search_update();

-- atomic like/unlike + counter (no read-modify-write race)
create or replace function public.toggle_post_like(p_post uuid, p_profile uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare liked boolean; n integer;
begin
  if exists (select 1 from public.post_likes where post_id=p_post and profile_id=p_profile) then
    delete from public.post_likes where post_id=p_post and profile_id=p_profile;
    update public.community_posts set like_count = greatest(like_count-1,0)
      where id=p_post returning like_count into n;
  else
    insert into public.post_likes(post_id, profile_id) values (p_post, p_profile);
    update public.community_posts set like_count = like_count+1
      where id=p_post returning like_count into n;
  end if;
  return n;
end $$;
```

> Comment counts: bump `comment_count` in the same path as `addComment`
> /`deleteComment` (a small SQL fn or `+1`/`-1` update inside the action's db
> call). Keep counters denormalized to avoid per-render `count(*)`.

### Data layer `lib/db/community.ts` (server-only, `DbResult`)

Reads (visibility-scoped, cursor-paginated):
- `listFeed({ sort:'new'|'top', cursor?, limit=20, q? }): DbResult<{posts, nextCursor}>`
- `getPost(id): DbResult<CommunityPostDetail>` (post + comments + my-like flag)

Mutations (owner/actor-scoped):
- `createPost(input)` — captures `author_name` from the caller's profile.
- `deletePost(id)` → `eq('author_id', me)`.
- `toggleLike(postId)` → `rpc('toggle_post_like', …)`.
- `addComment(postId, body)`, `deleteComment(id)` (author or post-author).
- `reportPost({postId?, commentId?, reason})`.

---

## Pagination (resolved: keyset/cursor, not offset)

Cursor = base64 of `(created_at, id)` for "new", or `(like_count, created_at, id)`
for "top". Query: `where status='visible' and (created_at,id) < (cursor) order by
created_at desc, id desc limit 20`. Stable under inserts, O(1) deep pages — the
indexes above back both sorts. Client "Load more" passes `nextCursor`.

## Feed algorithm (resolved: two tabs, no hot-score for v1)

- **New** — `status='visible' order by created_at desc` (the cursor default).
- **Top** — `status='visible' order by like_count desc, created_at desc`, default
  window **last 7 days** (`created_at >= now()-interval '7 days'`).

A time-decayed "hot" score (`log(likes) − age`) is a future enhancement — note
it, don't build it. Two tabs cover the v1 need at near-zero complexity.

## Search (resolved: Postgres FTS)

`listFeed({ q })` → `where search @@ websearch_to_tsquery('english', q)` ordered
by `ts_rank(search, query) desc`. Backed by the GIN index. No ILIKE, no external
search service. Empty `q` → normal feed. (Searching code bodies is future; v1
searches title+description, which is what the `search` column weights.)

---

## Moderation considerations

- **Reporting:** any user can `reportPost`/report a comment (rate-limited).
  Reports land in `post_reports` with `status='open'`.
- **Review (v1 = manual):** an env-gated admin allow-list (`ADMIN_PROFILE_IDS` or
  Clerk role) gates a minimal `/community/moderation` queue that lists open
  reports and lets an admin set a post/comment `status='hidden'|'removed'`.
  Hidden/removed content drops out of all visibility-scoped reads. Full admin
  tooling is future; manual review via this queue (or direct DB) suffices to launch.
- **Preventive:** rate-limit posting/commenting (DB-backed daily cap +
  in-memory burst); strip/escape rendered markdown (no raw HTML); cap lengths;
  consider a lightweight profanity word-filter on submit (optional v1).
- **Author accountability:** `author_id` retained on every post/comment for
  takedown + per-author rate limiting.

---

## API / Server Actions (`app/(app)/community/actions.ts`)

All follow `checkActionLimit → validate → db → revalidatePath`. Budgets in
`lib/limits.ts`: post 10/day + 5/min burst; comment 60/day + 10/min; like
120/min; report 20/day.

- `createPostAction` (reuses the **Save-Flow dialog** for title/description) —
  from `/analyses/[id]` "Share to community".
- `deletePostAction`, `toggleLikeAction`, `addCommentAction`,
  `deleteCommentAction`, `reportAction`, `moderatePostAction` (admin-gated).

`toggleLikeAction` returns the new count for optimistic UI.

---

## UI & component hierarchy (`components/community/`)

```
/community  (feed)
  ├─ FeedTabs (New | Top)  ·  SearchBar (debounced → ?q=)
  ├─ PostCard[]            (author+level badge, title, lang chip, Big-O badges,
  │                         like button w/ optimistic count, comment count, timeAgo)
  └─ LoadMore (cursor)
/community/[id]  (detail)
  ├─ PostHeader (author, meta, report menu)
  ├─ CodeBlock (read-only Monaco or static highlighted — prefer static for cards)
  ├─ ResultsPanel (reuse analyzer's — renders the snapshot `result`)
  ├─ LikeBar  ·  "Open in analyzer" (reuse existing handoff)  ·  "Discuss with AI"
  ├─ CommentList → CommentItem[] (delete if author/post-author, report)
  └─ CommentComposer
Share entry: /analyses/[id] → ShareDialog (Save-Flow Dialog variant)
Admin: /community/moderation (admin-gated) → ReportQueue
```

- Feed/detail pages are **Server Components** (cursor in searchParams); like/
  comment/report are client islands calling actions.
- Reuse `ResultsPanel`, code rendering, badges, `Dialog`, toast — minimal new
  primitives.

---

## Tests

- `lib/db/community` (mocked): feed filters `status='visible'` (NOT owner);
  cursor pagination shape; mutations scoped to author/actor; `toggle_post_like`
  rpc called; `author_name` denormalized with Anonymous fallback.
- Actions: rate-limit-first; validation; like returns count; delete scoped;
  report inserts; admin gate rejects non-admins.
- Search: `websearch_to_tsquery` branch only when `q` present.
- Components: PostCard optimistic like; comment add/delete visibility; report menu.

---

## Security & risk

- **Cross-user reads** are the new risk surface — every read MUST filter
  `status='visible'`; every mutation MUST scope to `author_id`/actor. Centralize
  in `lib/db/community.ts` and cover with the ownership-style tests already
  established in `tests/integration/db-ownership.test.ts`.
- XSS: render user text/markdown safely (no `dangerouslySetInnerHTML` on user
  content; sanitize/escape; code shown in a non-executing block).
- IDOR: like/comment/delete all verified server-side against actor identity.
- Abuse/spam: DB daily caps + burst limits + reporting + admin hide/remove.
- **Risk:** denormalized counters can drift (failed mid-transaction) — the
  atomic RPCs prevent the common races; a periodic reconciliation query is a
  cheap future safeguard, noted not built.
