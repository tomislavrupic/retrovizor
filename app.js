/* Retrovizor — static, geotagged photo journal. */
'use strict';
const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { photos: [], visible: [], current: null, map: null, clusters: null, markers: new Map(), view: 'map' };
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
  plaza: 'The day opens out into the square.'
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function photoTime(photo) {
  const value = new Date(photo.capturedAt.replace(' ', 'T'));
  return new Intl.DateTimeFormat('en-GB', {timeZone:'America/Santiago', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}).format(value);
}
function announce(text) { $('announcement').textContent = text; }
function buildPhotoButton(photo, gallery = false) {
  const button = element('button', gallery ? 'gallery-card' : 'frame');
  button.dataset.id = photo.id;
  button.setAttribute('aria-label', `${photo.title}, ${photo.locationLabel}, ${photoTime(photo)}`);
  const img = element('img'); img.src = gallery ? photo.image : photo.thumb; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
  button.append(img);
  if (gallery) {
    const body = element('span', 'card-body');
    body.append(element('span', 'section-label', photo.locationLabel), element('strong', '', photo.title), element('span','technical',photoTime(photo)));
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
  state.photos.forEach(photo => {
    const marker = L.marker([photo.lat,photo.lng], {icon:makeIcon(photo,false),title:photo.title,alt:photo.title,photoThumb:photo.thumb,keyboard:true,riseOnHover:true});
    marker.bindTooltip(photo.title, {direction:'top',offset:[0,-44]});
    marker.on('click',()=>selectPhoto(photo.id,{pan:false}));
    state.markers.set(photo.id,marker);
  });
  const resize = new ResizeObserver(()=>state.map.invalidateSize({pan:false})); resize.observe($('map'));
}
function showMapError(text) { $('map-message').hidden=false; $('map-message').textContent=text; }
function overview() {
  if (!state.map || !state.visible.length) return;
  state.map.fitBounds(state.visible.map(p=>[p.lat,p.lng]),{padding:[64,76],maxZoom:16,animate:false});
}
function renderCollection() {
  const filter=$('place-filter').value;
  state.visible=state.photos.filter(p=>filter==='all'||p.locationLabel===filter);
  $('filmstrip').replaceChildren(...state.visible.map(p=>buildPhotoButton(p)));
  $('gallery').replaceChildren(...state.visible.map(p=>buildPhotoButton(p,true)));
  $('collection-count').textContent=`${state.visible.length} photographs · 7 NOV 2026`;
  if (state.clusters) {state.clusters.clearLayers();state.clusters.addLayers(state.visible.map(p=>state.markers.get(p.id)));overview();}
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
  $('photo-title').textContent=photo.title; $('photo-place').textContent=photo.locationLabel;
  $('photo-caption').textContent=captions[photo.category]||'A moment from a day in Santiago.';
  $('photo-time').textContent=photoTime(photo);
  $('photo-coordinates').textContent=`${Math.abs(photo.lat).toFixed(4)}° S · ${Math.abs(photo.lng).toFixed(4)}° W`;
  $('photo-index').textContent=`${String(index+1).padStart(2,'0')} / ${state.visible.length}`;
  $('previous').disabled=index<=0; $('next').disabled=index===state.visible.length-1;
  $('lightbox-prev').disabled=index<=0; $('lightbox-next').disabled=index===state.visible.length-1;
  document.querySelectorAll('[data-id]').forEach(node=>node.setAttribute('aria-current',String(node.dataset.id===id)));
  if (previous && state.markers.has(previous.id)) state.markers.get(previous.id).setIcon(makeIcon(previous,false));
  const marker=state.markers.get(id);
  if(marker) {
    marker.setIcon(makeIcon(photo,true));
    marker.setZIndexOffset(1000);
    if(pan&&state.map) state.clusters.zoomToShowLayer(marker,()=>{state.map.panTo(marker.getLatLng(),{animate:!reduceMotion,duration:.16});});
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
function setView(view) {
  state.view=view;
  $('explorer').classList.toggle('gallery-mode',view==='gallery');$('gallery').hidden=view!=='gallery';
  for(const v of ['map','gallery']) {$(`${v}-tab`).classList.toggle('active',view===v);$(`${v}-tab`).setAttribute('aria-pressed',String(view===v));}
  $('overview').hidden=view==='gallery';
  if(view==='map'&&state.map){state.map.invalidateSize();overview();}
}
function updateLightbox() {
  const photo=state.current;
  $('lightbox-image').src=photo.image;$('lightbox-image').alt=photo.title;
  $('lightbox-title').textContent=`${photo.title} · ${photo.locationLabel}`;
  $('lightbox-index').textContent=$('photo-index').textContent;
}
function openLightbox() {if(!state.current) return;updateLightbox();if(!$('lightbox').open)$('lightbox').showModal();}
function selectHash() {
  const id=new URLSearchParams(location.hash.slice(1)).get('photo');
  if(state.photos.some(p=>p.id===id)) {
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
    const response=await fetch('photos.json');if(!response.ok)throw new Error('Photo list unavailable');
    const photos=await response.json();
    state.photos=photos.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)).sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt));
    if(!state.photos.length)throw new Error('Empty photo list');
    [...new Set(state.photos.map(p=>p.locationLabel))].forEach(place=>{const option=element('option','',place);option.value=place;$('place-filter').append(option);});
    initMap();renderCollection();
    if(!selectHash()) {const hero=state.photos.find(p=>p.id==='A48')||state.photos[0];selectPhoto(hero.id,{pan:false,hash:false});}
    $('place-filter').addEventListener('change',()=>{renderCollection();history.replaceState(null,'',location.pathname+location.search);});
    $('overview').addEventListener('click',overview);
    $('previous').addEventListener('click',()=>stepPhoto(-1));$('next').addEventListener('click',()=>stepPhoto(1));
    $('lightbox-prev').addEventListener('click',()=>stepPhoto(-1));$('lightbox-next').addEventListener('click',()=>stepPhoto(1));
    $('open-photo').addEventListener('click',openLightbox);$('close-lightbox').addEventListener('click',()=>$('lightbox').close());
    $('lightbox').addEventListener('click',event=>{if(event.target===$('lightbox'))$('lightbox').close();});
    $('map-tab').addEventListener('click',()=>setView('map'));$('gallery-tab').addEventListener('click',()=>setView('gallery'));
    $('share-photo').addEventListener('click',copyMemory);window.addEventListener('hashchange',selectHash);
    document.addEventListener('keydown',event=>{if(!$('lightbox').open)return;if(event.key==='ArrowLeft'){event.preventDefault();stepPhoto(-1);}if(event.key==='ArrowRight'){event.preventDefault();stepPhoto(1);}});
  }catch(error){$('load-error').hidden=false;$('collection-count').textContent='Photographs unavailable';console.error(error);}
}
start();
