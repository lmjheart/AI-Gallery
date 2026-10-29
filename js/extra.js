/* =====================================================
   관리자 스위치 (true / false 만 바꾸세요)
   SHOW_WRITE_TAB : 위쪽 메뉴에 '내 작품 글쓰기' 탭을 보이게 할지
                    false 여도 주소 끝에 #/write 를 붙이면 기능은 그대로 열려요
   WRITE_ENABLED  : 글쓰기 기능 자체를 켜 둘지
                    false 로 하면 주소로 들어와도 '지금은 글쓰기 기간이 아니에요'만 보여요
   ===================================================== */
const SHOW_WRITE_TAB = false;
const WRITE_ENABLED = true;

/* =====================================================
   방명록 비속어 필터
   걸러야 할 말이 더 생기면 BAD_WORDS 에 추가하세요.
   (일상 단어와 겹치는 말은 넣지 마세요. 예: '보지', '시바견', '미친')
   ===================================================== */
const BADWORD_MESSAGE = "고운 말을 사용해 주세요 🙂\n비속어나 욕설이 포함되어 있어 등록할 수 없어요.";
const BAD_WORDS = [
  "시발", "씨발", "씨바", "쉬발", "씹새", "씹창", "씹년", "씹놈",
  "병신", "븅신", "벼엉신", "지랄", "좆", "존나", "개새끼", "개새기",
  "새끼야", "미친놈", "미친년", "미친새끼", "썅", "쌍놈", "쌍년", "닥쳐",
  "느금마", "니애미", "엿먹", "꺼지라", "창녀", "창년", "섹스", "야동",
  "빨통", "젖탱", "또라이", "찐따", "맘충", "틀딱",
  "ㅅㅂ", "ㅆㅂ", "ㅂㅅ", "ㅈㄹ", "ㅈㄴ", "ㅁㅊ", "ㄲㅈ", "ㅅㄲ", "ㄷㅊ",
  "fuck", "fuk", "shit", "bitch", "asshole", "bastard", "cunt", "pussy", "slut", "whore", "nigger", "nigga", "retard"
];
// 공백·점·특수문자를 지워서 "시. 발" 같은 우회도 잡기
const normBad = t => String(t || "").toLowerCase().replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ]/g, "");
const BAD_NORM = BAD_WORDS.map(normBad);
const containsBadWord = text => { const t = normBad(text); return !!t && BAD_NORM.some(b => t.includes(b)); };

const CF = window.GCONF || {}, ON = !!(CF.url && CF.key);
let HEARTS = {}, NOTES = {}, PROFILES = {}, DBW = [];
const BASE_WORKS = D.works.slice();
const coverUrl = u => { u = String(u || "").trim(); if (!u) return ""; const d = driveId(u); return d ? `https://drive.google.com/thumbnail?id=${d}&sz=w800` : (/^https:\/\//i.test(u) ? u : ""); };
let dev = (() => { try { let d = localStorage.getItem("gdev"); if (!d) { d = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("gdev", d); } return d; } catch (e) { return "anon" + Math.random().toString(36).slice(2); } })();
async function rpc(name, args) {
  const r = await fetch(`${CF.url}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: CF.key, ...(CF.key.startsWith("eyJ") ? { Authorization: `Bearer ${CF.key}` } : {}), "Content-Type": "application/json" }, body: JSON.stringify(args || {}) });
  if (!r.ok) throw new Error((await r.text()).slice(0, 200));
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
// true: 썸네일이 없는 학생은 목록의 원에 프로필 이미지를 씁니다. false: 썸네일만 씁니다(없으면 글자 원).
const LIST_USE_PROFILE = true;
const applyProfiles = () => D.students.forEach(s => {
  s.base = s.base || { a: s.artistName, i: s.intro, p: s.profileImage }; const pr = PROFILES[s.id];
  s.artistName = pr && pr.name ? pr.name : s.base.a; s.intro = pr && pr.intro ? pr.intro : s.base.i;
  const aw = DBW.filter(w => w.type === "avatar" && w.studentId === s.id).pop(), pw = DBW.filter(w => w.type === "profile" && w.studentId === s.id).pop();
  const au = aw ? coverUrl(aw.src).replace("sz=w800", "sz=w400") : "", pu = pw ? coverUrl(pw.src).replace("sz=w800", "sz=w600") : "";
  const pl = pw ? coverUrl(pw.src).replace("sz=w800", "sz=w400") : "";
  s.profileImage = au || (LIST_USE_PROFILE && pl) || s.base.p; s.bigImage = pu || au || s.base.p;
});
window.mergeNote = w => { const n = NOTES[w.id] || {}; return { ...w, intent: n.intent || w.intent, prompt: n.prompt || w.prompt, reflection: n.reflection || w.reflection }; };
window.topWorks = () => {
  const t = D.works.filter(w => HEARTS[w.id] > 0).sort((a, b) => HEARTS[b.id] - HEARTS[a.id]).slice(0, 5);
  if (t.length) { window.topTitle = "하트를 많이 받은 작품"; return t; }
  window.topTitle = "대표 작품"; return D.works.filter(w => w.featured).slice(0, 4);
};
const _work = work;
work = function (id) {
  _work(id); const st = document.querySelector(".stage"); if (!ON || !st) return;
  const b = document.createElement("button"); b.className = "btn2 heart";
  const paint = () => { b.textContent = `❤️ ${HEARTS[id] || 0}`; }; paint();
  b.onclick = async () => {
    if (b.disabled) return; b.disabled = true; b.classList.add("pop");
    try { HEARTS[id] = await rpc("clap", { w: id, d: dev }); paint(); }
    catch (e) { if (!String(e.message).includes("slow")) b.textContent = "잠시 후 다시 눌러 주세요"; }
    setTimeout(() => { b.disabled = false; b.classList.remove("pop"); paint(); }, 3000);
  };
  st.after(b);
};
const _student = student;
student = function (id) {
  _student(id); if (!ON || !document.querySelector(".profile")) return;
  const sec = document.createElement("section"); sec.className = "info gb";
  sec.innerHTML = `<h3>다녀갔어요!</h3><p class="note">이름·전화번호 같은 개인정보는 쓰지 말아 주세요.</p>
    <input id="gn" maxlength="20" placeholder="별명"><textarea id="gm" maxlength="200" placeholder="작가에게 한마디 (200자까지)"></textarea>
    <button class="btn2" id="gs">흔적 남기기</button><p id="gmsg" class="note"></p><div id="gl"></div>`;
  app.appendChild(sec);
  const gn = sec.querySelector("#gn"), gm = sec.querySelector("#gm"), msg = sec.querySelector("#gmsg"), gl = sec.querySelector("#gl");
  const load = async () => {
    try { const L = await rpc("get_guestbook", { s: id });
      gl.innerHTML = L.length ? L.map(m => `<div class="bubble"><b>${esc(m.nick)}</b><p>${esc(m.msg)}</p><small>${new Date(m.at).toLocaleString("ko-KR")}</small></div>`).join("") : "<p class='empty'>첫 번째 방문 흔적을 남겨 주세요!</p>";
    } catch (e) { gl.textContent = "방명록을 불러오지 못했어요."; }
  };
  sec.querySelector("#gs").onclick = async () => {
    const n = gn.value.trim(), m = gm.value.trim();
    if (!n || !m) { msg.textContent = "별명과 메시지를 모두 적어 주세요."; return; }
    if (containsBadWord(n) || containsBadWord(m)) { alert(BADWORD_MESSAGE); return; }
    try { await rpc("add_guestbook", { s: id, n, m, d: dev }); gn.value = gm.value = ""; msg.textContent = ""; load(); }
    catch (e) { msg.textContent = String(e.message).includes("slow") ? "잠시 후에 다시 남겨 주세요." : "등록하지 못했어요. 다시 시도해 주세요."; }
  };
  load();
};
const TYPES = [["image", "이미지"], ["audio", "노래"], ["video", "동영상"], ["game", "게임"], ["url", "웹사이트"], ["avatar", "썸네일 (목록 원형 이미지)"], ["profile", "프로필"], ["etc", "기타"]];
const $id = id => document.getElementById(id);
function profileForm(sid, code) {
  const pf = $id("pform"), st = D.students.find(x => x.id === sid);
  pf.innerHTML = `<div class="info"><h3>내 작가 정보</h3><p class="note">실명·전화번호·계정은 쓰지 말아 주세요. 모두에게 공개돼요.</p>
    <label>작가명 (20자까지)</label><input id="pn" maxlength="20" value="${esc(st.artistName)}"><label>한 줄 소개 (60자까지)</label><input id="pi" maxlength="60" value="${esc(st.intro)}">
    <button class="btn2" id="ps">저장</button><p id="pmsg" class="note"></p></div>`;
  $id("ps").onclick = async () => {
    const n = $id("pn").value.trim(), i = $id("pi").value.trim(), pm = $id("pmsg");
    if (!n) { pm.textContent = "작가명을 적어 주세요."; return; }
    try { await rpc("save_profile", { s: sid, c: code, n, i }); PROFILES[sid] = { name: n, intro: i }; applyProfiles(); pm.textContent = "저장했어요!"; }
    catch (e) { pm.textContent = "저장하지 못했어요. 다시 시도해 주세요."; }
  };
}
async function myWorks(sid, code) {
  const box = $id("mform"); let list = [], note = "";
  const draw = () => {
    box.innerHTML = `<div class="info"><h3>내가 올린 작품</h3><p class="note">작품은 Suno, 캔바 등에 올린 뒤 공유 링크(https://…)를 붙여넣어요. 선생님이 확인하면 사이트에 공개돼요.</p>
      ${note ? `<p class="note">${esc(note)}</p>` : ""}
      ${list.map(w => `<div class="row"><b>${esc(w.title)}</b> <span class="tag">${w.approved ? "공개 중" : "확인 대기"}</span> <button class="btn2" data-e="${esc(w.id)}">고치기</button></div>`).join("") || "<p class='note'>아직 올린 작품이 없어요.</p>"}
      <button class="btn2" id="wnew">+ 새 작품 추가</button></div><div id="wedit"></div>`;
    box.querySelectorAll("[data-e]").forEach(b => b.onclick = () => edit(list.find(w => w.id === b.dataset.e)));
    $id("wnew").onclick = () => edit(null);
  };
  const load = async () => { try { list = (await rpc("my_works", { s: sid, c: code })) || []; } catch (e) { list = []; } draw(); };
  const edit = w0 => {
    const w = w0 || { id: "", title: "", type: "image", description: "", url: "", cover: "", tool: "", prompt: "", intent: "", reflection: "" }, ed = $id("wedit");
    ed.innerHTML = `<div class="info"><h3>${w.id ? "작품 고치기" : "새 작품"}</h3>
      <label>작품 제목</label><input id="e1" maxlength="40" value="${esc(w.title)}">
      <label>작품 종류</label><select id="e2">${TYPES.map(t => `<option value="${t[0]}" ${t[0] === w.type ? "selected" : ""}>${t[1]}</option>`).join("")}</select><p class="note" id="e2n"></p>
      <label>작품 링크 (https://로 시작)</label><input id="e3" maxlength="500" value="${esc(w.url)}">
      <label>표지 이미지 링크 (선택 · 드라이브 이미지 파일 링크)</label><input id="e9" maxlength="500" value="${esc(w.cover || "")}">
      <label>작품 설명</label><textarea id="e4" maxlength="300">${esc(w.description)}</textarea>
      <label>사용한 AI 도구</label><input id="e5" maxlength="60" value="${esc(w.tool)}">
      <label>사용한 프롬프트</label><textarea id="e6" maxlength="3000" rows="5">${esc(w.prompt)}</textarea>
      <label>만든 의도</label><textarea id="e7" maxlength="500">${esc(w.intent)}</textarea>
      <label>소감</label><textarea id="e8" maxlength="500">${esc(w.reflection)}</textarea>
      <button class="btn2" id="esave">저장</button> ${w.id ? '<button class="btn2" id="edel">삭제</button>' : ""}<p id="emsg" class="note"></p></div>`;
    const g = k => $id("e" + k).value, em = $id("emsg");
    const NOTE = { avatar: "학생 목록의 원형 이미지로 쓰여요. 정사각형 이미지를 올리고, 중요한 모습은 가운데에 두세요. (표지 칸은 비워 두세요)", profile: "내 프로필 이미지 링크를 넣어요. 작품 모아보기의 '프로필'에 모여요. 학생 목록의 원형 이미지는 '썸네일' 종류로 따로 올려요." };
    const nt = () => { $id("e2n").textContent = NOTE[g(2)] || ""; }; $id("e2").onchange = nt; nt();
    $id("esave").onclick = async () => {
      if (!g(1).trim()) { em.textContent = "작품 제목을 적어 주세요."; return; }
      if (!/^https:\/\/\S+$/i.test(g(3).trim())) { em.textContent = "링크는 https://로 시작해야 해요."; return; }
      const sv = $id("esave"); if (sv.disabled) return; sv.disabled = true; sv.textContent = "저장 중…";
      try { await rpc("save_my_work", { s: sid, c: code, w: w.id, t: g(1), ty: g(2), u: g(3), cv: g(9), d: g(4), tl: g(5), p: g(6), i: g(7), r: g(8) }); note = "저장했어요. 선생님이 확인하면 공개돼요."; await load(); }
      catch (e) { sv.disabled = false; sv.textContent = "저장"; em.textContent = String(e.message).includes("limit") ? "작품은 8개까지 올릴 수 있어요." : "저장하지 못했어요. 입력을 확인해 주세요."; }
    };
    if (w.id) $id("edel").onclick = async () => {
      if (!confirm("이 작품을 삭제할까요?")) return;
      try { await rpc("delete_my_work", { s: sid, c: code, w: w.id }); note = "삭제했어요."; await load(); } catch (e) { em.textContent = "삭제하지 못했어요."; }
    };
  };
  await load();
}
function notesForm(sid, code) {
  const form = $id("wform"), ws = BASE_WORKS.filter(w => w.studentId === sid);
  if (!ws.length) { form.innerHTML = ""; return; }
  form.innerHTML = `<div class="info"><h3>선생님이 올린 작품에 글쓰기</h3><select id="fw">${ws.map(w => `<option value="${esc(w.id)}">${esc(w.title)}</option>`).join("")}</select>
    <label>만든 의도</label><textarea id="fi" maxlength="500"></textarea><label>사용한 프롬프트</label><textarea id="fp" maxlength="3000" rows="6"></textarea>
    <label>소감</label><textarea id="fr" maxlength="500"></textarea><button class="btn2" id="fs">저장</button><p id="fmsg" class="note"></p></div>`;
  const fill = () => { const n = NOTES[$id("fw").value] || {}; $id("fi").value = n.intent || ""; $id("fp").value = n.prompt || ""; $id("fr").value = n.reflection || ""; };
  $id("fw").onchange = fill; fill();
  $id("fs").onclick = async () => {
    const w = $id("fw").value, i = $id("fi").value, p = $id("fp").value, r = $id("fr").value;
    try { await rpc("save_note", { s: sid, c: code, w, i, p, r }); NOTES[w] = { intent: i, prompt: p, reflection: r }; $id("fmsg").textContent = "저장했어요!"; }
    catch (e) { $id("fmsg").textContent = "저장하지 못했어요. 다시 시도해 주세요."; }
  };
}
window.writePage = function () {
  if (!ON) { app.innerHTML = '<p class="empty">아직 준비 중이에요.</p>'; return; }
  if (!WRITE_ENABLED) { app.innerHTML = '<p class="empty">지금은 작품 글쓰기 기간이 아니에요.</p>'; return; }
  app.innerHTML = `<h2>내 작품 글쓰기</h2><p>선생님께 받은 작가 코드로 내 정보와 작품을 올릴 수 있어요.</p>
    <div class="info"><select id="ws">${D.students.map(s => `<option value="${esc(s.id)}">${esc(s.artistName)}</option>`).join("")}</select>
    <input id="wc" type="password" placeholder="작가 코드"><button class="btn2" id="wok">확인</button><p id="wmsg" class="note"></p></div>
    <div id="pform"></div><div id="mform"></div><div id="wform"></div>`;
  $id("wok").onclick = async () => {
    const sid = $id("ws").value, code = $id("wc").value.trim(), msg = $id("wmsg");
    try { if (!(await rpc("check_code", { s: sid, c: code }))) throw 0; } catch (e) { msg.textContent = "코드가 맞지 않아요."; return; }
    msg.textContent = ""; profileForm(sid, code); myWorks(sid, code); notesForm(sid, code);
  };
};
// 작품 모아보기 순서: "new" 최신순 | "old" 오래된 순 | "random" 무작위 | "hearts" 하트 많은 순
const ALL_ORDER = "new";
const ordered = list => {
  const a = list.slice();
  if (ALL_ORDER === "new") return a.reverse();
  if (ALL_ORDER === "random") return a.sort(() => Math.random() - 0.5);
  if (ALL_ORDER === "hearts") return a.sort((x, y) => (HEARTS[y.id] || 0) - (HEARTS[x.id] || 0));
  return a;
};
window.allPage = function () {
  const f = window.__f || "all";
  const list = ordered(D.works.filter(w => f === "all" || w.type === f));
  app.innerHTML = `<h2>작품 모아보기</h2><div class="chips">${[["all", "전체"], ...Object.entries(LABEL).filter(([k]) => k !== "avatar")].map(([k, v]) => `<button class="chip ${k === f ? "on" : ""}" data-k="${k}">${k === "all" ? "" : ICON[k] + " "}${v}</button>`).join("")}</div>
    ${list.length ? `<div class="grid">${list.map(workCard).join("")}</div>` : '<p class="empty">이 종류의 작품이 아직 없어요.</p>'}`;
  app.querySelectorAll(".chip").forEach(b => b.onclick = () => { window.__f = b.dataset.k; window.allPage(); });
};
(async () => {
  document.querySelector(".top nav").insertAdjacentHTML("beforeend", '<a href="#/all">작품 모아보기</a>');
  if (ON) {
    if (SHOW_WRITE_TAB) document.querySelector(".top nav").insertAdjacentHTML("beforeend", '<a href="#/write">내 작품 글쓰기</a>');
    const refresh = async () => { try { const p = await rpc("get_public"); HEARTS = p.hearts || {}; NOTES = p.notes || {}; PROFILES = p.profiles || {}; DBW = p.works || []; D.works = BASE_WORKS.concat(DBW.filter(w => w.type !== "avatar").map(w => ({ ...w, ext: true, thumbnail: coverUrl(w.cover) }))); applyProfiles(); return true; } catch (e) { return false; } };
    await refresh();
    // 첫 화면으로 돌아올 때 다른 노트북의 하트까지 반영
    addEventListener("hashchange", async () => { if ((location.hash === "" || location.hash === "#/") && await refresh()) route(); });
  }
  route();
})();
