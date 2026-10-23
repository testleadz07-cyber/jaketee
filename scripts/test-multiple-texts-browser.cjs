/* eslint-disable @typescript-eslint/no-require-imports -- Edge CDP integration checks without payment or storage writes. */
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path')
const {spawn}=require('node:child_process')
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))
async function main(){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hoodie-browser-'))
  const browser=spawn(process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'})
  let socket,id=0;const pending=new Map(),errors=[]
  try{
    const portFile=path.join(profile,'DevToolsActivePort')
    for(let i=0;i<100 && !fs.existsSync(portFile);i++)await delay(200)
    const port=fs.readFileSync(portFile,'utf8').split('\n')[0]
    const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl)
    await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject})
    socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled' && m.params.type==='error')errors.push(m.params.args.map(a=>a.value || a.description || '').join(' '));if(pending.has(m.id)){const p=pending.get(m.id);clearTimeout(p.timer);pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result)}}
    const command=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error(`Timeout ${method}`))},60000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params}))})
    const evaluate=async expression=>{const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);return r.result.value}
    const wait=async expression=>{for(let i=0;i<240;i++){try{if(await evaluate(expression))return}catch(e){if(!/context|Cannot read properties of null/i.test(e.message))throw e}await delay(250)}throw Error(`Not ready: ${expression}`)}
    const click=async label=>{await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)} || b.getAttribute('aria-label')===${JSON.stringify(label)});if(!b || b.disabled)throw Error('Unavailable button: '+${JSON.stringify(label)});b.click()})()`);await delay(180)}
    await command('Page.enable');await command('Runtime.enable')
    const typeText=async text=>{await evaluate(`(()=>{const i=document.querySelector('#design-text');i.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,${JSON.stringify(text)});i.dispatchEvent(new Event('input',{bubbles:true}));i.blur()})()`);await delay(180)}
    for(const category of (process.env.MULTI_TEXT_CATEGORY ? [process.env.MULTI_TEXT_CATEGORY] : ['varsity','bomber','coach','puffer','hoodie'])){
      await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false})
      await command('Page.navigate',{url:`http://localhost:3000/design/${category}`})
      await wait(`!!document.querySelector('canvas') && document.querySelector('canvas').getContext('2d').getImageData(360,340,1,1).data[3]===255`)
      await evaluate(`[...document.querySelectorAll('details.group')].forEach(d=>d.open=true)`)
      await click('Add text');await typeText('NY')
      await click('Add text');await typeText('CLASS OF 2026');await click('Curve downward')
      await click('Use #b91c1c thread')
      await click('Select text 1: NY');assert.equal(await evaluate(`document.querySelector('#design-text').value`),'NY')
      assert.equal(await evaluate(`document.querySelector('input[aria-label="Custom thread color"]').value`),'#ffffff')
      await click('Duplicate text');await typeText('COPY');await click('Remove text')
      assert.equal(await evaluate(`document.querySelectorAll('[aria-label="Text elements"] button').length`),2)
      await click('Undo');assert.equal(await evaluate(`document.querySelectorAll('[aria-label="Text elements"] button').length`),3)
      await click('Redo');assert.equal(await evaluate(`document.querySelectorAll('[aria-label="Text elements"] button').length`),2)
      await click('Save design')
      const key=`jacketee-${category}-design-v1`
      let saved=await evaluate(`JSON.parse(localStorage.getItem('${key}'))`)
      assert.equal(saved.design.front.texts.length,2);assert.equal(saved.design.front.texts[1].color,'#b91c1c');assert.equal(saved.design.front.texts[0].value,'NY')
      const second=saved.design.front.texts[1],first=saved.design.front.texts[0]
      await evaluate(`document.querySelector('canvas').scrollIntoView({block:'center',behavior:'instant'})`);await delay(250)
      const rect=await evaluate(`(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`)
      await command('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x+rect.w*second.x,y:rect.y+rect.h*second.y,button:'left',clickCount:1})
      for(const dx of [.02,.04,.06]){await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x+rect.w*(second.x+dx),y:rect.y+rect.h*second.y,buttons:1});await delay(70)}
      await command('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x+rect.w*(second.x+.06),y:rect.y+rect.h*second.y,button:'left',clickCount:1})
      await click('Save design')
      saved=await evaluate(`JSON.parse(localStorage.getItem('${key}'))`)
      assert.ok(saved.design.front.texts[1].x>second.x);assert.equal(saved.design.front.texts[0].x,first.x)
      await click('Undo');await click('Save design')
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('${key}')).design.front.texts[1].x`),second.x)
      for(const view of ['Back','Left sleeve','Right sleeve']){await click(view);await click('Add text');await typeText(view);await click('Duplicate text')}
      await click('Front');await click('Save design')
      saved=await evaluate(`JSON.parse(localStorage.getItem('${key}'))`)
      for(const view of ['front','back','leftSleeve','rightSleeve'])assert.equal(saved.design[view].texts.length,2)
      await evaluate(`(()=>{const create=URL.createObjectURL;URL.createObjectURL=blob=>{window.__export=blob.text();return create(blob)};const old=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(!this.download)old.call(this)}})()`)
      await click('Download design');await wait(`document.body.textContent.includes('Design and all four previews downloaded.')`)
      const exported=await evaluate(`window.__export.then(s=>JSON.parse(s))`);assert.equal(exported.previews.length,4);assert.equal(exported.design.front.texts.length,2)
      await command('Page.reload');await wait(`document.body.textContent.includes('has been restored.')`)
      assert.equal(await evaluate(`document.querySelectorAll('[aria-label="Text elements"] button').length`),2)
      await evaluate(`[...document.querySelectorAll('details.group')].forEach(d=>d.open=true)`)
      await click('Reset entire design');await click('Reset design');assert.equal(await evaluate(`document.querySelectorAll('[aria-label="Text elements"] button').length`),0)
      await click('Undo');assert.equal(await evaluate(`document.querySelectorAll('[aria-label="Text elements"] button').length`),2)
      await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(180);assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true)
      // Legacy drafts are read as a first selectable element and converted on the next edit.
      await evaluate(`(()=>{const d=JSON.parse(localStorage.getItem('${key}'));d.design={front:{text:{value:'OLD NY',color:'#ffffff',fontStyle:'varsity',size:42,x:.5,y:.38}}};localStorage.setItem('${key}',JSON.stringify(d))})()`)
      await command('Page.reload');await wait(`document.body.textContent.includes('has been restored.')`)
      assert.equal(await evaluate(`document.querySelector('#design-text').value`),'OLD NY')
      await evaluate(`[...document.querySelectorAll('details.group')].forEach(d=>d.open=true)`)
      await click('Add text');await typeText('NEW');await click('Save design')
      saved=await evaluate(`JSON.parse(localStorage.getItem('${key}'))`);assert.equal(saved.design.front.texts[0].value,'OLD NY');assert.equal(saved.design.front.texts[1].value,'NEW');assert.equal(saved.design.front.text,undefined)
      console.log(`Passed ${category}: independent text edits/styles, duplicate/remove, canvas selection/drag, undo/redo, all views, exports, legacy drafts, save/restore, reset, and mobile width.`)
    }
    assert.deepEqual(errors.filter(e=>/same key|hasn't mounted|ChunkLoadError|TypeError|ReferenceError/i.test(e)),[])
  }finally{socket?.close();browser.kill();for(const p of pending.values())clearTimeout(p.timer)}
}
main().catch(e=>{console.error(e);process.exitCode=1})
