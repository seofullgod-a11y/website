# seftsaint — Worlds in progress

เว็บพอร์ตโฟลิโอส่วนตัว สร้างด้วย [Astro](https://astro.build) แบบ static
ไม่มีฐานข้อมูล ไม่มี CMS และไม่ดึงอะไรจาก X ตอนเปิดหน้าเว็บ

---

## เปิดโปรเจกต์

ต้องใช้ **Node.js 22.12 ขึ้นไป** (เช็กด้วย `node -v`)

```bash
npm install        # ครั้งแรกครั้งเดียว
npm run dev        # เปิด http://localhost:4321 — แก้ไฟล์แล้วหน้าเว็บอัปเดตเอง
npm run build      # สร้างเว็บจริงไว้ในโฟลเดอร์ dist/
npm run preview    # เปิดดูผลจาก dist/ ก่อนอัปโหลด
npm start          # เสิร์ฟ dist/ แบบเดียวกับบน Railway (ต้อง build ก่อน)
npm run check      # ตรวจ TypeScript / Astro
```

Deploy: ดูหัวข้อ **"ขึ้น GitHub + Railway"** ด้านล่าง
(ถ้าจะใช้ Vercel, Netlify หรือ Cloudflare Pages ให้ตั้ง build command เป็น `npm run build` และ output เป็น `dist`)

---

## แก้อะไร ที่ไหน

| ต้องการแก้ | ไฟล์ |
|---|---|
| ชื่อ, ลิงก์ X, ข้อความ Hero, About, meta/SEO | `src/data/site.ts` |
| ปุ่ม เมนู ชื่อ section และข้อความเล็ก ๆ ทุกจุด | `src/data/ui.ts` |
| ผลงาน | `src/data/projects.ts` |
| Journal และกล่อง "Now" | `src/data/updates.ts` |
| สี ฟอนต์ และระยะห่าง | `src/styles/global.css` (ดูตัวแปรใน `:root`) |

**เปลี่ยนเป็นภาษาไทย:** แปลข้อความใน `site.ts`, `ui.ts`, `projects.ts` และ `updates.ts`
จากนั้นตั้ง `lang: 'th'` และ `locale: 'th-TH'` ใน `site.ts` (วันที่จะเป็น พ.ศ. เอง)
ฟอนต์ภาษาไทย (IBM Plex Sans Thai) ติดตั้งไว้แล้ว และจะโหลดเฉพาะเมื่อหน้านั้นมีตัวอักษรไทย

---

## เพิ่มผลงานใหม่

1. วางภาพไว้ที่ `src/assets/media/<slug>/` เช่น `src/assets/media/new-game/cover.jpg`
2. วางวิดีโอ (ถ้ามี) ไว้ที่ `public/media/<slug>/` เช่น `public/media/new-game/preview.mp4`
3. เพิ่ม object ใหม่ใน `src/data/projects.ts` (มี template ให้คัดลอกอยู่ด้านบนไฟล์)
4. ถ้ามีอัปเดตระหว่างทาง ให้เพิ่มใน `src/data/updates.ts` แล้วใส่ `project: '<slug>'`
   รายการนั้นจะไปอยู่ทั้งใน Journal และไทม์ไลน์ของหน้าโปรเจกต์โดยอัตโนมัติ

- `status`: `'in-progress' | 'experiment' | 'paused' | 'released'`
- `featured: true` = งานที่แสดงใน Hero และ spread ใหญ่ (ควรมีแค่ชิ้นเดียว)
- `draft: true` = ซ่อนจากเว็บไว้ก่อน
- ใส่เฉพาะส่วนที่มีข้อมูลจริง ส่วนที่ไม่ได้ใส่จะไม่แสดง
- ลำดับในไฟล์ไม่สำคัญ Journal เรียงตาม `date` เสมอ

---

## สื่อ (ภาพ / วิดีโอ)

| ชนิด | ที่วางไฟล์ | สเปกแนะนำ |
|---|---|---|
| ภาพปก / poster | `src/assets/media/<slug>/` | JPG หรือ PNG กว้าง 1920–2560px, 16:9 — ระบบย่อและแปลงเป็น AVIF/WebP ให้เอง |
| วิดีโอ preview (หน้าแรก) | `public/media/<slug>/preview.mp4` | 8–15 วินาที, วนต่อกันได้, กว้าง 1600px, H.264, ไม่มีเสียง, ขนาดประมาณ 2–5MB |
| วิดีโอเดโมเต็ม | `public/media/<slug>/<date>-<name>.mp4` | H.264 + AAC, กว้าง 1920px |

พฤติกรรมของวิดีโอ:
- ไม่เล่นเสียงเองทุกกรณี
- preview จะเล่นแบบ mute เฉพาะตอนมองเห็นบนคอมที่ใช้เมาส์ และหยุดเมื่อเลื่อนพ้นหรือสลับแท็บ
- บนมือถือ, เมื่อเปิด reduced motion หรือ Data Saver จะแสดง poster และปุ่ม Play โดยไม่โหลดวิดีโอล่วงหน้า
- เดโมในหน้าโปรเจกต์จะโหลดเมื่อกด Play เท่านั้น
- ถ้าไม่มีไฟล์ จะแสดง poster และปุ่ม "Watch on X" ถ้าไฟล์เสีย จะแสดงลิงก์สำรองไปยังโพสต์ต้นฉบับ

คำสั่ง ffmpeg ที่ใช้เตรียมไฟล์ได้:

```bash
# preview loop 12 วินาที (เริ่มวินาทีที่ 5) ไม่มีเสียง
ffmpeg -ss 5 -t 12 -i input.mov -vf "scale=1600:-2,fps=30" -an \
  -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart preview.mp4

# เดโมเต็ม
ffmpeg -i input.mov -vf "scale=1920:-2" -c:v libx264 -crf 22 -preset slow \
  -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart 2026-09-25-last-update.mp4

# ดึงเฟรมจากวินาทีที่ 5 มาเป็น poster
ffmpeg -ss 5 -i input.mov -frames:v 1 -q:v 2 2026-09-25-last-update.jpg
```

ตอนรัน `npm run dev` หรือ `npm run build` terminal จะแสดงรายชื่อไฟล์ที่ยังขาด
และในโหมด dev จะมีป้ายสีเหลืองบนภาพที่เป็นภาพชั่วคราวหรือยังไม่มีวิดีโอ ป้ายนี้ไม่แสดงบนเว็บจริง

---

## ขึ้น GitHub + Railway

โปรเจกต์ตั้งค่าให้ Railway ไว้ครบแล้ว:
- `railway.json`: build ด้วย `npm run build`, start ด้วย `npm start` และมี healthcheck ที่ `/health`
- `server.mjs`: server สำหรับเสิร์ฟ `dist/` ไม่มี dependency เพิ่ม
  - อ่าน `PORT` ที่ Railway กำหนดให้เอง
  - บีบอัด brotli/gzip และตั้ง cache header
  - รองรับ byte-range ที่วิดีโอบน Safari และ iOS ต้องใช้
  - คืนหน้า 404 จริงเมื่อไม่พบหน้า
- ใช้ Node 22 ตาม `engines` ใน `package.json` และ `.nvmrc`

### 1. ขึ้น GitHub

สร้าง repo ว่างบน GitHub ก่อน โดย**ไม่ต้อง**ติ๊กสร้าง README หรือ .gitignore แล้วรัน:

```bash
cd ~/Downloads/Website/My\ Own
git init -b main
git add .
git commit -m "seftsaint v1"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

ถ้าอัปโหลดผ่านหน้าเว็บ GitHub (Add file → Upload files) ให้ลากทุกไฟล์และโฟลเดอร์เข้าไป
รวมถึงไฟล์ที่ขึ้นต้นด้วยจุด (`.gitignore`, `.nvmrc`) บน Mac กด `Cmd + Shift + .` เพื่อแสดงไฟล์ที่ซ่อนอยู่
**ห้ามอัปโหลด** `node_modules/` และ `dist/`

### 2. เชื่อม Railway

1. Railway → **New Project → Deploy from GitHub repo** แล้วเลือก repo นี้
2. Railway จะอ่าน `railway.json` เอง ไม่ต้องตั้ง build หรือ start command เพิ่ม
3. ไปที่ **Settings → Networking → Generate Domain** แล้วกด **Redeploy** หนึ่งครั้ง
   เพื่อให้ canonical และภาพ social preview ใช้โดเมนนั้น (อ่านจาก `RAILWAY_PUBLIC_DOMAIN` อัตโนมัติ)
4. ถ้าใช้โดเมนของตัวเอง ให้เพิ่มใน Networking แล้วตั้ง `url` ใน `src/data/site.ts`
   (หรือตั้งตัวแปร `SITE_URL` ใน Railway) จากนั้น push ใหม่
5. หลังจากนี้ทุกครั้งที่ `git push` Railway จะ build และ deploy ให้เอง

**ถ้ามีปัญหา**
- Railway เสิร์ฟด้วย Caddy แทน `npm start`: ตั้งตัวแปร `RAILPACK_NO_SPA=1`
- Railway ใช้ Node ผิดเวอร์ชัน: ตั้งตัวแปร `RAILPACK_NODE_VERSION=22`
- ทดสอบแบบเดียวกับบน Railway ในเครื่อง: `npm run build && PORT=8080 npm start` แล้วเปิด http://localhost:8080

**เรื่องวิดีโอกับ GitHub:** GitHub รับไฟล์ได้ไม่เกิน 100MB ต่อไฟล์ และจะเตือนเมื่อเกิน 50MB
preview ควรอยู่ราว 2–5MB ส่วนเดโมเต็มควรไม่เกิน 50MB
ถ้าใหญ่กว่านั้น ให้ใช้ Git LFS หรือฝากไฟล์ไว้ที่อื่นแล้วเก็บแค่ลิงก์

---

## สิ่งที่ยังขาดจากคุณ

**วิดีโอ** (ชื่อไฟล์ตั้งไว้ในข้อมูลแล้ว วางไฟล์ตามชื่อนี้ได้เลย)
- `public/media/forest-concept/preview.mp4` — loop สั้นสำหรับ Hero (สำคัญที่สุด)
- `public/media/forest-concept/2026-09-14-godot.mp4`
- `public/media/forest-concept/2026-09-20-unreal.mp4`
- `public/media/forest-concept/2026-09-23-luna.mp4`
- `public/media/forest-concept/2026-09-25-last-update.mp4`

**ภาพต้นฉบับ** — ภาพ 4 ภาพใน `src/assets/media/forest-concept/` เป็นเฟรมปกที่จับจากโพสต์ X
ขนาด 1280×720 (`interim: true`) ใช้ได้ แต่ภาพต้นฉบับจะคมกว่า
ให้วางทับด้วยชื่อไฟล์เดิม แล้วลบ `interim: true` ใน `projects.ts` และ `updates.ts`

**ข้อมูลที่ควรยืนยัน**
- ชื่อโปรเจกต์: โพสต์ไม่ได้ระบุชื่อ จึงใช้ "Forest Concept" เป็นชื่อชั่วคราว (`workingTitle: true`)
- การรวม 4 โพสต์เป็นโปรเจกต์เดียว: โพสต์ 20 ก.ย. บอกว่าย้าย concept จาก Godot ไป Unreal และ HUD, ป้าย "Sunward Valley" และนกในโพสต์ 23 กับ 25 ก.ย. ตรงกัน
- ประโยค "A little bird guides you along the trail." มาจากข้อความ HUD ในเดโม ("Follow the little white bird along the trail.")
- ข้อความ Hero และ About เขียนจากคำอธิบายที่คุณให้มา ควรอ่านอีกรอบให้ตรงกับน้ำเสียงของคุณ
- URL เว็บหลัง deploy → `site.ts` → `url`

---

## โครงสร้าง

```
src/
  data/        ← เนื้อหาทั้งหมด (แก้ตรงนี้เป็นหลัก)
  assets/media ← ภาพผลงาน (ระบบปรับขนาดให้)
  components/  ← Hero, FeaturedProject, Journal, Media (ภาพ/วิดีโอ), ...
  pages/       ← index, work/[slug], 404
  scripts/     ← JS ฝั่งเบราว์เซอร์ (header, fade-in, จัดการวิดีโอ) ~2KB
  styles/      ← global.css (สี, ฟอนต์, ตัวแปร)
server.mjs     ← server สำหรับ production (npm start)
railway.json   ← ค่าตั้ง Railway
public/
  media/       ← วิดีโอ
  fonts/       ← ฟอนต์ (SIL OFL)
  og.jpg       ← ภาพ social preview 1200×630
```

รายละเอียดการออกแบบ: พื้น charcoal, accent สีเดียว (`--accent` เขียว sage อ่อน),
Geist / Geist Mono / Instrument Serif italic, motion 180–350ms,
ไม่มี custom cursor, ไม่มี scroll-jacking, รองรับ reduced motion และ keyboard focus ทุกจุด
การเปลี่ยนหน้าใช้ CSS View Transitions (Chrome, Edge และ Safari 18.2+ เบราว์เซอร์อื่นเปลี่ยนหน้าตามปกติ)
