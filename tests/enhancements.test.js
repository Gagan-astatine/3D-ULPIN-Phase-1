import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EntityCollection, JulianDate, Ellipsoid, Axis, Matrix4, Cartesian3, Transforms, ImageBasedLighting } from 'cesium';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import validator from 'gltf-validator';
import { getCadastralDataset } from '../src/services/propertyService.js';
import { createModelLayer } from '../src/components/ModelLayer/ModelLayer.js';
import { createFloorLayer } from '../src/components/FloorLayer/FloorLayer.js';
import { createUnitLayer } from '../src/components/FloorLayer/UnitLayer.js';
import { createCertificate, verifyCertificateLink, verifyCertificateFile, verificationURL } from '../src/services/certificateService.js';
import { certificatePDF } from '../src/services/certificatePdf.js';
import { cameraTarget } from '../src/utils/cameraUtils.js';
const data=await getCadastralDataset(),time=JulianDate.now();
const stateFor=b=>({selectedBuilding:b,selectedProperty:data.index.getPropertyByBuildingId(b.buildingId),selectedParcel:data.index.getParcelForBuilding(b),selectedFloor:null,selectedUnit:null,selectedAsset:null,showFloors:true,explodeView:false,crossSection:false,hiddenObjects:{},isolateSelection:false,layerVisibility:{buildings:true,details:true,floors:true,units:true,rooftop:true,vegetation:true,labels:true}});
test('every architectural entity passes the lighting validation used by Cesium ModelVisualizer',()=>{
  const viewer={entities:new EntityCollection()};
  createModelLayer(viewer,data,{ground:{},explode:0});
  const lighting=new ImageBasedLighting();
  try {
    for(const entity of viewer.entities.values){
      const factor=entity.model.imageBasedLightingFactor.getValue(time);
      assert.doesNotThrow(()=>{lighting.imageBasedLightingFactor=factor;},entity.id);
    }
  } finally { lighting.destroy(); }
});
test('all 48 authored models pass the Khronos glTF validator with local textures',async()=>{
  assert.equal(new Set(data.buildings.map(b=>b.architecturalStyle)).size,12);
  for(const b of data.buildings) for(const asset of Object.values(b.models)){
    const filename=path.resolve('public',asset),bytes=fs.readFileSync(filename);
    const report=await validator.validateBytes(new Uint8Array(bytes),{uri:path.basename(filename),externalResourceFunction:uri=>Promise.resolve(new Uint8Array(fs.readFileSync(path.resolve(path.dirname(filename),decodeURIComponent(uri)))))});
    assert.equal(report.issues.numErrors,0,`${asset}: ${JSON.stringify(report.issues.messages.slice(0,3))}`);
    const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
    assert.ok(json.meshes[0].primitives.length >= (asset.endsWith('/building.glb') ? 2 : 1));
    assert.ok(json.materials.some(m=>m.pbrMetallicRoughness.baseColorTexture));
  }
});
test('detailed model floors preserve selection, ground datum, explosion, section and isolation for every building',()=>{
  const viewer={entities:new EntityCollection()},model={state:null,ground:{},explode:0,reveal:1};
  const layers=[createModelLayer(viewer,data,model),createFloorLayer(viewer,data,model),createUnitLayer(viewer,data,model)];
  const ids=viewer.entities.values.map(e=>e.id);
  for(const b of data.buildings){
    const state=stateFor(b);model.state=state;model.explode=0;model.ground={[b.parcelId]:{base:913}};
    layers.forEach(l=>{l.setGround?.(model.ground);l.sync(state);});
    const f=data.index.getFloorsForBuilding(b.buildingId).at(-1),entity=viewer.entities.getById(`model:${b.buildingId}:${f.unitId}`),volume=viewer.entities.getById(`floor:${f.unitId}`);
    assert.equal(entity.show,true);assert.equal(entity.properties.getValue(time).unitId,f.unitId);assert.equal(volume.show,false);
    const h=()=>Ellipsoid.WGS84.cartesianToCartographic(entity.position.getValue(time)).height;
    assert.ok(Math.abs(h()-(913+(f.floorNumber-1)*3))<1e-5);
    model.explode=1;assert.ok(Math.abs(h()-(913+(f.floorNumber-1)*5.2))<1e-5);model.explode=0;
    state.selectedFloor=f;layers.forEach(l=>l.sync(state));assert.equal(entity.show,false);assert.equal(volume.show,true);
    const u=data.index.getUnitsForFloor(f.unitId)[0];state.selectedUnit=u;state.isolateSelection=true;layers.forEach(l=>l.sync(state));
    assert.equal(viewer.entities.getById(`unit:${u.unitId}`).show,true);assert.equal(volume.show,false);
    state.isolateSelection=false;state.selectedUnit=null;state.crossSection=true;layers.forEach(l=>l.sync(state));assert.equal(entity.show,false);assert.equal(volume.show,true);
    state.showFloors=false;state.crossSection=false;layers.forEach(l=>l.sync(state));assert.equal(viewer.entities.getById(`model:${b.buildingId}:building`).show,true);
    state.layerVisibility.buildings=false;layers.forEach(l=>l.sync(state));assert.equal(viewer.entities.getById(`model:${b.buildingId}:building`).show,false);
  }
  assert.deepEqual(viewer.entities.values.map(e=>e.id),ids);
});
test('Cesium glTF axis correction aligns model meshes with the geographic floor plates',()=>{
  const viewer={entities:new EntityCollection()},model={state:null,ground:{},explode:0};createModelLayer(viewer,data,model);
  const axis=Matrix4.multiplyTransformation(Axis.Y_UP_TO_Z_UP,Axis.Z_UP_TO_X_UP,new Matrix4());
  for(const b of data.buildings){
    const entity=viewer.entities.getById('model:'+b.buildingId+':building');
    const matrix=Matrix4.multiplyTransformation(entity.computeModelMatrix(time),axis,new Matrix4());
    const enu=Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(...b.center,0));
    for(const [east,north] of b.localFootprint){
      const actual=Matrix4.multiplyByPoint(matrix,new Cartesian3(east,3,-north),new Cartesian3());
      const expected=Matrix4.multiplyByPoint(enu,new Cartesian3(east,north,3),new Cartesian3());
      assert.ok(Cartesian3.distance(actual,expected)<1e-6);
    }
  }
});
test('property-focused 3D and section views follow each selected structure',()=>{
  for(const b of data.buildings){const s=stateFor(b);assert.deepEqual(cameraTarget('3d',data,s).center,b.center);assert.ok(Math.abs(cameraTarget('section',data,s).center[0]-b.center[0])<1e-10);}
});
test('all twelve certificate QR codes independently decode to matching verification pages',async()=>{
  for(const p of data.properties){const c=createCertificate(p,data);assert.ok(c.valid);assert.equal(c.checks.length,6);
    const url=verificationURL(c,'https://example.org/ulpin/'),png=PNG.sync.read(await QRCode.toBuffer(url,{width:640,margin:4,errorCorrectionLevel:'M'}));
    const decoded=jsQR(new Uint8ClampedArray(png.data),png.width,png.height);assert.equal(decoded?.data,url);
    assert.equal(verifyCertificateLink(new URL(decoded.data).hash,data).status,'matched');
    assert.equal(verifyCertificateFile(JSON.parse(JSON.stringify(c)),data).status,'matched');
    const pdf=certificatePDF(c,url);assert.ok(new TextDecoder().decode(pdf).startsWith('%PDF-1.4'));assert.ok(new TextDecoder().decode(pdf).includes('/Subtype /Link'));
  }
});
test('verification rejects changed data, modified fingerprints, stale revisions and malformed links',()=>{
  const c=createCertificate(data.properties[0],data),url=new URL(verificationURL(c,'http://localhost:5173/'));
  const modified=structuredClone(c);modified.record.property.landArea++;assert.equal(verifyCertificateFile(modified,data).status,'mismatch');
  assert.equal(verifyCertificateLink(url.hash.replace(c.digest,'0'.repeat(64)),data).status,'mismatch');
  assert.equal(verifyCertificateLink(url.hash.replace('2026.09-demo.2','2025-old'),data).status,'stale');
  assert.equal(verifyCertificateLink(url.hash.replace('0001','9999'),data).status,'not-found');
  assert.equal(verifyCertificateLink('#/verify?ulpin=ULPIN-DEMO-0001',data).status,'invalid');
  assert.equal(verifyCertificateLink(url.hash+'&digest='+c.digest,data).status,'invalid');
  assert.throws(()=>verificationURL(c,'javascript:alert(1)'));
  const broken=structuredClone(data.properties[0]);broken.builtUpArea++;assert.equal(createCertificate(broken,data).valid,false);
});
