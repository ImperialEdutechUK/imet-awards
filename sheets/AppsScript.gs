/**
 * Google Sheets event backend / mail merge for the Vercel event starter.
 * Bind this script to HR's spreadsheet: Extensions > Apps Script.
 * Project Settings > Script properties (do not place secrets in cells):
 *  SHEET_WEBHOOK_SECRET    = same random string as Vercel
 *  PUBLIC_BASE_URL        = https://your-event.vercel.app
 *  EVENT_TITLE            = iMET Annual Awards Ceremony 2027
 *  EVENT_DATE             = 2027-01-09T18:00:00+05:30
 *  EVENT_VENUE            = Event venue, city
 *  SURVEY_URL             = https://... (optional)
 *  SHEET_ID               = spreadsheet ID (recommended)
 */
const COLUMNS = [
  'Name','Email','Department','Seat','Token','InviteSentAt','ReceivedAt',
  'RSVP','RSVPAt','CheckedInAt','Reminder14At','Reminder7At',
  'Reminder1At','SurveySentAt','LastError'
];

function props_() { return PropertiesService.getScriptProperties(); }
function spreadsheet_() {
  const id = props_().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function guestSheet_() {
  const sheet = spreadsheet_().getSheetByName('Guests');
  if (!sheet) throw new Error('Create a tab named Guests and run setupGuestList first.');
  const headers = sheet.getRange(1,1,1,COLUMNS.length).getValues()[0];
  COLUMNS.forEach((h,i)=>{ if (headers[i] !== h) throw new Error('Unexpected Guests header in column '+(i+1)+': expected '+h); });
  return sheet;
}
function setupGuestList() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName('Guests');
  if (!sh) sh = ss.insertSheet('Guests');
  const top = sh.getRange(1,1,1,COLUMNS.length);
  const previous = top.getValues()[0];
  const existing = previous.some(Boolean);
  if (existing && COLUMNS.some((h,i)=>previous[i] && previous[i] !== h))
    throw new Error('Sheet has other column headings. Do not overwrite it; create a new Guests tab.');
  top.setValues([COLUMNS]).setFontWeight('bold').setBackground('#172337').setFontColor('#f3d397');
  sh.setFrozenRows(1);
  sh.setColumnWidths(1,2,190);
  sh.setColumnWidth(5,270);
  const last = sh.getLastRow();
  if (last < 2) return;
  const range = sh.getRange(2,1,last-1,COLUMNS.length);
  const rows = range.getValues();
  let touched = false;
  const existingTokens = new Set(rows.map(r=>String(r[4]||'').toLowerCase()).filter(Boolean));
  rows.forEach(r=>{
    if (!r[0] || !r[1] || r[4]) return;
    let token;
    do { token = Utilities.getUuid().replace(/-/g,'').toLowerCase(); } while(existingTokens.has(token));
    existingTokens.add(token);
    r[4] = token; touched = true;
  });
  if(touched) range.setValues(rows);
}
function reply_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function error_(message,status) { return reply_({ok:false,error:message,status:status||400}); }
function all_() {
  const sh = guestSheet_();
  if(sh.getLastRow()<2) return {sh, rows:[]};
  return {sh, rows:sh.getRange(2,1,sh.getLastRow()-1,COLUMNS.length).getValues()};
}
function find_(rows, token) {
  if(!/^[a-f0-9]{32}$/i.test(token||'')) return -1;
  return rows.findIndex(r=>String(r[4]).toLowerCase()===String(token).toLowerCase() && r[0] && r[1]);
}
function timestamp_(v) { return v instanceof Date ? v.toISOString() : (v ? String(v) : ''); }
function guest_(r) {
  return {name:String(r[0]), department:String(r[2]||''), seat:String(r[3]||''),
    receivedAt:timestamp_(r[6]), rsvp:String(r[7]||''), rsvpAt:timestamp_(r[8]),
    checkedInAt:timestamp_(r[9])};
}
function action_(payload) {
  const action = payload.action;
  if (action==='summary') {
    const {rows} = all_();
    const guests = rows.filter(r=>r[0]&&r[1]);
    return {ok:true,counts:{total:guests.length, sent:guests.filter(r=>r[5]).length,
      received:guests.filter(r=>r[6]).length,
      confirmed:guests.filter(r=>String(r[7]).trim()==='Yes').length,
      declined:guests.filter(r=>String(r[7]).trim()==='No').length,
      checkedIn:guests.filter(r=>r[9]).length}};
  }
  if (['surveyGet','surveySave','surveySend'].includes(action)) return surveyAdmin_(payload);
  const token = String(payload.token||'').toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(token)) return {ok:false,error:'Invalid pass',status:400};
  if (action==='surveyForm' || action==='surveySubmit') return surveyGuest_(payload, token);
  if(action==='lookup') {
    const {rows} = all_(); const i=find_(rows,token);
    if(i<0) return {ok:false,error:'Invitation not found. Contact HR.',status:404};
    return {ok:true,guest:guest_(rows[i])};
  }
  if (!['acknowledge','rsvp','checkin'].includes(action)) return {ok:false,error:'Unknown action',status:400};
  const lock=LockService.getScriptLock(); lock.waitLock(12000);
  try {
    const {sh,rows}=all_(); const i=find_(rows,token);
    if(i<0) return {ok:false,error:'Guest not on the HR list',status:404};
    const row=i+2, r=rows[i], now=new Date();
    if(action==='acknowledge' && !r[6]) sh.getRange(row,7).setValue(now);
    if(action==='rsvp') {
      if(!['Yes','No'].includes(payload.answer)) return {ok:false,error:'Choose Yes or No',status:400};
      if(r[9] && payload.answer==='No') return {ok:false,error:'Already checked in. Contact event staff.',status:409};
      if(!r[6]) sh.getRange(row,7).setValue(now);
      sh.getRange(row,8,1,2).setValues([[payload.answer,now]]);
    }
    if(action==='checkin') {
      if(r[9]) return {ok:true,alreadyCheckedIn:true,guest:guest_(r)};
      if(!r[6]) sh.getRange(row,7).setValue(now);
      if(String(r[7])!=='Yes') sh.getRange(row,8,1,2).setValues([['Yes',now]]);
      sh.getRange(row,10).setValue(now);
    }
    SpreadsheetApp.flush();
    const updated=sh.getRange(row,1,1,COLUMNS.length).getValues()[0];
    return {ok:true,guest:guest_(updated),alreadyCheckedIn:false};
  } finally { lock.releaseLock(); }
}
function doPost(e) {
  let body;
  try { body=JSON.parse(e && e.postData && e.postData.contents || '{}'); }
  catch(_) { return error_('Invalid request',400); }
  const expected=props_().getProperty('SHEET_WEBHOOK_SECRET');
  if(!expected || body.secret!==expected) return error_('Not authorised',403);
  try { return reply_(action_(body)); }
  catch(err) { console.error(err); return error_('Google Sheets service error',500); }
}

function settings_() {
  const p=props_();
  const base=(p.getProperty('PUBLIC_BASE_URL')||'').replace(/\/$/,'');
  const title=p.getProperty('EVENT_TITLE')||'iMET Annual Awards Ceremony 2027';
  const venue=p.getProperty('EVENT_VENUE')||'Cinnamon Life Colombo';
  const date=p.getProperty('EVENT_DATE')||'';
  if(!/^https:\/\//.test(base)) throw new Error('Set HTTPS PUBLIC_BASE_URL in Script properties.');
  return {base,title,venue,date,survey:p.getProperty('SURVEY_URL')||''};
}
function escape_(v) {
  return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function sendStyled_(to,subject,heading,message,buttonText,buttonUrl,qrUrl,person) {
  const body=`Hello ${person},\n\n${message.replace(/<[^>]*>/g,'')}\n\n${buttonText}: ${buttonUrl}`;
  const qrHtml=qrUrl?`<p style="color:#64748b;font-size:13px">Your personal QR pass</p><img src="cid:eventqr" width="180" height="180" alt="Event QR pass" />`:'';
  const html=`<div style="background:#f2f3f7;padding:28px 10px;font-family:Arial,sans-serif;color:#192239">
    <div style="max-width:560px;margin:auto;background:white;border-radius:16px;overflow:hidden">
      <div style="padding:28px 32px;background:#19243a;color:#f4dc9b"><div style="letter-spacing:3px;font-size:12px">YOU ARE INVITED</div><h1 style="font-size:30px;margin:16px 0 4px">${escape_(heading)}</h1></div>
      <div style="padding:30px 32px"><p>Hello ${escape_(person)},</p><p style="line-height:1.7">${escape_(message)}</p>
      <p><a href="${escape_(buttonUrl)}" style="display:inline-block;padding:14px 23px;background:#c9a363;color:#141e32;text-decoration:none;border-radius:8px;font-weight:bold">${escape_(buttonText)}</a></p>
      ${qrHtml}
      <p style="font-size:12px;line-height:1.6;color:#64748b">Please keep your pass private. Event staff will scan it at entry. Your response and attendance are recorded securely by HR.</p></div></div></div>`;
  let inlineImages;
  if(qrUrl) {
    try {
      const response=UrlFetchApp.fetch(qrUrl,{muteHttpExceptions:true,followRedirects:true});
      if(response.getResponseCode()===200) inlineImages={eventqr:response.getBlob().setName('event-pass.png')};
    } catch(err) {console.warn('QR image could not be embedded for '+to);}
  }
  const actualHtml=inlineImages?html:html.replace(qrHtml,qrUrl?`<p><a href="${escape_(buttonUrl)}">View your QR pass online</a></p>`:'');
  MailApp.sendEmail({to,subject,body,htmlBody:actualHtml,name:'Event Team',...(inlineImages?{inlineImages}:{})});
}
function sendInvitations() {
  setupGuestList();
  const cfg=settings_(); const {sh,rows}=all_();
  let quota=Math.min(MailApp.getRemainingDailyQuota(),40); // safe batch under script runtime limits
  for(let i=0;i<rows.length && quota>0;i++) {
    const r=rows[i]; if(!r[0]||!r[1]||!r[4]||r[5]) continue;
    const url=cfg.base+'/invite.html?token='+encodeURIComponent(r[4]);
    const qr=cfg.base+'/api/qr?token='+encodeURIComponent(r[4]);
    try {
      sendStyled_(String(r[1]),'Your invitation | '+cfg.title,cfg.title,
        'We are pleased to invite you to the iMET Annual Awards Ceremony 2027 on Saturday, 9 January 2027, from 6:00 PM to 11:30 PM (Sri Lanka time) at '+cfg.venue+'. Open your personalised invitation to confirm your attendance and view your QR pass.',
        'View invitation & RSVP',url,qr,String(r[0]));
      sh.getRange(i+2,6).setValue(new Date()); sh.getRange(i+2,15).clearContent(); quota--;
    } catch(err) { sh.getRange(i+2,15).setValue(String(err).slice(0,180)); }
  }
}
function sendCountdownReminders() {
  const cfg=settings_(); if(!cfg.date) throw new Error('Set EVENT_DATE');
  const days=Math.ceil((new Date(cfg.date).getTime()-Date.now())/86400000);
  if(days<0||days>14) return;
  const config=days<=1?{col:13,text:'Tomorrow is nearly here!'}:
    days<=7?{col:12,text:'Just one week to go!'}:{col:11,text:'The countdown is on!'};
  const {sh,rows}=all_(); let quota=Math.min(MailApp.getRemainingDailyQuota(),40);
  for(let i=0;i<rows.length&&quota>0;i++) {
    const r=rows[i]; if(!r[0]||!r[1]||!r[4]||!r[5]||String(r[7])==='No'||r[config.col-1]) continue;
    try {
      const url=cfg.base+'/invite.html?token='+encodeURIComponent(r[4]);
      sendStyled_(String(r[1]),config.text+' | '+cfg.title,cfg.title,
        config.text+' We are excited to celebrate together at '+cfg.venue+'. Open your invitation to review or update your response and bring your QR pass.',
        'View invitation',url,'',String(r[0]));
      sh.getRange(i+2,config.col).setValue(new Date()); sh.getRange(i+2,15).clearContent(); quota--;
    } catch(err) {sh.getRange(i+2,15).setValue(String(err).slice(0,180));}
  }
}
function sendPostEventSurvey() {
  const cfg=settings_(); if(!cfg.date||!cfg.survey) return;
  if(surveyDefinition_()) return; // HR is running the survey from the staff dashboard instead
  const elapsed=Date.now()-new Date(cfg.date).getTime();
  if(elapsed<24*3600000) return;
  const {sh,rows}=all_(); let quota=Math.min(MailApp.getRemainingDailyQuota(),40);
  for(let i=0;i<rows.length&&quota>0;i++) {
    const r=rows[i]; if(!r[0]||!r[1]||r[13]||!r[9]) continue; // only guests who were checked in at the event
    try {
      sendStyled_(String(r[1]),'Thank you for celebrating with us',cfg.title,
        'Thank you for being part of the event. We would love to hear your thoughts. Please take a moment to complete our short survey.',
        'Share feedback',cfg.survey,'',String(r[0]));
      sh.getRange(i+2,14).setValue(new Date()); sh.getRange(i+2,15).clearContent(); quota--;
    } catch(err) {sh.getRange(i+2,15).setValue(String(err).slice(0,180));}
  }
}
function scheduledDailyTasks() { sendCountdownReminders(); sendPostEventSurvey(); }
function installDailyTrigger() {
  const name='scheduledDailyTasks';
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===name).forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger(name).timeBased().everyDays(1).atHour(9).create();
}

/* ==========================================================================
 * Post-event survey, created and sent from the staff dashboard on the website.
 * - HR writes the questions on /staff. The definition is kept in Script properties.
 * - Emails go ONLY to guests with a CheckedInAt time, once each (SurveySentAt).
 * - Answers are written to the "Survey responses" tab, one row per guest.
 * ========================================================================== */
const SURVEY_TAB = 'Survey responses';
const SURVEY_FIXED = ['Token','SubmittedAt','Name','Department'];
const SURVEY_BATCH = 10; // emails per request, so each request finishes quickly; the website keeps asking until all are sent

function surveyDefinition_() {
  const raw = props_().getProperty('SURVEY_DEFINITION');
  if (!raw) return null;
  try { const survey = JSON.parse(raw); return survey && Array.isArray(survey.questions) ? survey : null; }
  catch(_) { return null; }
}
function cleanSurvey_(input) {
  const src = input || {};
  const title = String(src.title||'').trim().slice(0,120);
  const message = String(src.message||'').trim().slice(0,600);
  const questions = (Array.isArray(src.questions) ? src.questions : []).map(q=>({
    text: String((q&&q.text)||'').trim().slice(0,200),
    type: ['rating','yesno','text'].includes(q&&q.type) ? q.type : 'text'
  })).filter(q=>q.text).slice(0,12);
  if (!title) return {error:'Give the survey a title.'};
  if (!questions.length) return {error:'Add at least one question.'};
  return {survey:{title,message,questions}};
}
// Text typed by people is never allowed to act as a spreadsheet formula.
function plain_(v) {
  const text = String(v==null ? '' : v).slice(0,1000);
  return /^[=+\-@]/.test(text) ? "'"+text : text;
}
function surveyTab_(survey, create) {
  const ss = spreadsheet_(); let sh = ss.getSheetByName(SURVEY_TAB);
  if (!sh) { if (!create) return null; sh = ss.insertSheet(SURVEY_TAB); }
  if (create && sh.getLastRow() < 2) {
    const head = SURVEY_FIXED.concat(survey.questions.map(q=>plain_(q.text)));
    sh.getRange(1,1,1,head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function surveyAnswers_(survey) {
  const sh = surveyTab_(survey,false);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2,1,sh.getLastRow()-1,SURVEY_FIXED.length+survey.questions.length).getValues().filter(r=>r[0]);
}
function surveyOverview_() {
  const survey = surveyDefinition_();
  const {rows} = all_();
  const attended = rows.filter(r=>r[0]&&r[1]&&r[4]&&r[9]);
  const stats = {attended:attended.length, sent:attended.filter(r=>r[13]).length, responses:0};
  let results = [];
  if (survey) {
    const answers = surveyAnswers_(survey);
    stats.responses = answers.length;
    results = survey.questions.map((q,i)=>{
      const given = answers.map(a=>a[SURVEY_FIXED.length+i]).filter(v=>v!=='' && v!==null && v!==undefined);
      if (q.type==='rating') {
        const marks = given.map(Number).filter(n=>n>=1&&n<=5);
        return {text:q.text, type:q.type, count:marks.length,
          average: marks.length ? Math.round(marks.reduce((a,b)=>a+b,0)/marks.length*10)/10 : null,
          spread: [1,2,3,4,5].map(n=>marks.filter(v=>v===n).length)};
      }
      if (q.type==='yesno') return {text:q.text, type:q.type, count:given.length,
        yes:given.filter(v=>String(v)==='Yes').length, no:given.filter(v=>String(v)==='No').length};
      return {text:q.text, type:q.type, count:given.length, comments:given.map(String).slice(-40)};
    });
  }
  return {ok:true,
    survey: survey ? {title:survey.title, message:survey.message, questions:survey.questions} : null,
    locked: Boolean(survey && survey.sentAt), sentAt: (survey && survey.sentAt) || '', stats, results};
}
function sendSurveyEmail_(to, person, survey, cfg, url) {
  const intro = survey.message || 'Thank you for joining us. We would be grateful for a few minutes of your time to tell us how the evening went.';
  const body = `Hello ${person},\n\n${intro}\n\nOpen the survey: ${url}\n\nThis link is personal to you.`;
  const html = `<div style="background:#050203;padding:28px 10px;font-family:Arial,sans-serif;color:#efe3c6">
    <div style="max-width:560px;margin:auto;border:1px solid #c8a45d;background:#0a0405">
      <div style="padding:28px 32px;border-bottom:1px solid #5e1719"><div style="letter-spacing:3px;font-size:12px;color:#c8a45d">${escape_(String(cfg.title).toUpperCase())}</div><h1 style="font-size:26px;margin:14px 0 0;color:#ead7a8;font-weight:normal">${escape_(survey.title)}</h1></div>
      <div style="padding:28px 32px"><p>Hello ${escape_(person)},</p><p style="line-height:1.7">${escape_(intro)}</p>
      <p style="margin:26px 0"><a href="${escape_(url)}" style="display:inline-block;padding:14px 24px;background:#c8a45d;color:#050203;text-decoration:none;font-weight:bold">Open the survey</a></p>
      <p style="font-size:12px;line-height:1.6;color:#b9ab8c">This link is personal to you. Your answers are recorded by HR.</p></div></div></div>`;
  MailApp.sendEmail({to, subject:survey.title+' | '+cfg.title, body, htmlBody:html, name:'Event Team'});
}
function surveyAdmin_(payload) {
  const action = payload.action;
  if (action==='surveyGet') return surveyOverview_();
  const lock = LockService.getScriptLock(); lock.waitLock(12000);
  try {
    const current = surveyDefinition_();
    if (action==='surveySave') {
      if (current && current.sentAt) return {ok:false,error:'The survey has already been sent, so it can no longer be changed.',status:409};
      const cleaned = cleanSurvey_(payload.survey);
      if (cleaned.error) return {ok:false,error:cleaned.error,status:400};
      props_().setProperty('SURVEY_DEFINITION', JSON.stringify(cleaned.survey));
      return surveyOverview_();
    }
    // surveySend
    if (!current) return {ok:false,error:'Save the survey before sending it.',status:400};
    const cfg = settings_();
    if (!current.sentAt) {
      const earlier = spreadsheet_().getSheetByName(SURVEY_TAB);
      if (earlier && earlier.getLastRow() > 1)
        return {ok:false,error:'The "Survey responses" tab already holds answers from an earlier survey. Rename or delete that tab in the Sheet, then send again.',status:409};
    }
    surveyTab_(current,true);
    const {sh,rows} = all_();
    let quota = Math.min(MailApp.getRemainingDailyQuota(), SURVEY_BATCH), sent = 0, failed = 0;
    for (let i=0; i<rows.length && quota>0; i++) {
      const r = rows[i];
      if (!r[0]||!r[1]||!r[4]||!r[9]||r[13]) continue; // only guests who were checked in, and only once each
      try {
        sendSurveyEmail_(String(r[1]), String(r[0]), current, cfg, cfg.base+'/survey?token='+encodeURIComponent(r[4]));
        sh.getRange(i+2,14).setValue(new Date()); sh.getRange(i+2,15).clearContent(); sent++;
      } catch(err) { sh.getRange(i+2,15).setValue(String(err).slice(0,180)); failed++; }
      quota--;
    }
    if (sent && !current.sentAt) {
      current.sentAt = new Date().toISOString();
      props_().setProperty('SURVEY_DEFINITION', JSON.stringify(current));
    }
    SpreadsheetApp.flush();
    const overview = surveyOverview_();
    overview.sent = sent; overview.failed = failed;
    overview.remaining = overview.stats.attended - overview.stats.sent;
    overview.quotaLeft = MailApp.getRemainingDailyQuota();
    return overview;
  } finally { lock.releaseLock(); }
}
function surveyGuest_(payload, token) {
  const {rows} = all_(); const i = find_(rows, token);
  if (i < 0) return {ok:false,error:'We could not find your details. Please use the link in your email.',status:404};
  const r = rows[i];
  if (!r[9]) return {ok:false,error:'This survey is for guests who attended the event.',status:403};
  const survey = surveyDefinition_();
  if (!survey || !survey.sentAt) return {ok:false,error:'The survey is not open yet.',status:404};
  if (payload.action==='surveyForm') {
    const answered = surveyAnswers_(survey).some(a=>String(a[0]).toLowerCase()===token);
    return {ok:true, guest:{name:String(r[0])}, answered,
      survey:{title:survey.title, message:survey.message, questions:survey.questions}};
  }
  const given = Array.isArray(payload.answers) ? payload.answers : [];
  const values = [];
  for (let q=0; q<survey.questions.length; q++) {
    const type = survey.questions[q].type, answer = given[q];
    if (type==='rating') {
      const mark = Number(answer);
      if (!(Number.isInteger(mark) && mark>=1 && mark<=5)) return {ok:false,error:'Please answer every rating question.',status:400};
      values.push(mark);
    } else if (type==='yesno') {
      if (answer!=='Yes' && answer!=='No') return {ok:false,error:'Please answer every Yes or No question.',status:400};
      values.push(answer);
    } else values.push(plain_(String(answer==null ? '' : answer).trim()));
  }
  const lock = LockService.getScriptLock(); lock.waitLock(12000);
  try {
    const sh = surveyTab_(survey,true);
    const last = sh.getLastRow();
    let row = last + 1;
    if (last > 1) { // a guest who answers again replaces their earlier row
      const at = sh.getRange(2,1,last-1,1).getValues().findIndex(t=>String(t[0]).toLowerCase()===token);
      if (at >= 0) row = at + 2;
    }
    sh.getRange(row,1,1,SURVEY_FIXED.length+values.length).setValues([[token,new Date(),String(r[0]),String(r[2]||'')].concat(values)]);
    return {ok:true};
  } finally { lock.releaseLock(); }
}

