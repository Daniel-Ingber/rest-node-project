<div dir="rtl">

# שרת REST לכרטיסי ביקור

[English](README.md) | **עברית**

שרת REST API לאפליקציית כרטיסי ביקור, כתוב ב-**Node.js**, ב-**TypeScript** וב-**MongoDB**.

משתמשים רגילים יכולים לצפות בכרטיסים ולסמן להם לייק, משתמשים עסקיים יכולים לפרסם כרטיסים
משלהם ולנהל אותם, ומנהל המערכת (admin) יכול לראות את כל המשתמשים ולתת לכרטיס מספר עסקי חדש.

---

## תוכן עניינים

- [התחלה מהירה](#התחלה-מהירה)
- [סביבות הרצה](#סביבות-הרצה)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [המסלול של בקשה בשרת](#המסלול-של-בקשה-בשרת)
- [אימות והרשאות](#אימות-והרשאות)
- [תיעוד ה-API](#תיעוד-ה-api)
- [מודלי הנתונים](#מודלי-הנתונים)
- [ולידציה](#ולידציה)
- [נתונים ראשוניים](#נתונים-ראשוניים)
- [בונוסים](#בונוסים)
- [תשובות שגיאה](#תשובות-שגיאה)
- [לוגים](#לוגים)

---

## התחלה מהירה

### דרישות

- Node.js בגרסה 24 ומעלה (השרת מריץ את קבצי ה-TypeScript ישירות, בלי שלב build)
- MongoDB - שרת מקומי בכתובת `mongodb://localhost:27017` או cluster ב-Atlas
- pnpm (הפרויקט נעול על `pnpm@10.28.2`)

### התקנה

</div>

```bash
pnpm install
```

<div dir="rtl">

### הרצה

</div>

```bash
pnpm dev     # development - local MongoDB, port 3000, reloads on change (nodemon)
pnpm test    # test        - local MongoDB, port 8081
pnpm prod    # production  - MongoDB Atlas, port 80
```

<div dir="rtl">

`pnpm dev` ו-`pnpm prod` מעבירים את הפלט דרך `pino-pretty`. בעלייה השרת מדפיס את הכתובת שלו:

</div>

```
Server runs on: http://localhost:3000
```

<div dir="rtl">

כל הנתיבים יושבים תחת הקידומת `/api/v1`, למשל `http://localhost:3000/api/v1/cards`.

### לנסות את השרת

בתיקייה `rest/` יש בקשות מוכנות עבור התוסף
[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
של VS Code:

1. פותחים את `rest/users.rest` (או את `rest/cards.rest`)
2. מעדכנים את `@host` לפורט של הסביבה שרצה - הקבצים מכוונים לפורט `80` (`pnpm prod`),
   ובשביל `pnpm dev` צריך `http://localhost:3000/api/v1`
3. שולחים את בקשת ההתחברות של אחד [המשתמשים הראשוניים](#נתונים-ראשוניים)
4. מעתיקים את הטוקן מהתשובה למשתנה `@token` בראש הקובץ

מעכשיו כל שאר הבקשות בקובץ מוכנות לשליחה.

---

## סביבות הרצה

קבצי הסביבה נמצאים ב-`src/config` ונטענים על ידי [dotenvx](https://dotenvx.com) דרך
הסקריפטים של `package.json`. כל סקריפט טוען **קודם** את הקובץ של הסביבה שלו ורק אחריו
את קובץ `.env` המשותף. dotenvx שומר את הערך הראשון שהוא פוגש, ולכן `.env` מחזיק את ערכי
ברירת המחדל, וקובץ הסביבה דורס רק את מה שמשתנה:

| קובץ | סביבה | מה הוא קובע |
| --- | --- | --- |
| `.env` | ברירות מחדל משותפות | פורט `80`, `CLIENT_URL`, `APP_NAME`, `JWT_SECRET` |
| `.env.development` | `pnpm dev` | מסד מקומי `biz_cards_dev`, פורט `3000`, לוגים ברמת `debug` |
| `.env.test` | `pnpm test` | מסד מקומי, פורט `8081` |
| `.env.production` | `pnpm prod` | MongoDB Atlas, הלקוח שב-GitHub Pages, לוגים של `error` בלבד |

| משתנה | משמעות |
| --- | --- |
| `DB_CONNECTION_STRING` | מחרוזת החיבור ל-MongoDB |
| `PORT` | הפורט שהשרת מאזין עליו |
| `CLIENT_URL` | הכתובת של אפליקציית הלקוח - היא נוספת לרשימת ה-CORS המותרת |
| `NODE_ENV` | `development` / `test` / `production` |
| `LOG_LEVEL` | `fatal` / `error` / `info` / `debug` |
| `APP_NAME` | שם האפליקציה |
| `JWT_SECRET` | הסוד שבו נחתמים הטוקנים |

`src/config/index.ts` בודק את כולם עם סכמת Zod **לפני** שהשרת עולה. משתנה חסר או שגוי
עוצר את התהליך עם הודעה ברורה, במקום לתת לשרת לרוץ עם הגדרות חלקיות.

> קבצי הסביבה נמצאים ב-git כדי שיהיה קל לבדוק את הפרויקט. באפליקציה אמיתית הם מכילים
> סודות ומקומם ב-`.gitignore`.

---

## מבנה הפרויקט

</div>

```
rest/                    Ready made requests for the REST Client extension
logs/                    The daily files of the file logger (created on the first failure)
src/
├── @types/              Type declarations that extend express (req.user) and jose (the payload)
├── config/              The .env files and their validation
├── database/
│   ├── connect.ts       Opens the connection and initializes the data
│   ├── init-db.ts       Creates the initial users and cards
│   ├── initial-users.ts Three users - regular, business and admin
│   ├── initial-cards.ts Three business cards
│   ├── models.ts        The mongoose models and their custom methods
│   └── schemas/         The mongoose schemas (user, card, name, address, image)
├── error/               HttpError and NotFoundError
├── middleware/          Everything that runs before and after the routes, the logger included
├── routes/              The endpoints themselves
├── services/            The logic - auth, users and cards; the only place that talks to the database
├── validations/         The Zod schemas of everything the client sends
└── index.ts             Builds the express application
```

<div dir="rtl">

הרעיון שמאחורי החלוקה הוא ש**לכל שכבה יש תפקיד אחד**:

- **route** קורא את הבקשה ועונה עליה, ותו לא
- **middleware** שומר על ה-route - טוקן, תפקיד, המבנה של גוף הבקשה
- **service** מחזיק את הלוגיקה, והוא השכבה היחידה שנוגעת במודלים
- **validation** מתאר איך נראה אובייקט חוקי שמגיע מהלקוח
- **schema** מתאר איך נראה מסמך חוקי במסד הנתונים

---

## המסלול של בקשה בשרת

`src/index.ts` רושם את ה-middlewares לפי הסדר שבו הם רצים:

1. **CORS** (`middleware/cors.ts`) - רק `CLIENT_URL` ו-`http://localhost:5173` (Vite)
   רשאים לפנות ל-API מדפדפן. בקשות בלי כותרת `Origin` (REST Client, Postman, curl) עוברות
2. **לוגר בקשות** (`morgan`) - כותב שורה אחת לכל בקשה אל הלוגר של האפליקציה
3. **`fileLogger`** - עוקב אחרי התשובה וכותב אותה לקובץ כשהיא נכשלת
4. **`express.json()`** - מפרסר גוף JSON אל `req.body`
5. **הראוטרים** - `/api/v1/users` ו-`/api/v1/cards`
6. **`notFound`** - עונה `404` לכתובת שאף route לא התאים לה
7. **`fileErrorLogger`** - שומר את השגיאה על התשובה כדי שה-file logger יוכל לקרוא אותה
8. **`errorHandler`** - הופך כל שגיאה שנזרקה לתשובת JSON

בתוך route הסדר תמיד זהה:

</div>

```ts
router.put("/:id", ...isCardOwner, validateCard, async (req, res) => { ... });
//                 │               │
//                 │               └── is the body legal?
//                 └── is there a valid token, and is this user allowed?
```

<div dir="rtl">

ההרשאה רצה **לפני** הוולידציה בכוונה - משתמש שאסור לו לגעת במשאב לא אמור ללמוד שום דבר
על המבנה שלו.

---

## אימות והרשאות

### הטוקן

`POST /users/login` עונה עם **JWT** (נחתם עם `jose`, באלגוריתם HS256) בעזרת `JWT_SECRET`,
שתוקפו פג אחרי שעתיים. ה-payload שלו מחזיק בדיוק את מה שבדיקות ההרשאה צריכות:

</div>

```json
{ "_id": "6aad...", "isBusiness": true, "isAdmin": false }
```

<div dir="rtl">

כל בקשה מוגנת שולחת אותו בחזרה בכותרת:

</div>

```
Authorization: bearer <token>
```

<div dir="rtl">

### השומרים (guards)

`validateToken` קורא את הכותרת, מאמת את החתימה, טוען את המשתמש ממסד הנתונים ושם אותו
על `req.user`. כל שאר השומרים בנויים מעליו ומיוצאים כמערך, כך שה-route פורס אותם לתוך
ה-handlers שלו:

| שומר | קובץ | עובר כאשר |
| --- | --- | --- |
| `validateToken` | `validate-token.ts` | הטוקן תקין והמשתמש עדיין קיים |
| `isAdmin` | `is-admin.ts` | `isAdmin` הוא true |
| `isBusiness` | `is-business.ts` | `isBusiness` או `isAdmin` הוא true |
| `isOwnerOrAdmin` | `is-owner-or-admin.ts` | ה-id בכתובת הוא ה-id של המשתמש, או שהמשתמש הוא admin |
| `isCardOwner` | `is-card-owner.ts` | הכרטיס שבכתובת נוצר על ידי המשתמש |
| `isCardOwnerOrAdmin` | `is-card-owner.ts` | הכרטיס נוצר על ידי המשתמש, או שהמשתמש הוא admin |

כותרת חסרה או פגומה עונה `400`, טוקן של משתמש שנמחק עונה `401`, ושומר שמסרב עונה `403`.

---

## תיעוד ה-API

כל הכתובות מתחילות ב-`/api/v1`.

### משתמשים

| # | מתודה | כתובת | מי רשאי | מה זה עושה |
| --- | --- | --- | --- | --- |
| 1 | POST | `/users` | כולם | רושם משתמש חדש, האימייל חייב להיות פנוי |
| 2 | POST | `/users/login` | כולם | מחזיר טוקן |
| 3 | GET | `/users` | admin | מחזיר את כל המשתמשים |
| 4 | GET | `/users/:id` | המשתמש עצמו או admin | מחזיר משתמש אחד |
| 5 | PUT | `/users/:id` | המשתמש עצמו או admin | עורך את המשתמש (הכול חוץ מהסיסמה) |
| 6 | PATCH | `/users/:id` | המשתמש עצמו או admin | הופך את הסטטוס `isBusiness` |
| 7 | DELETE | `/users/:id` | המשתמש עצמו או admin | מוחק את המשתמש |

הסיסמה אף פעם לא חוזרת בתשובה - הסכמה עצמה מסתירה אותה (`select: false`), כך שהיא לא
יכולה לדלוף בטעות משאילתה ששכחה להוציא אותה.

`isAdmin` לא חלק מאובייקט ההרשמה. לקוח לא יכול להפוך את עצמו ל-admin; ה-admin היחיד
הוא זה שנוצר ב[נתונים הראשוניים](#נתונים-ראשוניים).

### כרטיסים

| # | מתודה | כתובת | מי רשאי | מה זה עושה |
| --- | --- | --- | --- | --- |
| 1 | GET | `/cards` | כולם | מחזיר את כל הכרטיסים |
| 2 | GET | `/cards/my-cards` | משתמש רשום | מחזיר את הכרטיסים של המשתמש |
| 3 | GET | `/cards/:id` | כולם | מחזיר כרטיס אחד |
| 4 | POST | `/cards` | משתמש עסקי או admin | יוצר כרטיס |
| 5 | PUT | `/cards/:id` | יוצר הכרטיס | עורך את הכרטיס |
| 6 | PATCH | `/cards/:id` | משתמש רשום | מסמן לייק, קריאה שנייה מבטלת אותו |
| 7 | DELETE | `/cards/:id` | היוצר או admin | מוחק את הכרטיס |
| * | PATCH | `/cards/:id/biz-number` | admin | נותן לכרטיס מספר עסקי חדש ([בונוס](#1-שינוי-מספר-עסקי)) |

`/cards/my-cards` נרשם **לפני** `/cards/:id`, אחרת express היה קורא את `my-cards` כ-id.

### תשובות

כל תשובה היא אובייקט JSON שעוטף את המידע במפתח עם שם:

| בקשה | תשובה |
| --- | --- |
| `POST /users` | `{ "message": "User Saved!", "user": { ... } }` (`201`) |
| `POST /users/login` | `{ "message": "Logged in!", "token": "eyJhbGciOiJ..." }` |
| `GET /users` | `{ "users": [ ... ] }` |
| כל route אחר של משתמשים | `{ "user": { ... } }` |
| `GET /cards` | `{ "cards": [ ... ] }` |
| `GET /cards/my-cards` | `{ "myCards": [ ... ] }` |
| כל route אחר של כרטיסים | `{ "card": { ... } }` (`201` ביצירה) |

---

## מודלי הנתונים

### משתמש

</div>

```jsonc
{
  "name":    { "first": "test", "middle": "", "last": "test" },
  "address": { "state": "", "country": "country", "city": "city",
               "street": "street", "houseNumber": 1, "zip": "11111" },
  "image":   { "url": "https://...", "alt": "user-profile" },
  "phone":       "0501111111",
  "email":       "user@user.com",   // unique
  "password":    "<bcrypt hash>",   // never returned
  "isAdmin":     false,             // set by the server only
  "isBusiness":  false,
  "createdAt":   "2026-09-18T00:00:00.000Z"
  // failedLoginAttempts, blockedUntil - hidden, see the blocking bonus
}
```

<div dir="rtl">

### כרטיס

</div>

```jsonc
{
  "title":       "card",
  "subtitle":    "subtitle",
  "description": "description",
  "phone":       "0501111111",
  "email":       "card@card.com",
  "web":         "https://card.com",
  "image":     { "url": "https://...", "alt": "card" },
  "address":   { "state": "", "country": "country", "city": "city",
                 "street": "street", "houseNumber": 1, "zip": "11111" },
  "bizNumber":  1234567,   // unique, 7 digits, created by the server
  "likes":      [],        // the ids of the users that liked the card
  "userId":     "6aad...", // the id of the user that created the card
  "createdAt":  "2026-09-18T00:00:00.000Z"
}
```

<div dir="rtl">

`name`, `address` ו-`image` הן סכמות mongoose נפרדות (`database/schemas/`), כך שהמשתמש
והכרטיס חולקים בדיוק את אותן הגדרות במקום לחזור עליהן.

`models.ts` מוסיף שתי מתודות משלו למודל המשתמש:

- `user.setPassword(password)` - מתודה של מסמך, מצפינה את הסיסמה עם bcrypt ושומרת את המשתמש
- `UserModel.findByEmail(email)` - מתודה סטטית של האוסף

---

## ולידציה

כל אובייקט שמגיע מלקוח עובר פרסור של סכמת **Zod** לפני שה-handler של ה-route רואה אותו.
הסכמות נמצאות ב-`src/validations` ומשקפות את המודלים - `address`, `name` ו-`image` הן
סכמות קטנות שסכמות המשתמש והכרטיס בנויות עליהן, והביטויים הרגולריים המשותפים נמצאים
ב-`patterns.ts`.

`middleware/validate.ts` מחזיק factory גנרי אחד:

</div>

```ts
export function validateSchema<T>(schema: ZodType<T>): RequestHandler<any, any, T> {
  return async (req, res, next) => {
    req.body = await schema.parseAsync(req.body);
    next();
  };
}
```

<div dir="rtl">

הוא מפרסר את הגוף, מחליף אותו בערך **המפורסר** (כך שה-route עובד עם מידע שכבר נקי
ומוקלד), ומשאיר ל-error handler לענות במקרה של כישלון. כל ולידטור קונקרטי הוא אז שורה אחת:

| ולידטור | סכמה | בשימוש של |
| --- | --- | --- |
| `validateUser` | `userSchema` | `POST /users` |
| `validateLogin` | `loginSchema` - `email` ו-`password` מתוך `userSchema` | `POST /users/login` |
| `validateUserUpdate` | `userUpdateSchema` - `userSchema` בלי הסיסמה | `PUT /users/:id` |
| `validateCard` | `cardSchema` | `POST /cards`, `PUT /cards/:id` |
| `validateBizNumber` | `bizNumberSchema` | `PATCH /cards/:id/biz-number` |

הכללים עצמם:

| שדה | כלל |
| --- | --- |
| `email` | כתובת אימייל תקינה |
| `password` | 6-30 תווים, אות גדולה, אות קטנה, ספרה ואחד מהתווים `!@#$%^&*` |
| `phone` | מספר ישראלי, למשל `0501111111` או `+972501111111` |
| `web`, `image.url` | כתובת URL תקינה |
| `houseNumber` | מספר שלם בין 1 ל-9999 |
| `bizNumber` | מספר שלם בן 7 ספרות |

סכמת המשתמש וסכמת המספר העסקי הן `z.strictObject`, כך שגוף שמכיל מפתח שלא קיים בסכמה
נדחה, במקום שהמפתח יתעלם בשקט.

סכמות ה-mongoose חוזרות על הכללים החשובים - שדות חובה, אורכים ומפתחות ייחודיים. זה
בכוונה: Zod שומר על הגבול של האפליקציה, ו-mongoose שומר על מסד הנתונים עצמו, למשל מפני
מידע שנכתב על ידי הנתונים הראשוניים או על ידי סקריפט עתידי.

---

## נתונים ראשוניים

בכל עלייה בסביבה שאינה production, `database/init-db.ts` ממלא מסד נתונים ריק בשלושה
משתמשים ושלושה כרטיסים. אם באוסף כבר יש מסמכים לא נוצר כלום, כך שהפעלה מחדש של השרת
אף פעם לא משכפלת את המידע.

| אימייל | סיסמה | תפקיד |
| --- | --- | --- |
| `user1@user1.com` | `Aa123456!` | משתמש רגיל |
| `user2@user2.com` | `Aa123456!` | משתמש עסקי |
| `user3@user3.com` | `Aa123456!` | admin (וגם משתמש עסקי) |

שלושת הכרטיסים שייכים למשתמש העסקי, כך של-`GET /cards/my-cards` יש מה להחזיר מיד
אחרי העלייה הראשונה.

---

## בונוסים

### 1. שינוי מספר עסקי

`PATCH /cards/:id/biz-number` מאפשר ל**admin** לתת לכרטיס כל מספר עסקי שאף כרטיס אחר
לא מחזיק:

</div>

```http
PATCH /api/v1/cards/<id>/biz-number
Authorization: bearer <admin token>
Content-Type: application/json

{ "bizNumber": 7654321 }
```

<div dir="rtl">

`cardService.changeBizNumber` מחפש קודם כרטיס עם המספר הזה, ועונה
`400 The business number is aleardy taken` אם מצא. אותה ייחודיות נשמרת גם על ידי
`generateBizNumber`, שמגריל מספר אקראי בן 7 ספרות ומגריל שוב כל עוד המספר תפוס, וגם על
ידי אינדקס `unique` על השדה.

### 2. לוגר לקבצים

כל תשובה עם סטטוס **400 ומעלה** נכתבת לקובץ בתוך `logs/` (בתיקייה הראשית של הפרויקט),
שנקרא על שם התאריך של אותו יום. יום בלי בקשה שנכשלה לא יוצר קובץ, וקובץ שכבר קיים
מתווסף אליו ולעולם לא נדרס:

</div>

```
logs/log-2026-09-19.log

2026-09-19T14:27:18.851Z | 400 | "exp" claim timestamp check failed
2026-09-19T14:27:30.024Z | 400 | Login Failed - cannot find user email
2026-09-19T14:28:54.921Z | 403 | Must be admin or owner
```

<div dir="rtl">

כל שורה מחזיקה את שלושת הדברים שהתרגיל דורש - **תאריך הבקשה**, **קוד הסטטוס** ו**הודעת
השגיאה**. `middleware/file-logger.ts` בנוי משני חלקים, כי השגיאה וקוד הסטטוס ידועים
בשני רגעים שונים:

| חלק | איפה הוא רץ | מה הוא עושה |
| --- | --- | --- |
| `fileLogger` | לפני ה-routes | מאזין לאירוע `finish` של התשובה, וכותב את השורה כשהסטטוס 400 ומעלה |
| `fileErrorLogger` | ממש לפני ה-error handler | שם את השגיאה על `res.locals` כדי שהמאזין יוכל לקרוא את ההודעה שלה |

כישלון בלי אובייקט שגיאה - למשל כתובת שאף route לא התאים לה - נופל חזרה לשם של קוד
הסטטוס (`Not Found`), ושגיאת ולידציה נכתבת כרשימת השדות שנכשלו במקום כל הדוח שלה.
הודעות נחתכות ב-300 תווים, כך שכל כישלון תופס תמיד שורה אחת.

### 3. חסימת משתמש

משתמש ששולח **סיסמה שגויה שלוש פעמים ברצף** לא יכול להתחבר במשך **24 השעות** הבאות,
גם עם הסיסמה הנכונה:

</div>

```json
{ "message": "Login Failed - the user is blocked until 2026-09-19T19:40:17.813Z" }
```

<div dir="rtl">

הסטטוס של התשובה הוא `403`. שני שדות בסכמת המשתמש מחזיקים את המצב, ושניהם מוסתרים מכל
שאילתה רגילה עם `select: false` כך שהם אף פעם לא מגיעים ללקוח:

| שדה | משמעות |
| --- | --- |
| `failedLoginAttempts` | כמה סיסמאות שגויות הגיעו ברצף |
| `blockedUntil` | הרגע שבו החסימה נגמרת, `null` כשהמשתמש חופשי |

התחברות **מוצלחת** מאפסת את שניהם, כך ששתי סיסמאות שגויות ואחריהן הנכונה משאירות את
המשתמש עם דף נקי.

---

## תשובות שגיאה

שום דבר ב-routes או ב-services לא עונה על שגיאה בעצמו. הם זורקים, ו-`middleware/error-handler.ts`
הוא המקום היחיד שהופך שגיאה לתשובה (כל שגיאה גם נכתבת ללוגר של האפליקציה):

| השגיאה | סטטוס | התשובה |
| --- | --- | --- |
| שגיאת `jose` (`JWTExpired`, `JWSSignatureVerificationFailed`, ...) | 400 | `{ "name": "<the error name>" }` |
| `SyntaxError` | 400 | `Invalid JSON Format` עם ההודעה של הפרסר |
| `ZodError` | 400 | `Validation Error` עם רשימת הבעיות |
| `mongoose.Error.CastError` | 400 | id בכתובת שאינו id תקין של mongo |
| `mongoose.Error.ValidationError` | 400 | `Validation Error` עם ההודעות של הסכמה |
| `MongoServerError` | 400 | שגיאת מסד נתונים, למשל מפתח ייחודי כפול (ה-stack רק ברמת `debug`) |
| `HttpError`, `NotFoundError` | ה-`statusCode` שלה | `{ "message": "..." }` |
| כל דבר אחר | 500 | `{ "message": "internal server error" }` |

כתובת שאף route לא התאים לה נענית על ידי `middleware/not-found.ts`:
`404 { "error": "Page Not Found" }`.

`error/custom-error.ts` מחזיק את שתי השגיאות שהאפליקציה זורקת בעצמה:

</div>

```ts
throw new HttpError("The email is aleardy taken", 400);
throw new NotFoundError("No such card found");
```

<div dir="rtl">

מכיוון ש-express 5 מעביר promise שנדחה ל-error handler בעצמו, route אסינכרוני לא צריך
`try / catch` בכלל.

---

## לוגים

האפליקציה כותבת לוגים עם [pino](https://getpino.io):

- `middleware/logger.ts` מייצא את הלוגר. כל service כותב איתו מה הוא עשה, עם שם הפונקציה
  כקידומת - `[login]: Login succesfully - Return valid token for user`
- `morgan` כותב שורה אחת לכל בקשה **דרך** אותו לוגר, כך ששני סוגי הפלט חולקים פורמט
  אחד - `[GET]: /api/v1/cards , 200 - 3.608 ms`
- הרמה מגיעה מ-`LOG_LEVEL`. היא נקראת ישירות מ-`process.env` ולא מהקונפיג המאומת, כי
  הקונפיג מדווח על השגיאות של עצמו עם הלוגר הזה
- ב-production מודפסות רק שגיאות, וב-development הכול
- `pnpm dev` ו-`pnpm prod` מעבירים את הפלט דרך `pino-pretty --singleLine`, שהופך את שורות
  ה-JSON לטקסט צבעוני וקריא

תשובות שנכשלו נכתבות גם לקובץ - ראו [בונוס הלוגר לקבצים](#2-לוגר-לקבצים).

</div>
