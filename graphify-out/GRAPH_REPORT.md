# Graph Report - sout_al_ahzan_web  (2026-11-03)

## Corpus Check
- 190 files · ~79,881 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: .css 21, (none) 3, .ico 1)

## Summary
- 1149 nodes · 2713 edges · 73 communities (48 shown, 25 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- واجهات الخادم والإدارة
- صفحة الرادود وأدوات تعديله
- الحساب وتسجيل الدخول
- صفحات التعريف والتواصل
- تدقيق التخزين
- عناوين الصفحات لمحركات البحث
- المكتبة الجانبية
- البحث وسجله
- سير عمل IndexNow
- الرئيسية وأحدث الإصدارات
- سير عمل التخزين
- صيانة المكتبة
- حزم المشروع وESLint
- سير عمل الصور المصغرة
- الاستكشاف والراديو
- قوائم التشغيل
- تنظيف العناوين
- أدوات الصيانة المشتركة
- رفوف الرئيسية الإضافية
- صفحة البحث وصور الرواديد
- بطاقات الأقسام
- لوحة «يُشغَّل الآن»
- تصنيف الأقسام
- هيكل الموقع والتذييل
- المشغّل والتنزيل
- إعدادات TypeScript
- صفحة المقطع وتعديله
- الإصدارات من مصدرها
- إعدادات Next والتخطيطات
- توحيد أسماء الرواديد
- الملفات اليتيمة
- بيان التطبيق
- توليد الصور المصغرة
- إسناد الرادود
- ألوان الصفحات
- سير عمل المكتبة
- مدخلات سير المكتبة
- التخطيط الجذري للموقع
- خطوات سير المكتبة
- متغيرات سير المكتبة
- سكربت البناء
- هياكل التحميل
- صفحة القسم
- خريطة الموقع
- وضع سير المكتبة
- مدخل الملفات
- مدخل الرادود
- مشغّلات سير المكتبة
- تخطيط صفحة القسم
- وسيط الواجهات
- إرسال IndexNow
- تخطيط التواصل
- تخطيط الاستكشاف
- تخطيط المساعدة
- تخطيط الوظائف
- صفحة غير موجودة
- تخطيط القوائم
- تخطيط الملف الشخصي
- تخطيط الناشرين
- تخطيط الراديو
- ملف robots
- تخطيط البحث
- تخطيط الإعدادات
- تخطيط الدعم
- تخطيط الرفع

## God Nodes (most connected - your core abstractions)
1. `react` - 65 edges
2. `next` - 61 edges
3. `thumb()` - 49 edges
4. `usePlayer()` - 44 edges
5. `countOf()` - 42 edges
6. `lucide-react` - 39 edges
7. `json()` - 32 edges
8. `InfoHero()` - 27 edges
9. `InfoPage()` - 27 edges
10. `usePlaylists()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `handle()` --calls--> `githubWorkflowCaller()`  [EXTRACTED]
  functions/api/admin/library.js → cloudflare/github-oidc.js
- `onRequestPost()` --calls--> `githubWorkflowCaller()`  [EXTRACTED]
  functions/api/link-reciter.js → cloudflare/github-oidc.js
- `onRequestGet()` --calls--> `githubWorkflowCaller()`  [EXTRACTED]
  functions/api/storage.js → cloudflare/github-oidc.js
- `mayStore()` --calls--> `githubWorkflowCaller()`  [EXTRACTED]
  functions/api/thumbs.js → cloudflare/github-oidc.js
- `onRequestGet()` --calls--> `githubWorkflowCaller()`  [EXTRACTED]
  functions/api/thumbs.js → cloudflare/github-oidc.js

## Import Cycles
- None detected.

## Communities (73 total, 25 thin omitted)

### Community 0 - "واجهات الخادم والإدارة"
Cohesion: 0.05
Nodes (75): decodeJson(), fromBase64Url(), githubWorkflowCaller(), signingKey(), ALIASES_KEY, aliasesAfterMerge(), allReciters(), HONORIFICS (+67 more)

### Community 1 - "صفحة الرادود وأدوات تعديله"
Cohesion: 0.07
Nodes (54): metadata, ReciterPage(), ReciterEditor(), Album, AlbumCard(), albumsOf(), byListens(), byNewest() (+46 more)

### Community 2 - "الحساب وتسجيل الدخول"
Cohesion: 0.07
Nodes (44): supabase, { createClient }, supabase, dependencies, lucide-react@^1.48.0, next@16.2.10, react@19.2.4, @supabase/supabase-js@^2.110.0 (+36 more)

### Community 3 - "صفحات التعريف والتواصل"
Cohesion: 0.11
Nodes (37): AboutPage(), librarySize(), metadata, AdsPage(), metadata, ArtistsPage(), ContactPage(), SOCIAL (+29 more)

### Community 4 - "تدقيق التخزين"
Cohesion: 0.05
Nodes (36): absent, already, bearer(), bucket(), byKey, dupes, external, externalAudio (+28 more)

### Community 5 - "عناوين الصفحات لمحركات البحث"
Cohesion: 0.15
Nodes (29): CATEGORY_NAMES, categoryName(), escapeHtml(), isValidId(), query(), SITE_NAME, SITE_URL, SUPABASE_KEY (+21 more)

### Community 6 - "المكتبة الجانبية"
Cohesion: 0.10
Nodes (32): coverOf(), Dialog, Filter, LibraryDialog(), LibraryMenu(), Menu, MenuItem, MoreButton() (+24 more)

### Community 7 - "البحث وسجله"
Cohesion: 0.14
Nodes (23): CATEGORY_ICONS, Art(), categoriesFor(), CATEGORY_COLOR, hrefOf(), Item, Row, SearchBox() (+15 more)

### Community 8 - "سير عمل IndexNow"
Cohesion: 0.07
Nodes (28): concurrency, cancel-in-progress, group, MODE, runs-on, steps, timeout-minutes, mode (+20 more)

### Community 9 - "الرئيسية وأحدث الإصدارات"
Cohesion: 0.13
Nodes (23): Home(), jsonLd, metadata, revalidate, Seed, dailyMessage(), HomeClientProps, known() (+15 more)

### Community 10 - "سير عمل التخزين"
Cohesion: 0.07
Nodes (27): runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, jobs, audit (+19 more)

### Community 11 - "صيانة المكتبة"
Cohesion: 0.09
Nodes (24): byFolder, byKey, categories, coverOf, deadAudio, deadCovers, deadStems, durations (+16 more)

### Community 12 - "حزم المشروع وESLint"
Cohesion: 0.10
Nodes (24): eslintConfig, react-dom@19.2.4, devDependencies, eslint@^9, eslint-config-next@16.2.10, @types/node@^20, @types/react@^19, @types/react-dom@^19 (+16 more)

### Community 13 - "سير عمل الصور المصغرة"
Cohesion: 0.08
Nodes (25): concurrency, cancel-in-progress, group, jobs, thumbs, name, on, push (+17 more)

### Community 14 - "الاستكشاف والراديو"
Cohesion: 0.16
Nodes (19): ExploreContent(), ExplorePage(), Kind, KINDS, tracksPage(), pick(), RadioContent(), RadioPage() (+11 more)

### Community 15 - "قوائم التشغيل"
Cohesion: 0.18
Nodes (18): Cover(), dateOf(), day, PlaylistIndex(), PlaylistsContent(), PlaylistsPage(), PlaylistView(), shuffled() (+10 more)

### Community 16 - "تنظيف العناوين"
Cohesion: 0.10
Nodes (22): byKey, byReason, byTitle, cleaned, cleanTitle(), clips, copies, crossReciter (+14 more)

### Community 17 - "أدوات الصيانة المشتركة"
Cohesion: 0.13
Nodes (17): sha, asked, byKey, redo, bearer(), bucket(), call(), distance() (+9 more)

### Community 18 - "رفوف الرئيسية الإضافية"
Cohesion: 0.18
Nodes (22): andJoin(), bestOf(), blend(), byListens, CategoryShelf(), FansOf(), GRAINS, guestNames() (+14 more)

### Community 19 - "صفحة البحث وصور الرواديد"
Cohesion: 0.13
Nodes (14): Browse(), CATEGORY_TITLE, Found, SearchContent(), SearchPage(), Tab, trackQuery(), PlayerContext (+6 more)

### Community 20 - "بطاقات الأقسام"
Cohesion: 0.24
Nodes (19): Results(), CATEGORY_MAP, CategoryClient(), shuffled(), ReciterOfTheDay(), CategoryTiles(), NewReleaseCard(), QuickTracks() (+11 more)

### Community 21 - "لوحة «يُشغَّل الآن»"
Cohesion: 0.18
Nodes (19): ContextBar(), UpNext(), BIO_FIELDS, CREDIT_FIELDS, Extras, known, listensOfReciter(), load() (+11 more)

### Community 22 - "تصنيف الأقسام"
Cohesion: 0.12
Nodes (19): byReciter, byTitle, changes, CODE, codeOf(), CODES, forms(), FROM_POEMS (+11 more)

### Community 23 - "هيكل الموقع والتذييل"
Cohesion: 0.17
Nodes (16): ClientLayout(), ContextBarWrapper(), COLUMNS, Footer(), LEGAL, SOCIAL, MobileBottomNav(), AuthProvider() (+8 more)

### Community 24 - "المشغّل والتنزيل"
Cohesion: 0.15
Nodes (15): clock(), PlayerBar(), Slider(), spoken(), DownloadResult, downloadTrack(), compact, CountForms (+7 more)

### Community 25 - "إعدادات TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 26 - "صفحة المقطع وتعديله"
Cohesion: 0.17
Nodes (15): metadata, TrackPage(), TrackEditor(), byListens, NO_RELATED, readRelated(), Related, Row (+7 more)

### Community 27 - "الإصدارات من مصدرها"
Cohesion: 0.15
Nodes (10): allPages(), attr(), FILES, page(), pause(), readReleases(), readTracks(), index (+2 more)

### Community 28 - "إعدادات Next والتخطيطات"
Cohesion: 0.12
Nodes (5): nextConfig, next, metadata, metadata, metadata

### Community 29 - "توحيد أسماء الرواديد"
Cohesion: 0.13
Nodes (12): arabic(), groups, ids, keyOf(), keys, LATIN, moves, renames (+4 more)

### Community 30 - "الملفات اليتيمة"
Cohesion: 0.16
Nodes (10): byKey, category(), fold(), folderReciter, forms(), orphans, PREFIXES, WORDS (+2 more)

### Community 31 - "بيان التطبيق"
Cohesion: 0.15
Nodes (12): background_color, description, dir, display, icons, id, lang, name (+4 more)

### Community 32 - "توليد الصور المصغرة"
Cohesion: 0.18
Nodes (8): bearer(), covers, existing(), failures, links, make(), result, todo

### Community 33 - "إسناد الرادود"
Cohesion: 0.21
Nodes (12): broken, walk(), used, byKey, content(), moves, RECITER, same() (+4 more)

### Community 34 - "ألوان الصفحات"
Cohesion: 0.23
Nodes (12): ACCENT, clamp(), css(), fit(), hsl(), known, lightnessWithin(), luminance() (+4 more)

### Community 35 - "سير عمل المكتبة"
Cohesion: 0.17
Nodes (11): concurrency, cancel-in-progress, group, jobs, library, runs-on, timeout-minutes, name (+3 more)

### Community 36 - "مدخلات سير المكتبة"
Cohesion: 0.20
Nodes (10): description, required, type, category, titles, workflow_dispatch, description, required (+2 more)

### Community 37 - "التخطيط الجذري للموقع"
Cohesion: 0.22
Nodes (7): amiriQuran, metadata, RootLayout(), rubik, SHARE_IMAGE, viewport, COVER_FALLBACK_SCRIPT

### Community 38 - "خطوات سير المكتبة"
Cohesion: 0.25
Nodes (8): steps, if, name, run, uses, with, node-version, python-version

### Community 39 - "متغيرات سير المكتبة"
Cohesion: 0.29
Nodes (7): CATEGORY, FILES, GITHUB_TOKEN, MODE, RECITER, TITLES, env

### Community 40 - "سكربت البناء"
Cohesion: 0.29
Nodes (4): env, next, options, { status, error }

### Community 41 - "هياكل التحميل"
Cohesion: 0.57
Nodes (5): Loading(), CardSkeleton(), HorizontalCardSkeleton(), Skeleton(), SkeletonProps

### Community 42 - "صفحة القسم"
Cohesion: 0.33
Nodes (3): CATEGORY_MAP, CategoryPageServer(), Props

### Community 43 - "خريطة الموقع"
Cohesion: 0.33
Nodes (4): ABOUT, BROWSE, CATEGORIES, dynamic

### Community 44 - "وضع سير المكتبة"
Cohesion: 0.40
Nodes (5): mode, default, description, options, type

### Community 46 - "مدخل الملفات"
Cohesion: 0.50
Nodes (4): description, required, type, files

### Community 47 - "مدخل الرادود"
Cohesion: 0.50
Nodes (4): reciter, description, required, type

### Community 48 - "مشغّلات سير المكتبة"
Cohesion: 0.50
Nodes (4): on, push, branches, paths

## Knowledge Gaps
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `توحيد أسماء الرواديد` to `تنظيف العناوين`, `إسناد الرادود`, `صيانة المكتبة`, `تصنيف الأقسام`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Should `واجهات الخادم والإدارة` be split into smaller, more focused modules?**
  _Cohesion score 0.05313131313131313 - nodes in this community are weakly interconnected._
- **Why does `next` connect `إعدادات Next والتخطيطات` to `صفحة الرادود وأدوات تعديله`, `الحساب وتسجيل الدخول`, `صفحات التعريف والتواصل`, `المكتبة الجانبية`, `البحث وسجله`, `الرئيسية وأحدث الإصدارات`, `حزم المشروع وESLint`, `الاستكشاف والراديو`, `قوائم التشغيل`, `رفوف الرئيسية الإضافية`, `صفحة البحث وصور الرواديد`, `بطاقات الأقسام`, `لوحة «يُشغَّل الآن»`, `هيكل الموقع والتذييل`, `المشغّل والتنزيل`, `صفحة المقطع وتعديله`, `التخطيط الجذري للموقع`, `صفحة القسم`, `خريطة الموقع`, `تخطيط التواصل`, `تخطيط الاستكشاف`, `تخطيط المساعدة`, `تخطيط الوظائف`, `صفحة غير موجودة`, `تخطيط القوائم`, `تخطيط الملف الشخصي`, `تخطيط الناشرين`, `تخطيط الراديو`, `ملف robots`, `تخطيط البحث`, `تخطيط الإعدادات`, `تخطيط الدعم`, `تخطيط الرفع`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `صفحة الرادود وأدوات تعديله` be split into smaller, more focused modules?**
  _Cohesion score 0.0710085933966531 - nodes in this community are weakly interconnected._
- **Why does `react` connect `الحساب وتسجيل الدخول` to `صفحة الرادود وأدوات تعديله`, `صفحات التعريف والتواصل`, `المكتبة الجانبية`, `البحث وسجله`, `الرئيسية وأحدث الإصدارات`, `حزم المشروع وESLint`, `الاستكشاف والراديو`, `قوائم التشغيل`, `رفوف الرئيسية الإضافية`, `صفحة البحث وصور الرواديد`, `بطاقات الأقسام`, `لوحة «يُشغَّل الآن»`, `هيكل الموقع والتذييل`, `المشغّل والتنزيل`, `صفحة المقطع وتعديله`, `إعدادات Next والتخطيطات`, `ألوان الصفحات`, `التخطيط الجذري للموقع`, `هياكل التحميل`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `الحساب وتسجيل الدخول` be split into smaller, more focused modules?**
  _Cohesion score 0.0689484126984127 - nodes in this community are weakly interconnected._
- **Should `صفحات التعريف والتواصل` be split into smaller, more focused modules?**
  _Cohesion score 0.11085972850678733 - nodes in this community are weakly interconnected._