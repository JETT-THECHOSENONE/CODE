import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GameMode, QuizCategory } from '@same-word/shared';
import { useGame } from './store';

const copy=async(text:string)=>{try{await navigator.clipboard.writeText(text);return true}catch{return false}};
const zh={
  create:'创建房间',join:'加入房间',word:'同词联想',quiz:'默契问答',name:'怎么称呼你？',code:'六位房间号',people:'房间人数',time:'每轮思考时间',
  createMine:'创建我的房间',joinNow:'进入房间',tag:'你的脑回路，恰好我也有。',sub:'各想一个词，同时揭晓；没撞上，就从这些词继续联想。',
  waiting:'等待好友加入',copyCode:'复制房间号',copyLink:'复制邀请链接',leave:'退出房间',submitted:'已提交',thinking:'思考中',
  submit:'确认提交',answer:'输入你的联想词',rules:'游戏说明',privacy:'隐私说明',round:'轮',reveal:'答案揭晓',next:'下一轮即将开始',
  success:'同词相遇成功！',again:'再来一局',home:'返回首页',share:'分享结果',question:'默契问答',score:'默契同步率'
};
const en={...zh,create:'Create room',join:'Join room',word:'Same word',quiz:'Sync quiz',name:'Your name',code:'6-digit room code',people:'Players',time:'Thinking time',createMine:'Create my room',joinNow:'Join room',tag:'Your minds just met.',sub:'Think of a word, reveal together, and keep associating until everyone matches.',waiting:'Waiting for friends',copyCode:'Copy code',copyLink:'Copy invite link',leave:'Leave room',submitted:'Submitted',thinking:'Thinking',submit:'Submit',answer:'Type your word',rules:'How to play',privacy:'Privacy',round:'Round',reveal:'Reveal',next:'Next round soon',success:'You found the same word!',again:'Play again',home:'Home',share:'Share result',question:'Sync quiz',score:'Sync rate'};

export default function App(){
  const g=useGame(); const T=g.locale==='zh'?zh:en;
  useEffect(()=>{g.connect()},[]);
  useEffect(()=>{const params=new URLSearchParams(location.search);const code=params.get('room');if(code&&!g.snapshot)sessionStorage.setItem('pending-room',code)},[g.snapshot]);
  return <div className="app-shell">
    <div className="ambient a1"/><div className="ambient a2"/><div className="grain"/>
    <Header locale={g.locale} setLocale={g.setLocale}/>
    <main>{!g.snapshot?<Landing T={T}/>:<Room T={T}/>}</main>
    {!g.snapshot&&<footer><span>让脑回路相遇，让朋友更靠近。</span><span>独立制作 · 非官方项目</span></footer>}
    <AnimatePresence>{g.error&&<Toast text={g.error} onClose={g.clearError}/>}</AnimatePresence>
    <AnimatePresence>{g.notice&&<motion.div className="notice" initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} exit={{opacity:0}}>{g.notice}</motion.div>}</AnimatePresence>
  </div>
}

function Header({locale,setLocale}:{locale:string;setLocale:(x:'zh'|'en')=>void}){
  const room=useGame(x=>x.snapshot);
  return <header className={`topbar ${room?'has-room':''}`}><div className="brand"><span className="logo-mark">♥</span><div><b>同词相遇</b><small>SAME WORD</small></div></div><div className="header-actions">
    {room&&<span className="room-pill">♧　房间 {room.code}</span>}<button className="lang" onClick={()=>setLocale(locale==='zh'?'en':'zh')} aria-label="Language">🌐 {locale==='zh'?'简体中文 ▾':'English ▾'}</button></div></header>
}

function Landing({T}:{T:typeof zh}){
  const g=useGame(); const pending=sessionStorage.getItem('pending-room')||new URLSearchParams(location.search).get('room')||'';
  const [tab,setTab]=useState<'create'|'join'>(pending?'join':'create'); const [mode,setMode]=useState<GameMode>('word');
  const [name,setName]=useState('');const [code,setCode]=useState(pending);const [max,setMax]=useState<2|3|4>(2);const [seconds,setSeconds]=useState(30);
  const [custom,setCustom]=useState(false);const [category,setCategory]=useState<QuizCategory>('life');const [total,setTotal]=useState<5|10|15>(5);const [modal,setModal]=useState<'rules'|'privacy'|null>(null);
  const go=async()=>{if(tab==='create')await g.createRoom({nickname:name,mode,maxPlayers:max,roundSeconds:seconds,locale:g.locale,quizCategory:category,quizTotal:total});else await g.joinRoom(code,name)};
  return <>
    <section className="landing-grid">
      <motion.div className="hero" initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}}>
        <div className="eyebrow">✦ 词不一样？那就下一轮！</div><h1>{g.locale==='zh'?<><span>你的脑回路，</span><strong>恰好我也有。</strong></>:T.tag}</h1><p>{T.sub}</p>
        <div className="word-demo"><span>大海</span><i>×</i><span>天空</span><b>→</b><span className="match">蓝色 ✓</span></div>
        <ul className="feature-pills"><li>⏱ 30 / 60 秒</li><li>🔗 链接邀请</li><li>✨ 同词即通关</li></ul>
      </motion.div>
      <motion.div className="game-card" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.08}}>
        <div className="tabs"><button className={tab==='create'?'active':''} onClick={()=>setTab('create')}>＋ {T.create}</button><button className={tab==='join'?'active':''} onClick={()=>setTab('join')}>↗ {T.join}</button></div>
        {tab==='create'&&<>
          <FieldLabel title="游戏玩法" hint={mode==='word'?'自由联想猜同词':'三选一测默契'}/>
          <Segment options={[['word',T.word],['quiz',T.quiz]]} value={mode} setValue={v=>setMode(v as GameMode)}/>
        </>}
        <FieldLabel title={T.name}/><input data-testid="nickname" value={name} onChange={e=>setName(e.target.value)} maxLength={16} placeholder={g.locale==='zh'?'输入昵称（最多 16 字）':'Your name'}/>
        {tab==='join'?<><FieldLabel title={T.code}/><input data-testid="room-code" inputMode="numeric" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" className="code-input"/></>:<>
          <FieldLabel title={T.people} hint="满员后自动开始"/><Segment options={[[2,'2 人'],[3,'3 人'],[4,'4 人']]} value={max} setValue={v=>setMax(v as 2|3|4)}/>
          <FieldLabel title={T.time}/><div className="segmented"><button className={!custom&&seconds===30?'active':''} onClick={()=>{setCustom(false);setSeconds(30)}}>30 秒</button><button className={!custom&&seconds===60?'active':''} onClick={()=>{setCustom(false);setSeconds(60)}}>60 秒</button><button className={custom?'active':''} onClick={()=>setCustom(true)}>自定义</button></div>
          {custom&&<div className="range-row"><input type="range" min="10" max="180" step="5" value={seconds} onChange={e=>setSeconds(Number(e.target.value))}/><b>{seconds}s</b></div>}
          {mode==='quiz'&&<div className="quiz-config"><FieldLabel title="题目类别"/><Segment options={[["life","生活"],["imagination","脑洞"],["personality","性格"]]} value={category} setValue={v=>setCategory(v as QuizCategory)}/><FieldLabel title="题目数量"/><Segment options={[[5,'5 题'],[10,'10 题'],[15,'15 题']]} value={total} setValue={v=>setTotal(v as 5|10|15)}/></div>}
        </>}
        <button data-testid="primary-action" className="primary" disabled={!name.trim()||(tab==='join'&&code.length!==6)||!g.connected} onClick={go}>{!g.connected?'正在连接…':tab==='create'?T.createMine:T.joinNow}<span>→</span></button>
        <p className="micro">{tab==='create'?'创建后邀请朋友，一起揭晓答案。':'支持邀请链接自动填入房间号。'}</p>
        <div className="aux"><button onClick={()=>setModal('rules')}>{T.rules}</button><button onClick={()=>setModal('privacy')}>{T.privacy}</button></div>
      </motion.div>
    </section>
    <AnimatePresence>{modal&&<InfoModal type={modal} onClose={()=>setModal(null)}/>}</AnimatePresence>
  </>
}

function Room({T}:{T:typeof zh}){const s=useGame(x=>x.snapshot)!;if(s.phase==='LOBBY'||s.phase==='COUNTDOWN')return <Lobby T={T}/>;if(s.phase==='ROUND_INPUT')return <RoundInput T={T}/>;if(s.phase==='ROUND_REVEAL')return <Reveal T={T}/>;return <Finish T={T}/>}

function Lobby({T}:{T:typeof zh}){
  const g=useGame(),s=g.snapshot!;const [copied,setCopied]=useState('');const invite=`${location.origin}/?room=${s.code}`;const me=s.players.find(p=>p.id===g.identity?.playerId);const full=s.players.length===s.maxPlayers;
  const cp=async(kind:string,value:string)=>{if(await copy(value)){setCopied(kind);setTimeout(()=>setCopied(''),1500)}};
  return <motion.section className="room-wrap" initial={{opacity:0}} animate={{opacity:1}}><div className="room-card lobby-card">
    <div className="stage-head"><button onClick={()=>cp('code',s.code)}>房间 {s.code}　▣</button><span>{s.players.length} / {s.maxPlayers} · ⏱ {s.roundSeconds}s</span></div>
    <div className="lobby-body"><div className="room-kicker">房间 {s.code} · 每轮 {s.roundSeconds} 秒</div><h1>{s.phase==='COUNTDOWN'?'游戏马上开始':full?'人员已齐，准备开始':`还差 ${s.maxPlayers-s.players.length} 人即可开始`}</h1><p>{s.phase==='COUNTDOWN'?'所有玩家同步进入游戏。':full?'房主点击开始后，所有人同步进入游戏。':'分享房间号或邀请链接，等朋友加入。'}</p>
    <div className="lobby-players">{Array.from({length:s.maxPlayers}).map((_,i)=>{const p=s.players[i];return <motion.div className={`lobby-player ${p?'':'empty'}`} key={p?.id||i} initial={{opacity:0}} animate={{opacity:1}}><b>{i+1}</b><span>{p?.nickname||'待加入'}</span><em>{p?(p.id===me?.id?(p.isHost?'我 · 房主':'我'):(p.isHost?'房主':'已就绪')):'待加入'}</em></motion.div>})}</div>
    <div className="lobby-actions"><button className="invite-action" onClick={()=>cp('link',invite)}>⌘ {copied==='link'?'邀请链接已复制':'邀请朋友'}</button><button data-testid="start-game" className="start-action" disabled={!full||!me?.isHost||s.phase==='COUNTDOWN'} onClick={()=>g.start()}>{s.phase==='COUNTDOWN'?'正在开始…':me?.isHost?'开始第 1 轮':'等待房主开始'}</button></div>
    <button className="text-danger" onClick={()=>g.leave()}>{T.leave}</button></div>
  </div></motion.section>
}

function RoundInput({T}:{T:typeof zh}){
  const g=useGame(),s=g.snapshot!,me=s.players.find(p=>p.id===g.identity?.playerId);const [answer,setAnswer]=useState('');const [composing,setComposing]=useState(false);const [now,setNow]=useState(Date.now());
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(id)},[]);useEffect(()=>setAnswer(''),[s.roundId]);
  const remaining=Math.max(0,Math.ceil(((s.deadline||now)-now)/1000));const question=s.currentQuestion;const text=g.locale==='zh'?'zh':'en';
  const submit=()=>g.submit(answer);
  return <section className="room-wrap"><div className="room-card play-card">
    <div className="stage-head play-head"><b>{s.mode==='word'?`第 ${s.round} 轮`:`${s.quizIndex+1} / ${s.quizTotal}`}</b><Timer seconds={remaining} total={s.roundSeconds}/></div>
    <div className="round-intro"><small>{s.mode==='word'?(s.round===1?'先各想一个词，再一起揭晓':'根据上一轮的词，继续联想'):`${s.quizCategory.toUpperCase()} · 默契问答`}</small><h2>{s.mode==='word'?(s.round===1?'写下你脑中的那个词':'把这些词联系起来'):(g.locale==='zh'?question?.text.zh:question?.text.en)}</h2><p>{s.mode==='word'?'提交后不能修改，其他玩家在揭晓前看不到。':'所有玩家提交后统一揭晓选择。'}</p></div>
    {s.mode==='word'&&s.wordHistory.length>0&&<div className="previous-words"><small>上一轮</small>{s.wordHistory.at(-1)?.results.map(r=><span key={r.playerId}>{r.answer||'未作答'}</span>)}</div>}
    {s.mode==='word'?<div className="answer-zone"><input data-testid="answer-input" autoFocus disabled={me?.submitted} value={answer} onChange={e=>setAnswer(e.target.value)} onCompositionStart={()=>setComposing(true)} onCompositionEnd={()=>setComposing(false)} onKeyDown={e=>{if(e.key==='Enter'&&!composing)submit()}} placeholder="输入一个词语…" maxLength={32}/><button data-testid="submit-answer" className="primary" disabled={!answer.trim()||me?.submitted} onClick={submit}>{me?.submitted?'已锁定 ✓':'✓ 锁定答案'}</button></div>:<div className="options">{question?.options.map(o=><button key={o.id} className={answer===o.id?'selected':''} disabled={me?.submitted} onClick={()=>setAnswer(o.id)}><b>{o.id}</b><span>{o.text[text]}</span><i>✓</i></button>)}<button className="primary" disabled={!answer||me?.submitted} onClick={submit}>{me?.submitted?'已提交 ✓':T.submit}</button></div>}
    <Progress players={s.players} meId={me?.id}/>
  </div></section>
}

function Reveal({T}:{T:typeof zh}){
  const g=useGame(),s=g.snapshot!;const reveal=s.mode==='word'?s.currentReveal:s.quizHistory.at(-1);const matched=reveal?.matched;
  return <section className="room-wrap"><div className="room-card reveal-card"><div className="room-kicker">{T.reveal}</div><h1>{matched?'默契命中！':'这次还不一样'}</h1><p>{matched?'你们的选择完全一致':'记住彼此的答案，下一轮继续靠近'}</p>
    <div className="reveal-list">{s.mode==='word'&&s.currentReveal?.results.map((r,i)=><motion.div key={r.playerId} initial={{rotateX:90,opacity:0}} animate={{rotateX:0,opacity:1}} transition={{delay:i*.22}}><Avatar name={r.nickname} index={i}/><small>{r.nickname}</small><strong>{r.answer||'未作答'}</strong></motion.div>)}
    {s.mode==='quiz'&&s.quizHistory.at(-1)?.answers.map((a,i)=>{const q=s.quizHistory.at(-1)!.question;const opt=q.options.find(o=>o.id===a.optionId);return <motion.div key={a.playerId} initial={{rotateX:90,opacity:0}} animate={{rotateX:0,opacity:1}} transition={{delay:i*.22}}><Avatar name={a.nickname} index={i}/><small>{a.nickname}</small><strong>{a.optionId?`${a.optionId}. ${opt?.text[g.locale]}`:'未作答'}</strong></motion.div>})}</div>
    <div className="pulse-dots"><i/><i/><i/></div><p className="micro">{matched&&s.mode==='word'?'正在生成相遇结果…':T.next}</p></div></section>
}

function Finish({T}:{T:typeof zh}){
  const g=useGame(),s=g.snapshot!,isHost=s.hostId===g.identity?.playerId;
  const makeCard=()=>{const c=document.createElement('canvas');c.width=1080;c.height=1440;const x=c.getContext('2d')!;x.fillStyle='#f7f1e8';x.fillRect(0,0,c.width,c.height);x.fillStyle='#da553f';x.font='bold 54px sans-serif';x.fillText('同词相遇 · SAME WORD',90,130);x.fillStyle='#29231f';x.font='bold 86px sans-serif';x.fillText(s.mode==='word'?(s.finalWord||'相遇成功'):`默契 ${s.compatibility}%`,90,340);x.font='36px sans-serif';x.fillText(`${s.players.map(p=>p.nickname).join(' × ')}`,90,450);x.fillText(s.mode==='word'?`历经 ${s.round} 轮相遇`:`${s.quizHistory.filter(q=>q.matched).length}/${s.quizHistory.length} 题全员一致`,90,520);x.fillStyle='#da553f';x.fillRect(90,610,900,10);x.fillStyle='#625850';x.font='30px sans-serif';x.fillText('你的脑回路，恰好我也有。',90,700);const a=document.createElement('a');a.download=`same-word-${s.code}.png`;a.href=c.toDataURL('image/png');a.click()};
  if(s.mode==='word')return <section className="room-wrap"><motion.div className="room-card original-finish" initial={{scale:.97,opacity:0}} animate={{scale:1,opacity:1}}><div className="stage-head"><b>同词相遇</b><span>房间 {s.code} · 共 {s.round} 轮</span></div><div className="finish-body"><h1>你们的脑回路相遇了</h1><p>用了 {s.round} 轮，我们都想到了「{s.finalWord}」</p><div className="finish-players">{s.players.map((p,i)=><span key={p.id}><b>{i+1}</b>{p.nickname}{p.id===g.identity?.playerId&&<em>我</em>}</span>)}</div><div className="finish-rounds">{s.wordHistory.map(r=><div key={r.round}><small>第 {r.round} 轮</small><section>{r.results.map((x,i)=><span className={`result-${i}`} key={x.playerId}>{x.answer||'—'}</span>)}{r.matched&&<b>✓</b>}</section></div>)}</div><button className="primary" disabled={!isHost} onClick={()=>g.restart()}>{isHost?T.again:'等待房主再开一局'}</button><div className="finish-links"><button onClick={makeCard}>{T.share}</button><button onClick={()=>g.leave()}>{T.home}</button></div></div></motion.div></section>;
  return <section className="room-wrap"><motion.div className="room-card finish-card" initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}}><div className="confetti">✦ <i>●</i> ◆ <i>✦</i> ●</div><div className="trophy">✓</div><div className="room-kicker">GAME COMPLETE</div><h1>默契问答完成！</h1><div className="final-answer"><small>{T.score}</small>{s.compatibility}%</div><p>{s.quizHistory.filter(q=>q.matched).length} / {s.quizHistory.length} 题全员一致（娱乐评价）</p>
    <div className="history"><h3>题目回顾</h3>{s.quizHistory.map((r,i)=><div className="history-row" key={r.questionId}><b>{i+1}</b><div><strong>{r.question.text[g.locale]}</strong><small>{r.answers.map(a=>`${a.nickname}: ${a.optionId||'—'}`).join(' · ')}</small></div><i>{r.matched?'✓':'—'}</i></div>)}</div>
    <div className="actions"><button className="primary" disabled={!isHost} onClick={()=>g.restart()}>{isHost?T.again:'等待房主再开一局'}</button><button className="secondary" onClick={makeCard}>↗ {T.share}</button><button className="ghost" onClick={()=>g.leave()}>{T.home}</button></div></motion.div></section>
}

function FieldLabel({title,hint}:{title:string;hint?:string}){return <div className="field-label"><b>{title}</b>{hint&&<span>{hint}</span>}</div>}
function Segment({options,value,setValue}:{options:Array<[string|number,string]>;value:string|number;setValue:(x:string|number)=>void}){return <div className="segmented">{options.map(([v,l])=><button key={v} className={value===v?'active':''} onClick={()=>setValue(v)}>{l}</button>)}</div>}
function Avatar({name,index}:{name:string;index:number}){return <span className={`avatar avatar-${index%4}`}>{name.slice(0,1).toUpperCase()}</span>}
function Progress({players,meId}:{players:Array<{id:string;nickname:string;submitted:boolean;connected:boolean}>;meId?:string}){return <div className="progress-box"><div><b>我的答案</b><span>{players.filter(p=>p.submitted).length} / {players.length} 人已提交</span></div><section>{players.map((p,i)=><div className={`progress-player ${p.id===meId?'mine':''}`} key={p.id}><b>{i+1}</b><span>{p.nickname}<small>{p.submitted?'已提交':'等待作答'}{p.id===meId?' · 我':''}</small></span></div>)}</section></div>}
function Timer({seconds}:{seconds:number;total:number}){const danger=seconds<=10;return <div className={`timer ${danger?'danger':''}`}><span>◷</span><strong>{seconds}s</strong></div>}
function Toast({text,onClose}:{text:string;onClose:()=>void}){useEffect(()=>{const id=setTimeout(onClose,4000);return()=>clearTimeout(id)},[text]);return <motion.div className="toast" initial={{y:24,opacity:0}} animate={{y:0,opacity:1}} exit={{y:24,opacity:0}}><span>!</span>{text}<button onClick={onClose}>×</button></motion.div>}
function InfoModal({type,onClose}:{type:'rules'|'privacy';onClose:()=>void}){return <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}><motion.div className="modal" initial={{scale:.94}} animate={{scale:1}} onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><h2>{type==='rules'?'怎么玩？':'隐私说明'}</h2>{type==='rules'?<><h3>同词联想</h3><p>每个人独立写下一个词，全部提交后同时揭晓。如果不一致，就根据上一轮所有词继续联想；直到大家写出完全相同的词。</p><h3>默契问答</h3><p>同一题有三个选项，全部玩家选完后同步揭晓。全员选中同一选项即为本题默契命中。</p></>:<><p>本项目不要求注册，不收集真实身份信息。昵称、房间和答案仅用于实时游戏，并会随无活动房间自动清理。</p><p>身份恢复凭证只保存在当前浏览器会话中。请不要把敏感信息作为昵称或答案提交。</p></>}</motion.div></motion.div>}
