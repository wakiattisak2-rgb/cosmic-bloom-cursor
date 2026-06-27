# ระบบสมาชิก Aetros (Free Beta) + Admin Console

## ตอบคำถามข้อ 2 ก่อน (สำคัญ)

**ข้อมูลของคุณยังอยู่ครับ** — ทุกอย่างที่บันทึก (บทความ, actions_log, XP, credits, profile) อยู่ใน Supabase ผูกกับ `user_id` ใน `auth.users` ไม่ได้อยู่ใน browser

**แต่มีข้อควรระวัง:** ตอนนี้ระบบใช้ **Anonymous Sign-in** อัตโนมัติ ถ้าคุณกด Sign out:
- session anonymous จะถูกลบ → ครั้งหน้าเข้ามาจะได้ user ใหม่ (anonymous id ใหม่) → **มองไม่เห็นบทความเก่าของตัวเอง** (แม้ข้อมูลยังอยู่ในฐานก็ตาม)
- ทางแก้ระดับสากล: ให้ user "**Upgrade / Link account**" จาก anonymous → email หรือ Google ก่อน sign out ครั้งแรก แล้ว user_id จะคงเดิม

ระบบสมาชิกใหม่ด้านล่างจะแก้ปัญหานี้ให้ครบ

---

## 1. Membership Tiers (ฟรีช่วง Beta)

| Tier | ปัจจุบัน | สิทธิ์ |
|---|---|---|
| **Guest** (anonymous) | ฟรี | ใช้ทุกฟีเจอร์ได้ แต่ข้อมูลผูกกับ device — เตือนให้ upgrade |
| **Member** (email/Google) | ฟรี (Beta badge) | บันทึกถาวร, comment, post, redeem rewards, profile หน้า public |
| **Verified Expert** | สมัคร + admin approve | ลง expert directory, รับงาน, badge ✓ |
| **Admin** | invite-only | เข้า `/admin` |

ตอน Beta ทุก tier ฟรี แสดง "Free during Beta" badge

## 2. Account & Profile (ระดับสากล)

- **Sign up/in**: Email+Password, Google OAuth, ต่อ anonymous (link identity)
- **Profile page** `/u/$handle`: avatar, bio, country, interests (ESG topics), badges, XP, public posts/articles, joined date
- **Account settings** `/settings`:
  - Profile (display name, handle, avatar upload, bio, language)
  - Account (email, password, linked providers, delete account)
  - Notifications (email digest, mentions, replies)
  - Privacy (public profile on/off, show activity)
  - Sessions (active devices + sign out all) ← มาตรฐาน GDPR/SOC2
  - Data export (download my data as JSON) ← GDPR Article 20
- **Onboarding**: 3-step (interests → role → goals) ให้ +50 XP

## 3. Activity History (Backend Tracking)

ตาราง `activity_log` ใหม่ — บันทึก **ทุก event** ของ user (ไม่ใช่แค่ eco actions):

ประเภท event: `signup, signin, signout, profile_update, article_publish, article_view, article_like, comment_create, post_create, reward_redeem, expert_apply, role_grant, login_failed`

ฟิลด์: user_id, event_type, entity_type, entity_id, metadata (jsonb), ip_address, user_agent, created_at

หน้า `/settings/activity` — user เห็น history ของตัวเอง (timeline)

## 4. Admin Console `/admin` (role = admin only)

Layout: sidebar + dashboard cards

- **Overview**: DAU/WAU/MAU, new signups (7/30d sparkline), articles published, XP distributed, total credits
- **Users** `/admin/users`: table (search, filter by tier/role/status), row → modal: profile, activity, grant role, suspend, reset password, impersonate (audit-logged)
- **Content moderation** `/admin/content`: articles/posts/comments queue → approve / reject / hide / delete (soft delete) + reason
- **Expert applications** `/admin/experts`: pending → approve sets `verified=true` + grants role
- **Rewards** `/admin/rewards`: CRUD reward catalog, stock, cost
- **Activity audit** `/admin/audit`: filter by user/event/date — ใช้ตอบ compliance
- **Reports**: user export CSV

ทุก admin action เขียนเข้า `admin_audit_log` (ใคร, ทำอะไร, กับใคร, เมื่อไหร่, เหตุผล)

## 5. Security (ระดับสากล)

- Role storage: ตาราง `user_roles` แยก + enum `app_role` (`user, expert, moderator, admin`) + `has_role()` security definer (ไม่เก็บ role บน profile — กัน privilege escalation)
- RLS ทุกตาราง, policies scope ที่ `auth.uid()`
- Admin grants: trigger ห้าม user แก้ role ตัวเอง
- Rate limit: posts/comments ผ่าน DB function
- Soft delete (`deleted_at`) สำหรับ content
- HIBP password check เปิด
- Audit log immutable (INSERT only, no UPDATE/DELETE policy)

---

## Technical Implementation

### DB Migration (1 ครั้ง)
1. `app_role` enum + `user_roles` table + `has_role()` function
2. ขยาย `profiles`: handle (unique), bio, country, interests[], avatar_url, is_public, onboarded_at, suspended_at
3. `activity_log` table (immutable)
4. `admin_audit_log` table
5. `expert_applications` table (status: pending/approved/rejected)
6. Soft-delete columns บน knowledge_articles, posts, comments
7. Trigger: `handle_new_user` แจก role `user` + log signup event
8. RLS + GRANT ครบทุกตาราง

### Auth
- เปิด Email+Password + Google (เรียก `configure_auth` + `configure_social_auth`)
- แก้ `/auth` page: tabs Email / Google, รองรับ "link to anonymous"
- แก้ `auth.tsx`: ไม่ auto-anonymous อีก — ให้ landing เลือกเอง (กัน data loss)
- หรือ: ถ้าเป็น anonymous อยู่ แสดง banner "บันทึกบัญชีของคุณก่อนออก" ทุกหน้า

### Frontend
- `/settings/*` (profile, account, notifications, privacy, sessions, activity, export)
- `/u/$handle` public profile
- `/admin/*` (overview, users, content, experts, rewards, audit) — gated ด้วย `_admin` pathless layout + `has_role('admin')`
- `/onboarding` 3-step wizard
- AnonymousBanner component (เตือน upgrade)

### Activity logging
- helper `logActivity(event_type, entity, metadata)` — เรียกจาก RPC ทุกที่ที่มี mutation
- หรือ DB triggers บนตารางหลักให้ auto log

---

## คำถามก่อนเริ่ม

1. **Admin คนแรก**: ให้ผมเซ็ต email ไหนเป็น admin? (จะใส่ใน seed migration)
2. **Anonymous mode**: เก็บไว้ (สะดวก แต่เสี่ยง data loss) หรือบังคับ sign-in (ปลอดภัยกว่า มาตรฐานสากล)?
3. **ขอบเขตรอบนี้**: ทำครบทุกข้อด้านบนในรอบเดียว หรือเริ่ม Phase 1 ก่อน (Auth จริง + Roles + Activity log + Admin Users page) แล้วค่อยต่อ Phase 2 (Audit, Moderation, Expert apps, Settings ครบ)?
