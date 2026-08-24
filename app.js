var currentLang = localStorage.getItem ? 'en' : 'en';
try{ var savedLang = window.localStorage.getItem('csuz_lang'); if(savedLang) currentLang = savedLang; }catch(e){}

function t(key){
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

function applyLanguage(){
  document.documentElement.lang = currentLang;
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
  var pwInput=document.getElementById('pwInput');
  if(pwInput && pwInput.value){ pwInput.dispatchEvent(new Event('input')); }
  else{
    var lbl=document.getElementById('pwStrengthLabel');
    if(lbl){ lbl.textContent=t('pw_enter_prompt'); lbl.style.color='var(--text-muted)'; }
  }
  document.getElementById('urlResult').innerHTML='';
}

document.getElementById('langSwitch').addEventListener('click', function(e){
  var btn=e.target.closest('.lang-btn');
  if(!btn) return;
  currentLang=btn.dataset.lang;
  try{ window.localStorage.setItem('csuz_lang', currentLang); }catch(err){}
  applyLanguage();
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
}
document.querySelectorAll('[data-nav]').forEach(function(el){
  el.addEventListener('click', function(e){ e.preventDefault(); navigate(el.dataset.nav); });
});
window.addEventListener('load', function(){ navigate(location.hash.replace('#','')||'home'); });

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
  if(home) home.innerHTML = list.slice(0,3).map(cardHtml).join('');
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

/* ---------- PASSWORD CHECKER ---------- */
var pwInput=document.getElementById('pwInput');
var pwEye=document.getElementById('pwEye');
pwEye.addEventListener('click', function(){
  pwInput.type = pwInput.type==='password' ? 'text' : 'password';
  pwEye.textContent = pwInput.type==='password' ? '\uD83D\uDC41' : '\uD83D\uDE48';
});
var commonPatterns=['password','123456','qwerty','admin','letmein','welcome','iloveyou','111111','abc123'];
pwInput.addEventListener('input', function(){
  var v=pwInput.value;
  var fill=document.getElementById('pwMeterFill');
  var label=document.getElementById('pwStrengthLabel');
  var crit=document.getElementById('pwCrit');
  if(!v){ fill.style.width='0%'; label.textContent=t('pw_enter_prompt'); label.style.color='var(--text-muted)'; crit.innerHTML=''; return; }
  var checks={
    length: v.length>=12,
    lengthLoose: v.length>=8,
    upper: /[A-Z]/.test(v),
    lower: /[a-z]/.test(v),
    number: /[0-9]/.test(v),
    symbol: /[^A-Za-z0-9]/.test(v),
    common: !commonPatterns.some(function(p){ return v.toLowerCase().indexOf(p)!==-1; }),
    sequential: !/(0123|1234|2345|3456|abcd|qwer)/i.test(v)
  };
  var score=0;
  if(checks.lengthLoose) score++;
  if(checks.length) score++;
  if(checks.upper) score++;
  if(checks.lower) score++;
  if(checks.number) score++;
  if(checks.symbol) score++;
  if(checks.common) score++;
  if(checks.sequential) score++;
  var pct=Math.round((score/8)*100);
  fill.style.width=pct+'%';
  var strength=t('pw_weak'), color='var(--danger)';
  if(pct>=85){strength=t('pw_verystrong'); color='var(--safe)';}
  else if(pct>=65){strength=t('pw_strong'); color='var(--safe)';}
  else if(pct>=40){strength=t('pw_moderate'); color='var(--warn)';}
  fill.style.background=color;
  label.textContent=t('pw_strength_prefix')+' '+strength;
  label.style.color=color;
  var items=[
    [checks.length,t('crit_length')],
    [checks.upper && checks.lower,t('crit_case')],
    [checks.number,t('crit_number')],
    [checks.symbol,t('crit_symbol')],
    [checks.common,t('crit_common')],
    [checks.sequential,t('crit_sequential')]
  ];
  crit.innerHTML=items.map(function(pair){
    var ok=pair[0], lbl=pair[1];
    return '<div class="c" style="color:'+(ok?'var(--safe)':'var(--danger)')+'">'+(ok?'\u2705':'\u274c')+' <span style="color:var(--text)">'+lbl+'</span></div>';
  }).join('');
});

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

/* ---------- INIT ---------- */
applyLanguage();
