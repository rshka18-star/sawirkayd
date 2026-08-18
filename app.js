const DB_NAME = "SawirKaydDB";
const STORE = "photos";
let db;
let currentId = null;

const addBtn = document.getElementById("addBtn");
const fileInput = document.getElementById("fileInput");
const gallery = document.getElementById("gallery");
const emptyState = document.getElementById("emptyState");
const viewer = document.getElementById("viewer");
const viewerImage = document.getElementById("viewerImage");
const closeViewer = document.getElementById("closeViewer");
const deleteBtn = document.getElementById("deleteBtn");

function openDB(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME,1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if(!d.objectStoreNames.contains(STORE)){
        const s = d.createObjectStore(STORE,{keyPath:"id"});
        s.createIndex("createdAt","createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txStore(mode="readonly"){
  return db.transaction(STORE,mode).objectStore(STORE);
}

function getAll(){
  return new Promise((resolve,reject)=>{
    const req = txStore().getAll();
    req.onsuccess = () => resolve(req.result.sort((a,b)=>b.createdAt-a.createdAt));
    req.onerror = () => reject(req.error);
  });
}

function putPhoto(photo){
  return new Promise((resolve,reject)=>{
    const req = txStore("readwrite").put(photo);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function removePhoto(id){
  return new Promise((resolve,reject)=>{
    const req = txStore("readwrite").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function render(){
  const photos = await getAll();
  gallery.innerHTML = "";
  emptyState.style.display = photos.length ? "none" : "block";

  for(const photo of photos){
    const card = document.createElement("button");
    card.className = "card";
    card.setAttribute("aria-label","Fur sawirka");
    const img = document.createElement("img");
    const url = URL.createObjectURL(photo.blob);
    img.src = url;
    img.onload = () => URL.revokeObjectURL(url);
    card.appendChild(img);
    card.onclick = () => showViewer(photo);
    gallery.appendChild(card);
  }
}

function showViewer(photo){
  currentId = photo.id;
  const url = URL.createObjectURL(photo.blob);
  viewerImage.src = url;
  viewerImage.onload = () => URL.revokeObjectURL(url);
  viewer.showModal();
}

addBtn.onclick = () => fileInput.click();

fileInput.onchange = async () => {
  const files = [...fileInput.files].filter(f=>f.type.startsWith("image/"));
  for(const file of files){
    await putPhoto({
      id: crypto.randomUUID(),
      name:file.name,
      createdAt:Date.now(),
      blob:file
    });
  }
  fileInput.value = "";
  await render();
};

closeViewer.onclick = () => viewer.close();

deleteBtn.onclick = async () => {
  if(!currentId) return;
  if(confirm("Ma hubtaa inaad tirtirayso sawirkan?")){
    await removePhoto(currentId);
    viewer.close();
    currentId = null;
    await render();
  }
};

viewer.addEventListener("click",(e)=>{
  if(e.target === viewer) viewer.close();
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  });
}

(async()=>{
  db = await openDB();
  await render();
})();
