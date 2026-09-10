/** Reproducible, locally authored glTF 2.0 architecture. No modeling service or
 * third-party asset downloads are needed. Coordinates are metres, Y-up in glTF. */
import fs from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { Cartesian2, PolygonPipeline } from 'cesium';
import { mockBuildings } from '../src/data/mockBuildings.js';
const out = path.resolve('public/models');
fs.mkdirSync(path.join(out, 'textures'), {recursive:true});
const crc = bytes => { let c=0xffffffff; for(const b of bytes) { c^=b; for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0); } return (c^0xffffffff)>>>0; };
function png(w,h,rgb) {
  const chunk=(type,data)=> { const t=Buffer.from(type), n=Buffer.alloc(4), c=Buffer.alloc(4); n.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t,data]))); return Buffer.concat([n,t,data,c]); };
  const head=Buffer.alloc(13); head.writeUInt32BE(w); head.writeUInt32BE(h,4); head[8]=8; head[9]=2;
  const raw=Buffer.alloc(h*(w*3+1)); for(let y=0;y<h;y++) for(let x=0;x<w;x++) { const col=rgb(x,y); for(let k=0;k<3;k++)raw[y*(w*3+1)+1+x*3+k]=Math.max(0,Math.min(255,Math.round(col[k]))); }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
const noise=(x,y)=> { let v=Math.imul(x+17,374761393)+Math.imul(y+19,668265263); v=Math.imul(v^(v>>>13),1274126177); return ((v^(v>>>16))>>>0)/4294967295; };
const colors={stone:[204,190,164],concrete:[175,183,183],brick:[167,85,64],tile:[147,64,40],wood:[130,89,51],glass:[72,131,157],grass:[78,116,64],metal:[179,193,198]};
for(const [name,base] of Object.entries(colors)) {
  const image=png(256,256,(x,y)=> {
    let n=(noise(x,y)-.5)*(name==='glass'?3:18);
    if(name==='brick'||name==='stone') { const row=Math.floor(y/64), seam=y%64<3||(x+row*64)%128<3; if(seam)return name==='brick'?[199,182,160]:[163,156,143]; }
    if(name==='tile')n+=Math.sin(x*Math.PI/16)*19-(y%64<3?24:0);
    if(name==='wood')n+=Math.sin(x*.7+Math.sin(y*.04))*12;
    if(name==='glass')n+=22*Math.sin((x+y*.4)*.025)+12*Math.sin(y*.05);
    return base.map(c=>c+n);
  });
  fs.writeFileSync(path.join(out,'textures',`${name}.png`),image);
}
const palette=[
  ['stone','stone',[1,1,1,1],0,.86], ['concrete','concrete',[1,1,1,1],0,.85],
  ['brick','brick',[1,1,1,1],0,.8], ['tile','tile',[1,1,1,1],0,.8],
  ['wood','wood',[1,1,1,1],0,.65], ['glass','glass',[1,1,1,1],.6,.16],
  ['metal','metal',[1,1,1,1],.8,.3], ['white','concrete',[1.25,1.25,1.22,1],0,.7],
  ['gold',null,[.72,.49,.15,1],.75,.3], ['grass','grass',[1,1,1,1],0,1],
  ['leaf',null,[.14,.31,.16,1],0,.95], ['water',null,[.12,.47,.57,1],.5,.14],
  ['dark',null,[.09,.14,.16,1],.4,.42]
];
// Clamp base factors to glTF's [0,1] range; brightness comes from the texture.
const materials=palette.map(([name,texture,factor,metallic,roughness])=>({name,pbrMetallicRoughness:{baseColorFactor:factor.map(v=>Math.min(1,v)),metallicFactor:metallic,roughnessFactor:roughness,...(texture?{baseColorTexture:{index:Object.keys(colors).indexOf(texture)}}:{})},doubleSided:false}));
const mat=name=>palette.findIndex(p=>p[0]===name);
const toGltf=([x,n,z])=>[x,z,-n];
class Mesh {
  constructor(){this.groups=new Map();}
  tri(a,b,c,m,uv=[[0,0],[1,0],[1,1]]) {
    const pts=[a,b,c].map(toGltf), ab=pts[1].map((v,i)=>v-pts[0][i]), ac=pts[2].map((v,i)=>v-pts[0][i]);
    const normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    const len=Math.hypot(...normal); if(len<1e-9)return;
    if(!this.groups.has(m))this.groups.set(m,{p:[],n:[],uv:[]});
    const g=this.groups.get(m); pts.forEach((p,i)=> {g.p.push(...p);g.n.push(...normal.map(v=>v/len));g.uv.push(...uv[i]);});
  }
  quad(a,b,c,d,m,u=1,v=1) {this.tri(a,b,c,m,[[0,0],[u,0],[u,v]]);this.tri(a,c,d,m,[[0,0],[u,v],[0,v]]);}
  prism(poly,z,h,m) {
    const idx=PolygonPipeline.triangulate(poly.map(p=>new Cartesian2(...p)));
    for(let i=0;i<idx.length;i+=3){const [a,b,c]=idx.slice(i,i+3).map(j=>poly[j]);this.tri([...a,z+h],[...b,z+h],[...c,z+h],m,[a,b,c].map(p=>p.map(v=>v/3)));this.tri([...c,z],[...b,z],[...a,z],m);}
    poly.forEach((a,i)=>{const b=poly[(i+1)%poly.length];this.quad([...a,z],[...b,z],[...b,z+h],[...a,z+h],m,Math.hypot(b[0]-a[0],b[1]-a[1])/3,h/3);});
  }
  box(x,y,z,w,d,h,m){this.prism([[x-w/2,y-d/2],[x+w/2,y-d/2],[x+w/2,y+d/2],[x-w/2,y+d/2]],z,h,m);}
  frustum(x,y,z,r1,r2,h,m,sides=24){for(let i=0;i<sides;i++){const a=i*2*Math.PI/sides,b=(i+1)*2*Math.PI/sides;this.quad([x+r1*Math.cos(a),y+r1*Math.sin(a),z],[x+r1*Math.cos(b),y+r1*Math.sin(b),z],[x+r2*Math.cos(b),y+r2*Math.sin(b),z+h],[x+r2*Math.cos(a),y+r2*Math.sin(a),z+h],m);if(r2>0)this.tri([x,y,z+h],[x+r2*Math.cos(a),y+r2*Math.sin(a),z+h],[x+r2*Math.cos(b),y+r2*Math.sin(b),z+h],m);}}
  dome(x,y,z,r,h,m){for(let j=0;j<12;j++){const a=j*Math.PI/24,b=(j+1)*Math.PI/24;this.frustum(x,y,z+Math.sin(a)*h,r*Math.cos(a),r*Math.cos(b),(Math.sin(b)-Math.sin(a))*h,m,32);}}
  hip(w,d,z,h,m,x=0,y=0){const a=[x-w/2,y-d/2,z],b=[x+w/2,y-d/2,z],c=[x+w/2,y+d/2,z],e=[x-w/2,y+d/2,z],r1=[x-w*.23,y,z+h],r2=[x+w*.23,y,z+h];this.quad(a,b,r2,r1,m,w/2,h);this.tri(b,c,r2,m);this.quad(c,e,r1,r2,m,w/2,h);this.tri(e,a,r1,m);}
}
function addFloor(mesh,b,z=0){
  const s=b.architecturalStyle, p=b.localFootprint;
  const main=['mansion','temple','civic','museum'].includes(s)?'stone':s==='school'?'brick':s==='park'?'wood':'white';
  mesh.prism(p,z+.015,.17,'concrete');
  if(s==='park'){for(const x of [-6,6])for(const y of [-5,5])mesh.frustum(x,y,z+.18,.28,.28,2.8,'wood',12);return;}
  const glass=['curtain-wall','office','mall'].includes(s);
  // Façade panels follow every footprint edge, including concave courtyards.
  p.forEach((a,i)=>{
    const end=p[(i+1)%p.length], dx=end[0]-a[0],dy=end[1]-a[1],length=Math.hypot(dx,dy), nx=dy/length,ny=-dx/length, count=Math.max(2,Math.round(length/(s==='temple'?4:3)));
    const pt=(t,h,offset=0)=>[a[0]+dx*t+nx*offset,a[1]+dy*t+ny*offset,z+h];
    mesh.quad(pt(0,.18),pt(1,.18),pt(1,2.94),pt(0,2.94),main,length/3,1);
    for(let k=0;k<count;k++){
      const t0=(k+(glass?.045:.19))/count,t1=(k+(glass?.955:.81))/count,lo=glass?.32:.83,hi=2.57;
      mesh.quad(pt(t0,lo,.035),pt(t1,lo,.035),pt(t1,hi,.035),pt(t0,hi,.035),'glass',1,1);
      for(const t of [t0,t1])mesh.quad(pt(t-.012/count,lo,.05),pt(t+.012/count,lo,.05),pt(t+.012/count,hi,.05),pt(t-.012/count,hi,.05),'metal');
      mesh.quad(pt(t0,1.75,.045),pt(t1,1.75,.045),pt(t1,1.80,.045),pt(t0,1.80,.045),'metal');
    }
    mesh.quad(pt(0,2.87,.07),pt(1,2.87,.07),pt(1,3,.07),pt(0,3,.07),glass?'metal':main,length/3,.1);
  });
  if(['apartments','hotel','mansion'].includes(s)) for(let x=-b.width/2+3;x<b.width/2-1;x+=5){mesh.box(x,-b.depth/2-.55,z+.2,3.7,1.2,.16,'concrete');mesh.box(x,-b.depth/2-1.12,z+.37,3.7,.09,.88,'glass');mesh.box(x,-b.depth/2-1.12,z+1.25,3.7,.12,.08,'metal');}
  if(['civic','temple','mansion'].includes(s)) for(let x=-b.width/2+2;x<b.width/2;x+=4){mesh.frustum(x,-b.depth/2-.6,z+.18,.32,.28,2.7,main,16);mesh.box(x,-b.depth/2-.6,z+2.8,.85,.85,.2,main);}
  if(s==='hospital'){mesh.box(0,-b.depth/2-.1,z+1.1,1.8,.1,.5,'white');mesh.box(0,-b.depth/2-.12,z+.6,.5,.1,1.5,'white');}
}
function addRoof(m,b,z=0){
  const s=b.architecturalStyle;
  m.prism(b.localFootprint,z,.2,'concrete');
  if(s==='curtain-wall')return; // The existing selectable solar / rooftop asset owns this roof.
  if(s==='temple'){
    for(let i=0;i<6;i++){const w=16-i*2.1;m.box(0,0,z+.2+i*1.4,w,w,.55,'stone');m.frustum(0,0,z+.75+i*1.4,w*.62,(w-2)*.55,.85,'stone',4);}
    m.frustum(0,0,z+8.6,1.7,.15,2.5,'gold',24);m.dome(0,0,z+11.1,.5,.65,'gold');
  } else if(s==='school'){m.hip(b.width+1.8,b.depth/2+1.8,z+.2,1.8,'tile',0,-b.depth/4);m.hip(b.width/2+1.8,b.depth/2+1.8,z+.2,1.8,'tile',-b.width/4,b.depth/4);}
  else if(['mansion','park'].includes(s))m.hip(b.width+1.8,b.depth+1.8,z+.2,b.roofHeight-.2,s==='park'?'wood':'tile');
  else if(s==='museum'){m.box(0,0,z+.2,b.width*.66,b.depth*.6,.5,'stone');m.dome(0,0,z+.7,8,5,'glass');}
  else if(s==='civic'){m.hip(b.width+1,b.depth+1,z+.2,2.8,'stone');m.frustum(0,0,z+3,.07,.07,1,'metal',8);}
  else {
    b.localFootprint.forEach((a,i)=>{const c=b.localFootprint[(i+1)%b.localFootprint.length];const dx=c[0]-a[0],dy=c[1]-a[1],l=Math.hypot(dx,dy),nx=dy/l*.15,ny=-dx/l*.15;m.prism([a,c,[c[0]-nx,c[1]-ny],[a[0]-nx,a[1]-ny]],z+.2,.65,'white');});
    m.box(0,2,z+.2,7,6,1.6,'concrete');
    if(s==='mall')m.dome(-6,-6,z+.2,5,2.6,'glass');
    else for(let i=0;i<3;i++){m.box(6,-7+i*3,z+.3,4,2,.22,'dark');m.box(6,-7+i*3,z+.53,3.8,1.8,.04,'glass');}
  }
}
function addSite(m,b){
  const w=b.width,d=b.depth,s=b.architecturalStyle;
  m.box(0,-d/2-3,.03,Math.min(12,w),3,.08,'stone');
  if(s==='park'){
    m.box(0,0,-.03,37,42,.08,'grass');m.box(0,-15,.07,36,2,.06,'stone');m.box(0,0,.07,2,40,.06,'stone');
    m.frustum(-12,11,.06,3.5,3.5,.35,'stone');m.frustum(-12,11,.42,3.1,3.1,.025,'water');
    for(const [x,y] of [[-14,-15],[14,-15],[-14,16],[14,16],[-14,-5],[14,5]]){m.frustum(x,y,.1,.25,.2,2.4,'wood',8);m.dome(x,y,1.8,2.5,3,'leaf');}
    for(const x of [-10,10]){m.box(x,-12,.4,3.2,.65,.15,'wood');m.box(x,-11.7,.5,3.2,.15,.6,'wood');}
  } else {
    for(const x of [-w/2+1,w/2-1]){m.box(x,-d/2-3,.05,1.8,1.8,.5,'stone');m.dome(x,-d/2-3,.55,.85,.8,'leaf');}
    if(s==='mansion')for(let i=0;i<4;i++)m.box(0,-d/2-1.4-i*.55,.03,8,1.2,Math.max(.1,.65-i*.15),'stone');
    if(s==='mall')m.box(-3,-d/2-1.2,2.8,14,3,.15,'glass');
  }
}
function save(mesh,dest){
  const chunks=[],views=[],accessors=[];let offset=0;
  function accessor(values,type){const arr=new Float32Array(values),bytes=Buffer.from(arr.buffer),index=views.length;views.push({buffer:0,byteOffset:offset,byteLength:bytes.length,target:34962});chunks.push(bytes);offset+=bytes.length;const width=type==='VEC2'?2:3,acc={bufferView:index,componentType:5126,count:values.length/width,type};if(type==='VEC3'){acc.min=Array.from({length:3},(_,j)=>Math.min(...values.filter((_,i)=>i%3===j)));acc.max=Array.from({length:3},(_,j)=>Math.max(...values.filter((_,i)=>i%3===j)));}accessors.push(acc);return accessors.length-1;}
  const primitives=[...mesh.groups].map(([name,g])=>({attributes:{POSITION:accessor(g.p,'VEC3'),NORMAL:accessor(g.n,'VEC3'),TEXCOORD_0:accessor(g.uv,'VEC2')},material:mat(name),mode:4}));
  const gltf={asset:{version:'2.0',generator:'3D ULPIN authored architecture v2'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:path.basename(dest,'.glb'),mesh:0}],meshes:[{primitives}],materials,images:Object.keys(colors).map(name=>({uri:`../textures/${name}.png`})),textures:Object.keys(colors).map((_,source)=>({source,sampler:0})),samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}],buffers:[{byteLength:offset}],bufferViews:views,accessors};
  let json=Buffer.from(JSON.stringify(gltf));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);let bin=Buffer.concat(chunks);bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);
  const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);const jh=Buffer.alloc(8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(dest,Buffer.concat([header,jh,json,bh,bin]));
}
for(const b of mockBuildings){const dir=path.join(out,b.buildingId);fs.mkdirSync(dir,{recursive:true});for(const kind of ['floor','roof','site','building']){const mesh=new Mesh();if(kind==='floor')addFloor(mesh,b);if(kind==='roof')addRoof(mesh,b);if(kind==='site')addSite(mesh,b);if(kind==='building'){for(let f=0;f<b.numberOfFloors;f++)addFloor(mesh,b,f*3);addRoof(mesh,b,b.height);}save(mesh,path.join(dir,`${kind}.glb`));}}
fs.writeFileSync(path.join(out,'README.md'),'# Authored demo models\n\n48 glTF 2.0 models and 8 repeatable material textures, authored for this fictional demo. Regenerate with `npm run models`. No third-party scans or official structures. GLBs have a Y-up metre coordinate system and share the data floor plates. Textures are locally generated and stored beside the models. Keep the textures directory when moving GLBs.\n');
console.log(`Created ${mockBuildings.length*4} GLB models and ${Object.keys(colors).length} textures.`);
