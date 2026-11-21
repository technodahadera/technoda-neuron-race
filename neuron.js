const branches = [
  'M280 244 C218 244 212 189 181 171 S111 169 87 127 M164 164 Q139 135 133 102 L94 80 M140 129 L157 87 L146 53 M104 148 Q69 163 42 148',
  'M310 211 C279 175 272 154 270 130 S234 99 236 69 M267 133 Q295 114 304 84 L294 61 M268 145 Q248 147 224 135 L201 103',
  'M272 267 C210 259 188 275 164 289 S109 281 78 303 L47 294 M146 292 Q129 323 101 332 L76 357 M179 282 Q151 255 122 245 L96 212 M125 244 L62 232',
  'M302 307 Q284 341 253 351 T201 381 L167 386 M249 352 Q231 328 205 322 M217 373 Q223 405 194 422',
  'M314 220 Q329 159 361 136 L388 92 M356 143 Q384 153 410 138'
];
const ends = ['M918 256 Q963 248 989 197 L1008 184','M920 258 Q981 249 1008 241','M920 261 Q972 269 1008 284','M918 266 Q963 295 985 320 L1007 332'];
const points = [72,134,197,260,309,363,410,455,503,551,599,647,695,743,791,839,887,968,1124];
export const distance = step => points[Math.min(points.length - 1,step)];
export function diagram() {
  return `<svg class="neuron" viewBox="0 0 1190 450" role="img" aria-label="מסלול האות העצבי מהדנדריטים דרך גוף התא והאקסון, חציית הסינפסה ועד לתא המטרה">
  <defs>
    <linearGradient id="nerve" x2="1" y2=".45"><stop stop-color="#b490ff"/><stop offset=".5" stop-color="#877af7"/><stop offset="1" stop-color="#65dbfa"/></linearGradient>
    <linearGradient id="coat" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#326e99"/><stop offset=".46" stop-color="#153b65"/><stop offset="1" stop-color="#12233f"/></linearGradient>
    <radialGradient id="soma"><stop stop-color="#47376c"/><stop offset=".78" stop-color="#2d2255"/><stop offset="1" stop-color="#513a84"/></radialGradient>
    <filter id="halo" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="stars" width="41" height="37" patternUnits="userSpaceOnUse"><circle cx="13" cy="11" r="1.2" fill="#9f94cf" opacity=".19"/></pattern>
  </defs>
  <rect width="1190" height="450" fill="url(#stars)"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="#9476ff" stroke-width="13" opacity=".16" filter="url(#halo)">${branches.map(d=>`<path d="${d}"/>`).join('')}</g>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="url(#nerve)" stroke-width="5">${branches.map(d=>`<path d="${d}"/>`).join('')}</g>
  <path d="M260 240 Q283 222 285 191 Q304 213 329 200 Q350 213 352 231 Q362 251 402 259 Q357 267 347 291 Q337 325 307 309 Q284 344 274 312 Q277 288 253 272 Q240 254 260 240Z" fill="url(#soma)" stroke="#a68cf9" stroke-width="2.7"/>
  <ellipse cx="304" cy="258" rx="26" ry="24" fill="#9c80ee" opacity=".62"/><ellipse cx="299" cy="253" rx="9" ry="8" fill="#dbcbff" opacity=".8"/>
  <path d="M353 260 H923" fill="none" stroke="#2b1f52" stroke-width="28" stroke-linecap="round"/>
  <path d="M352 260 H925" fill="none" stroke="#a08bf4" stroke-width="5"/>
  ${[415,477,539,601,663,725,787,849].map(x=>`<rect x="${x}" y="239" width="52" height="42" rx="18" fill="url(#coat)" stroke="#65d7ef" stroke-opacity=".58" stroke-width="1.8"/><path d="M${x+8} 248 H${x+42}" stroke="#80e6ff" stroke-width="2" opacity=".4" stroke-linecap="round"/>`).join('')}
  <g stroke-linecap="round" stroke-width="4" stroke="url(#nerve)" fill="none">${ends.map(d=>`<path d="${d}"/>`).join('')}</g>
  <g fill="#95e8ff">${[[1008,184],[1008,241],[1008,284],[1007,332]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" />`).join('')}</g>
  <g fill="none" stroke="#76e9ca" stroke-width="4" stroke-linecap="round"><path d="M1066 252 Q1044 219 1032 188 M1066 257 Q1042 248 1032 237 M1066 264 Q1045 276 1033 287 M1064 274 Q1049 311 1032 332"/></g>
  <path d="M1080 217 Q1112 201 1142 219 Q1167 237 1159 268 Q1175 299 1133 311 Q1105 324 1081 300 Q1050 294 1057 269 Q1047 241 1080 217Z" fill="#194c4c" stroke="#6deed2" stroke-width="3"/>
  <ellipse cx="1110" cy="263" rx="22" ry="21" fill="#57bca9" opacity=".5"/>
  <path id="race-line" d="M72 255 C150 249 240 253 312 260 H1005 M1031 260 H1124" stroke="#e9d6ff" stroke-width="2" stroke-dasharray="4 7" fill="none" opacity=".44"/>
  <g fill="#decfff" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" direction="rtl">
    <text x="132" y="45">דנדריטים</text><text x="322" y="396">גוף התא</text><text x="645" y="174">אקסון</text><text x="646" y="334">מעטפת מיאלין</text><text x="1012" y="126">סינפסה</text><text x="1110" y="375" fill="#83f0d1">תא המטרה</text>
  </g>
  <g stroke="#a996d2" stroke-width="1" opacity=".45"><path d="M646 184v43 M646 313v-26 M1016 136v32 M322 377v-50 M1110 352v-31"/></g>
  <g id="runners"></g>
  </svg>`;
}
