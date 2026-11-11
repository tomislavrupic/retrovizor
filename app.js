/* Retrovizor — static, geotagged photo journal. */
'use strict';
const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { photos: [], visible: [], current: null, map: null, clusters: null, markers: new Map(), view: 'map', scouts: [], plans: [], plan: null, planLayer: null, planMarkers: new Map() };
const captions = {
  street: 'A free day. No set destination. Just a camera and a city to walk through.',
  landscape: 'A little space to breathe, with the city just beyond the frame.',
  architecture: 'Looking up, looking closer. The details that stay with you.',
  cityscape: 'The city keeps unfolding, one view at a time.',
  people: 'Someone else’s ordinary moment becomes part of the memory.',
  sculpture: 'A quiet figure in the middle of a moving city.',
  'public-art': 'Color overhead, and life carrying on underneath.',
  mural: 'A small pause for the art living on the street.',
  market: 'A walk through the crowd, collecting little fragments of the day.',
  garden: 'Shade, green, and a pause between streets.',
  'street-life': 'A city made of passing moments.',
  art: 'Another way of seeing the same city.',
  plaza: 'The day opens out into the square.',
  'food-drink': 'A pause at the table, and another small memory of the city.',
  'restaurant-street': 'Tables, conversation, and the street moving around them.',
  'street-art': 'Color and everyday life sharing the same corner.',
  interior: 'A small look inside one of the city’s everyday spaces.',
  'behind-the-scenes': 'A glimpse of the work happening around the story.'
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function photoCaptureTime(photo) {
  if(typeof photo?.capturedAt!=='string'||!photo.capturedAt.trim()) return null;
  const timestamp=Date.parse(photo.capturedAt.includes('T')?photo.capturedAt:photo.capturedAt.replace(' ','T'));
  return Number.isFinite(timestamp)?timestamp:null;
}
function photoTime(photo) {
  const timestamp=photoCaptureTime(photo);
  if(timestamp===null)return 'Date not recorded';
  return new Intl.DateTimeFormat('en-GB', {timeZone:'America/Santiago', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}).format(timestamp);
}
function hasPhotoLocation(photo) {return Number.isFinite(photo?.lat)&&Number.isFinite(photo?.lng);}
function mapsDirectionsUrl(destination, {origin, waypoints, mode} = {}) {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', destination);
  if (origin) url.searchParams.set('origin', origin);
  if (Array.isArray(waypoints) && waypoints.length) url.searchParams.set('waypoints', waypoints.join('|'));
  if (mode) url.searchParams.set('travelmode', mode);
  return url.href;
}
function photoDirectionsUrl(photo) { return mapsDirectionsUrl(`${photo.lat},${photo.lng}`); }
function scoutDirectionsUrl(place) {
  const hasCoordinates = Number.isFinite(place.lat) && Number.isFinite(place.lng);
  const destination = place.mapQuery || (hasCoordinates ? `${place.lat},${place.lng}` : `${place.address || place.name}, Santiago, Chile`);
  return mapsDirectionsUrl(destination);
}
function announce(text) { $('announcement').textContent = text; }
function buildPhotoButton(photo, gallery = false) {
  const button = element('button', gallery ? 'gallery-card' : 'frame');
  button.dataset.id = photo.id;
  button.setAttribute('aria-label', `${photo.title}, ${photo.locationLabel||'Location not recorded'}, ${photoTime(photo)}`);
  const img = element('img'); img.src = gallery ? photo.image : photo.thumb; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
  button.append(img);
  if (gallery) {
    const body = element('span', 'card-body');
    body.append(element('span', 'section-label', photo.locationLabel||'Location not recorded'), element('strong', '', photo.title), element('span','technical',photoTime(photo)));
    button.append(body);
  } else button.append(element('span','',photo.title));
  button.addEventListener('click', () => { selectPhoto(photo.id, {pan:true}); if (gallery) openLightbox(); });
  return button;
}
function makeIcon(photo, selected) {
  const content = element('div', 'pin-content'); const img = element('img'); img.src = photo.thumb; img.alt = ''; content.append(img);
  return L.divIcon({html:content, className:`photo-pin${selected ? ' is-selected' : ''}`,iconSize:[52,40],iconAnchor:[26,44]});
}
function initMap() {
  if (!window.L || !L.markerClusterGroup) { showMapError('The map could not load. You can still explore every photograph in the Archive.'); return; }
  state.map = L.map('map', { zoomControl:false, zoomAnimation:!reduceMotion, fadeAnimation:!reduceMotion, markerZoomAnimation:!reduceMotion, scrollWheelZoom:true });
  L.control.zoom({position:'bottomright'}).addTo(state.map);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(state.map);
  let errors = 0;
  tiles.on('tileerror', () => { if (++errors >= 4) showMapError('Map tiles are unavailable. Your photographs and location pins are still accessible.'); });
  tiles.on('tileload', () => { errors = 0; $('map-message').hidden = true; });
  state.clusters = L.markerClusterGroup({maxClusterRadius:56,showCoverageOnHover:false,animate:!reduceMotion,spiderfyOnMaxZoom:true,spiderLegPolylineOptions:{weight:1,color:getComputedStyle(document.documentElement).getPropertyValue('--pix-text-secondary').trim(),opacity:.8},iconCreateFunction:cluster=>{
    const content=element('div','cluster-photo');const image=element('img');
    image.src=cluster.getAllChildMarkers()[0].options.photoThumb;image.alt='';content.append(image,element('span','cluster-count',String(cluster.getChildCount())));
    return L.divIcon({html:content,className:'cluster-icon',iconSize:[64,48]});
  }});
  state.map.addLayer(state.clusters);
  state.planLayer = L.markerClusterGroup({
    maxClusterRadius:70,
    showCoverageOnHover:false,
    animate:!reduceMotion,
    spiderfyOnMaxZoom:true,
    iconCreateFunction:cluster=>{
      const content=element('div','plan-stop-cluster-label',`${cluster.getChildCount()} stops`);
      return L.divIcon({html:content,className:'plan-stop-cluster-icon',iconSize:[88,36],iconAnchor:[44,18]});
    }
  });
  state.photos.filter(hasPhotoLocation).forEach(photo => {
    const marker = L.marker([photo.lat,photo.lng], {icon:makeIcon(photo,false),title:photo.title,alt:photo.title,photoThumb:photo.thumb,keyboard:true,riseOnHover:true});
    marker.bindTooltip(photo.title, {direction:'top',offset:[0,-44]});
    marker.on('click',()=>selectPhoto(photo.id,{pan:false}));
    state.markers.set(photo.id,marker);
  });
  const resize = new ResizeObserver(()=>state.map.invalidateSize({pan:false})); resize.observe($('map'));
}
function showMapError(text) { $('map-message').hidden=false; $('map-message').textContent=text; }
function overview() {
  const mapped=state.visible.filter(hasPhotoLocation);
  if (!state.map || !mapped.length) return;
  state.map.fitBounds(mapped.map(p=>[p.lat,p.lng]),{padding:[64,76],maxZoom:16,animate:false});
}
function renderCollection() {
  const filter=$('place-filter').value;
  state.visible=state.photos.filter(p=>filter==='all'||p.locationLabel===filter);
  $('filmstrip').replaceChildren(...state.visible.map(p=>buildPhotoButton(p)));
  $('gallery').replaceChildren(...state.visible.map(p=>buildPhotoButton(p,true)));
  const mappedCount=state.visible.filter(hasPhotoLocation).length;
  $('collection-count').textContent=`${state.visible.length} photographs · ${mappedCount} mapped`;
  if (state.clusters) {state.clusters.clearLayers();state.clusters.addLayers(state.visible.map(p=>state.markers.get(p.id)).filter(Boolean));overview();}
  const selected=state.visible.find(p=>p.id===state.current?.id)||state.visible[0];
  if (selected) selectPhoto(selected.id,{pan:false,hash:false});
  announce(`${state.visible.length} photographs shown.`);
}
function selectPhoto(id, {pan=false,hash=true}={}) {
  const photo=state.photos.find(p=>p.id===id); if(!photo) return;
  const previous=state.current;
  state.current=photo;
  const index=state.visible.findIndex(p=>p.id===id);
  $('selected-image').src=photo.image; $('selected-image').alt=photo.title;
  $('photo-title').textContent=photo.title; $('photo-place').textContent=photo.locationLabel||'Location not recorded';
  $('photo-caption').textContent=captions[photo.category]||'A moment from a day in Santiago.';
  $('photo-time').textContent=photoTime(photo);
  const hasLocation=hasPhotoLocation(photo);
  $('photo-coordinates').textContent=hasLocation?`${Math.abs(photo.lat).toFixed(4)}° S · ${Math.abs(photo.lng).toFixed(4)}° W`:'Location not recorded';
  const directions=$('photo-directions');directions.hidden=!hasLocation;
  if(hasLocation){directions.href=photoDirectionsUrl(photo);directions.setAttribute('aria-label',`Get directions to ${photo.locationLabel||'this photo location'}`);}
  else directions.removeAttribute('href');
  if(state.view==='map'){
    $('map-note-title').textContent=hasLocation?'SANTIAGO, CHILE':'LOCATION NOT RECORDED';
    $('map-note-copy').textContent=hasLocation?'Choose a photograph to explore a moment.':`${photo.title} is in the library without a map pin.`;
  }
  $('photo-scout').hidden=!state.scouts.some(place=>place.photoIds?.includes(id));
  $('photo-index').textContent=`${String(index+1).padStart(2,'0')} / ${state.visible.length}`;
  $('previous').disabled=index<=0; $('next').disabled=index===state.visible.length-1;
  $('lightbox-prev').disabled=index<=0; $('lightbox-next').disabled=index===state.visible.length-1;
  document.querySelectorAll('[data-id]').forEach(node=>node.setAttribute('aria-current',String(node.dataset.id===id)));
  if (previous && state.markers.has(previous.id)) state.markers.get(previous.id).setIcon(makeIcon(previous,false)).setZIndexOffset(0);
  const marker=state.markers.get(id);
  if(marker) {
    marker.setIcon(makeIcon(photo,true));
    marker.setZIndexOffset(1000);
    if(pan&&state.view==='map'&&state.map&&state.clusters?.hasLayer(marker)) {
      state.map.setView(marker.getLatLng(),Math.max(state.map.getZoom(),16),{animate:false});
    }
  }
  if(hash) history.replaceState(null,'',`#photo=${encodeURIComponent(id)}`);
  if($('lightbox').open) updateLightbox();
  announce(`${photo.title}. ${photo.locationLabel}. ${index+1} of ${state.visible.length}.`);
}
function stepPhoto(direction) {
  const index=state.visible.findIndex(p=>p.id===state.current?.id);
  const next=state.visible[index+direction]; if(!next) return;
  selectPhoto(next.id,{pan:true});
  const frame=$('filmstrip').querySelector(`[data-id="${next.id}"]`);
  if(frame) {
    const strip=$('filmstrip');
    const left=frame.offsetLeft-strip.offsetLeft;
    if(left<strip.scrollLeft||left+frame.offsetWidth>strip.scrollLeft+strip.clientWidth) strip.scrollTo({left:Math.max(0,left-strip.clientWidth/2+frame.offsetWidth/2),behavior:'instant'});
  }
}
function setView(view,{writeHash=true}={}) {
  const wasPlan=state.view==='plan'&&view!=='plan'&&location.hash.startsWith('#plan');
  const wasScout=state.view==='scout'&&view!=='scout'&&location.hash.startsWith('#scout');
  if((wasPlan||wasScout)&&view!=='scout') {
    const hash=state.current?`#photo=${encodeURIComponent(state.current.id)}`:'';
    history.replaceState(null,'',`${location.pathname}${location.search}${hash}`);
  }
  state.view=view;
  $('explorer').classList.toggle('gallery-mode',view==='gallery');$('gallery').hidden=view!=='gallery';
  $('explorer').classList.toggle('scout-mode',view==='scout');$('scout').hidden=view!=='scout';
  $('explorer').classList.toggle('plan-mode',view==='plan');$('plan').hidden=view!=='plan';
  for(const v of ['map','gallery','scout','plan']) {$(`${v}-tab`).classList.toggle('active',view===v);$(`${v}-tab`).setAttribute('aria-pressed',String(view===v));}
  $('overview').hidden=view!=='map';$('place-filter').hidden=view==='scout'||view==='plan';document.querySelector('.filter-label').hidden=view==='scout'||view==='plan';$('archive').hidden=view==='scout'||view==='plan';
  $('collection-count').hidden=view==='scout'||view==='plan';
  const planLabels=view==='plan';
  $('map-region').setAttribute('aria-label',planLabels?'Filming stop locations':'Photograph locations');
  $('map').setAttribute('aria-label',planLabels?'Map of numbered filming stops':'Interactive map of Santiago photograph locations');
  $('map-footer-note').textContent=planLabels?'Filming stops; photo GPS, venue maps and geocoded place locations.':'Pins follow the original photo geotags.';
  if(state.map) {
    const planMode=view==='plan';
    if(state.clusters&&state.map.hasLayer(state.clusters)) state.map.removeLayer(state.clusters);
    if(state.planLayer&&state.map.hasLayer(state.planLayer)) state.map.removeLayer(state.planLayer);
    if(planMode&&state.planLayer) state.map.addLayer(state.planLayer);
    else if(view==='map'&&state.clusters) state.map.addLayer(state.clusters);
    if(view==='map'||planMode) {
      state.map.invalidateSize();
      if(planMode) requestAnimationFrame(()=>{if(state.view==='plan'&&state.map){state.map.invalidateSize({pan:false});fitPlanStops();}});
      else overview();
    }
  }
  if(view==='plan'&&writeHash&&!location.hash.startsWith('#plan')) history.replaceState(null,'',`${location.pathname}${location.search}#plan`);
  if(view==='map'&&!wasPlan&&!wasScout&&location.hash.startsWith('#scout')) history.replaceState(null,'',`${location.pathname}${location.search}`);
  if(view==='plan') {$('map-note-title').textContent='FILMING PLAN';$('map-note-copy').textContent=state.plan?.summary||'Numbered filming stops; directions open the road or walking route.';}
  else if(view==='map'&&state.current&&!hasPhotoLocation(state.current)) {$('map-note-title').textContent='LOCATION NOT RECORDED';$('map-note-copy').textContent=`${state.current.title} is in the library without a map pin.`;}
  else {$('map-note-title').textContent='SANTIAGO, CHILE';$('map-note-copy').textContent='Choose a photograph to explore a moment.';}
}
function externalLink(text,url,className='') {
  const link=element('a',className,text);link.href=url;link.target='_blank';link.rel='noopener';return link;
}
function showScout(id) {
  setView('scout');
  $('scout-filter').value='all';renderScouting();
  history.replaceState(null,'',id?`#scout=${encodeURIComponent(id)}`:'#scout');
  if(id){const card=$('scout-cards').querySelector(`[data-scout="${id}"]`);card?.scrollIntoView({block:'start',behavior:'instant'});card?.focus({preventScroll:true});}
}
function planDestination(stop) {
  if(stop.privateLocation) return '';
  const isPlaceholder=value=>!value||/\b(pending|unknown|tbc|tbd|unlocated|to be confirmed|confirm|not set|not provided)\b/i.test(value);
  if (typeof stop.mapQuery==='string'&&stop.mapQuery.trim()&&!isPlaceholder(stop.mapQuery)) return stop.mapQuery.trim();
  if (Number.isFinite(stop.lat)&&Number.isFinite(stop.lng)) return `${stop.lat},${stop.lng}`;
  const address=typeof stop.address==='string'?stop.address.trim():'';
  if (isPlaceholder(address)) return '';
  return address;
}
function routeLegUrl(leg) {
  if(leg.privateLocation) return '';
  const origin=String(leg.origin||'').trim(),destination=String(leg.destination||'').trim();
  const isPlaceholder=value=>!value||/\b(pending|unknown|tbc|tbd|unlocated|to be confirmed|confirm|not set|not provided)\b/i.test(value);
  if (isPlaceholder(origin)||isPlaceholder(destination)) return '';
  return mapsDirectionsUrl(destination,{origin,waypoints:leg.waypoints,mode:leg.mode});
}
function shotStorageKey(stop, shot) {return `retrovizor-shoot-plan:${state.plan?.date||'undated'}:${stop.id}:${shot.id}`;}
function readShotDone(stop, shot) {
  try {return localStorage.getItem(shotStorageKey(stop,shot))==='1';} catch {return false;}
}
function writeShotDone(stop, shot, done) {
  try {localStorage.setItem(shotStorageKey(stop,shot),done?'1':'0');return true;} catch {return false;}
}
function latestPlan() {return state.plans.at(-1)||null;}
function findPlan(date) {return state.plans.find(plan=>plan.date===date)||null;}
function planHash(id, date=state.plan?.date) {
  const latest=latestPlan();
  const includeDay=Boolean(date&&(id||date!==latest?.date));
  return `#plan${id?`=${encodeURIComponent(id)}`:''}${includeDay?`&day=${encodeURIComponent(date)}`:''}`;
}
function planContainingStop(id) {return state.plans.find(plan=>(plan.stops||[]).some(stop=>stop.id===id))||null;}
function activatePlan(date,{focusId,writeHash=false,pushHistory=false}={}) {
  const plan=findPlan(date)||latestPlan();
  if(!plan)return false;
  state.plan=plan;
  renderPlan();
  if(writeHash) history[pushHistory?'pushState':'replaceState'](null,'',`${location.pathname}${location.search}${planHash(focusId,plan.date)}`);
  if(state.view==='plan') requestAnimationFrame(()=>{if(state.view==='plan'&&state.plan===plan){state.map?.invalidateSize({pan:false});fitPlanStops();if(focusId)focusPlanStop(focusId,{writeHash:false});}});
  return true;
}
function renderPlan() {
  const content=$('plan-content');
  state.planMarkers.clear();
  if(state.planLayer) state.planLayer.clearLayers();
  if(!state.plan) {content.replaceChildren(element('p','plan-unavailable','The shoot plan could not be loaded. Reload the page to try again.'));return;}
  const plan=state.plan;
  const header=element('header','plan-header');
  header.append(element('p','section-label',plan.status||'Provisional plan'));
  if(state.plans.length>1){
    const dayLabel=element('label','plan-day-label','Plan day');dayLabel.htmlFor='plan-day-select';
    const daySelect=document.createElement('select');daySelect.id='plan-day-select';daySelect.className='plan-day-select';daySelect.setAttribute('aria-label','Choose shoot plan day');
    state.plans.forEach((item,index)=>{const titleDay=Number(item.title?.match(/\bday\s*(\d+)\b/i)?.[1]);const dayNumber=Number(item.dayNumber)||titleDay||index+1;const option=element('option','',`Day ${dayNumber} · ${new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric'}).format(new Date(`${item.date}T12:00:00`))}`);option.value=item.date;daySelect.append(option);});
    daySelect.value=plan.date;daySelect.addEventListener('change',()=>activatePlan(daySelect.value,{writeHash:true,pushHistory:true}));
    const dayControl=element('div','plan-day-control');dayControl.append(dayLabel,daySelect);header.append(dayControl);
  }
  if(plan.date){const date=new Date(`${plan.date}T12:00:00`);header.append(element('p','plan-date',new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(date)));}
  const planTitle=element('h2','',plan.title||'Shoot plan');planTitle.id='plan-title';header.append(planTitle);
  if(plan.subtitle) header.append(element('p','plan-subtitle',plan.subtitle));
  if(plan.summary) header.append(element('p','plan-summary',plan.summary));
  const layout=element('div','plan-panel-content');
  if(Array.isArray(plan.notices)&&plan.notices.length){const section=element('details','plan-details plan-preflight');section.append(element('summary','','Before departure · checks to confirm'));const list=element('ul','plan-notice-list');plan.notices.forEach(note=>list.append(element('li','',note)));section.append(list);layout.append(section);}
  const stopSection=element('section','plan-section plan-stops-section');stopSection.append(element('h3','','Stops & shot checklist'));
  const cards=element('div','plan-stops');
  (Array.isArray(plan.stops)?plan.stops:[]).forEach((stop,index)=>{
    const card=element('article','plan-stop');card.dataset.planStop=stop.id||'';card.id=`plan-stop-${stop.id||index+1}`;
    const heading=element('div','plan-stop-heading');heading.append(element('span','plan-stop-number',String(index+1)),element('div','plan-stop-title-wrap',undefined));
    const titleWrap=heading.lastElementChild;titleWrap.append(element('p','section-label',stop.time||'Time pending'),element('h4','',stop.title||`Stop ${index+1}`));
    if(stop.status)titleWrap.append(element('span','plan-status',stop.status));card.append(heading);
    if(stop.address&&!stop.privateLocation)card.append(element('p','plan-address',stop.address));
    const destination=planDestination(stop);
    if(destination)card.append(externalLink('Directions to this stop ↗',mapsDirectionsUrl(destination),'button plan-directions'));
    else card.append(element('p','plan-pending',stop.privateLocation?'Private location · use the crew call sheet':'Location pending — no map pin or directions yet.'));
    const photo=state.photos.find(item=>item.id===stop.photoId);
    if(photo){const reference=element('button','plan-reference');reference.type='button';const img=element('img');img.src=photo.thumb;img.alt='';img.loading='lazy';reference.append(img,element('span','',`Photo reference · ${photo.title}`));reference.addEventListener('click',()=>{setView('map');$('place-filter').value='all';renderCollection();selectPhoto(photo.id,{pan:true});if(window.matchMedia('(max-width: 620px)').matches)requestAnimationFrame(()=>$('open-photo').scrollIntoView({block:'center',behavior:'instant'}));});card.append(reference);}
    if(Array.isArray(stop.shots)&&stop.shots.length){const checklist=element('fieldset','plan-checklist');const legend=element('legend','','Shots to get');checklist.append(legend);
      stop.shots.forEach(shot=>{const label=element('label','plan-shot');const input=document.createElement('input');input.type='checkbox';input.checked=readShotDone(stop,shot);input.addEventListener('change',()=>{if(!writeShotDone(stop,shot,input.checked)){announce('Checklist state could not be saved on this device.');}});label.append(input,element('span','',shot.text||''));checklist.append(label);});card.append(checklist);}
    const notes=[['Light',stop.light],['Travel',stop.transfer],['Access / notes',stop.notes]].filter(([,value])=>value);
    if(notes.length){const dl=element('dl','plan-notes');notes.forEach(([label,value])=>{const row=element('div');row.append(element('dt','',label),element('dd','',value));dl.append(row);});card.append(dl);}
    cards.append(card);
    if(!stop.privateLocation&&Number.isFinite(stop.lat)&&Number.isFinite(stop.lng)&&state.planLayer){
      const badge=element('span','plan-pin-number',String(index+1));
      const icon=L.divIcon({html:badge,className:'plan-pin-icon',iconSize:[38,44],iconAnchor:[19,40]});
      const marker=L.marker([stop.lat,stop.lng],{icon,title:stop.title||`Stop ${index+1}`,alt:stop.title||`Stop ${index+1}`,keyboard:true,riseOnHover:true});
      const tip=element('span','',`${index+1}. ${stop.title||`Stop ${index+1}`}`);marker.bindTooltip(tip,{direction:'top',offset:[0,-38]});
      marker.on('click',()=>focusPlanStop(stop.id,{center:true}));state.planMarkers.set(stop.id,marker);state.planLayer.addLayer(marker);
    }
  });
  stopSection.append(cards);layout.append(stopSection);
  const lightRows=(Array.isArray(plan.light)?plan.light:[]).map(item=>{
    const row=element('div','plan-light-row');row.append(element('strong','',item.label||''),element('span','',item.value||''));
    if(item.note)row.append(element('p','',item.note));return row;
  });
  if(lightRows.length){const section=element('details','plan-details');section.append(element('summary','','Light & timing'));const body=element('div','plan-details-body');body.append(...lightRows);section.append(body);layout.append(section);}
  if(Array.isArray(plan.legs)&&plan.legs.length){const section=element('details','plan-details');section.append(element('summary','','Route legs'));const body=element('div','plan-details-body');
    plan.legs.forEach(leg=>{const row=element('article','plan-leg');row.append(element('p','section-label',leg.title||'Transfer'),element('p','plan-leg-route',`${leg.origin||'Origin pending'} → ${leg.destination||'Destination pending'}`));if(leg.note)row.append(element('p','plan-leg-note',leg.note));const url=routeLegUrl(leg);if(url)row.append(externalLink(`${leg.mode==='walking'?'Walking':'Driving'} directions ↗`,url,'button plan-directions'));else if(leg.privateLocation)row.append(element('p','plan-pending','Private destination · use the crew call sheet; directions are not linked.'));body.append(row);});section.append(body);layout.append(section);}
  if(Array.isArray(plan.deferred)&&plan.deferred.length){const section=element('section','plan-section');section.append(element('h3','','Deferred / outside the route'));plan.deferred.forEach(item=>{const row=element('article','plan-deferred');row.append(element('h4','',item.title||''));if(item.notes)row.append(element('p','',item.notes));section.append(row);});layout.append(section);}
  if(Array.isArray(plan.sources)&&plan.sources.length){const section=element('section','plan-sources');section.append(element('h3','','Sources'));plan.sources.forEach(source=>section.append(externalLink(`${source.title||'Source'} ↗`,source.url)));layout.append(section);}
  content.replaceChildren(header,layout);
  if(state.view==='plan'){$('map-note-title').textContent='FILMING PLAN';$('map-note-copy').textContent=plan.summary||'Numbered filming stops; directions open the road or walking route.';}
}
function fitPlanStops() {
  if(!state.map||!state.plan) return;
  const points=(state.plan.stops||[]).filter(stop=>!stop.privateLocation&&Number.isFinite(stop.lat)&&Number.isFinite(stop.lng)).map(stop=>[stop.lat,stop.lng]);
  if(points.length===1) state.map.setView(points[0],15,{animate:false});
  else if(points.length>1) state.map.fitBounds(points,{padding:[54,64],maxZoom:15,animate:false});
}
function focusPlanStop(id,{center=false,writeHash=true}={}) {
  const stop=(state.plan?.stops||[]).find(item=>item.id===id);if(!stop)return;
  if(writeHash)history.replaceState(null,'',`${location.pathname}${location.search}${planHash(id,state.plan.date)}`);
  const card=[...$('plan').querySelectorAll('[data-plan-stop]')].find(node=>node.dataset.planStop===id);card?.scrollIntoView({block:'nearest',behavior:'instant'});
  if(center&&!stop.privateLocation&&Number.isFinite(stop.lat)&&Number.isFinite(stop.lng)&&state.map)state.map.setView([stop.lat,stop.lng],Math.max(state.map.getZoom(),15),{animate:false});
  announce(`${stop.title||'Stop'} selected.`);
}
function showPlan(id,{date,writeHash=true}={}) {
  if(!date&&id){const latest=latestPlan();date=(latest?.stops||[]).some(stop=>stop.id===id)?latest.date:planContainingStop(id)?.date||state.plan?.date;}
  if(!date&&!id)date=latestPlan()?.date;
  if(date&&findPlan(date))activatePlan(date);
  if(!state.plan)state.plan=latestPlan();
  setView('plan',{writeHash:false});
  if(writeHash)history.replaceState(null,'',`${location.pathname}${location.search}${id||date?planHash(id,state.plan?.date):'#plan'}`);
  if(id)focusPlanStop(id,{writeHash:false});
}
function renderScouting() {
  const filter=$('scout-filter').value;
  const places=state.scouts.filter(p=>filter==='all'||(filter==='photographed')===Boolean(p.photoIds?.length));
  $('scout-count').textContent=`${places.length} locations`;
  $('scout-cards').replaceChildren(...places.map(place=>{
    const card=element('article','scout-card');card.dataset.scout=place.id;card.tabIndex=-1;
    const photo=state.photos.find(p=>p.id===place.heroId);
    if(photo){const img=element('img','scout-image');img.src=photo.image;img.alt=photo.title;img.loading='lazy';card.append(img);}
    else {const blank=element('div','scout-unphotographed');blank.append(element('span','section-label','NEXT STOP'),element('strong','',place.area),element('span','technical','Not yet photographed'));card.append(blank);}
    const body=element('div','scout-body');body.append(element('p','section-label',`${photo?'Photographed':'To scout'} / ${place.kind}`),element('h3','',place.name),element('p','scout-address',place.address));
    body.append(element('p','scout-pitch',place.idea));
    const details=element('dl','scout-details');
    for(const [label,value] of [['Light / timing',place.light],['Sound / setup',place.sound],['Visit',place.hours],['Access',place.access]]){const row=element('div');row.append(element('dt','',label),element('dd','',value));details.append(row);}
    body.append(details);
    if(place.dates)body.append(element('p','scout-dates',place.dates));
    const actions=element('div','scout-actions');
    if(photo){const mapButton=element('button','','View on photo map');mapButton.addEventListener('click',()=>{$('place-filter').value='all';renderCollection();setView('map');selectPhoto(photo.id,{pan:true});$('map-tab').scrollIntoView({block:'start',behavior:'instant'});});actions.append(mapButton);}
    actions.append(externalLink('Directions ↗',scoutDirectionsUrl(place),'button'));
    body.insertBefore(actions,body.querySelector('.scout-pitch'));
    const sources=element('div','scout-sources');sources.append(element('span','technical','Official information: '));place.sources.forEach((source,index)=>{if(index)sources.append(document.createTextNode(' · '));sources.append(externalLink(source.title+' ↗',source.url));});body.append(sources);
    if(place.contact)body.append(element('p','scout-contact',place.contact));
    card.append(body);return card;
  }));
}
function updateLightbox() {
  const photo=state.current;
  $('lightbox-image').src=photo.image;$('lightbox-image').alt=photo.title;
  $('lightbox-title').textContent=`${photo.title} · ${photo.locationLabel||'Location not recorded'}`;
  $('lightbox-index').textContent=$('photo-index').textContent;
  const directions=$('lightbox-directions');directions.hidden=!hasPhotoLocation(photo);
  if(hasPhotoLocation(photo)){directions.href=photoDirectionsUrl(photo);directions.setAttribute('aria-label',`Get directions to ${photo.locationLabel||'this photo location'}`);}
  else directions.removeAttribute('href');
}
function openLightbox() {if(!state.current) return;updateLightbox();if(!$('lightbox').open)$('lightbox').showModal();}
function selectHash() {
  if(location.hash==='#plan'||location.hash.startsWith('#plan=')||location.hash.startsWith('#plan&')){
    const params=new URLSearchParams(location.hash.slice(1));
    let id=params.get('plan')||'';let date=params.get('day')||'';
    if(!date&&id&&!state.plan?.stops?.some(stop=>stop.id===id))date=planContainingStop(id)?.date||'';
    showPlan(id||undefined,{date:date||undefined,writeHash:false});return true;
  }
  if(location.hash==='#scout'){setView('scout');return true;}
  const scoutId=new URLSearchParams(location.hash.slice(1)).get('scout');
  if(state.scouts.some(p=>p.id===scoutId)){showScout(scoutId);return true;}
  const id=new URLSearchParams(location.hash.slice(1)).get('photo');
  if(state.photos.some(p=>p.id===id)) {
    if(state.view==='scout'||state.view==='plan')setView('map');
    if(!state.visible.some(p=>p.id===id)) {$('place-filter').value='all';renderCollection();}
    selectPhoto(id,{pan:true,hash:false});return true;
  }return false;
}
async function copyMemory() {
  const url=new URL(location.href);url.hash=`photo=${state.current.id}`;
  try {await navigator.clipboard.writeText(url.href);$('share-photo').textContent='Link copied ✓';announce('Link copied to clipboard.');setTimeout(()=>$('share-photo').textContent='Copy link to this memory ↗',2200);}
  catch {window.prompt('Copy this memory’s link:',url.href);}
}
async function start() {
  try {
    const response=await fetch('photos.json?v=20261111-library1');if(!response.ok)throw new Error('Photo list unavailable');
    const photos=await response.json();
    state.photos=photos.map((photo,index)=>({photo,index,timestamp:photoCaptureTime(photo)})).sort((a,b)=>{
      if(a.timestamp===null&&b.timestamp!==null)return 1;
      if(a.timestamp!==null&&b.timestamp===null)return -1;
      if(a.timestamp!==null&&b.timestamp!==null&&a.timestamp!==b.timestamp)return a.timestamp-b.timestamp;
      return a.index-b.index;
    }).map(item=>item.photo);
    if(!state.photos.length)throw new Error('Empty photo list');
    try {const scoutResponse=await fetch('scouting.json');if(!scoutResponse.ok)throw new Error('Scouting guide unavailable');state.scouts=(await scoutResponse.json()).locations;renderScouting();}catch(error){$('scout-cards').textContent='The filming guide could not load. Reload the page to try again.';console.error(error);}
    const planFiles=['shoot-plan.json?v=20261111-day3a','shoot-plan-day3.json?v=20261111-day3a'];
    const loadedPlans=await Promise.all(planFiles.map(async path=>{try{const response=await fetch(path);if(!response.ok)throw new Error(`Plan unavailable: ${path}`);return await response.json();}catch(error){console.error(error);return null;}}));
    state.plans=loadedPlans.filter(plan=>plan&&typeof plan.date==='string'&&Array.isArray(plan.stops)).sort((a,b)=>a.date.localeCompare(b.date));
    state.plan=latestPlan();
    [...new Set(state.photos.map(p=>p.locationLabel))].forEach(place=>{const option=element('option','',place);option.value=place;$('place-filter').append(option);});
    initMap();renderCollection();renderPlan();
    if(!selectHash()) {const hero=state.photos.find(p=>p.id==='A48')||state.photos[0];selectPhoto(hero.id,{pan:false,hash:false});}
    $('place-filter').addEventListener('change',()=>{renderCollection();history.replaceState(null,'',location.pathname+location.search);});
    $('overview').addEventListener('click',overview);
    $('previous').addEventListener('click',()=>stepPhoto(-1));$('next').addEventListener('click',()=>stepPhoto(1));
    $('lightbox-prev').addEventListener('click',()=>stepPhoto(-1));$('lightbox-next').addEventListener('click',()=>stepPhoto(1));
    $('open-photo').addEventListener('click',openLightbox);$('close-lightbox').addEventListener('click',()=>$('lightbox').close());
    $('lightbox').addEventListener('click',event=>{if(event.target===$('lightbox'))$('lightbox').close();});
    $('map-tab').addEventListener('click',()=>setView('map'));$('gallery-tab').addEventListener('click',()=>setView('gallery'));
    $('scout-tab').addEventListener('click',()=>showScout());$('scout-filter').addEventListener('change',renderScouting);
    $('plan-tab').addEventListener('click',()=>showPlan());
    $('photo-scout').addEventListener('click',()=>showScout(state.scouts.find(place=>place.photoIds?.includes(state.current.id))?.id));
    $('share-photo').addEventListener('click',copyMemory);window.addEventListener('hashchange',selectHash);window.addEventListener('popstate',selectHash);
    document.addEventListener('keydown',event=>{if(!$('lightbox').open)return;if(event.key==='ArrowLeft'){event.preventDefault();stepPhoto(-1);}if(event.key==='ArrowRight'){event.preventDefault();stepPhoto(1);}});
  }catch(error){$('load-error').hidden=false;$('collection-count').textContent='Photographs unavailable';console.error(error);}
}
start();
