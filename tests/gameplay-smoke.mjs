import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length,"game script missing");
const source=scripts.at(-1)[1];

let now=0;
let rafCallback=null;
let rafId=0;

class ClassList {
  constructor(){this.set=new Set();}
  add(...xs){xs.forEach(x=>this.set.add(x));}
  remove(...xs){xs.forEach(x=>this.set.delete(x));}
  toggle(x,on){
    if(on===undefined){if(this.set.has(x)){this.set.delete(x);return false;}this.set.add(x);return true;}
    if(on)this.set.add(x);else this.set.delete(x);
    return !!on;
  }
  contains(x){return this.set.has(x);}
}

function makeElement(id,attrs={}){
  const listeners={};
  return {
    id,hidden:true,textContent:"",value:"",
    style:{},classList:new ClassList(),attrs:{...attrs},listeners,
    width:0,height:0,
    setAttribute(k,v){this.attrs[k]=String(v);},
    getAttribute(k){return this.attrs[k]??null;},
    addEventListener(type,fn){(listeners[type]??=[]).push(fn);},
    dispatch(type,event={}){
      const e={
        preventDefault(){},
        stopPropagation(){},
        pointerId:1,
        target:this,
        ...event
      };
      for(const fn of listeners[type]||[])fn(e);
    },
    closest(sel){return sel==="#resultCard"&&id==="resultCard"?this:null;},
    setPointerCapture(){},
  };
}

const ids=[
  "game","hud","score","flow","toast","tutorial","dailyLabel","home","pause","result","pauseBtn",
  "homeBest","homeMode","pauseMode","resultScore","bestText","distanceText","perfectText","flowText",
  "themeSelect","hudSelect","soundToggle","hapticToggle","motionToggle","contrastToggle",
  "runsStat","perfectStat","resumeBtn","restartBtn","homeBtn","resultCard"
];
const elements=Object.fromEntries(ids.map(id=>[id,makeElement(id)]));
elements.themeSelect.value="midnight";
elements.hudSelect.value="standard";

const ctx=new Proxy({
  createLinearGradient(){return {addColorStop(){}};}
},{
  get(target,prop){
    if(prop in target)return target[prop];
    if(typeof prop==="symbol")return target[prop];
    return ()=>{};
  },
  set(target,prop,value){target[prop]=value;return true;}
});
elements.game.getContext=()=>ctx;

const modes=["classic","chill","zen","speed","lowg","daily"];
const modeButtons=modes.map(m=>makeElement("mode-"+m,{"data-mode":m}));

const meta=makeElement("meta");
const documentElement=makeElement("html");
documentElement.requestFullscreen=async()=>{};
documentElement.style={setProperty(){}};

const documentListeners={};
const document={
  hidden:false,
  fullscreenElement:null,
  webkitFullscreenElement:null,
  documentElement,
  getElementById(id){
    if(!elements[id])elements[id]=makeElement(id);
    return elements[id];
  },
  querySelector(sel){
    if(sel==='meta[name="theme-color"]')return meta;
    return null;
  },
  querySelectorAll(sel){
    if(sel.includes(".modeBtn"))return modeButtons;
    return [];
  },
  addEventListener(type,fn){(documentListeners[type]??=[]).push(fn);}
};

const windowListeners={};
const storage=new Map();
const sandbox={
  console,Math,Date,JSON,Number,Object,Array,String,Boolean,RegExp,Promise,
  parseInt,parseFloat,isFinite,
  setTimeout(fn){fn();return 1;},
  clearTimeout(){},
  performance:{now:()=>now},
  localStorage:{
    getItem:k=>storage.has(k)?storage.get(k):null,
    setItem:(k,v)=>storage.set(k,String(v)),
    removeItem:k=>storage.delete(k)
  },
  navigator:{
    vibrate(){return true;},
    serviceWorker:{register:async()=>({})}
  },
  screen:{orientation:{lock:async()=>{}}},
  document,
  innerWidth:1280,
  innerHeight:720,
  devicePixelRatio:1,
  addEventListener(type,fn){(windowListeners[type]??=[]).push(fn);},
  requestAnimationFrame(fn){rafCallback=fn;return ++rafId;},
  cancelAnimationFrame(){},
  AudioContext:undefined,
  webkitAudioContext:undefined
};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;

vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:"index.html"});

assert.match(sandbox.SWOOP.version,/^\d+\.\d+\.\d+$/,"runtime version should be semantic");
assert.ok(html.includes('id="rotateNotice"'),"landscape rotate guard missing");
assert.ok(html.includes('class="pause-game"'),"mobile game pause layout missing");
assert.equal(sandbox.SWOOP.state,"home","boot should stop at tap-to-play title");
assert.ok(rafCallback,"animation loop was not scheduled");

elements.home.dispatch("pointerdown");
assert.equal(sandbox.SWOOP.state,"playing","title tap must start gameplay");

function frame(count=1){
  for(let i=0;i<count;i++){
    now+=1000/60;
    const cb=rafCallback;
    assert.ok(cb,"RAF callback disappeared");
    cb(now);
  }
}

const x0=sandbox.SWOOP.player.x;
frame(90);
const x1=sandbox.SWOOP.player.x;
assert.ok(x1>x0+20,"ball failed to move: "+x0+" -> "+x1);
assert.equal(sandbox.SWOOP.health().finite,true);
assert.equal(sandbox.SWOOP.health().moving,true);

elements.game.dispatch("pointerdown",{pointerId:11});
frame(24);
elements.game.dispatch("pointerup",{pointerId:11});
frame(36);
assert.equal(sandbox.SWOOP.health().finite,true,"hold/release produced invalid physics");
assert.ok(sandbox.SWOOP.player.x>x1,"hold/release stopped forward movement");

elements.pauseBtn.dispatch("pointerdown");
assert.equal(sandbox.SWOOP.state,"paused");
elements.resumeBtn.dispatch("click");
assert.equal(sandbox.SWOOP.state,"playing");
const resumeX=sandbox.SWOOP.player.x;
frame(30);
assert.ok(sandbox.SWOOP.player.x>resumeX,"resume failed to restart motion");

for(const mode of modes){
  elements.pauseBtn.dispatch("pointerdown");
  assert.equal(sandbox.SWOOP.state,"paused");
  modeButtons.find(b=>b.getAttribute("data-mode")===mode).dispatch("click");
  assert.equal(sandbox.SWOOP.state,"playing",mode+" did not start");
  const before=sandbox.SWOOP.player.x;
  frame(45);
  const health=sandbox.SWOOP.health();
  assert.equal(health.mode,mode,mode+" did not become active");
  assert.equal(health.finite,true,mode+" produced non-finite state");
  assert.ok(sandbox.SWOOP.player.x>before+5,mode+" failed to move");
}

console.log("Swoop gameplay smoke test passed",sandbox.SWOOP.health());
