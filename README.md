# Imperial Excellence Awards & Gala 2026: event website

The iMET awards website, built with **Next.js, React and TypeScript** and styled only in the event theme: **black, burgundy and gold**. It runs on Vercel and keeps HR's private Google Sheet as the single source of truth for guests.

**The event:** Saturday, 9 January 2027, 6:00 PM – 11:30 PM (Sri Lanka time, UTC+05:30), Cinnamon Life Colombo.

## What is in the website

| Address | What it is |
| --- | --- |
| `/` | Public event page: curtain intro, event title, live countdown, the evening, programme, details and event theme |
| `/invite?token=…` | A guest's personal RSVP page: confirm or decline, see their seat, collect their QR entry pass |
| `/ticket?token=…` | Full-screen QR pass for confirmed guests |
| `/staff` | Password-protected check-in dashboard: live totals, camera QR scanner, manual check-in. Installable on a phone's home screen |
| `/api/*` | Server routes that talk to the Google Sheet. Secrets never reach the browser |

Older links ending in `.html` (for example `/invite.html?token=…` in emails already sent) still work.

There is **no public self-registration**: only people on HR's list, with their personal link, can respond.

## Built with

- **Next.js 16** (App Router) and **React 19**, written in **TypeScript**
- **Motion** for the title's entrance; the opening curtain is drawn on a canvas
- **CSS Modules** with one set of theme colours in `src/app/globals.css`
- One background photograph (the burgundy wall) fixed behind every page
- Fonts (Cinzel, Jost, Pinyon Script) are bundled with the site, so nothing loads from Google Fonts
- `qrcode` for passes and `html5-qrcode` for the staff scanner
- Google Sheets + Apps Script as the guest database and mailer

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # open http://localhost:3000
```

The public page works straight away. The RSVP, pass and staff pages need the Google Sheet connected (next sections). `npm run build` makes the production build; `npm run typecheck` checks the TypeScript.

## Change the event wording

All public wording, dates and the venue live in one file: **`src/lib/event.ts`**. Edit it and redeploy. Never put guest or HR data in that file; it is public.

If the date changes, update `startISO` and `endISO` there **and** `EVENT_DATE` in the Apps Script properties so the countdown, calendar file and reminder emails agree.

| To change | Edit |
| --- | --- |
| Event name, date, time, venue, programme, notes | `src/lib/event.ts` |
| Theme colours | the variables at the top of `src/app/globals.css` |
| Background photograph | `public/wall-wide.webp` and `public/wall-portrait.webp` |
| Curtain on or off | the `curtain` block in `src/lib/event.ts` |
| Home page sections | `src/app/page.tsx` and `src/components/home.module.css` |
| RSVP and pass pages | `src/components/InviteClient.tsx`, `TicketClient.tsx`, `portal.module.css` |
| Staff dashboard | `src/components/StaffClient.tsx`, `staff.module.css` |
| Invitation, reminder and survey emails | `sheets/AppsScript.gs` |

## The curtain and the background

**Curtain.** Guests first see a closed velvet curtain with the event name. Clicking or tapping it (or pressing Enter) draws the curtains aside and reveals the site. It appears on the home page and on a guest's personal RSVP page, once per browser session, and never on the QR pass or staff pages. Guests who have asked their device to reduce motion skip it. Settings are in the `curtain` block of `src/lib/event.ts`: set `enabled` to `false` to remove it, or `oncePerSession` to `false` to show it on every visit.

**Background.** The textured burgundy wall behind every page is one photograph, stored twice in `public/`: `wall-wide.webp` (1920 × 1080, for laptops and desktops) and `wall-portrait.webp` (736 × 1308, for phones). The wide version is the same photograph turned on its side so the lit area sits at the top. To change the background, replace both files with images of the same names.

The design is deliberately plain: flat gold type, thin rules and the wall photograph, with no glows, particles or illustrations.

## 1. Google Sheet (HR's single source of truth)

1. Create a **private** Google spreadsheet owned by HR.
2. Create a tab named **Guests** (case-sensitive).
3. Paste the headers from `Guests-template.csv` into row 1:

   `Name, Email, Department, Seat, Token, InviteSentAt, ReceivedAt, RSVP, RSVPAt, CheckedInAt, Reminder14At, Reminder7At, Reminder1At, SurveySentAt, LastError`

4. HR enters guest **names in column A** and **emails in column B**, and optionally department and seat in C and D. Do not edit the tracking columns E–O by hand. Keep one row per email, and keep rows and tokens once invitations have gone out.
5. In the Sheet: **Extensions > Apps Script**. Paste in `sheets/AppsScript.gs`.
6. In Apps Script **Project Settings > Script properties**, add:

   | Property | Value |
   | --- | --- |
   | `SHEET_ID` | The text between `/d/` and `/edit` in the Sheet's address |
   | `SHEET_WEBHOOK_SECRET` | A long random secret, also used in Vercel |
   | `PUBLIC_BASE_URL` | The final HTTPS address of the website, with no trailing `/` |
   | `EVENT_TITLE` | `Imperial Excellence Awards & Gala 2026` |
   | `EVENT_DATE` | `2027-01-09T18:00:00+05:30` |
   | `EVENT_VENUE` | `Cinnamon Life Colombo` |
   | `SURVEY_URL` | Optional survey link for the post-event email |

7. Run **`setupGuestList`** once from the Apps Script editor and approve Google's permissions. It gives each guest a unique random token. It is safe to run again after adding guests.
8. **Deploy > New deployment > Web app**. Choose *Execute as: Me* and access *Anyone* (only if your organisation permits public web apps), then deploy and copy the `/exec` address. The script rejects any call without the secret. **Do not publish the Sheet itself.**
9. After changing the script, deploy a **new version**; an existing deployment does not pick up saved changes.

`ReceivedAt` is set only when a guest acknowledges or responds. `InviteSentAt` means the script asked Google to send the email; it does not prove delivery or that the email was opened.

## 2. Deploy on Vercel

1. Put this folder in a **private GitHub repository**. Do not upload `.env` files.
2. In Vercel: **Add New > Project > Import Git Repository**. Vercel recognises Next.js and needs no extra settings.
3. Under **Project > Settings > Environment Variables**, add (Production and Preview):

   | Variable | Value |
   | --- | --- |
   | `SHEET_WEBHOOK_URL` | The Apps Script `/exec` address |
   | `SHEET_WEBHOOK_SECRET` | The same secret as in Apps Script |
   | `ADMIN_PASSWORD` | A strong staff password (not a guest password) |
   | `ADMIN_SESSION_SECRET` | A different long random secret, used to sign staff sessions |
   | `PUBLIC_BASE_URL` | The website's HTTPS address |

   These are server-side only. Never prefix them with `NEXT_PUBLIC_` and never put them in `src/lib/event.ts`. Redeploy after changing them.
4. Deploy, open the address Vercel gives you, and connect a custom domain if you wish.
5. Test with two dummy guests before sending anything real (checklist below).

## 3. How invitations, RSVP and check-in work

- HR adds names and emails to **Guests** and runs `setupGuestList`.
- HR runs **`sendInvitations`** from the Apps Script editor (up to 40 recipients per run; run again for more). Each email carries the guest's personal RSVP button and, when it can be fetched, their QR pass.
- The guest opens their link and chooses **Yes, I will attend** or **Unable to attend**. The Sheet records `ReceivedAt`, `RSVP` and `RSVPAt`.
- Confirmed guests see their QR pass on the RSVP page and at `/ticket?token=…`.
- Entry staff open `/staff`, sign in, and scan passes with the phone camera, or paste the pass link. The Sheet records `CheckedInAt`; a second scan is flagged as already checked in.
- The dashboard shows the list size, invitations sent, acknowledgements, confirmations, declines and check-ins.
- HR runs **`installDailyTrigger`** once to schedule reminders at 14, 7 and 1 days, and the survey email at least 24 hours after the event if `SURVEY_URL` is set. Google's daily email quota applies; large lists may need several runs or a dedicated email service.

## 4. Staff phone app

On Android Chrome open `/staff` and choose **Install app** or **Add to Home screen**; on iPhone Safari use **Share > Add to Home Screen**. The camera needs HTTPS and permission. Scanning and totals need a connection; manual entry remains available when the camera is not.

## 5. Privacy and safeguards

- The Sheet stays private. Public pages never receive the guest list or email addresses.
- QR codes hold a random per-guest link, not a name or email. Treat links and codes as bearer passes; ask guests not to forward them.
- Once a guest opens their personal link, their pass code is remembered in that browser, so **Your RSVP** on the home page returns them to their RSVP and QR pass. Only the random code is kept, never a name or email. **Remove my pass from this device** on the RSVP page clears it; guests using a shared computer should do this.
- The staff dashboard uses a server-side password and a signed, HTTP-only session cookie. That suits a modest internal event. For larger or regulated use, move to single sign-on, per-user roles, access logs and a purpose-built database.
- Google Sheets suits a few hundred guests; very busy entrances can hit its limits.
- Not included: offline check-in, email bounce reporting, an editable seating chart, or an in-site survey dashboard.
- Agree with HR how long attendee data is kept and when it is deleted.

## 6. Checklist before sending real invitations

1. The home page shows the right name, date, time and venue on a phone and a laptop.
2. `/invite` without a valid link shows guidance, not guest details.
3. A test guest can confirm, decline, see their seat and get a QR pass after confirming.
4. Each response appears in the right row of the Sheet.
5. `/staff` shows nothing until the password is entered.
6. Scanning a pass records the check-in; scanning it again says **Already checked in**.
7. The scanner works on an iPhone and an Android phone.
8. One test invitation and one test reminder arrive as expected.

## Notes

- The event name follows the Save the Date announcement. Confirm the name, programme and wording with HR before launch.
- The emails in `sheets/AppsScript.gs` still use their earlier colours. They are separate from the website and can be restyled there.
