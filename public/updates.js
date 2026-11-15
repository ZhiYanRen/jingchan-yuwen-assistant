// Activate only a complete release, after the app confirms its local state is safe.
export function watchUpdates(registration,{ready,saveBeforeReload}) {
  let alreadyControlled=Boolean(navigator.serviceWorker.controller);
  let changed=false,reloading=false;
  function apply(){
    if(document.visibilityState!=='visible'||!ready())return;
    if(changed){if(reloading||!saveBeforeReload())return;reloading=true;location.reload();}
    else if(registration.waiting&&saveBeforeReload())registration.waiting.postMessage({type:'ACTIVATE'});
  }
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!alreadyControlled){alreadyControlled=true;return;}changed=true;apply();});
  registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')apply();});});
  const check=()=>{if(document.visibilityState==='visible')registration.update().catch(()=>{});apply();};
  window.addEventListener('online',check);document.addEventListener('visibilitychange',check);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  const timer=setInterval(apply,500),poll=setInterval(check,60000);
  window.addEventListener('pagehide',()=>clearInterval(poll),{once:true});apply();
}
