#!/bin/sh
set -eu
mkdir -p dist/.openai dist/server
cp .openai/hosting.json dist/.openai/hosting.json
node --input-type=module <<'BUILD'
import fs from 'node:fs';
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',ttf:'font/ttf'};
const assets=Object.fromEntries(fs.readdirSync('public').map(name=>{
 const ext=name.split('.').at(-1);
 return [name,[types[ext],fs.readFileSync('public/'+name,ext==='ttf'?'base64':'utf8')]];
}));
const quiz=fs.readFileSync("worker/questions.js","utf8").replace("export const","const");
const worker=fs.readFileSync("worker/index.js","utf8").replace(/^import .*;$/gm,"");
fs.writeFileSync("dist/server/index.js","const assets="+JSON.stringify(assets)+";\n"+quiz+"\n"+worker);
BUILD
