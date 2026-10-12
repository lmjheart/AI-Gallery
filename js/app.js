const D = window.GALLERY, app = document.getElementById("app");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ICON = { image: "🖼️", audio: "🎵", video: "🎬", url: "🌐", game: "🎮", avatar: "⭕", profile: "🙂", etc: "✨" };
const LABEL = { image: "이미지", audio: "노래", video: "동영상", url: "웹사이트", game: "게임", avatar: "썸네일", profile: "프로필", etc: "기타" };
const worksOf = id => D.works.filter(w => w.studentId === id);
const tag = o => o.sample ? '<span class="tag">예시</span>' : "";
document.getElementById("logo").textContent = D.site.title;
document.title = D.site.title;

const avatar = (s, big) => {
  const c = `av ${big ? "big" : ""}`, ph = `<div class="${c}" style="background:${esc(s.color)}">${esc(s.emoji || s.artistName[0] || "")}</div>`;
  return s.profileImage ? `<img class="${c}" loading="lazy" referrerpolicy="no-referrer" style="border:4px solid ${esc(s.color)}" src="${esc(s.profileImage)}" alt="" data-ph="${esc(ph)}" onerror="this.outerHTML=this.dataset.ph">` : ph;
};
const driveId = u => { u = String(u || "").trim(); if (!/^https:\/\/drive\.google\.com\//i.test(u)) return ""; const m = u.match(/\/d\/([\w-]{10,})/) || u.match(/[?&]id=([\w-]{10,})/); return m ? m[1] : ""; };
const imgSrc = (w, sz) => { if (!(w.ext && (w.type === "image" || w.type === "profile"))) return ""; const id = driveId(w.src); return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${sz}` : ""; };
const ytId = u => { const m = String(u || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/))([\w-]{11})/); return m ? m[1] : ""; };
const sunoId = u => { const m = String(u || "").match(/suno\.com\/song\/([0-9a-f-]{36})/i); return m ? m[1] : ""; };
const canvaEmb = u => { const m = String(u || "").match(/^https:\/\/(?:www\.)?canva\.com\/design\/([\w-]+)(?:\/([\w-]+))?\/(?:view|watch)/i); return m ? `https://www.canva.com/design/${m[1]}/${m[2] ? m[2] + "/" : ""}view?embed` : ""; };
window.openHere = b => { const u = b.dataset.u, box = b.closest(".ph"); box.outerHTML = `<iframe class="embed" src="${esc(u)}" sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe><p><a class="btn" href="${esc(u)}" target="_blank" rel="noopener noreferrer">안 열리면 새 창에서 열기</a></p>`; };
const embedSrc = w => { const d = driveId(w.src); if (d) return `https://drive.google.com/file/d/${d}/preview`; const y = ytId(w.src); if (y) return `https://www.youtube.com/embed/${y}?autoplay=1&rel=0`; const n = sunoId(w.src); if (n) return `https://suno.com/embed/${n}`; return canvaEmb(w.src); };
const thumb = w => {
  const t = w.thumbnail || imgSrc(w, 800) || (w.type === "image" && !w.ext && /\.(png|jpe?g|webp|gif)$/i.test(w.src || "") ? w.src : "");
  return t ? `<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${esc(t)}" alt="" onerror="this.outerHTML='<div class=ph>🖼️</div>'">` : `<div class="ph">${ICON[w.type] || "✨"}</div>`;
};
const workCard = w => `<a class="card work" href="#/work/${esc(w.id)}">${thumb(w)}<span class="pill">${ICON[w.type] || "✨"} ${LABEL[w.type] || "기타"}</span><div class="body"><b>${esc(w.title)}</b> ${tag(w)}</div></a>`;

function home() {
  const feat = (window.topWorks || (() => D.works.filter(w => w.featured).slice(0, 4)))();
  app.innerHTML = `<section class="hero"><i class="b1"></i><i class="b2"></i><i class="b3"></i>
    <h1>${esc(D.site.title)}</h1><p class="tag-line">${esc(D.site.tagline)}</p><p>${esc(D.site.intro)}</p>
    <a class="btn" href="#/exhibitions">전시 둘러보기</a></section>
    ${feat.length ? `<h2>${window.topTitle || "대표 작품"}</h2><div class="grid">${feat.map(workCard).join("")}</div>` : ""}`;
}
function exhibitions() {
  app.innerHTML = `<h2>전시를 골라 보세요</h2><div class="grid">${D.exhibitions.map(e => {
    const n = D.students.filter(s => s.exhibitionId === e.id).length;
    return `<a class="card ex" href="#/students/${esc(e.id)}" style="border-top-color:${esc(e.color)}"><div class="body"><b>${esc(e.title)} ${tag(e)}</b><p>${esc(e.description)}</p><small>참여 학생 ${n}명</small></div></a>`;
  }).join("")}</div>`;
}
function students(id) {
  const e = D.exhibitions.find(x => x.id === id);
  if (!e) return notFound();
  app.innerHTML = `<a class="back" href="#/exhibitions">← 전시 목록</a><h2>${esc(e.title)}</h2>
    <div class="grid">${D.students.filter(s => s.exhibitionId === id).map(s => `
    <a class="card stu" href="#/student/${esc(s.id)}">${avatar(s)}<div class="body"><b>${esc(s.artistName)} ${tag(s)}</b><small>${esc(s.realName)}</small><p>${esc(s.intro)}</p><small>작품 ${worksOf(s.id).length}개</small></div></a>`).join("")}</div>`;
}
function student(id) {
  const s = D.students.find(x => x.id === id);
  if (!s) return notFound();
  const ws = worksOf(id);
  const body = !ws.length ? `<p class="empty">아직 전시된 작품이 없어요.</p>`
    : `<div class="${ws.length <= 2 ? "list big" : "grid"}">${ws.map(workCard).join("")}</div>`;
  app.innerHTML = `<a class="back" href="#/students/${esc(s.exhibitionId)}">← 학생 목록</a>
    <section class="profile">${avatar(s, true)}<div><h2>${esc(s.artistName)} ${tag(s)}</h2><small>${esc(s.realName)}</small><p>${esc(s.intro)}</p></div></section>
    <h3>작품 ${ws.length}개</h3>${body}`;
}
function media(w) {
  const s = esc(w.src);
  if (w.ext && w.src) {
    const em = embedSrc(w), noFrame = /\.canva\.site(\/|$)/i.test(w.src), btn = `<a class="btn" href="${s}" target="_blank" rel="noopener noreferrer">새 창에서 열기</a>`;
    return em ? `<iframe class="embed ${w.type === "audio" || /suno\.com/.test(w.src) ? "aud" : ""}" src="${esc(em)}" allow="autoplay; fullscreen" allowfullscreen loading="lazy"></iframe><p>${btn}</p>`
      : `<div class="ph huge">${ICON[w.type] || "✨"}<p>${noFrame ? "이 작품은 새 창에서 열려요." : "작품은 다른 서비스에 있어요. 새 창에서 열려요."}</p><a class="btn" href="${s}" target="_blank" rel="noopener noreferrer">작품 보러가기</a>${noFrame ? "" : `<button class="btn2" data-u="${s}" onclick="openHere(this)">이 화면에서 열어 보기</button>`}</div>`;
  }
  if (!w.src) return `<div class="ph huge">${ICON[w.type] || "✨"}<p>예시 작품이라 실제 파일이 없어요.</p></div>`;
  if (w.type === "image") return `<img class="full" src="${s}" alt="${esc(w.title)}">`;
  if (w.type === "audio") return `<audio controls autoplay src="${s}"></audio>`;
  if (w.type === "video") return `<video controls autoplay playsinline src="${s}"></video>`;
  if (w.type === "game") return `<iframe class="game" src="${s}" sandbox="allow-scripts allow-same-origin" allow="autoplay"></iframe>`;
  return `<a class="btn" href="${s}" target="_blank" rel="noopener">작품 열기</a>`;
}
function info(w) {
  const rows = [["사용한 AI 도구", w.tool], ["제작 의도", w.intent], ["소감", w.reflection]].filter(r => r[1]);
  if (!rows.length && !w.prompt) return "";
  const long = w.prompt && w.prompt.length > 200;
  return `<section class="info"><h3>이 작품은 이렇게 만들었어요</h3>
    ${rows.map(r => `<div class="row"><b>${r[0]}</b><p>${esc(r[1])}</p></div>`).join("")}
    ${w.prompt ? `<div class="row"><b>사용한 프롬프트</b><div class="prompt ${long ? "collapsed" : ""}" id="pbox"><pre>${esc(w.prompt)}</pre></div>
    <div class="acts">${long ? '<button class="btn2" id="ptoggle">펼치기</button>' : ""}<button class="btn2" id="pcopy">프롬프트 복사</button></div></div>` : ""}</section>`;
}
function bindPrompt(w) {
  const box = document.getElementById("pbox"); if (!box) return;
  const t = document.getElementById("ptoggle"), c = document.getElementById("pcopy");
  if (t) t.onclick = () => { const x = box.classList.toggle("collapsed"); t.textContent = x ? "펼치기" : "접기"; };
  c.onclick = async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(w.prompt); ok = true; } catch (e) {
      const ta = document.createElement("textarea"); ta.value = w.prompt; document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch (e2) {} ta.remove();
    }
    c.textContent = ok ? "복사했어요!" : "복사 실패 - 직접 선택해 복사해 주세요";
    setTimeout(() => c.textContent = "프롬프트 복사", 2000);
  };
}
function work(id) {
  const w0 = D.works.find(x => x.id === id);
  if (!w0) return notFound();
  const w = (window.mergeNote || (x => x))(w0);
  const s = D.students.find(x => x.id === w.studentId);
  const others = worksOf(w.studentId).filter(x => x.id !== id);
  app.innerHTML = `<a class="back" href="#/student/${esc(s.id)}">← ${esc(s.artistName)}의 작품 페이지</a>
    <h2>${esc(w.title)} ${tag(w)}</h2><small>${LABEL[w.type] || "기타"} · ${esc(s.artistName)}</small>
    <div class="stage">${media(w)}</div>${w.description ? `<p>${esc(w.description)}</p>` : ""}${info(w)}
    ${others.length ? `<h3>${esc(s.artistName)}의 다른 작품</h3><div class="grid">${others.map(workCard).join("")}</div>` : ""}`;
  bindPrompt(w);
}
function notFound() { app.innerHTML = `<p class="empty">찾을 수 없는 페이지예요. <a href="#/">홈으로 가기</a></p>`; }

function route() {
  const [p, a] = location.hash.replace(/^#\/?/, "").split("/");
  ({ exhibitions, students, student, work, write: window.writePage, all: window.allPage }[p] || home)(a);
  window.scrollTo(0, 0);
}
addEventListener("hashchange", route); route();
