var currentLang = localStorage.getItem ? 'en' : 'en';
try{ var savedLang = window.localStorage.getItem('csuz_lang'); if(savedLang) currentLang = savedLang; }catch(e){}

function t(key){
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

var URDU_FONT_LOADED=false;
function ensureUrduFont(){
  if(URDU_FONT_LOADED) return;
  URDU_FONT_LOADED=true;
  var l=document.createElement('link');
  l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap';
  document.head.appendChild(l);
}
function applyLanguage(){
  document.documentElement.lang = currentLang;
  var rtl = !!RTL_LANGS[currentLang];
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.body.classList.toggle('lang-ur', currentLang==='ur');
  if(currentLang==='ur') ensureUrduFont();
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    var key = el.getAttribute('data-i18n-ph');
    el.setAttribute('placeholder', t(key));
  });
  document.querySelectorAll('[data-i18n-inline]').forEach(function(el){
    var key = el.getAttribute('data-i18n-inline');
    el.textContent = t(key);
  });
  document.querySelectorAll('.lang-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.lang===currentLang);
  });
  renderArticleGrids();
  renderLearn();
  renderTimeline();
  renderRoadmap();
  labIndex=0; labScore=0; renderLab();
  quizState=null; renderQuiz();
  document.getElementById('urlResult').innerHTML='';
}

/* Languages shipped as separate packs, fetched the first time they are picked. */
var LANG_PACKS={kk:1, ur:1, es:1, id:1};
var RTL_LANGS={ur:1};
function ensureLang(code, cb){
  if(!LANG_PACKS[code] || I18N[code]) return cb();
  var s=document.createElement('script');
  s.src='lang-'+code+'.js';
  s.onload=cb;
  s.onerror=cb;
  document.head.appendChild(s);
}
function setLang(code){
  ensureLang(code, function(){
    currentLang = I18N[code] ? code : 'en';
    try{ window.localStorage.setItem('csuz_lang', currentLang); }catch(err){}
    applyLanguage();
  });
}
document.getElementById('langSwitch').addEventListener('click', function(e){
  var btn=e.target.closest('.lang-btn');
  if(btn) setLang(btn.dataset.lang);
});

/* ---------- ROUTER ---------- */
function navigate(route){
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  var target = document.getElementById('page-'+route) ? route : 'home';
  document.getElementById('page-'+target).classList.add('active');
  document.querySelectorAll('[data-nav]').forEach(function(a){ a.classList.toggle('active', a.dataset.nav===target); });
  window.scrollTo({top:0, behavior:'instant'});
  document.getElementById('mobileMenu').classList.remove('open');
  history.replaceState(null,'','#'+target);
  observeReveals();
}
document.querySelectorAll('[data-nav]').forEach(function(el){
  el.addEventListener('click', function(e){ e.preventDefault(); navigate(el.dataset.nav); });
});
window.addEventListener('load', function(){ navigate(location.hash.replace('#','')||'home'); });

/* ---------- SCROLL REVEAL ---------- */
var revealIO = ('IntersectionObserver' in window) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('in'); revealIO.unobserve(en.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'})
  : null;
function observeReveals(){
  if(!revealIO) return;
  document.querySelectorAll('.reveal:not(.in)').forEach(function(el){ revealIO.observe(el); });
}
observeReveals();

/* ---------- THEME ---------- */
var themeBtn=document.getElementById('themeToggle');
themeBtn.addEventListener('click', function(){
  var cur=document.body.getAttribute('data-theme');
  var next=cur==='dark'?'light':'dark';
  document.body.setAttribute('data-theme', next);
  themeBtn.textContent = next==='dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
});

/* ---------- MOBILE MENU ---------- */
document.getElementById('hamburgerBtn').addEventListener('click', function(){ document.getElementById('mobileMenu').classList.add('open'); });
document.getElementById('closeMobile').addEventListener('click', function(){ document.getElementById('mobileMenu').classList.remove('open'); });

/* ---------- ARTICLES ---------- */
function renderArticleGrids(){
  var list = ARTICLES[currentLang] || ARTICLES.en;
  var cardHtml = function(a){
    return '<div class="card clickable" onclick="openArticle(\''+a.id+'\')">'
      + '<span class="badge">'+a.tag+'</span>'
      + '<h4 style="margin-top:12px;">'+a.t+'</h4>'
      + '<p>'+a.r+' · '+t('by_label')+'</p>'
      + '</div>';
  };
  var home = document.getElementById('articleGrid');
  var full = document.getElementById('articleListGrid');
  if(home) home.innerHTML = list.slice(0,6).map(cardHtml).join('');
  if(full) full.innerHTML = list.map(cardHtml).join('');
}
function openArticle(id){
  var list = ARTICLES[currentLang] || ARTICLES.en;
  var a=list.find(function(x){ return x.id===id; });
  if(!a) return;
  var quizHtml='';
  if(a.quiz){
    quizHtml='<div class="card" style="margin-top:28px;">'
      + '<span class="eyebrow-mini">'+t('test_yourself_label')+'</span>'
      + '<h4 style="margin:10px 0 14px;">'+a.quiz.q+'</h4>'
      + '<div id="artQuizOpts">'+a.quiz.options.map(function(o,i){ return '<button class="opt" onclick="answerArtQuiz('+i+')">'+o+'</button>'; }).join('')+'</div>'
      + '<div id="artQuizFeedback"></div></div>';
  }
  document.getElementById('articleDetailBody').innerHTML =
    '<span class="badge">'+a.tag+'</span>'
    + '<h1 style="font-size:clamp(24px,4vw,32px); margin:14px 0 10px;">'+a.t+'</h1>'
    + '<p style="color:var(--text-dim); font-size:13px; margin-bottom:26px;" class="mono">'+a.r+' · '+t('by_label')+' Ataxanov Shoxjaxon · '+a.date+'</p>'
    + a.paras.map(function(p){ return '<p style="color:var(--text); font-size:15.5px; line-height:1.8; margin-bottom:16px;">'+p+'</p>'; }).join('')
    + quizHtml;
  window.currentArtQuiz=a.quiz;
  navigate('article-detail');
}
function answerArtQuiz(idx){
  var quiz=window.currentArtQuiz;
  document.querySelectorAll('#artQuizOpts .opt').forEach(function(btn,bi){
    btn.disabled=true;
    if(bi===quiz.correct) btn.classList.add('correct');
    else if(bi===idx) btn.classList.add('incorrect');
  });
  document.getElementById('artQuizFeedback').innerHTML = '<p style="margin-top:14px; font-size:13.5px; color:var(--text-muted);">'+(idx===quiz.correct? (t('feedback_correct_title')+' ') : (t('feedback_wrong_title')+' '))+quiz.explain+'</p>';
}

/* ---------- LEARN ---------- */
var colorMap={blue:['var(--blue-dim)','var(--blue)'],violet:['var(--violet-dim)','var(--violet)'],danger:['var(--danger-dim)','var(--danger)'],warn:['var(--warn-dim)','var(--warn)']};
function renderLearn(){
  var cats = LEARN[currentLang] || LEARN.en;
  document.getElementById('learnCats').innerHTML = cats.map(function(cat,i){
    var pair=colorMap[cat.color]; var bg=pair[0]; var fg=pair[1];
    return '<div class="cat" id="cat-'+i+'">'
      + '<div class="cat-head" onclick="document.getElementById(\'cat-'+i+'\').classList.toggle(\'open\')">'
      + '<div class="cat-head-left"><div class="icon-box" style="background:'+bg+';color:'+fg+';">'+cat.icon+'</div>'
      + '<div><h4>'+cat.name+'</h4><span class="count">'+cat.topics.length+' '+t('learn_topics_suffix')+'</span></div></div>'
      + '<span class="chev">\u25be</span></div>'
      + '<div class="cat-body"><div class="topic-list">'+cat.topics.map(function(tp){ return '<div class="topic"><b>'+tp[0]+'</b> — '+tp[1]+'</div>'; }).join('')+'</div></div>'
      + '</div>';
  }).join('');
}

/* ---------- IMPACT TIMELINE ---------- */
function renderTimeline(){
  document.getElementById('tl2026').innerHTML = t('tl2026').map(function(x){ return '<li>'+x+'</li>'; }).join('');
  document.getElementById('tl2027').innerHTML = t('tl2027').map(function(x){ return '<li>'+x+'</li>'; }).join('');
  document.getElementById('tl2027label').textContent = t('tl2027_label');
}

/* ---------- RESOURCES ROADMAP ---------- */
function renderRoadmap(){
  var items = t('roadmap');
  document.getElementById('roadmapList').innerHTML = items.map(function(it,i){
    return '<div class="res-item"><span class="res-num">'+String(i+1).padStart(2,'0')+'</span><div><b>'+it[0]+'</b><p style="color:var(--text-muted); font-size:13.5px;">'+it[1]+'</p></div></div>';
  }).join('');
}

/* ---------- PHISHING LAB ---------- */
var labIndex=0, labScore=0, labAnswered=false;
function renderLab(){
  var scenarios = PHISHING[currentLang] || PHISHING.en;
  var wrap=document.getElementById('labWrap');
  if(!wrap) return;
  if(labIndex>=scenarios.length){
    var pct=Math.round((labScore/scenarios.length)*100);
    var level=t('level_beginner'), cls='warn';
    if(pct>=80){level=t('level_advanced'); cls='safe';} else if(pct>=50){level=t('level_intermediate'); cls='warn';} else {cls='danger';}
    wrap.innerHTML='<div class="email-card result-card">'
      + '<div style="font-size:13px;color:var(--text-muted);">'+t('score_label')+'</div>'
      + '<div class="score">'+labScore+'/'+scenarios.length+'</div>'
      + '<div class="status-pill '+cls+'"><span class="dot"></span>'+t('awareness_level_label')+': '+level+'</div>'
      + '<div style="margin-top:24px;"><button class="btn btn-primary" onclick="labIndex=0;labScore=0;renderLab();">'+t('try_again_btn')+'</button></div>'
      + '</div>';
    return;
  }
  var s=scenarios[labIndex];
  wrap.innerHTML =
    '<div class="progress-bar"><div class="progress-fill" style="width:'+((labIndex/scenarios.length)*100)+'%"></div></div>'
    + '<div class="email-card">'
    + '<div class="email-head"><div class="row"><span>From</span><span>'+s.from+'</span></div>'
    + '<div class="row"><span>Subj.</span><span style="font-family:var(--font-body);font-weight:600;">'+s.subject+'</span></div></div>'
    + '<div class="email-body">'+s.body+'<div class="email-link">'+s.link+'</div></div>'
    + '<div class="judge-row" id="judgeRow">'
    + '<button class="judge-btn safe" onclick="judge(\'safe\')">'+t('judge_safe')+'</button>'
    + '<button class="judge-btn phish" onclick="judge(\'phish\')">'+t('judge_phish')+'</button>'
    + '</div><div id="labFeedback"></div></div>';
  labAnswered=false;
}
function judge(choice){
  if(labAnswered) return;
  labAnswered=true;
  var scenarios = PHISHING[currentLang] || PHISHING.en;
  var s=scenarios[labIndex];
  var correct = choice===s.answer;
  if(correct) labScore++;
  document.getElementById('judgeRow').style.display='none';
  var wasWord = s.answer==='phish' ? t('was_phishing') : t('was_safe');
  document.getElementById('labFeedback').innerHTML =
    '<div class="feedback '+(correct?'correct':'wrong')+'">'
    + '<h5>'+(correct? t('feedback_correct_title') : t('feedback_wrong_title'))+'</h5>'
    + '<div style="font-size:13.5px;color:var(--text-muted);margin-bottom:6px;">'+t('warning_signs_label')+' <b style="color:var(--text)">'+wasWord+'</b>'+t('warning_colon')+'</div>'
    + '<ul>'+s.flags.map(function(f){ return '<li>'+f+'</li>'; }).join('')+'</ul>'
    + '<button class="btn btn-primary" onclick="labIndex++;renderLab();">'+(labIndex<scenarios.length-1? t('next_scenario_btn') : t('see_results_btn'))+'</button>'
    + '</div>';
}

/* ---------- QUIZ ---------- */
var quizState=null;
function renderQuizHome(){
  var banks = QUIZ[currentLang] || QUIZ.en;
  document.getElementById('quizWrap').innerHTML =
    '<div class="level-grid">'
    + '<div class="level-card" onclick="startQuiz(\'beginner\')"><div class="n">'+t('level_beginner')+'</div><p style="color:var(--text-muted);font-size:13.5px;margin-top:6px;">'+banks.beginner.length+' '+t('questions_suffix')+'</p></div>'
    + '<div class="level-card" onclick="startQuiz(\'intermediate\')"><div class="n">'+t('level_intermediate')+'</div><p style="color:var(--text-muted);font-size:13.5px;margin-top:6px;">'+banks.intermediate.length+' '+t('questions_suffix')+'</p></div>'
    + '<div class="level-card" onclick="startQuiz(\'advanced\')"><div class="n">'+t('level_advanced')+'</div><p style="color:var(--text-muted);font-size:13.5px;margin-top:6px;">'+banks.advanced.length+' '+t('questions_suffix')+'</p></div>'
    + '</div>';
}
function startQuiz(level){
  var banks = QUIZ[currentLang] || QUIZ.en;
  quizState={level:level, i:0, score:0, bank:banks[level]};
  renderQuiz();
}
function renderQuiz(){
  var wrap=document.getElementById('quizWrap');
  if(!wrap) return;
  if(!quizState){ renderQuizHome(); return; }
  var i=quizState.i, bank=quizState.bank, score=quizState.score, level=quizState.level;
  var levelLabel = t('level_'+level);
  if(i>=bank.length){
    var pct=Math.round((score/bank.length)*100);
    var pctWord = pct>=70? t('pct_excellent') : (pct>=40? t('pct_good') : t('pct_keep_practicing'));
    wrap.innerHTML = '<div class="q-card" style="text-align:center;">'
      + '<div style="font-size:13px;color:var(--text-muted);">'+levelLabel+'</div>'
      + '<div class="score" style="font-size:44px;">'+score+'/'+bank.length+'</div>'
      + '<div class="status-pill '+(pct>=70?'safe':pct>=40?'warn':'danger')+'"><span class="dot"></span>'+pct+'% — '+pctWord+'</div>'
      + '<div style="margin-top:22px; display:flex; gap:10px; justify-content:center;">'
      + '<button class="btn btn-secondary" onclick="quizState=null;renderQuiz();">'+t('choose_level_btn')+'</button>'
      + '<button class="btn btn-primary" onclick="startQuiz(\''+level+'\');">'+t('retry_btn')+'</button>'
      + '</div></div>';
    return;
  }
  var q=bank[i];
  wrap.innerHTML =
    '<div class="progress-bar" style="max-width:640px;margin:0 auto 20px;"><div class="progress-fill" style="width:'+((i/bank.length)*100)+'%"></div></div>'
    + '<div class="q-card"><div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">'+t('question_of')+' '+(i+1)+' '+t('of_word')+' '+bank.length+'</div>'
    + '<h4>'+q.q+'</h4>'
    + '<div id="optWrap">'+q.o.map(function(opt,idx){ return '<button class="opt" onclick="answerQuiz('+idx+')">'+opt+'</button>'; }).join('')+'</div>'
    + '</div>';
}
function answerQuiz(idx){
  var bank=quizState.bank, i=quizState.i;
  var q=bank[i];
  document.querySelectorAll('#optWrap .opt').forEach(function(btn,bi){
    btn.disabled=true;
    if(bi===q.a) btn.classList.add('correct');
    else if(bi===idx) btn.classList.add('incorrect');
  });
  if(idx===q.a) quizState.score++;
  setTimeout(function(){ quizState.i++; renderQuiz(); }, 900);
}

/* ---------- URL CHECKER ---------- */
var shorteners=['bit.ly','tinyurl.com','t.co','goo.gl','ow.ly','is.gd','buff.ly'];
document.getElementById('urlCheckBtn').addEventListener('click', checkUrl);
document.getElementById('urlInput').addEventListener('keydown', function(e){ if(e.key==='Enter') checkUrl(); });
function checkUrl(){
  var raw=document.getElementById('urlInput').value.trim();
  var resultBox=document.getElementById('urlResult');
  if(!raw){
    resultBox.innerHTML='<p style="color:var(--danger); font-size:13.5px;">'+t('url_enter_first')+'</p>';
    return;
  }
  var flags=[];
  var url;
  try{ url = new URL(/^https?:\/\//.test(raw) ? raw : 'http://'+raw); }
  catch(e){ resultBox.innerHTML='<p style="color:var(--danger); font-size:13.5px;">'+t('url_invalid')+'</p>'; return; }

  if(url.protocol!=='https:') flags.push(t('flag_https'));
  if(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname)) flags.push(t('flag_ip'));
  if(url.hostname.split('.').length>3) flags.push(t('flag_subdomains'));
  if(raw.indexOf('@')!==-1) flags.push(t('flag_at'));
  if(shorteners.some(function(s){ return url.hostname.indexOf(s)!==-1; })) flags.push(t('flag_shortener'));
  if(/-{2,}/.test(url.hostname) || (url.hostname.match(/-/g)||[]).length>=3) flags.push(t('flag_hyphens'));
  if(/[0-9]/.test(url.hostname.replace(/\./g,'')) && /(paypal|google|facebook|instagram|bank|amazon)/i.test(url.hostname)) flags.push(t('flag_brandmix'));
  if(raw.length>90) flags.push(t('flag_long'));
  if(/\.(zip|xyz|top|club|work)$/i.test(url.hostname)) flags.push(t('flag_tld'));

  var level=t('level_beginner')==='Beginner' ? 'Low' : 'Low';
  var cls='safe';
  var levelText;
  if(flags.length>=3){ cls='danger'; }
  else if(flags.length>=1){ cls='warn'; }
  if(cls==='safe') levelText = currentLang==='uz' ? 'Past' : (currentLang==='ru' ? 'Низкий' : 'Low');
  else if(cls==='warn') levelText = currentLang==='uz' ? 'Oʻrta' : (currentLang==='ru' ? 'Средний' : 'Medium');
  else levelText = currentLang==='uz' ? 'Yuqori' : (currentLang==='ru' ? 'Высокий' : 'High');

  resultBox.innerHTML =
    '<div class="risk-box" style="background:var(--'+cls+'-dim);">'
    + '<div style="font-size:12.5px;color:var(--text-muted);margin-bottom:4px;">'+t('url_risk_label')+'</div>'
    + '<div class="rlabel" style="color:var(--'+cls+');">'+levelText+'</div></div>'
    + (flags.length ? '<div class="flag-list">'+flags.map(function(f){ return '<div class="flag">\u26a0\ufe0f '+f+'</div>'; }).join('')+'</div>'
       : '<div class="flag-list"><div class="flag">'+t('url_no_flags')+'</div></div>')
    + '<p style="font-size:12px;color:var(--text-dim);margin-top:14px;">'+t('url_disclaimer')+'</p>';
}

/* ---------- COUNTRY ENTRY ---------- */
/* ready:true = the site is already translated into that language.
   ready:false = volunteers are still translating; the option is shown but not selectable yet. */
var COUNTRIES=[
 {id:'860', code:'UZ', name:'Uzbekistan', native:'Oʻzbekiston',
  langs:[{name:'Oʻzbekcha', tag:'UZ', lang:'uz', ready:true},{name:'Русский', tag:'RU', lang:'ru', ready:true},{name:'English', tag:'EN', lang:'en', ready:true}]},
 {id:'398', code:'KZ', name:'Kazakhstan', native:'Қазақстан',
  langs:[{name:'Қазақша', tag:'KK', lang:'kk', ready:true},{name:'Русский', tag:'RU', lang:'ru', ready:true},{name:'English', tag:'EN', lang:'en', ready:true}]},
 {id:'586', code:'PK', name:'Pakistan', native:'پاکستان',
  langs:[{name:'اردو', tag:'UR', lang:'ur', ready:true},{name:'English', tag:'EN', lang:'en', ready:true}]},
 {id:'360', code:'ID', name:'Indonesia', native:'Indonesia',
  langs:[{name:'Bahasa Indonesia', tag:'ID', lang:'id', ready:true},{name:'English', tag:'EN', lang:'en', ready:true}]},
 {id:'036', code:'AU', name:'Australia', native:'Australia',
  langs:[{name:'English', tag:'EN', lang:'en', ready:true}]},
 {id:'724', code:'ES', name:'Spain', native:'España',
  langs:[{name:'Español', tag:'ES', lang:'es', ready:true},{name:'English', tag:'EN', lang:'en', ready:true}]},
 {id:'288', code:'GH', name:'Ghana', native:'Ghana',
  langs:[{name:'English', tag:'EN', lang:'en', ready:true}]}
];
var COUNTRY_BY_ID={}; COUNTRIES.forEach(function(c){ COUNTRY_BY_ID[c.id]=c; });

var entryEl=document.getElementById('entry');
var entryStage=document.getElementById('entryStage');
var entryPanel=document.getElementById('entryPanel');
var countryBadge=document.getElementById('countryBadge');
var savedCountry=null;
try{ savedCountry=window.localStorage.getItem('csuz_country'); }catch(e){}

var globe={ready:false, selected:null, spinning:true, flight:null, size:0, base:0};

function openEntry(){ entryEl.classList.add('open'); entryEl.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; if(globe.ready) globeLayout(); }
function closeEntry(){ entryEl.classList.remove('open'); entryEl.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

document.getElementById('entryMenu').innerHTML = COUNTRIES.map(function(c){
  return '<button class="c-chip" data-id="'+c.id+'" aria-pressed="false"><span class="dot"></span>'+c.name+'<span class="cc">'+c.code+'</span></button>';
}).join('');
document.getElementById('entryMenu').addEventListener('click', function(e){
  var btn=e.target.closest('.c-chip');
  if(btn) selectCountry(btn.dataset.id);
});

function selectCountry(id){
  var c=COUNTRY_BY_ID[id];
  globe.selected=id;
  document.getElementById('globeHint').style.opacity=0;
  document.getElementById('globeBack').classList.add('on');
  Array.prototype.forEach.call(document.querySelectorAll('.c-chip'), function(b){
    b.setAttribute('aria-pressed', String(b.dataset.id===id));
  });
  var pending=c.langs.filter(function(l){ return !l.ready; });
  entryPanel.hidden=false;
  entryStage.classList.add('selected');
  entryPanel.innerHTML =
    '<span class="eyebrow-mini">Step 2 — choose a language</span>'
    + '<h2 style="margin-top:12px;">'+c.name+'</h2>'
    + '<p>Lessons, quizzes and the phishing lab, in the languages students in '+c.native+' actually use.</p>'
    + '<div class="lang-list">'+c.langs.map(function(l){
        return '<button class="lang-opt" data-lang="'+l.lang+'"'+(l.ready?'':' disabled')+'>'
          + '<span class="name">'+l.name+'</span><span class="tag">'+(l.ready?l.tag:'SOON')+'</span></button>';
      }).join('')+'</div>'
    + (pending.length ? '<p class="lang-note">'+pending.map(function(l){return l.name;}).join(' and ')
        +' '+(pending.length>1?'are':'is')+' being translated by the '+c.code+' team. Pick another language for now.</p>' : '')
    + '<button class="entry-back" id="entryBackBtn">← All countries</button>';
  if(globe.ready){ globeLayout(); globeFlyTo(id); }
}

function resetCountry(){
  globe.selected=null;
  document.getElementById('globeBack').classList.remove('on');
  Array.prototype.forEach.call(document.querySelectorAll('.c-chip'), function(b){ b.setAttribute('aria-pressed','false'); });
  entryPanel.hidden=true;
  entryStage.classList.remove('selected');
  if(globe.ready){ globeLayout(); globeFlyTo(null); }
}

/* The header switcher offers the languages of the chosen country. */
function renderLangSwitch(countryId){
  var c=COUNTRY_BY_ID[countryId];
  var langs = c ? c.langs.filter(function(l){ return l.ready; })
                : [{tag:'EN', lang:'en'},{tag:'UZ', lang:'uz'},{tag:'RU', lang:'ru'}];
  document.getElementById('langSwitch').innerHTML = langs.map(function(l){
    return '<button class="lang-btn" data-lang="'+l.lang+'">'+l.tag+'</button>';
  }).join('');
}

entryPanel.addEventListener('click', function(e){
  if(e.target.closest('#entryBackBtn')) return resetCountry();
  var opt=e.target.closest('.lang-opt');
  if(!opt || opt.disabled) return;
  var c=COUNTRY_BY_ID[globe.selected];
  try{ window.localStorage.setItem('csuz_country', c.id); }catch(err){}
  countryBadge.textContent=c.code;
  renderLangSwitch(c.id);
  setLang(opt.dataset.lang);
  closeEntry();
});

document.getElementById('globeBack').addEventListener('click', resetCountry);
countryBadge.addEventListener('click', function(){
  openEntry();
  if(globe.selected) resetCountry();
});

if(savedCountry && COUNTRY_BY_ID[savedCountry]){
  countryBadge.textContent=COUNTRY_BY_ID[savedCountry].code;
  renderLangSwitch(savedCountry);
} else {
  renderLangSwitch(null);
  openEntry();
}

/* ---------- globe ---------- */
(function(){
  if(typeof d3==='undefined' || typeof topojson==='undefined') return;
  var canvas=document.getElementById('globe'), wrap=document.getElementById('globeWrap');
  var ctx=canvas.getContext('2d');
  var projection=d3.geoOrthographic().clipAngle(90).precision(0.4).rotate([-66,-44,0]);
  var path=d3.geoPath(projection, ctx);
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var land=[], borders=null, graticule=d3.geoGraticule10(), featureOf={};

  fetch('world-110m.json').then(function(r){ return r.json(); }).then(function(world){
    land=topojson.feature(world, world.objects.countries).features;
    borders=topojson.mesh(world, world.objects.countries, function(a,b){ return a!==b; });
    land.forEach(function(f){ if(COUNTRY_BY_ID[f.id]) featureOf[f.id]=f; });
    globe.ready=true; globe.spinning=!reduced;
    globeLayout();
    if(globe.selected) globeFlyTo(globe.selected);
  }).catch(function(){});

  window.globeLayout=function(){
    var rect=wrap.getBoundingClientRect();
    globe.size=Math.max(240, Math.min(rect.width||360, 520));
    var dpr=Math.min(window.devicePixelRatio||1, 2);
    canvas.width=globe.size*dpr; canvas.height=globe.size*dpr;
    canvas.style.width=globe.size+'px'; canvas.style.height=globe.size+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    globe.base=globe.size/2-6;
    projection.translate([globe.size/2, globe.size/2]);
    if(!globe.selected) projection.scale(globe.base);
    draw();
  };

  function fillFeature(f, fill, stroke, glow, lw){
    ctx.beginPath(); path(f);
    if(glow){ ctx.shadowColor=glow; ctx.shadowBlur=22; }
    ctx.fillStyle=fill; ctx.fill(); ctx.shadowBlur=0;
    if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||0.7; ctx.stroke(); }
  }

  function draw(){
    var s=globe.size, r=s/2;
    ctx.clearRect(0,0,s,s);
    var g=ctx.createRadialGradient(r*0.72, r*0.62, r*0.15, r, r, r);
    g.addColorStop(0,'#132043'); g.addColorStop(0.62,'#0E1730'); g.addColorStop(1,'#080D1A');
    ctx.beginPath(); path({type:'Sphere'}); ctx.fillStyle=g; ctx.fill();
    ctx.beginPath(); path(graticule); ctx.strokeStyle='rgba(62,123,250,0.10)'; ctx.lineWidth=0.5; ctx.stroke();
    ctx.beginPath();
    land.forEach(function(f){ if(!COUNTRY_BY_ID[f.id]) path(f); });
    ctx.fillStyle='#16213A'; ctx.fill();
    if(borders){ ctx.beginPath(); path(borders); ctx.strokeStyle='rgba(35,49,80,0.9)'; ctx.lineWidth=0.5; ctx.stroke(); }
    COUNTRIES.forEach(function(c){
      if(c.id===globe.selected || !featureOf[c.id]) return;
      fillFeature(featureOf[c.id], 'rgba(62,123,250,0.72)', 'rgba(140,180,255,0.85)', 'rgba(62,123,250,0.75)');
    });
    if(globe.selected && featureOf[globe.selected]){
      fillFeature(featureOf[globe.selected], '#3E7BFA', '#CBDCFF', 'rgba(62,123,250,0.95)', 1.1);
      var cen=d3.geoCentroid(featureOf[globe.selected]), rot=projection.rotate();
      if(d3.geoDistance(cen, [-rot[0], -rot[1]]) < Math.PI/2){
        var pt=projection(cen);
        ctx.font="600 11px 'JetBrains Mono', monospace"; ctx.fillStyle='#E9EEFA'; ctx.textAlign='center';
        ctx.fillText(COUNTRY_BY_ID[globe.selected].code, pt[0], pt[1]-12);
      }
    }
    ctx.beginPath(); path({type:'Sphere'}); ctx.strokeStyle='rgba(62,123,250,0.38)'; ctx.lineWidth=1; ctx.stroke();
  }

  function zoomScaleFor(f){
    var cen=d3.geoCentroid(f);
    var probe=d3.geoOrthographic().clipAngle(90).translate([globe.size/2, globe.size/2]).rotate([-cen[0],-cen[1],0]).scale(globe.base);
    var b=d3.geoPath(probe).bounds(f);
    var w=Math.max(b[1][0]-b[0][0],1), h=Math.max(b[1][1]-b[0][1],1);
    var k=Math.min((globe.size*0.44)/w, (globe.size*0.44)/h);
    return Math.max(globe.base, Math.min(globe.base*k, globe.base*3.6));
  }

  window.globeFlyTo=function(id){
    if(!globe.ready) return;
    var f=id ? featureOf[id] : null;
    var cen=f ? d3.geoCentroid(f) : null;
    globe.spinning=false;
    var ri=d3.interpolate(projection.rotate(), cen ? [-cen[0],-cen[1],0] : [-66,-44,0]);
    var si=d3.interpolate(projection.scale(), f ? zoomScaleFor(f) : globe.base);
    var dur=reduced?1:1150;
    if(globe.flight) globe.flight.stop();
    globe.flight=d3.timer(function(elapsed){
      var t=Math.min(1, elapsed/dur), e=d3.easeCubicInOut(t);
      projection.rotate(ri(e)).scale(si(e));
      draw();
      if(t===1){ globe.flight.stop(); globe.flight=null; if(!id) globe.spinning=!reduced; }
    });
  };

  d3.timer(function(){
    if(!globe.ready || !globe.spinning || globe.flight || !entryEl.classList.contains('open')) return;
    var rot=projection.rotate();
    projection.rotate([rot[0]+0.14, rot[1], rot[2]]);
    draw();
  });

  var drag=null;
  canvas.addEventListener('pointerdown', function(e){
    canvas.setPointerCapture(e.pointerId);
    drag={x:e.clientX, y:e.clientY, rot:projection.rotate(), moved:0};
    globe.spinning=false;
    if(globe.flight){ globe.flight.stop(); globe.flight=null; }
  });
  canvas.addEventListener('pointermove', function(e){
    if(!drag) return;
    var k=65/projection.scale();
    var dx=e.clientX-drag.x, dy=e.clientY-drag.y;
    drag.moved=Math.max(drag.moved, Math.abs(dx)+Math.abs(dy));
    projection.rotate([drag.rot[0]+dx*k, Math.max(-88, Math.min(88, drag.rot[1]-dy*k)), drag.rot[2]]);
    draw();
    document.getElementById('globeHint').style.opacity=0;
  });
  canvas.addEventListener('pointerup', function(e){
    var wasDrag = drag && drag.moved>4;
    drag=null;
    if(wasDrag || !globe.ready) return;
    var rect=canvas.getBoundingClientRect();
    var pt=projection.invert([e.clientX-rect.left, e.clientY-rect.top]);
    if(!pt) return;
    for(var i=0;i<COUNTRIES.length;i++){
      var f=featureOf[COUNTRIES[i].id];
      if(f && d3.geoContains(f, pt)){ selectCountry(COUNTRIES[i].id); return; }
    }
  });
  canvas.addEventListener('pointercancel', function(){ drag=null; });
  window.addEventListener('resize', function(){ if(globe.ready) globeLayout(); });
})();

/* ---------- INIT ---------- */
setLang(currentLang);
