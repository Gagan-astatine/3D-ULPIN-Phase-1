import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

const same = (a,b) => Math.abs(a-b)<.001;
export function validatePropertyRecord(property,data,t) {
  const parcel=data.index.getParcelForProperty(property),building=data.index.getBuildingForProperty(property);
  const floors=data.index.getFloorsForBuilding(property.buildingId);
  const coordinates=parcel?.coordinates??[];
  const tr = str => t ? t(str) : str;
  return [
    {key:'relationships',label:tr('Parcel and building relationships'),passed:!!parcel&&!!building&&building.parcelId===parcel.parcelId&&building.ulpin===property.ulpin},
    {key:'coordinates',label:tr('Geographic coordinate metadata'),passed:property.crs==='EPSG:4326'&&coordinates.length>=3&&coordinates.every(p=>p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90)},
    {key:'vertical',label:tr('Complete floor sequence and heights'),passed:!!building&&floors.length===property.numberOfFloors&&floors.every((f,i)=>f.floorNumber===i+1&&f.ulpin===property.ulpin)&&same(property.buildingHeight,building.numberOfFloors*building.floorHeight)},
    {key:'areas',label:tr('Floor and property areas'),passed:property.landArea>0&&same(parcel?.area??0,property.landArea)&&same(floors.reduce((s,f)=>s+f.area,0),property.builtUpArea)},
    {key:'units',label:tr('Property unit partitions'),passed:floors.length>0&&floors.every(f=>{const units=data.index.getUnitsForFloor(f.unitId);return units.length>0&&same(units.reduce((s,u)=>s+u.area,0),f.area)&&units.every(u=>u.parentFloorId===f.unitId&&u.buildingId===property.buildingId&&u.area>0);})},
    {key:'demo',label:tr('Explicit fictional record designation'),passed:property.isDemo===true&&property.ulpin.startsWith('ULPIN-DEMO-')}
  ];
}
export function canonicalJSON(value) {
  if(Array.isArray(value))return `[${value.map(canonicalJSON).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonicalJSON(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export const recordDigest = record => bytesToHex(sha256(utf8ToBytes(canonicalJSON(record))));
export function createCertificate(property,data,t) {
  const building=data.index.getBuildingForProperty(property),parcel=data.index.getParcelForProperty(property);
  const record={schema:'ulpin-demo-certificate/v1',certificateId:`CERT-DEMO-${property.ulpin.slice(-4)}-V2`,
    issuedOn:'2026-09-09',revision:property.recordVersion,issuer:'3D ULPIN demonstration registry',
    notice:'DEMO DATA — Not an official government land record or ownership certificate.',
    property:{...property},parcel:{...parcel},building:{...building},
    floors:data.index.getFloorsForBuilding(property.buildingId).map(f=>({...f,units:data.index.getUnitsForFloor(f.unitId)}))};
  const checks=validatePropertyRecord(property,data,t);
  return {record,digest:recordDigest(record),checks,valid:checks.every(c=>c.passed)};
}
export function verificationURL(certificate,baseURL) {
  const url=new URL(baseURL);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Use an http or https application URL without credentials.');
  url.search='';url.hash='';
  const query=new URLSearchParams({ulpin:certificate.record.property.ulpin,revision:certificate.record.revision,digest:certificate.digest});
  url.hash=`/verify?${query}`;
  return url.href;
}
export function verifyCertificateLink(hash,data,t) {
  const tr = str => t ? t(str) : str;
  const parts=hash.replace(/^#/,'');
  if(!parts.startsWith('/verify?'))return {status:'invalid',message:tr('This is not a certificate verification link.')};
  const q=new URLSearchParams(parts.slice(8));
  if([...q.keys()].length!==3||q.getAll('ulpin').length!==1||q.getAll('digest').length!==1||q.getAll('revision').length!==1||!/^ULPIN-DEMO-\d{4}$/.test(q.get('ulpin')??'')||! /^[a-f0-9]{64}$/.test(q.get('digest')??''))return {status:'invalid',message:tr('The certificate link is incomplete or malformed.')};
  const p=data.index.getPropertyByULPIN(q.get('ulpin'));
  if(!p)return {status:'not-found',message:tr('No demo property exists for this certificate.')};
  const certificate=createCertificate(p,data,t);
  if(q.get('revision')!==certificate.record.revision)return {status:'stale',message:tr('This certificate refers to a different demo dataset revision.'),certificate};
  if(q.get('digest')!==certificate.digest)return {status:'mismatch',message:tr('The certificate fingerprint does not match the current demo record.'),certificate};
  return {status:certificate.valid?'matched':'invalid-record',message:certificate.valid?tr('Certificate matches the current demo record.'):tr('The record failed one or more consistency checks.'),certificate};
}
export function verifyCertificateFile(file,data,t) {
  const tr = str => t ? t(str) : str;
  if(!file?.record?.property?.ulpin||typeof file.digest!=='string')return {status:'invalid',message:tr('This file is not a demo certificate.')};
  if(recordDigest(file.record)!==file.digest)return {status:'mismatch',message:tr('The contents have changed since this certificate fingerprint was calculated.')};
  try{return verifyCertificateLink(new URL(verificationURL(file,'https://demo.invalid/')).hash,data,t);}catch{return {status:'invalid',message:tr('The certificate structure is invalid.')};}
}
export const downloadBlob=(name,bytes,type)=>{
  const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
