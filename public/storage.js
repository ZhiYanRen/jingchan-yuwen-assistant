import {APP,KEY,createState,validateBackup} from './domain.js';
export function load(storage,catalog) {
  let raw=null;
  try {raw=storage.getItem(KEY);return {ok:true,state:raw?validateBackup(JSON.parse(raw),catalog):createState(),raw};}
  catch {return {ok:false,state:createState(),raw};}
}
export function save(storage,state) {
  try {storage.setItem(KEY,JSON.stringify({app:APP,schema:1,state}));return {ok:true};}
  catch {return {ok:false};}
}
