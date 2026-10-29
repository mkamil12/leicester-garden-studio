import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:3000';
const content=await fetch(base+'/api/content');assert.equal(content.status,200);assert.equal((await content.json()).demo,true);
for(const path of ['/api/admin','/api/photos/not-a-real-photo']){const r=await fetch(base+path);assert.equal(r.status,403,path)}
const availability=await fetch(base+'/api/availability');assert.equal(availability.status,200);const {days}=await availability.json();const day=days.find(d=>d.slots.length);assert.ok(day);
const id=randomUUID();
function form(){const f=new FormData();for(const [key,value] of Object.entries({requestId:id,name:'Synthetic Photo Test',email:'photo-test@example.com',phone:'07700 900123',postcode:'LE1 1AA',address:'Synthetic test site — no real visit',service:'regular',date:day.date,time:day.slots[0],size:'small',notes:'Automated integration fixture. Generated image; no private property details.',privacy:'yes',demoConsent:'yes',website:''}))f.set(key,value);return f;}
const csrf=await fetch(base+'/api/bookings',{method:'POST',headers:{Origin:'https://example.invalid'},body:form()});assert.equal(csrf.status,403);
const invalid=form();invalid.set('date','2020-01-01');const rejected=await fetch(base+'/api/bookings',{method:'POST',headers:{Origin:base},body:invalid});assert.equal(rejected.status,400);
const upload=form();const photo=await readFile(new URL('../public/assets/garden-hero-v2.jpg',import.meta.url));upload.append('photos',new File([photo],'synthetic-garden.jpg',{type:'image/jpeg'}));const created=await fetch(base+'/api/bookings',{method:'POST',headers:{Origin:base},body:upload});const result=await created.json();assert.equal(created.status,201,JSON.stringify(result));assert.equal(result.reference,id);assert.equal(result.demo,true);
const duplicate=await fetch(base+'/api/bookings',{method:'POST',headers:{Origin:base},body:form()});assert.equal(duplicate.status,200);assert.equal((await duplicate.json()).reference,id);
await writeFile(new URL('../outputs/integration-result.json',import.meta.url),JSON.stringify({reference:id,date:day.date,time:day.slots[0],checks:['demo-content','anonymous-admin-denied','anonymous-photos-denied','availability','csrf-denied','past-date-denied','private-photo-upload','idempotent-repeat']},null,2));
console.log('PASS: public content, private access, availability, CSRF, date validation, photo booking and idempotency.');console.log('Synthetic reference:',id);
