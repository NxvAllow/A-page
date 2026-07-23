import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onSnapshot, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { updateDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { increment } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDWZTHAjvielvOlRljQ8ZxxDkU_IF0s3kA",
  authDomain: "genesis-acc68.firebaseapp.com",
  projectId: "genesis-acc68",
  storageBucket: "genesis-acc68.firebasestorage.app",
  messagingSenderId: "927892532926",
  appId: "1:927892532926:web:d4ebdf8547e454b4b0f8ef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

//////////////////////////////////////////////////
// 🔥 METAS (Corregido y Completo)
//////////////////////////////////////////////////

async function guardarMeta(texto) {
  if (!texto) return;
  // Usamos serverTimestamp para que la fecha sea consistente
  await addDoc(collection(db, "metas"), {
    contenido: texto,
    completada: false,
    fecha: serverTimestamp() 
  });
  document.getElementById("metaInput").value = "";
  cargarMetas();
}

async function alternarMeta(id, estadoActual) {
  const metaRef = doc(db, "metas", id);
  await updateDoc(metaRef, {
    completada: !estadoActual
  });
  cargarMetas();
}

async function borrarMeta(id) {
  if(confirm("¿Borrar esta meta?")) {
    await deleteDoc(doc(db, "metas", id));
    cargarMetas();
  }
}

async function cargarMetas() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const q = query(collection(db, "metas"), orderBy("fecha", "desc"));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((docu) => {
    const data = docu.data();
    const li = document.createElement("li");
    li.className = "meta-item"; // Para el CSS que te pasaré abajo

    const contenidoCuerpo = document.createElement("div");
    contenidoCuerpo.style.display = "flex";
    contenidoCuerpo.style.alignItems = "center";
    contenidoCuerpo.style.gap = "10px";
    contenidoCuerpo.style.cursor = "pointer";
    
    const emoji = document.createElement("span");
    emoji.textContent = data.completada ? "❤️" : "🤍";
    
    const texto = document.createElement("span");
    texto.className = "meta-texto";
    texto.textContent = data.contenido;

    if (data.completada) {
      texto.style.textDecoration = "line-through";
      texto.style.opacity = "0.6";
    }

    contenidoCuerpo.onclick = () => alternarMeta(docu.id, data.completada);

    const botonBorrar = document.createElement("span");
    botonBorrar.textContent = "❌";
    botonBorrar.className = "borrar-meta"; 
    botonBorrar.onclick = (e) => {
      e.stopPropagation(); 
      borrarMeta(docu.id);
    };

    contenidoCuerpo.appendChild(emoji);
    contenidoCuerpo.appendChild(texto);
    li.appendChild(contenidoCuerpo);
    li.appendChild(botonBorrar);

    lista.appendChild(li);
  });
}
//////////////////////////////////////////////////
// 🔥 FOTOS (Cloudinary)
//////////////////////////////////////////////////

async function subirFoto() {
  const input = document.getElementById("fotoInput");
  const file = input.files[0];
  const texto = document.getElementById("textoFoto").value;

  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "mi_present"); // ✅ bien escrito

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dwnn2bgpf/image/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json(); // ✅ primero esto

    if (!data.secure_url) {
      console.error("Error Cloudinary:", data);
      return;
    }

    // 🔥 guardar UNA sola vez
    await addDoc(collection(db, "fotos"), {
      url: data.secure_url,
      texto: texto,
      fecha: new Date()
    });

    input.value = "";
    document.getElementById("textoFoto").value = "";

    cargarFotos();

  } catch (error) {
    console.error("Error:", error);
  }
}

async function cargarFotos() {
  const galeria = document.getElementById("galeria");
  galeria.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "fotos"));

  querySnapshot.forEach((docu) => {
    const data = docu.data();

    const contenedor = document.createElement("div");
    contenedor.className = "foto-card";

    const img = document.createElement("img");
    img.src = data.url;
    img.style.cursor = "zoom-in"; // Cambia el cursor para indicar que se puede ampliar
    img.onclick = () => abrirModal(data.url, data.texto); // <--- AÑADIR ESTO

    const texto = document.createElement("div");
    texto.className = "foto-texto";
    texto.textContent = data.texto || "";

    const borrar = document.createElement("span");
    borrar.textContent = "❌";
    borrar.className = "borrar-foto";
    borrar.onclick = () => borrarFoto(docu.id);

    contenedor.appendChild(img);
    contenedor.appendChild(borrar);
    contenedor.appendChild(texto);

    galeria.appendChild(contenedor);
  });
}

async function borrarFoto(id) {
  await deleteDoc(doc(db, "fotos", id));
  cargarFotos();
}

async function enviarMensaje() {
  const input = document.getElementById("mensajeInput");
  const texto = input.value;

  if (!texto || !usuario) return;

  await addDoc(collection(db, "chat"), {
  texto: texto,
  usuario: usuario,
  fecha: serverTimestamp()
 });

  input.value = "";
}

function escucharChat() {
  const contenedor = document.getElementById("mensajes");

  const q = query(collection(db, "chat"), orderBy("fecha"));

  onSnapshot(q, (snapshot) => {
    contenedor.innerHTML = "";

    snapshot.forEach((docu) => {
      const data = docu.data();

      const msg = document.createElement("div");

      const esMio = data.usuario === usuario;

      msg.style.display = "flex";
      msg.style.flexDirection = "column";
      msg.style.alignItems = esMio ? "flex-end" : "flex-start";

      const burbuja = document.createElement("div");
      burbuja.textContent = data.texto;

      burbuja.style.background = esMio ? "#95ebb9" : "#334155";
      burbuja.style.color = "white";
      burbuja.style.padding = "8px 12px";
      burbuja.style.borderRadius = "15px";
      burbuja.style.margin = "5px";
      burbuja.style.maxWidth = "70%";

      const info = document.createElement("span");
      info.textContent = data.usuario || "Anon";

      info.style.fontSize = "10px";
      info.style.opacity = "0.7";

      msg.appendChild(info);
      msg.appendChild(burbuja);

      contenedor.appendChild(msg);
    });

    contenedor.scrollTop = contenedor.scrollHeight;
  });
}

let usuario = localStorage.getItem("usuario") || "";

const nombreInput = document.getElementById("nombreInput");

if (usuario) {
  nombreInput.value = usuario;
}

nombreInput.addEventListener("change", () => {
  usuario = nombreInput.value;
  localStorage.setItem("usuario", usuario);
});

let contadorClicks = 0;

function sumarClick() {
  contadorClicks++;

  document.getElementById("botonSorpresa").textContent =
    `🎁 ${contadorClicks} clicks`;

  verificarSorpresa();
}

async function crearSorpresa() {
  const mensaje = document.getElementById("mensajeCrear").value;
  const clicks = parseInt(document.getElementById("clicksNecesarios").value);
  const file = document.getElementById("archivoSorpresa").files[0];

  if (!mensaje || !clicks) return;

  let url = "";

  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "mi_present");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dwnn2bgpf/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await res.json();
    url = data.secure_url;
  }

  await addDoc(collection(db, "sorpresas"), {
  mensaje: mensaje,
  clicks: clicks,
  url: url || "",
  usada: false, // 🔥 importante
  fecha: new Date()
  });

  alert("Sorpresa guardada 🎁");
}

async function verificarSorpresa() {
  const contenedor = document.getElementById("resultadoSorpresa");

  const querySnapshot = await getDocs(collection(db, "sorpresas"));

  let sorpresaEncontrada = null;
  let idDoc = null;

  querySnapshot.forEach((docu) => {
    const data = docu.data();

    // 🔥 solo busca una que NO esté usada
    if (!data.usada && contadorClicks >= data.clicks && !sorpresaEncontrada) {
      sorpresaEncontrada = data;
      idDoc = docu.id;
    }
  });

  if (sorpresaEncontrada) {

    let extra = "";

    if (sorpresaEncontrada.url) {
      if (sorpresaEncontrada.url.includes("image")) {
        extra = `<img src="${sorpresaEncontrada.url}" style="width:100%; border-radius:10px;">`;
      } else if (sorpresaEncontrada.url.includes("video")) {
        extra = `<video controls src="${sorpresaEncontrada.url}" style="width:100%;"></video>`;
      } else {
        extra = `<audio controls src="${sorpresaEncontrada.url}"></audio>`;
      }
    }

    contenedor.innerHTML = `
      <div style="margin-top:10px; padding:10px; background: #fbcfe8; border-radius:10px;">
        <h3>🎉 Sorpresa desbloqueada</h3>
        <p>${sorpresaEncontrada.mensaje}</p>
        ${extra}
      </div>
    `;

    // 🔥 marcar como usada
    await updateDoc(doc(db, "sorpresas", idDoc), {
      usada: true
    });

    // 🔥 reiniciar clicks
    contadorClicks = 0;
    document.getElementById("botonSorpresa").textContent = "🎁 0 clicks";
  }
}

function abrirModal(url, texto) {
  const modal = document.getElementById("fotoModal");
  document.getElementById("imgModal").src = url;
  document.getElementById("textoModal").textContent = texto || "";
  modal.style.display = "flex";
}

function cerrarModal() {
  document.getElementById("fotoModal").style.display = "none";
}

//////////////////////////////////////////////////
// 🔥 GUSTOS (Multimedia + Texto + Fecha)
//////////////////////////////////////////////////

async function subirGusto() {
  const input = document.getElementById("gustoInput");
  const file = input.files[0];
  const texto = document.getElementById("textoGusto").value;

  if (!file && !texto) return; // Al menos debe haber texto o archivo

  let url = "";
  let tipo = "";

  if (file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "mi_present");

      // Cloudinary detecta automáticamente el tipo si usamos /auto/upload
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dwnn2bgpf/auto/upload",
        { method: "POST", body: formData }
      );

      const data = await response.json();
      url = data.secure_url;
      tipo = data.resource_type; // 'image', 'video' o 'raw' (para audio)
    } catch (error) {
      console.error("Error subiendo a Cloudinary:", error);
    }
  }

  // Guardar en Firebase
  await addDoc(collection(db, "gustos"), {
    url: url,
    texto: texto,
    tipo: tipo,
    fecha: new Date()// Guarda la fecha legible
  });

  // Limpiar y recargar
  input.value = "";
  document.getElementById("textoGusto").value = "";
  cargarGustos();
}

async function borrarGusto(id) {
  if(confirm("¿Borrar este gusto?")) {
    await deleteDoc(doc(db, "gustos", id));
    cargarGustos();
  }
}

async function cargarGustos() {
  const contenedor = document.getElementById("listaGustos");
  contenedor.innerHTML = "";

  // 1. Creamos la consulta ordenada por el campo "fecha"
  // Use "desc" si quieres lo más nuevo arriba, o quítalo para lo más viejo arriba
  const q = query(collection(db, "gustos"), orderBy("fecha", "desc"));

  // 2. Usamos la consulta 'q' en lugar de la colección directa
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((docu) => {
    const data = docu.data();
    const card = document.createElement("div");
    card.className = "gusto-card"; // Aplicamos la clase CSS

    let mediaHTML = "";
    if (data.url) {
      if (data.tipo === "image") {
        mediaHTML = `<img src="${data.url}" class="gusto-media" style="cursor:pointer;" onclick="abrirModal('${data.url}', '${data.texto}')">`;
      } else if (data.tipo === "video") {
        mediaHTML = `<video src="${data.url}" controls class="gusto-media"></video>`;
      } else if (data.tipo === "raw" || data.url.includes("mp3") || data.url.includes("wav")) {
        mediaHTML = `<audio src="${data.url}" controls style="width:100%;"></audio>`;
      }
    }

    // Estructura HTML limpia con las nuevas clases y el corazón visual
    card.innerHTML = `
      <span class="borrar-btn" onclick="borrarGusto('${docu.id}')">❌</span>
      ${mediaHTML}
      <p class="gusto-texto">${data.texto}</p>
      <small class="gusto-fecha">${data.fecha}</small>
      <span class="corazon-visual">❤️</span> `;

    contenedor.appendChild(card);
  });
}
//////////////////////////////////////////////////
// 🔥 DIBUJOS (Canvas + Cloudinary + Likes)
//////////////////////////////////////////////////

const canvasDibujo = document.getElementById("canvasDibujo");
const ctxDibujo = canvasDibujo.getContext("2d");
const canvasWrapper = document.getElementById("canvasWrapper");

let dibujando = false;
let ultimoX = 0;
let ultimoY = 0;
let herramientaActual = "lapiz"; // 'lapiz' | 'marcador' | 'aerografo' | 'borrador'
let simetriaActiva = false;
let zoomActual = 100;
let intervaloSpray = null;
let posicionActual = { x: 0, y: 0 };

let historial = [];
let historialRedo = [];
const MAX_HISTORIAL = 20;

const paletaColores = [
  "#000000", "#808080", "#c0c0c0", "#ffffff",
  "#3b82f6", "#22d3ee", "#16a34a", "#84cc16",
  "#dc2626", "#f97316", "#f59e0b", "#a16207",
  "#92400e", "#7c3aed", "#ec4899", "#8e65a6"
];

function crearPaleta() {
  const contenedor = document.getElementById("paletaColores");
  paletaColores.forEach((color, i) => {
    const swatch = document.createElement("div");
    swatch.className = "swatch" + (i === paletaColores.length - 1 ? " activo" : "");
    swatch.style.background = color;
    swatch.onclick = () => seleccionarColor(color, swatch);
    contenedor.appendChild(swatch);
  });
}
crearPaleta();

function seleccionarColor(color, swatchEl) {
  document.getElementById("colorPicker").value = color;
  document.querySelectorAll(".swatch").forEach(s => s.classList.remove("activo"));
  if (swatchEl) swatchEl.classList.add("activo");
  if (herramientaActual === "borrador") usarHerramienta("lapiz");
}

document.getElementById("colorPicker").addEventListener("input", () => {
  document.querySelectorAll(".swatch").forEach(s => s.classList.remove("activo"));
  if (herramientaActual === "borrador") usarHerramienta("lapiz");
});

//////////////////////////////////////////////////
// 🖌 HERRAMIENTAS (lápiz, marcador, aerógrafo, borrador)
//////////////////////////////////////////////////

function usarHerramienta(tipo) {
  herramientaActual = tipo;
  const botones = {
    lapiz: "btnLapiz",
    marcador: "btnMarcador",
    aerografo: "btnAerografo",
    borrador: "btnBorrador"
  };
  Object.entries(botones).forEach(([nombre, idBoton]) => {
    document.getElementById(idBoton).classList.toggle("activa", nombre === tipo);
  });
}

function alternarSimetria() {
  simetriaActiva = !simetriaActiva;
  document.getElementById("btnSimetria").classList.toggle("activa", simetriaActiva);
}

function cambiarZoom(delta) {
  zoomActual = Math.min(300, Math.max(100, zoomActual + delta));
  aplicarZoom();
}

function restablecerZoom() {
  zoomActual = 100;
  aplicarZoom();
}

function aplicarZoom() {
  const anchoBase = canvasWrapper.clientWidth;
  canvasDibujo.style.width = (anchoBase * zoomActual / 100) + "px";
  document.getElementById("zoomLabel").textContent = zoomActual + "%";
}

//////////////////////////////////////////////////
// 🕓 HISTORIAL (deshacer / rehacer)
//////////////////////////////////////////////////

function limpiarCanvas(guardar = true) {
  if (guardar) guardarEstado();
  ctxDibujo.fillStyle = "#ffffff";
  ctxDibujo.fillRect(0, 0, canvasDibujo.width, canvasDibujo.height);
  if (guardar) autoguardarBorrador();
}
limpiarCanvas(false); // fondo blanco inicial, sin registrar en el historial

function guardarEstado() {
  historial.push(canvasDibujo.toDataURL());
  if (historial.length > MAX_HISTORIAL) historial.shift();
  historialRedo = []; // una acción nueva invalida el rehacer
}

function restaurarEstado(dataURL) {
  const img = new Image();
  img.onload = () => {
    ctxDibujo.clearRect(0, 0, canvasDibujo.width, canvasDibujo.height);
    ctxDibujo.drawImage(img, 0, 0);
  };
  img.src = dataURL;
}

function deshacer() {
  if (historial.length === 0) return;
  historialRedo.push(canvasDibujo.toDataURL());
  restaurarEstado(historial.pop());
  autoguardarBorrador();
}

function rehacer() {
  if (historialRedo.length === 0) return;
  historial.push(canvasDibujo.toDataURL());
  restaurarEstado(historialRedo.pop());
  autoguardarBorrador();
}

//////////////////////////////////////////////////
// 💾 AUTOGUARDADO LOCAL (borrador, no se sube a nadie)
//////////////////////////////////////////////////

let borradorYaChequeado = false;

function autoguardarBorrador() {
  try {
    localStorage.setItem("dibujoBorrador", canvasDibujo.toDataURL());
  } catch (error) {
    console.warn("No se pudo autoguardar el boceto:", error);
  }
}

function restaurarBorradorDibujo() {
  if (borradorYaChequeado) return;
  borradorYaChequeado = true;
  const guardado = localStorage.getItem("dibujoBorrador");
  if (guardado) restaurarEstado(guardado);
}
window.restaurarBorradorDibujo = restaurarBorradorDibujo;

//////////////////////////////////////////////////
// ✏️ DIBUJO EN EL CANVAS
//////////////////////////////////////////////////

function obtenerPosCanvas(e) {
  const rect = canvasDibujo.getBoundingClientRect();
  const escalaX = canvasDibujo.width / rect.width;
  const escalaY = canvasDibujo.height / rect.height;
  return {
    x: (e.clientX - rect.left) * escalaX,
    y: (e.clientY - rect.top) * escalaY
  };
}

function trazarSegmento(x1, y1, x2, y2) {
  const color = document.getElementById("colorPicker").value;
  const grosor = Number(document.getElementById("grosorPicker").value);
  const opacidad = Number(document.getElementById("opacidadPicker").value) / 100;

  ctxDibujo.lineCap = "round";
  ctxDibujo.lineJoin = "round";
  ctxDibujo.shadowBlur = 0;
  ctxDibujo.shadowColor = "transparent";

  if (herramientaActual === "marcador") {
    ctxDibujo.globalAlpha = opacidad * 0.8;
    ctxDibujo.strokeStyle = color;
    ctxDibujo.lineWidth = grosor;
    ctxDibujo.shadowBlur = grosor * 0.8;
    ctxDibujo.shadowColor = color;
  } else if (herramientaActual === "borrador") {
    ctxDibujo.globalAlpha = 1;
    ctxDibujo.strokeStyle = "#ffffff";
    ctxDibujo.lineWidth = grosor * 1.5;
  } else {
    // lápiz
    ctxDibujo.globalAlpha = opacidad;
    ctxDibujo.strokeStyle = color;
    ctxDibujo.lineWidth = grosor;
  }

  ctxDibujo.beginPath();
  ctxDibujo.moveTo(x1, y1);
  ctxDibujo.lineTo(x2, y2);
  ctxDibujo.stroke();

  if (simetriaActiva) {
    const mx1 = canvasDibujo.width - x1;
    const mx2 = canvasDibujo.width - x2;
    ctxDibujo.beginPath();
    ctxDibujo.moveTo(mx1, y1);
    ctxDibujo.lineTo(mx2, y2);
    ctxDibujo.stroke();
  }

  ctxDibujo.globalAlpha = 1;
  ctxDibujo.shadowBlur = 0;
}

function pintarSpray(x, y) {
  const color = document.getElementById("colorPicker").value;
  const grosor = Number(document.getElementById("grosorPicker").value);
  const opacidad = Number(document.getElementById("opacidadPicker").value) / 100;
  const radio = grosor * 2;
  const cantidad = Math.round(grosor * 1.5);

  ctxDibujo.fillStyle = color;

  const puntos = [{ x, y }];
  if (simetriaActiva) puntos.push({ x: canvasDibujo.width - x, y });

  puntos.forEach(punto => {
    for (let i = 0; i < cantidad; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const distancia = Math.random() * radio;
      const px = punto.x + Math.cos(angulo) * distancia;
      const py = punto.y + Math.sin(angulo) * distancia;
      ctxDibujo.globalAlpha = opacidad * 0.35;
      ctxDibujo.beginPath();
      ctxDibujo.arc(px, py, Math.max(1, grosor * 0.08), 0, Math.PI * 2);
      ctxDibujo.fill();
    }
  });

  ctxDibujo.globalAlpha = 1;
}

function empezarDibujo(e) {
  dibujando = true;
  guardarEstado();
  const pos = obtenerPosCanvas(e);
  ultimoX = pos.x;
  ultimoY = pos.y;
  posicionActual = pos;

  if (herramientaActual === "aerografo") {
    pintarSpray(pos.x, pos.y);
    intervaloSpray = setInterval(() => {
      pintarSpray(posicionActual.x, posicionActual.y);
    }, 60);
  }
}

function dibujarTrazo(e) {
  if (!dibujando) return;
  const pos = obtenerPosCanvas(e);
  posicionActual = pos;

  if (herramientaActual === "aerografo") {
    pintarSpray(pos.x, pos.y);
  } else {
    trazarSegmento(ultimoX, ultimoY, pos.x, pos.y);
  }

  ultimoX = pos.x;
  ultimoY = pos.y;
}

function terminarDibujo() {
  if (!dibujando) return;
  dibujando = false;
  if (intervaloSpray) {
    clearInterval(intervaloSpray);
    intervaloSpray = null;
  }
  autoguardarBorrador();
}

canvasDibujo.addEventListener("pointerdown", empezarDibujo);
canvasDibujo.addEventListener("pointermove", dibujarTrazo);
canvasDibujo.addEventListener("pointerup", terminarDibujo);
canvasDibujo.addEventListener("pointerleave", terminarDibujo);

//////////////////////////////////////////////////
// ☁️ GUARDAR EN CLOUDINARY + FIRESTORE
//////////////////////////////////////////////////

async function guardarDibujo() {
  const nombre = document.getElementById("nombreDibujo").value.trim();

  if (!nombre) {
    alert("Escribe tu nombre antes de guardar 🙂");
    return;
  }

  const dataURL = canvasDibujo.toDataURL("image/png");

  try {
    const formData = new FormData();
    formData.append("file", dataURL);
    formData.append("upload_preset", "mi_present");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dwnn2bgpf/image/upload",
      { method: "POST", body: formData }
    );

    const data = await response.json();

    if (!data.secure_url) {
      console.error("Error Cloudinary:", data);
      alert("No se pudo subir el dibujo 😢");
      return;
    }

    await addDoc(collection(db, "dibujos"), {
      nombre: nombre,
      url: data.secure_url,
      likes: 0,
      fecha: serverTimestamp()
    });

    limpiarCanvas();
    localStorage.removeItem("dibujoBorrador");
    alert("¡Dibujo guardado! 🎨");

  } catch (error) {
    console.error("Error:", error);
    alert("Ocurrió un error al guardar el dibujo");
  }
}

function obtenerLikeados() {
  return JSON.parse(localStorage.getItem("dibujosLikeados") || "[]");
}

function escucharDibujos() {
  const contenedor = document.getElementById("galeriaDibujos");
  const q = query(collection(db, "dibujos"), orderBy("fecha", "desc"));

  onSnapshot(q, (snapshot) => {
    contenedor.innerHTML = "";
    const likeados = obtenerLikeados();

    snapshot.forEach((docu) => {
      const data = docu.data();
      const yaLeGusta = likeados.includes(docu.id);

      const card = document.createElement("div");
      card.className = "dibujo-card";

      card.innerHTML = `
        <span class="borrar-dibujo" onclick="borrarDibujo('${docu.id}')">❌</span>
        <img src="${data.url}" onclick="abrirModal('${data.url}', '${data.nombre}')">
        <div class="dibujo-nombre">${data.nombre}</div>
        <div class="dibujo-fila">
          <span class="dibujo-like ${yaLeGusta ? "liked" : ""}" onclick="darLike('${docu.id}', ${yaLeGusta})">
            ${yaLeGusta ? "❤️" : "🤍"} ${data.likes || 0}
          </span>
        </div>
      `;

      contenedor.appendChild(card);
    });
  });
}

async function darLike(id, yaLeGusta) {
  if (yaLeGusta) return; // evita likear el mismo dibujo varias veces

  const likeados = obtenerLikeados();
  likeados.push(id);
  localStorage.setItem("dibujosLikeados", JSON.stringify(likeados));

  await updateDoc(doc(db, "dibujos", id), {
    likes: increment(1)
  });
}

async function borrarDibujo(id) {
  if (confirm("¿Borrar este dibujo?")) {
    await deleteDoc(doc(db, "dibujos", id));
  }
}

//////////////////////////////////////////////////
// 🔥 GLOBAL
//////////////////////////////////////////////////

window.subirFoto = subirFoto; // 🔥 IMPORTANTE
window.enviarMensaje = enviarMensaje;
window.crearSorpresa = crearSorpresa;
window.sumarClick = sumarClick;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.subirGusto = subirGusto;
window.borrarGusto = borrarGusto;
window.guardarMeta = guardarMeta;
window.borrarMeta = borrarMeta;
window.alternarMeta = alternarMeta;
window.limpiarCanvas = limpiarCanvas;
window.guardarDibujo = guardarDibujo;
window.darLike = darLike;
window.borrarDibujo = borrarDibujo;
window.usarHerramienta = usarHerramienta;
window.alternarSimetria = alternarSimetria;
window.cambiarZoom = cambiarZoom;
window.restablecerZoom = restablecerZoom;
window.deshacer = deshacer;
window.rehacer = rehacer;
escucharChat();
cargarMetas();
cargarFotos();
cargarGustos();
escucharDibujos();
