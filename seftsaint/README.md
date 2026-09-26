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
npm run media      # แปลงวิดีโอต้นฉบับใน media-src/ เป็นไฟล์สำหรับเว็บ
npm run check      # ตรวจ TypeScript / Astro
```

Deploy: ดูหัวข้อ **"ขึ้น GitHub + Railway"** ด้านล่าง
(ถ้าจะใช้ Vercel, Netlify หรือ Cloudflare Pages ให้ตั้ง build command เป็น `npm run build` และ output เป็น `dist`)

---

## แก้อะไร ที่ไหน

| ต้องการแก้ | ไฟล์ |
|---|---|
| ข้อความหน้าแรกทุกส่วน (เรียงตามหน้าเว็บ) | `src/data/site.ts` → `hero`, `proof`, `featured`, `about`, `story`, `partner`, `closing` |
| **โพสต์อัปเดตรายวันพร้อมคลิป (Devlog)** | เปิด `/studio` บนเว็บ (ดูหัวข้อ Devlog ด้านล่าง) — ชื่อหมวดและข้อความของ Devlog อยู่ใน `src/data/devlog.ts` |
| **ขนาดและความหนาของตัวอักษร** | `src/styles/global.css` → `:root`: `--w-display` (หัวข้อใหญ่), `--w-display-em` (บรรทัดตัวเอียง), `--w-serif` (หัวข้อเล็ก), `--fs-label` / `--w-label` (ตัวพิมพ์ใหญ่เล็ก ๆ, ปุ่ม, เมนู), `--text-base` (ตัวอักษรเนื้อหา) — ขนาดหัวข้อใหญ่ของแต่ละส่วนอยู่ในไฟล์ของส่วนนั้น เช่น `.hero__title` ใน `src/components/Hero.astro` |
| ยอดวิว/ไลก์ของแต่ละ build | `src/data/updates.ts` → `stats` (+ วันที่ใน `site.ts` → `story.statsAsOf`) |
| ชื่อ, ลิงก์ X, อีเมล, meta/SEO | `src/data/site.ts` |
| ปุ่ม เมนู ชื่อ section และข้อความเล็ก ๆ ทุกจุด | `src/data/ui.ts` |
| ผลงาน | `src/data/projects.ts` |
| Journal และกล่อง "Now" | `src/data/updates.ts` |
| สี ฟอนต์ และระยะห่าง | `src/styles/global.css` (ดูตัวแปรใน `:root`) |
| เปิด/ปิดเอฟเฟกต์ | `src/data/effects.ts` |
| ส่วน Partner (นักลงทุน), อีเมลติดต่อ | `src/data/site.ts` → `partner`, `email` |
| จุดที่ชวนพาร์ทเนอร์ทั่วเว็บ (การ์ดมุมจอ, ปุ่มท้ายวิดีโอ ฯลฯ) | `src/data/site.ts` → `partner.promote` |
| บรรทัดสั้นของงานเด่น, สถานะสั้น | `src/data/projects.ts` → `oneLiner`, `statusShort` |
| ข้อความสั้นของแต่ละบท (The story so far) | `src/data/updates.ts` → `excerpt` ของแต่ละรายการ |
| ภาพจอกว้างของ build ล่าสุด (ไม่มี HUD) | `src/data/updates.ts` → `media.wide` |

**เปลี่ยนเป็นภาษาไทย:** แปลข้อความใน `site.ts`, `ui.ts`, `projects.ts` และ `updates.ts`
จากนั้นตั้ง `lang: 'th'` และ `locale: 'th-TH'` ใน `site.ts` (วันที่จะเป็น พ.ศ. เอง)
ฟอนต์ภาษาไทย (IBM Plex Sans Thai) ติดตั้งไว้แล้ว และจะโหลดเฉพาะเมื่อหน้านั้นมีตัวอักษรไทย
หัวข้อใช้ฟอนต์ serif **Newsreader** และข้อความรองใช้ **Geist** ฟอนต์ทั้งหมดอยู่ในเครื่อง ไม่โหลดจากเว็บอื่น
Newsreader ไม่มีตัวอักษรไทย ถ้าเปลี่ยนเป็นภาษาไทย หัวข้อจะใช้ IBM Plex Sans Thai แทน

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

แต่ละผลงานใช้ไฟล์ได้ 3 แบบ:

| ชนิด | ใช้ตรงไหน | ที่อยู่ไฟล์ |
|---|---|---|
| **poster** (ภาพนิ่ง) | ทุกกรอบภาพ | `src/assets/media/<slug>/<name>.jpg` |
| **preview** (คลิปสั้น 8 วิ ไม่มีเสียง วนซ้ำ) | Hero และเวลา hover บนกรอบภาพ | `public/media/<slug>/<name>-preview.mp4` |
| **video** (เดโมเต็ม มีเสียง) | กดปุ่ม ▶ Play บนเว็บ | `public/media/<slug>/<name>.mp4` |

### วิธีที่ง่ายที่สุด: `npm run media`

1. วางไฟล์วิดีโอต้นฉบับ (.mov / .mp4 / .mkv) ไว้ที่ `media-src/<slug>/`
   และตั้งชื่อให้ตรงกับรายการในข้อมูล เช่น
   ```
   media-src/forest-concept/2026-09-14-godot.mov
   media-src/forest-concept/2026-09-20-unreal.mov
   media-src/forest-concept/2026-09-23-luna.mov
   media-src/forest-concept/2026-09-25-last-update.mov
   ```
2. รัน `npm run media -- --posters` (ต้องมี ffmpeg ติดตั้งไว้ ถ้ายังไม่มีใช้ `brew install ffmpeg`)
   สคริปต์จะสร้างไฟล์ทั้ง 3 แบบให้ครบ:
   - เดโมเต็ม กว้างไม่เกิน 1920px
   - preview 8 วินาที ขนาดราว 1–2MB
   - poster คมชัดจากเฟรมจริง ซึ่งจะเขียนทับภาพชั่วคราวเดิม
3. ใน `updates.ts` ใส่ `preview` และ `video` ให้รายการนั้น (ดูตัวอย่างจาก `last-update`) แล้วลบ `interim: true`
4. รัน `npm run dev` เพื่อเช็ก แล้ว push ขึ้น GitHub
   ไฟล์ต้นฉบับใน `media-src/` จะไม่ถูก push (อยู่ใน .gitignore)

ถ้าอยากเลือกช่วงของ preview เอง ให้สร้างไฟล์ JSON ชื่อเดียวกันไว้ข้างวิดีโอ
เช่น `media-src/forest-concept/2026-09-25-last-update.json` ที่มีค่า `{ "previewStart": 31.5, "previewLength": 8 }`

### พฤติกรรมบนเว็บ
ตอนนี้มีวิดีโอแค่ **Last update** (25 ก.ย.) ซึ่งเป็นงานล่าสุด ส่วนช่วง Godot, Unreal และ Luna เป็นภาพนิ่งที่มีปุ่ม **Watch on X ↗** ไปยังโพสต์ต้นฉบับ

- วิดีโอไม่เล่นเสียงเองทุกกรณี เสียงจะดังเฉพาะตอนผู้ชมกด Play
- **Hero:**
  - ฟุตเทจจริงจาก Unreal เต็มจอ เล่นเองแบบไม่มีเสียงทันทีที่เปิดเว็บ ทั้งคอมและมือถือ (มือถือใช้ไฟล์แนวตั้งแยก) และมีปุ่มหยุดที่มุมขวาล่าง
  - ปุ่ม **▶ Watch the latest build** เปิดเดโมเต็มพร้อมเสียงในหน้าต่างเล่นวิดีโอ
  - ไฟล์: `…-last-update-hero.mp4` 1920×986, 7.2 วินาที, 5.9MB และ `…-hero-tall.mp4` 720×900, 2.1MB
  - ตัดจากช่วง 1:03–1:11 ครอปให้ HUD ของเกมหลุดเฟรม และต่อหัวท้ายให้วนแบบไม่มีรอยตัด
- **Featured world:** แถบภาพจอกว้าง ใช้ลูกศรหรือปุ่ม ← → ไล่ดูทั้ง 4 build ตั้งแต่ Godot ถึง Last update
- **The story so far:**
  - แต่ละ build เป็นหนึ่งบท (Chapter 01–04) พร้อมภาพ ยอดวิว ยอดไลก์ และแถบเทียบยอดวิว
  - บทที่ยอดวิวสูงสุดขึ้นป้าย "Most viewed" เอง
  - บทสุดท้าย "Chapter 05 — The next world" พาไปส่วน Partner
  - บทที่มีวิดีโอมีปุ่ม ▶ Watch และทุกบทมีลิงก์ On X
- **หน้าโปรเจกต์:** hover แล้ว preview จะเล่น กด ▶ เพื่อเล่นเดโมเต็มในกรอบ พอจบจะมีปุ่ม Watch again และ More on X
- เล่นได้ทีละวิดีโอเดียว และหยุดเองเมื่อเลื่อนพ้นหรือสลับแท็บ
- ถ้าผู้ชมเปิด reduced motion หรือ Data Saver ไว้ preview จะไม่เล่นเอง และจะไม่โหลดวิดีโอจนกว่าจะกด
- iPhone ที่เปิดโหมดประหยัดพลังงาน (Low Power Mode) จะไม่ยอมให้วิดีโอเล่นเอง จะเห็นภาพนิ่งกับปุ่ม ▶ แทน
- ถ้ายังไม่มีไฟล์ ปุ่มจะเปลี่ยนเป็น **Watch on X ↗** เอง ถ้าไฟล์เสีย จะแสดงลิงก์สำรองไปยังโพสต์

**GitHub:** รับไฟล์ได้ไม่เกิน 100MB ต่อไฟล์ และจะเตือนเมื่อเกิน 50MB สคริปต์จะเตือนถ้าไฟล์ใหญ่เกิน

ตอนรัน `npm run dev` หรือ `npm run build` terminal จะแสดงรายชื่อไฟล์ที่ยังขาด
และในโหมด dev จะมีป้ายสีเหลืองบนภาพที่ยังเป็นภาพชั่วคราวหรือยังไม่มีวิดีโอ ป้ายนี้ไม่แสดงบนเว็บจริง

---

## Devlog — อัปเดตรายวันพร้อมคลิป

โพสต์ได้จากมือถือหรือคอมที่ **`/studio`** (เช่น `https://seftsaint.up.railway.app/studio`) ไม่ต้องผ่าน GitHub:
เลือกหมวด พิมพ์หัวข้อ (และรายละเอียดถ้ามี) แนบคลิปหรือรูป แล้วกด **โพสต์อัปเดต**
ระบบจะย่อคลิปให้เอง แล้วอัปเดตขึ้นเว็บภายในราว 1 นาที

อัปเดตจะไปขึ้น 3 ที่:
- **`/devlog`**: ทุกอัปเดต จัดกลุ่มตามวัน (Day 13, Today …) พร้อมตัวกรองตามหมวด
- **หน้าแรก** ส่วน **03 Devlog**: วันล่าสุด แสดงได้สูงสุด 3 รายการ
- **หน้าโปรเจกต์**: ส่วน Devlog ของโปรเจกต์นั้น ขึ้นเฉพาะเมื่อมีอัปเดตแล้ว

build ทั้ง 4 ที่โพสต์บน X ไปแล้วจะขึ้นเป็นรายการแรก ๆ ของ Devlog ในหมวด **Build** ด้วย (ปิดได้ที่ `devlog.includeBuilds`)

### ตั้งค่าใน Railway (ทำครั้งเดียว)
1. **ที่เก็บคลิป (Volume):** ในโปรเจกต์ Railway กด `⌘K` (หรือคลิกขวาที่ว่างบนหน้าโปรเจกต์) → เลือก **Volume** → เลือก service ของเว็บ → Mount path ใส่ `/data`
2. **รหัสผ่าน:** service ของเว็บ → **Variables** → **New Variable** → ชื่อ `STUDIO_PASSWORD` → ค่าเป็นรหัสผ่านที่ต้องการ (ยาว ๆ และเดายาก)
3. รอ deploy ใหม่ให้เสร็จ แล้วเปิด `/studio`

ถ้ายังไม่ได้ตั้งรหัสผ่าน หน้า studio จะปิดอยู่ ส่วนเว็บยังทำงานได้ตามปกติ
ถ้ายังไม่ได้ต่อ Volume หน้า studio จะเตือนและยังไม่รับโพสต์ เพราะถ้าไม่มี Volume ไฟล์จะหายทุกครั้งที่ deploy

### รายละเอียด
- **ไฟล์ที่รับ:** คลิปจากมือถือ/จอคอม (MP4, MOV รวมถึง HEVC และ HDR จาก iPhone) และรูป ขนาดสูงสุด 1.5 GB ต่อไฟล์ คลิปยาวสุด 5 นาที (ส่วนที่เกินจะถูกตัดออก)
  - ระบบแปลงเป็น MP4 (H.264) ความยาวด้านยาวสุด 1920px ที่เล่นได้ทุกเครื่อง
  - ทำคลิปพรีวิวสั้น 8 วินาทีแบบไม่มีเสียงไว้เล่นวนบนหน้าเว็บ
  - ทำภาพปก
  - คลิปแนวตั้งจะแสดงเต็มคลิปในกรอบ ไม่ถูกครอป
  - ไม่เก็บไฟล์ต้นฉบับ
- **อัปโหลดทีละ 8 MB:** ถ้าเน็ตหลุดระหว่างทาง ระบบจะลองต่อจากจุดเดิมเอง
- **แก้ไข / ซ่อน / ลบ:** ทำได้จากรายการใต้ฟอร์มในหน้า studio เช่น แก้วันที่ หมวด หัวข้อ รายละเอียด ลิงก์ X หรือซ่อนไว้ก่อนได้
- **หมวด:** World, Characters, Lighting, Gameplay, UI, AI workflow, Tech, Audio, Build — เปลี่ยนชื่อที่แสดงหรือเพิ่มหมวดได้ใน `src/data/devlog.ts` (อย่าเปลี่ยน `key` ของหมวดที่ใช้ไปแล้ว)
- **ค่าใช้จ่าย:** Volume คิดตามพื้นที่ที่ใช้ ($0.15/GB/เดือน ตามหน้า Railway ณ ก.ย. 2026) คลิป 30 วินาทีใช้ราว 10–30 MB ส่วนการดูคลิปนับเป็น egress ของ Railway เหมือนวิดีโออื่นบนเว็บ
- **ความปลอดภัย:**
  - ต้องใส่รหัสผ่านถึงจะเข้า studio ได้ และเข้าได้ครั้งละ 30 วัน
  - เปลี่ยน `STUDIO_PASSWORD` เมื่อไหร่ ทุกเครื่องจะออกจากระบบทันที
  - ถ้าใส่รหัสผิดเกิน 10 ครั้ง ระบบจะล็อกไว้ 15 นาที
  - หน้า studio ไม่ถูก index โดย Google
- **ถ้าหน้า studio บอกว่าไม่พบ ffmpeg:**
  1. ลองกด Redeploy ก่อน
  2. ถ้ายังไม่หาย ให้เพิ่ม Variable `RAILPACK_DEPLOY_APT_PACKAGES` = `ffmpeg`
- **ลองบนเครื่องตัวเอง:** `npm run build` แล้ว `STUDIO_PASSWORD=test npm start` → เปิด `http://localhost:4321/studio` (ไฟล์จะเก็บในโฟลเดอร์ `data/` ซึ่งไม่ขึ้น GitHub) ส่วน `npm run dev` จะไม่มีข้อมูล Devlog

---

## เอฟเฟกต์และลูกเล่น

เปิดหรือปิดทีละตัวได้ใน `src/data/effects.ts` โดยเปลี่ยนค่าเป็น `false`

| ชื่อ | ทำอะไร |
|---|---|
| `intro` | เปิดหน้าแรกครั้งแรก: ฟุตเทจค่อย ๆ สว่างขึ้นจากความมืดและขยับเข้าที่ หัวข้อเลื่อนขึ้นทีละบรรทัด และเส้นขอบฟ้าขีดผ่านด้านล่าง ใช้เวลาราว 3 วินาที ระหว่างนั้นกดทุกอย่างได้ตามปกติ เล่นครั้งเดียวต่อการเข้าชม และจะไม่เล่นถ้าเข้ามาจากลิงก์ที่มี # หรือผู้ชมเปิด reduced motion |
| `evolution` | (ดีไซน์ใหม่ไม่ได้ใช้บนหน้าแรกแล้ว) |
| `compare` | หน้าโปรเจกต์ ส่วน "Then & now": ลากเส้นแบ่งเพื่อเทียบเฟรมแรกกับเฟรมล่าสุด ใช้ปุ่มลูกศรบนคีย์บอร์ดได้ |
| `hoverPreview` | ชี้ที่แถวในรายการ Progress หรือ Original posts แล้วจะมีภาพเล็กลอยตามเมาส์ |
| `parallax` | ฟุตเทจ Hero เลื่อนช้ากว่าหน้าเว็บตอน scroll และภาพปกในหน้าโปรเจกต์ขยับเบา ๆ ตามเมาส์ |
| `lensLight` | แสงนุ่ม ๆ บนพื้นหลังที่ตามเมาส์ (ปิดไว้ในดีไซน์ใหม่) |
| `decode` | ตัวอักษร "ถอดรหัส": ตัวอักษรสลับไปมาแล้วกลับเป็นคำเดิม ทำงานตอนชี้เมาส์, ตอนแตะบนมือถือ, ตอนกด Tab มาที่ปุ่ม และเล่นเองหนึ่งครั้งตอนป้ายหัวข้อแต่ละส่วนเลื่อนเข้ามาในจอ (โปรแกรมอ่านหน้าจอยังได้ข้อความจริงเสมอ) |
| `render` | ภาพ "เรนเดอร์" ขึ้นทีละช่องจากกลางออกไป มีมุมกรอบเหมือนตอนเรนเดอร์ใน Blender ใช้กับภาพใหญ่ใน Featured world และภาพเล็กใน The story so far เล่นครั้งเดียวตอนเลื่อนมาถึง และเล่นเร็ว ๆ อีกครั้งตอนเปลี่ยน build |
| `levels` | แถบเลือกด่านใต้ภาพ Featured world: 01 Godot → 02 Unreal → 03 Luna pass → 04 Last update แล้วต่อด้วยเส้นประไปที่ 05 Next world (ล็อกอยู่ กดแล้วไปส่วนพาร์ทเนอร์) บนมือถือแสดงเฉพาะตัวเลข |
| `loading` | เข้าเว็บครั้งแรก: มุมล่างซ้ายของ Hero มีตัวนับ "Loading world 000% → 100%" ที่วิ่งตามการโหลดฟุตเทจจริง แล้วค่อยหายไป (ทำงานเฉพาะตอนที่ `intro` เล่น) |
| `hud` | หน้าแรกบนจอกว้าง: header บอกว่าอยู่ส่วนไหน เช่น "02 / 05 — Featured world" ตัวหนังสือถอดรหัสทุกครั้งที่เปลี่ยนส่วน |
| `scrollProgress` | เส้นบาง ๆ ใต้ header บอกว่าอ่านไปถึงไหนแล้ว |
| `pulse` | จุดหน้าชื่อ seftsaint หายใจช้า ๆ |

**อยากให้ข้อความไหนถอดรหัสได้** ครอบข้อความด้วย `<span data-decode>…</span>` แล้วใส่ `data-decode-area` ที่ลิงก์หรือกล่องที่ต้องการให้ชี้แล้วเล่น ถ้าอยากให้เล่นเองตอนเลื่อนมาถึง ให้เพิ่ม `data-decode-reveal` ที่ตัวเดียวกับ `data-decode-area` (ข้างใน `data-decode` ต้องเป็นตัวอักษรล้วน)

ทุกเอฟเฟกต์:
- ปิดเองเมื่อผู้ชมตั้งค่าลดการเคลื่อนไหว
- เอฟเฟกต์ที่ต้องใช้เมาส์จะไม่ทำงานบนมือถือ
- ถ้า JavaScript ไม่ทำงาน เว็บยังใช้งานได้ปกติ

---

## ชูเรื่องพาร์ทเนอร์

ทุกจุดเปิดหรือปิดได้ใน `src/data/site.ts` → `partner.promote` ข้อความทั้งหมดอยู่ใน `partner` ที่เดียวกัน

| จุด | เมื่อไหร่ | ค่า |
|---|---|---|
| **การ์ดมุมจอ** แบบ "New quest" มีภารกิจ 2 ข้อ (`nudge.objectives`) (มือถือจะเป็นแถบเล็กด้านล่าง) | ขึ้นหลังผู้ชมเลื่อนผ่านงานเด่น, ดูเดโมอย่างน้อย 6 วินาที หรือดูวิดีโอในหน้าโปรเจกต์จนจบ ถ้ากด × จะหายไป 7 วัน (`nudge.snoozeDays`) ถ้าได้เห็นส่วน Partner แล้วจะไม่ขึ้นอีกในการเข้าชมนั้น และจะหลบเองตอนส่วน Partner อยู่บนจอ | `nudge` |
| **ปุ่ม Let's talk** มุมขวาบน | ทุกหน้า | `headerPill` |
| **บทที่ 05 "The next world"** ท้าย The story so far | ตลอด | (`partner.enabled`) |
| **ด่าน 05 Next world** (ล็อกอยู่) ท้ายแถบเลือกด่านใน Featured world | ตลอด | (`partner.enabled` + `effects.levels`) |
| **ปุ่ม "Back the next world"** | ตอนวิดีโอเดโมเล่นจบ ทั้งในหน้าต่างเล่นวิดีโอและในหน้าโปรเจกต์ | `afterVideo` |
| **กล่องใต้สถานะ Paused** ในหน้าโปรเจกต์ | เฉพาะโปรเจกต์ที่สถานะเป็น `paused` | `projectNote` |
| **ปุ่ม Write to me** ในส่วนปิดท้าย | ทุกหน้า (ถ้าปิด จะเป็นลิงก์อีเมลธรรมดา) | `footer` |
| **ตัวเลขนับขึ้น** | ตอนเลื่อนมาเจอ | `countUp` |

ส่วน Partner ("Back the next world.") มีสามช่วง:
- **ข้อความ:** บอกว่างานยัง early แต่เดินเร็ว
- **ตัวเลขจริง:** 3 ตัว
- **สิ่งที่การสนับสนุนจะปลดล็อก:** Hardware, Fidelity และ Scale (`partner.unlocks`)

ปุ่ม **Let's talk** เปิดอีเมลที่เขียนหัวเรื่องและข้อความเริ่มต้นไว้ให้แล้ว (`emailBody`) และมีปุ่ม **Copy email** สำหรับคนที่ไม่ได้ตั้งแอปอีเมลไว้

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

**วิดีโอ:** ครบแล้ว ใช้วิดีโอ Last update ตัวเดียว
- เดโมเต็ม `public/media/forest-concept/2026-09-25-last-update.mp4`: 1280×720, 30fps, มีเสียง, 19MB
- preview `…-last-update-preview.mp4`: 8 วินาที ตัดจากช่วง 0:52–1:00 ไม่มีเสียง, 3.5MB
- poster: เฟรมแรกของวิดีโอ ความละเอียด 2560×1440 (ใช้เป็นภาพ Hero, ภาพปก และภาพ social preview ด้วย)

ทั้งหมดทำขนาดไว้ไม่ให้เกิน 25MB เพื่อให้อัปโหลดผ่านหน้าเว็บ GitHub ได้
ถ้าจะเพิ่มวิดีโอช่วงอื่นทีหลัง ให้ทำตามหัวข้อ **สื่อ** ด้านบน
(ถ้ารัน `npm run media` กับไฟล์ต้นฉบับ Last update ใหม่ สคริปต์จะทำไฟล์กว้าง 1920px ซึ่งอาจเกิน 25MB)

**ดีไซน์ใหม่ (redesign):** ฟุตเทจทุกชิ้นเป็นของจริงจากคลิป Last update ไม่มีภาพ stock และไม่มีโลโก้หรือคำชมที่ไม่มีจริง
แถบ "Built with" ใช้แค่ชื่อเครื่องมือที่คุณใช้จริง ไม่ได้บอกว่าบริษัทเหล่านั้นรับรอง

**ข้อมูลที่ควรยืนยัน**
- ข้อความในส่วน Partner (`partner.lead`, `partner.body`, `partner.unlocks`) เป็นวิสัยทัศน์ที่ผมเขียนจากสิ่งที่คุณบอก ควรอ่านอีกรอบให้ตรงกับแผนจริง
- ข้อความ "Made on a 16GB MacBook" และ "The latest demo was made on a 16GB MacBook" มาจากโพสต์ 25 ก.ย. ที่บอกว่า MacBook 16GB เริ่มไม่ไหวกับ Unreal ถ้าเครื่องที่ใช้ทำไม่ใช่เครื่องนี้ ให้แก้ใน `site.ts` → `partner.madeOn` และ `partner.nudge.text`
- ตัวเลขทั้งหมด (แถบ So far, ยอดวิวรายบท และส่วน Partner) นับจากโพสต์บน X ณ 26 ก.ย. 2026 ถ้าอัปเดตตัวเลข ให้แก้วันที่ใน `proof.asOf`, `story.statsAsOf` และ `partner.proofNote` ด้วย
- ชื่อโปรเจกต์: โพสต์ไม่ได้ระบุชื่อ จึงใช้ "Forest Concept" เป็นชื่อชั่วคราว (`workingTitle: true`)
- ส่วน Partner: ยอดวิวและยอดไลก์นับจาก 4 โพสต์บน X ณ 26 ก.ย. 2026 ถ้าจะอัปเดตตัวเลข ให้เปลี่ยนวันที่ใน `proofNote` ด้วย
- ข้อความ Hero, About และ Partner ควรอ่านอีกรอบให้ตรงกับน้ำเสียงของคุณ
- ถ้าจะใช้โดเมนของตัวเอง → `site.ts` → `url`

---

## โครงสร้าง

```
src/
  data/        ← เนื้อหาทั้งหมด (แก้ตรงนี้เป็นหลัก)
  assets/media ← ภาพผลงาน (ระบบปรับขนาดให้)
  components/  ← หน้าแรก: Hero → ProofBand (So far) → FeaturedWorld → DevlogLatest (Devlog) → About (The lab) → Story (บท 01–05) → Partner → Footer (ปิดท้าย)
                 (SignalBar กับ LabNotes เหลือไว้เป็นไฟล์ที่ชี้ไปยังของใหม่ เพื่อให้ build ผ่านแม้ไฟล์เก่ายังค้างใน GitHub)
                 อื่น ๆ: Header (+ เมนูมือถือ), Media (ภาพ/วิดีโอ), Lightbox, PartnerNudge (การ์ดมุมจอ), Arrow, ...
  pages/       ← index, work/[slug], devlog (+ config.json), studio (หน้าโพสต์อัปเดต), 404
  scripts/     ← site.ts (header, fade-in, วิดีโอ, หน้าต่างเล่นวิดีโอ) + fx.ts (เอฟเฟกต์)
                 + partner.ts (การ์ดมุมจอ, Copy email) + intro.ts (ตัวเลขนับขึ้น, Loading world)
                 + scramble.ts (ตัวอักษรถอดรหัส ใช้ร่วมกันหลายที่)
                 site.ts ยังมีเมนูมือถือ และตัวเลื่อน build + แถบเลือกด่านของ Featured world
  styles/      ← global.css (สี, ฟอนต์, ตัวแปร)
scripts/media.mjs ← npm run media (เตรียมวิดีโอ/poster จากไฟล์ต้นฉบับ)
media-src/     ← วิดีโอต้นฉบับ (ไม่ขึ้น GitHub)
server.mjs     ← server สำหรับ production (npm start)
server/        ← devlog.mjs (studio API, เก็บไฟล์, ย่อคลิปด้วย ffmpeg) + render.mjs (HTML ของ Devlog)
railway.json   ← ค่าตั้ง Railway
public/
  media/       ← วิดีโอ
  fonts/       ← ฟอนต์ (SIL OFL)
  og.jpg       ← ภาพ social preview 1200×630
```

รายละเอียดการออกแบบ: พื้น charcoal, accent สีเดียว (`--accent` เขียว sage อ่อน),
Newsreader (serif) / Geist / Geist Mono, ขนาดตัวอักษรเล็กและโปร่ง, motion 180–350ms,
ไม่มี custom cursor, ไม่มี scroll-jacking, รองรับ reduced motion และ keyboard focus ทุกจุด
การเปลี่ยนหน้าใช้ CSS View Transitions (Chrome, Edge และ Safari 18.2+ เบราว์เซอร์อื่นเปลี่ยนหน้าตามปกติ)
