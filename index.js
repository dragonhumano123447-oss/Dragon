<<<<<<< HEAD
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.send("¡Servidor Node.js funcionando!");
});

// Token común para todas las APIs
const TOKEN = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpcCI6IjE4MS4xNzYuODQuNjgiLCJwbGF0Zm9ybSI6IkFQSSIsInVzdWFyaW8iOnsiX2lkIjoiNjg3N2FkNjk3YjI0MjIwMjY3ZTg0NDgwIiwibmFtZSI6ImZpa29fZG94IiwicmFuZ28iOiJwbGF0aW51bSIsInNwYW0iOjAsImNfZXhwaXJ5IjoxNzgxOTY3MzE0fSwiaWF0IjoxNzc0NjI0ODM1LCJleHAiOjE3ODE4ODI0MzV9.Wtw-ueqZMVbql4fAqd1s6sDCb6vW_T0bBUxOp9BoD5YKgVby8Ptn_0LRmvF00XXM0ztcVdxw7PIqNeWLAFuV0Q";
// Función genérica para consultas POST con validación de JSON
async function consultarAPI(endpoint, body) {
  const response = await fetch(`https://lookfriends.xyz/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    if (!response.ok || data.message) throw new Error(data.message || `Error consultando ${endpoint}`);
    return data;
  } else {
    const text = await response.text();
    throw new Error(`Respuesta no válida del servidor ${endpoint}: ${text}`);
  }
}

// ------------------ RUTAS DE API ------------------ //

// Función para filtrar coincidencias parciales
const filtrarCoincidencias = (data, ap_pat, ap_mat, nombres) => {
  return (data ?? []).filter(item => {
    return (
      (!ap_pat || item.ap_pat.toLowerCase().includes(ap_pat.toLowerCase())) &&
      (!ap_mat || item.ap_mat.toLowerCase().includes(ap_mat.toLowerCase())) &&
      (!nombres || item.nombres.toLowerCase().includes(nombres.toLowerCase()))
    );
  });
};

// Nombres (GET o POST) - búsqueda parcial
app.all("/api/nombres", async (req, res) => {
  let { ap_pat = "", ap_mat = "", nombres = "" } = req.method === "POST" ? req.body : req.query;

  // Normalizamos y quitamos espacios
  ap_pat = ap_pat.trim();
  ap_mat = ap_mat.trim();
  nombres = nombres.trim();

  if (!ap_pat && !ap_mat && !nombres) {
    return res.status(400).json({ error: "Debes proporcionar al menos un parámetro: ap_pat, ap_mat o nombres." });
  }

  try {
    const data = await consultarAPI("nombres", { ap_pat, ap_mat, nombres });
    const coincidencias = filtrarCoincidencias(data, ap_pat, ap_mat, nombres);
    res.json({ coincidencias });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SBS (por dni)
app.get("/api/sbs", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("sbs", { dni });
    res.json({ rcc_padron: data.rcc_padron ?? null, rcc_reporte: data.rcc_reporte ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Telefonos (por dni o numb)
app.get("/api/telefonos", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  const numb = (req.query.numb || "").trim();

  if (!dni && !numb) return res.status(400).json({ error: "Debes proporcionar dni o numb." });
  if (dni && !/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });
  if (numb && !/^\d{9}$/.test(numb)) return res.status(400).json({ error: "El número debe tener 9 dígitos." });

  try {
    const data = await consultarAPI("telefonos", dni ? { dni } : { numb });
    res.json({ telefonos: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reniec (por dni)
app.get("/api/reniec", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("reniec", { dni });
    res.json({ reniec: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sueldos (por dni)
app.get("/api/sueldos", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("sueldos", { dni });
    res.json({ sueldos: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Familia (por dni)
app.get("/api/familia", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("familia", { dni });
    res.json({ familia: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sunarp (por placa, 6 caracteres)
app.get("/api/sunarp", async (req, res) => {
  let placa = (req.query.placa || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(placa)) return res.status(400).json({ error: "La placa debe tener 6 caracteres alfanuméricos." });

  try {
    const data = await consultarAPI("sunarp", { placa });
    res.json({ sunarp: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sunat (por ruc)
app.get("/api/sunat", async (req, res) => {
  const ruc = (req.query.ruc || "").trim();
  if (!/^\d{11}$/.test(ruc)) return res.status(400).json({ error: "La RUC debe tener 11 dígitos." });

  try {
    const data = await consultarAPI("sunat", { ruc });
    res.json({ sunat: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sisfoh (por dni)
app.get("/api/sisfoh", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("sisfoh", { dni });
    res.json({ sisfoh: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Denuncias PNP (por dni)
app.get("/api/denuncias-pnp", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("denuncias", { dni });

    const resultado = {
      clave: data.clave ?? null,
      comisaria: data.comisaria ?? null,
      condicion_denuncia: data.condicion_denuncia ?? null,
      contenido: data.contenido ?? null,
      fecha_hecho: data.fecha_hecho ?? null,
      fecha_registro: data.fecha_registro ?? null,
      hora_actual: data.hora_actual ?? null,
      intervencion: data.intervencion ?? null,
      lugar: data.lugar ?? null,
      numero_orden: data.numero_orden ?? null,
      link_qr: data.link_qr ?? null,
      pdf_base64: data.pdf_base64 ?? null,
      involucrados: Array.isArray(data.involucrados)
        ? data.involucrados.map(inv => ({
            estado: inv.estado ?? null,
            personas: Array.isArray(inv.personas)
              ? inv.personas.map(p => ({
                  detalle: p.detalle ?? null,
                  documento: p.documento ?? null
                }))
              : []
          }))
        : []
    };

    res.json({ "denuncias-pnp": resultado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`);
});
=======
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.send("¡Servidor Node.js funcionando!");
});

// Token común para todas las APIs
const TOKEN = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpcCI6IjE4MS4xNzYuODQuNjgiLCJwbGF0Zm9ybSI6IkFQSSIsInVzdWFyaW8iOnsiX2lkIjoiNjg3N2FkNjk3YjI0MjIwMjY3ZTg0NDgwIiwibmFtZSI6ImZpa29fZG94IiwicmFuZ28iOiJwbGF0aW51bSIsInNwYW0iOjAsImNfZXhwaXJ5IjoxNzgxOTY3MzE0fSwiaWF0IjoxNzc0NjI0ODM1LCJleHAiOjE3ODE4ODI0MzV9.Wtw-ueqZMVbql4fAqd1s6sDCb6vW_T0bBUxOp9BoD5YKgVby8Ptn_0LRmvF00XXM0ztcVdxw7PIqNeWLAFuV0Q";
// Función genérica para consultas POST con validación de JSON
async function consultarAPI(endpoint, body) {
  const response = await fetch(`https://lookfriends.xyz/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    if (!response.ok || data.message) throw new Error(data.message || `Error consultando ${endpoint}`);
    return data;
  } else {
    const text = await response.text();
    throw new Error(`Respuesta no válida del servidor ${endpoint}: ${text}`);
  }
}

// ------------------ RUTAS DE API ------------------ //

// Función para filtrar coincidencias parciales
const filtrarCoincidencias = (data, ap_pat, ap_mat, nombres) => {
  return (data ?? []).filter(item => {
    return (
      (!ap_pat || item.ap_pat.toLowerCase().includes(ap_pat.toLowerCase())) &&
      (!ap_mat || item.ap_mat.toLowerCase().includes(ap_mat.toLowerCase())) &&
      (!nombres || item.nombres.toLowerCase().includes(nombres.toLowerCase()))
    );
  });
};

// Nombres (GET o POST) - búsqueda parcial
app.all("/api/nombres", async (req, res) => {
  let { ap_pat = "", ap_mat = "", nombres = "" } = req.method === "POST" ? req.body : req.query;

  // Normalizamos y quitamos espacios
  ap_pat = ap_pat.trim();
  ap_mat = ap_mat.trim();
  nombres = nombres.trim();

  if (!ap_pat && !ap_mat && !nombres) {
    return res.status(400).json({ error: "Debes proporcionar al menos un parámetro: ap_pat, ap_mat o nombres." });
  }

  try {
    const data = await consultarAPI("nombres", { ap_pat, ap_mat, nombres });
    const coincidencias = filtrarCoincidencias(data, ap_pat, ap_mat, nombres);
    res.json({ coincidencias });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SBS (por dni)
app.get("/api/sbs", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("sbs", { dni });
    res.json({ rcc_padron: data.rcc_padron ?? null, rcc_reporte: data.rcc_reporte ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Telefonos (por dni o numb)
app.get("/api/telefonos", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  const numb = (req.query.numb || "").trim();

  if (!dni && !numb) return res.status(400).json({ error: "Debes proporcionar dni o numb." });
  if (dni && !/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });
  if (numb && !/^\d{9}$/.test(numb)) return res.status(400).json({ error: "El número debe tener 9 dígitos." });

  try {
    const data = await consultarAPI("telefonos", dni ? { dni } : { numb });
    res.json({ telefonos: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reniec (por dni)
app.get("/api/reniec", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("reniec", { dni });
    res.json({ reniec: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sueldos (por dni)
app.get("/api/sueldos", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("sueldos", { dni });
    res.json({ sueldos: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Familia (por dni)
app.get("/api/familia", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("familia", { dni });
    res.json({ familia: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sunarp (por placa, 6 caracteres)
app.get("/api/sunarp", async (req, res) => {
  let placa = (req.query.placa || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(placa)) return res.status(400).json({ error: "La placa debe tener 6 caracteres alfanuméricos." });

  try {
    const data = await consultarAPI("sunarp", { placa });
    res.json({ sunarp: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sunat (por ruc)
app.get("/api/sunat", async (req, res) => {
  const ruc = (req.query.ruc || "").trim();
  if (!/^\d{11}$/.test(ruc)) return res.status(400).json({ error: "La RUC debe tener 11 dígitos." });

  try {
    const data = await consultarAPI("sunat", { ruc });
    res.json({ sunat: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sisfoh (por dni)
app.get("/api/sisfoh", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("sisfoh", { dni });
    res.json({ sisfoh: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Denuncias PNP (por dni)
app.get("/api/denuncias-pnp", async (req, res) => {
  const dni = (req.query.dni || "").trim();
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });

  try {
    const data = await consultarAPI("denuncias", { dni });

    const resultado = {
      clave: data.clave ?? null,
      comisaria: data.comisaria ?? null,
      condicion_denuncia: data.condicion_denuncia ?? null,
      contenido: data.contenido ?? null,
      fecha_hecho: data.fecha_hecho ?? null,
      fecha_registro: data.fecha_registro ?? null,
      hora_actual: data.hora_actual ?? null,
      intervencion: data.intervencion ?? null,
      lugar: data.lugar ?? null,
      numero_orden: data.numero_orden ?? null,
      link_qr: data.link_qr ?? null,
      pdf_base64: data.pdf_base64 ?? null,
      involucrados: Array.isArray(data.involucrados)
        ? data.involucrados.map(inv => ({
            estado: inv.estado ?? null,
            personas: Array.isArray(inv.personas)
              ? inv.personas.map(p => ({
                  detalle: p.detalle ?? null,
                  documento: p.documento ?? null
                }))
              : []
          }))
        : []
    };

    res.json({ "denuncias-pnp": resultado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`);
});
>>>>>>> c936a1462fff325c57a6a89d07366e428ef6e21c
