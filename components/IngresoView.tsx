"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Fingerprint, Search, Download, UserCheck, AlertCircle, CheckCircle, Clock, Users, ChevronLeft, ChevronRight, RefreshCw, X, User, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { Ingreso, Alumno } from "@/lib/supabase";
import { carreraBadgeStyle } from "@/lib/carreraColors";
import AlertDialog from "./AlertDialog";
import ConfirmDialog from "./ConfirmDialog";

const card: React.CSSProperties = { background:"rgba(8,16,34,0.85)", border:"1px solid rgba(42,109,181,0.18)", borderRadius:14, backdropFilter:"blur(12px)" };
const inp: React.CSSProperties = { width:"100%", padding:"9px 13px", background:"rgba(42,109,181,0.08)", border:"1px solid rgba(42,109,181,0.22)", borderRadius:10, color:"#dbeafe", fontSize:13, outline:"none", fontFamily:"inherit", transition:"border-color .2s" };
const PAGE = 10;

function hora12(h: string) { const [hh,mm]=h.split(":"); const n=+hh; return `${String(n%12||12).padStart(2,"0")}:${mm} ${n>=12?"PM":"AM"}`; }
function fmtFecha(f: string) { const [y,m,d]=f.split("-"); return `${d}/${m}/${y}`; }

export default function IngresoView() {
  // ── Búsqueda de alumno para registro ──
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Alumno[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Alumno | null>(null);
  const [registering, setRegistering] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ open: boolean; message: string; type: "success" | "error" | "info" }>({ open: false, message: "", type: "info" });
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Eliminación de ingreso ──
  const [deleteTarget, setDeleteTarget] = useState<Ingreso | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Reportes ──
  const today = new Date().toISOString().slice(0,10);
  const [fDni,    setFDni]    = useState("");
  const [fNombre, setFNombre] = useState("");
  const [fInicio, setFInicio] = useState(today);
  const [fFin,    setFFin]    = useState(today);
  const [rows,    setRows]    = useState<Ingreso[]>([]);
  const [total,   setTotal]   = useState(0);
  const [totalHoy,setTotalHoy]= useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total/PAGE));

  // ── buscar alumnos ──
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/alumnos?search=${encodeURIComponent(query)}&pageSize=6`);
        const json = await res.json();
        setResults(json.data ?? []);
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // ── cargar ingresos ──
  const loadIngresos = useCallback(async (p: number, dni: string, nombre: string, ini: string, fin: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE) });
      if (dni)    params.set("dni",    dni);
      if (nombre) params.set("nombre", nombre);
      if (ini)    params.set("fecha_inicio", ini);
      if (fin)    params.set("fecha_fin",    fin);
      const res  = await fetch(`/api/ingresos?${params}`);
      const json = await res.json();
      setRows(json.data ?? []);
      setTotal(json.total ?? 0);
      if (typeof json.totalHoy === "number") setTotalHoy(json.totalHoy);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadIngresos(1, "", "", today, today); searchRef.current?.focus(); }, []); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadIngresos(1, fDni, fNombre, fInicio, fFin); }, 400);
    return () => clearTimeout(t);
  }, [fDni, fNombre, fInicio, fFin, loadIngresos]);

  // ── registrar ──
  async function registrar() {
    if (!selected) return;
    setRegistering(true); setAlertInfo(p => ({ ...p, open: false }));
    try {
      const res = await fetch("/api/ingresos", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ dni: selected.dni }) });
      const json = await res.json();
      if (res.status === 201) {
        setAlertInfo({ open: true, type:"success", message:`✓ Ingreso registrado — ${selected.nombres} ${selected.apellidos}` });
        setSelected(null); setQuery(""); setResults([]);
        loadIngresos(page, fDni, fNombre, fInicio, fFin);
      } else if (res.status === 409) {
        setAlertInfo({ open: true, type:"error", message: json.error }); // Using error for warn logic, or could map warn to info/error
      } else {
        setAlertInfo({ open: true, type:"error", message: json.error ?? "Error al registrar." });
      }
    } catch { setAlertInfo({ open: true, type:"error", message:"Error de conexión." }); }
    finally { setRegistering(false); searchRef.current?.focus(); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ingresos?id=${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        setAlertInfo({ open: true, type: "success", message: "Ingreso eliminado correctamente." });
        setDeleteTarget(null);
        loadIngresos(page, fDni, fNombre, fInicio, fFin);
      } else {
        setAlertInfo({ open: true, type: "error", message: json.error || "Error al eliminar el ingreso." });
      }
    } catch {
      setAlertInfo({ open: true, type: "error", message: "Error de conexión." });
    } finally {
      setDeleting(false);
    }
  }

  // ── exportar ──
  async function exportar() {
    const params = new URLSearchParams({ page:"1", pageSize:"10000" });
    if (fDni)    params.set("dni", fDni);
    if (fInicio) params.set("fecha_inicio", fInicio);
    if (fFin)    params.set("fecha_fin", fFin);
    const json = await (await fetch(`/api/ingresos?${params}`)).json();
    const data = (json.data as Ingreso[]).map((r,i) => ({
      "N°": i+1, DNI: r.dni_alumno,
      Nombres: r.alumnos?.nombres ?? "", Apellidos: r.alumnos?.apellidos ?? "",
      Carrera: r.alumnos?.carrera ?? "", Fecha: r.fecha_ingreso, Hora: r.hora_ingreso,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0]??{}).map(k=>({ wch: Math.max(k.length,...data.map(r=>String((r as Record<string,unknown>)[k]??"").length))+2 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
    XLSX.writeFile(wb, `ingresos_${fInicio}_${fFin}.xlsx`);
  }

  const msgColors = { ok:{ bg:"rgba(6,78,59,.28)", border:"rgba(52,211,153,.3)", color:"#6ee7b7" }, err:{ bg:"rgba(120,0,0,.28)", border:"rgba(248,113,113,.3)", color:"#fca5a5" }, warn:{ bg:"rgba(120,80,0,.28)", border:"rgba(251,191,36,.3)", color:"#fcd34d" } };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes alertIn { from{opacity:0;transform:translateY(-6px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(74,179,216,.4)} 50%{box-shadow:0 0 0 8px rgba(74,179,216,0)} }
        .ing-drop { position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:9999;
          background:#0a1628; border:1px solid rgba(42,109,181,.3); border-radius:12px;
          overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,.7); }
        .ing-drop-item { padding:11px 16px; cursor:pointer; transition:background .15s; display:flex; align-items:center; gap:12px; }
        .ing-drop-item:hover { background:rgba(42,109,181,.15); }
        .ing-tbl th,.ing-tbl td { padding:10px 14px; text-align:left; font-size:13px; white-space:nowrap; }
        .ing-tbl th { font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:rgba(74,179,216,.5); border-bottom:1px solid rgba(42,109,181,.15); }
        .ing-tbl tbody tr { border-bottom:1px solid rgba(42,109,181,.07); transition:background .15s; }
        .ing-tbl tbody tr:hover td { background:rgba(42,109,181,.07); }
        .pg-btn { width:32px;height:32px;border-radius:8px;border:1px solid rgba(42,109,181,.2);background:rgba(42,109,181,.06);color:rgba(180,210,240,.7);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s; }
        .pg-btn:hover:not(:disabled){background:rgba(42,109,181,.18);border-color:rgba(74,179,216,.35);color:#dbeafe;}
        .pg-btn:disabled{opacity:.3;cursor:default;}
        .pg-btn.ap{background:rgba(42,109,181,.25);border-color:rgba(74,179,216,.4);color:#dbeafe;font-weight:700;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.6);}
        .si:focus{border-color:rgba(74,179,216,.5)!important;}
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", gap:20, fontFamily:"'DM Sans',sans-serif", animation:"fadeUp .35s both" }}>

        {/* ── REGISTRO ── */}
        <div style={{ ...card, padding:"24px 26px", position:"relative", zIndex:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:18, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#1a4a7a,#2a6db5)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <Fingerprint size={17} style={{ color:"#4ab3d8" }} />
              </div>
              <div>
                <div style={{ fontSize:14,fontWeight:700,color:"#dbeafe" }}>Registrar Ingreso</div>
                <div style={{ fontSize:11,color:"rgba(74,179,216,.5)" }}>Busca por DNI, nombre o apellido</div>
              </div>
            </div>
            {/* Total asistentes de hoy */}
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderRadius:10, background:"rgba(42,109,181,.1)", border:"1px solid rgba(74,179,216,.2)" }}>
              <Users size={16} style={{ color:"#4ab3d8", flexShrink:0 }} />
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(74,179,216,.5)",textTransform:"uppercase",letterSpacing:".08em" }}>Asistentes hoy</div>
                <div style={{ fontSize:20,fontWeight:800,color:"#dbeafe",fontFamily:"'Syne',sans-serif",lineHeight:1.1 }}>{totalHoy}</div>
              </div>
            </div>
          </div>

          {/* Buscador */}
          <div style={{ position:"relative", zIndex:100 }}>
            <div style={{ position:"relative" }}>
              <Search size={15} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"rgba(74,179,216,.5)", pointerEvents:"none" }} />
              <input
                ref={searchRef}
                className="si"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null); }}
                placeholder="Buscar alumno por DNI, nombre o apellido…"
                style={{ ...inp, paddingLeft:38, fontSize:14, animation:"pulse-ring 2.5s ease-in-out infinite", border:"1.5px solid rgba(74,179,216,.25)", borderRadius:11 }}
              />
              {searching && <RefreshCw size={14} style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", color:"rgba(74,179,216,.5)", animation:"spin 1s linear infinite" }} />}
              {query && !searching && <button onClick={() => { setQuery(""); setSelected(null); setResults([]); }} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(74,179,216,.5)", padding:4 }}><X size={14} /></button>}
            </div>

            {/* Dropdown — position:absolute relativo al div padre con position:relative */}
            {results.length > 0 && !selected && (
              <div className="ing-drop">
              {results.map(a => (
                <div key={a.id} className="ing-drop-item" onClick={() => { setSelected(a); setQuery(`${a.nombres} ${a.apellidos}`); setResults([]); }}>
                  <div style={{ width:34,height:34,borderRadius:8,background:"rgba(42,109,181,.15)",border:"1px solid rgba(42,109,181,.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <User size={15} style={{ color:"rgba(74,179,216,.7)" }} />
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:"#dbeafe" }}>{a.nombres} {a.apellidos}</div>
                    <div style={{ fontSize:11,color:"rgba(74,179,216,.55)",marginTop:4 }}>
                      DNI: {a.dni} · <span style={{...carreraBadgeStyle(a.carrera), fontSize:9}}>{a.carrera}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:10,color:"rgba(74,179,216,.4)",flexShrink:0 }}>Seleccionar →</div>
                </div>
              ))}
            </div>
            )}
            {query.trim() && results.length === 0 && !searching && !selected && (
              <div className="ing-drop" style={{ padding:"16px", textAlign:"center", color:"rgba(74,179,216,.4)", fontSize:13 }}>
                No se encontraron alumnos
              </div>
            )}
          </div>

          {/* Alumno seleccionado */}
          {selected && (
            <div style={{ marginTop:14, padding:"14px 16px", borderRadius:12, background:"rgba(42,109,181,.1)", border:"1px solid rgba(74,179,216,.25)", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", animation:"alertIn .25s both" }}>
              <div style={{ width:42,height:42,borderRadius:10,background:"linear-gradient(135deg,#1a4a7a,#2a6db5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <User size={18} style={{ color:"#4ab3d8" }} />
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:14,fontWeight:700,color:"#dbeafe" }}>{selected.nombres} {selected.apellidos}</div>
                <div style={{ fontSize:12,color:"rgba(74,179,216,.6)",marginTop:4,display:"flex",alignItems:"center",gap:6 }}>
                  DNI: <b style={{ color:"#4ab3d8",letterSpacing:".08em" }}>{selected.dni}</b> 
                  <span style={carreraBadgeStyle(selected.carrera)}>{selected.carrera}</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                <button onClick={() => { setSelected(null); setQuery(""); }} style={{ padding:"8px 14px", borderRadius:9, border:"1px solid rgba(42,109,181,.3)", background:"transparent", color:"rgba(74,179,216,.6)", fontSize:12, cursor:"pointer" }}>
                  Cambiar
                </button>
                <button
                  onClick={registrar}
                  disabled={registering}
                  style={{ padding:"8px 20px", borderRadius:9, border:"none", background: registering?"rgba(42,109,181,.2)":"linear-gradient(135deg,#1a4a7a,#2a6db5)", color: registering?"rgba(180,210,240,.4)":"#dbeafe", fontSize:13, fontWeight:700, cursor:registering?"not-allowed":"pointer", display:"flex",alignItems:"center",gap:7, boxShadow:"0 3px 14px rgba(42,109,181,.4)", transition:"background .2s" }}
                >
                  {registering ? <><RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }}/> Registrando…</> : <><UserCheck size={14}/> Registrar Asistencia</>}
                </button>
              </div>
            </div>
          )}

          {/* Mensaje resultado */}
          <AlertDialog
            open={alertInfo.open}
            onClose={() => setAlertInfo(p => ({ ...p, open: false }))}
            message={alertInfo.message}
            type={alertInfo.type}
          />

          {/* Confirmar eliminación */}
          <ConfirmDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            loading={deleting}
            title="¿Eliminar registro de ingreso?"
            description="Esta acción eliminará permanentemente este registro de asistencia. No se puede deshacer."
          >
            {deleteTarget && (
              <p style={{ fontSize: 13, color: "rgba(120,160,210,0.75)", margin: 0 }}>
                Alumno: <strong style={{ color: "#dbeafe" }}>{deleteTarget.alumnos ? `${deleteTarget.alumnos.nombres} ${deleteTarget.alumnos.apellidos}` : "—"}</strong>
                <br />
                Fecha: <span style={{ color: "#4ab3d8" }}>{fmtFecha(deleteTarget.fecha_ingreso)}</span> a las <span style={{ color: "#4ab3d8" }}>{hora12(deleteTarget.hora_ingreso)}</span>
              </p>
            )}
          </ConfirmDialog>
        </div>

        {/* ── REPORTES ── */}
        <div style={{ ...card }}>
          {/* cabecera filtros */}
          <div style={{ padding:"13px 18px", borderBottom:"1px solid rgba(42,109,181,.14)", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <div style={{ display:"flex",alignItems:"center",gap:7,flex:1,minWidth:120 }}>
              <Search size={14} style={{ color:"rgba(74,179,216,.55)" }}/>
              <span style={{ fontSize:13,fontWeight:700,color:"#dbeafe" }}>Reporte de Ingresos</span>
            </div>

            {/* Buscar por DNI */}
            <input className="si" value={fDni} onChange={e=>setFDni(e.target.value)} placeholder="DNI…" style={{ ...inp, width:110, padding:"7px 11px", fontSize:12 }} />
            {/* Buscar por nombre/apellido */}
            <input className="si" value={fNombre} onChange={e=>setFNombre(e.target.value)} placeholder="Nombre o apellido…" style={{ ...inp, width:170, padding:"7px 11px", fontSize:12 }} />

            {/* Rango de fechas */}
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:11, color:"rgba(74,179,216,.5)", whiteSpace:"nowrap" }}>Desde</span>
              <input type="date" className="si" value={fInicio} onChange={e=>setFInicio(e.target.value)} style={{ ...inp, width:140, padding:"7px 10px", fontSize:12, colorScheme:"dark" }} />
              <span style={{ fontSize:11, color:"rgba(74,179,216,.5)", whiteSpace:"nowrap" }}>Hasta</span>
              <input type="date" className="si" value={fFin} onChange={e=>setFFin(e.target.value)} style={{ ...inp, width:140, padding:"7px 10px", fontSize:12, colorScheme:"dark" }} />
            </div>

            {/* Btn limpiar */}
            {(fInicio || fFin) && (
              <button onClick={()=>{setFInicio("");setFFin("");}} style={{ ...inp, width:"auto", padding:"7px 10px", cursor:"pointer", fontSize:11, color:"rgba(74,179,216,.6)", whiteSpace:"nowrap" }}>
                Sin filtro de fecha
              </button>
            )}

            {/* Exportar */}
            <button onClick={exportar} disabled={total===0} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,background:"linear-gradient(135deg,rgba(6,78,59,.7),rgba(52,211,153,.25))",border:"1px solid rgba(52,211,153,.3)",color:"#6ee7b7",fontSize:12,fontWeight:700,cursor:total===0?"not-allowed":"pointer",opacity:total===0?.45:1,whiteSpace:"nowrap" }}>
              <Download size={13}/> Exportar Excel
            </button>
          </div>

          {/* Tabla */}
          <div style={{ overflowX:"auto" }}>
            <table className="ing-tbl" style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th>#</th><th>DNI</th><th>Nombre Completo</th><th>Carrera</th>
                  <th><Clock size={10} style={{ display:"inline",verticalAlign:"middle",marginRight:3 }}/>Hora</th>
                  <th><Clock size={10} style={{ display:"inline",verticalAlign:"middle",marginRight:3, opacity:.5 }}/>Fecha</th>
                  <th style={{ textAlign:"right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign:"center",padding:"40px 0",color:"rgba(74,179,216,.45)" }}>
                    <RefreshCw size={20} style={{ animation:"spin 1s linear infinite",display:"inline-block" }}/>
                    <div style={{ marginTop:8,fontSize:12 }}>Cargando…</div>
                  </td></tr>
                ) : rows.length===0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center",padding:"46px 0",color:"rgba(74,179,216,.28)",fontSize:13 }}>
                    No hay registros para los filtros aplicados
                  </td></tr>
                ) : rows.map((r,i)=>(
                  <tr key={r.id}>
                    <td style={{ color:"rgba(120,160,210,.4)",fontSize:11 }}>{(page-1)*PAGE+i+1}</td>
                    <td><span style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:"#dbeafe",letterSpacing:".06em" }}>{r.dni_alumno}</span></td>
                    <td><span style={{ fontWeight:600,color:"#dbeafe",fontSize:13 }}>{r.alumnos?`${r.alumnos.nombres} ${r.alumnos.apellidos}`:"—"}</span></td>
                    <td><span style={carreraBadgeStyle(r.alumnos?.carrera ?? "")}>{r.alumnos?.carrera??"—"}</span></td>
                    <td>
                      <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                        <div style={{ width:6,height:6,borderRadius:"50%",background:"#4ab3d8",flexShrink:0 }}/>
                        <span style={{ fontWeight:700,color:"#4ab3d8",fontSize:13 }}>{hora12(r.hora_ingreso)}</span>
                      </div>
                    </td>
                    <td style={{ color:"rgba(180,210,240,.6)",fontSize:12 }}>{fmtFecha(r.fecha_ingreso)}</td>
                    <td style={{ textAlign:"right" }}>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="ts-row-action delete"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(248,113,113,0.5)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "7px",
                          width: "28px",
                          height: "28px",
                          transition: "all .18s"
                        }}
                        title="Eliminar ingreso"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages>1 && (
            <div style={{ padding:"11px 18px",borderTop:"1px solid rgba(42,109,181,.1)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap" }}>
              <span style={{ fontSize:12,color:"rgba(74,179,216,.45)" }}>{total} registro{total!==1?"s":""} — pág. {page}/{totalPages}</span>
              <div style={{ display:"flex",gap:4 }}>
                <button className="pg-btn" disabled={page<=1} onClick={()=>{const p=page-1;setPage(p);loadIngresos(p,fDni,fNombre,fInicio,fFin);}}><ChevronLeft size={14}/></button>
                {Array.from({length:totalPages},(_,i)=>i+1)
                  .filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1)
                  .reduce<(number|"…")[]>((acc,p,i,arr)=>{ if(i>0&&arr[i-1]!==p-1)acc.push("…"); acc.push(p); return acc; },[])
                  .map((p,i)=>p==="…"
                    ?<span key={`e${i}`} style={{color:"rgba(74,179,216,.3)",fontSize:13,padding:"0 3px"}}>…</span>
                    :<button key={p} className={`pg-btn${p===page?" ap":""}`} onClick={()=>{setPage(p as number);loadIngresos(p as number,fDni,fNombre,fInicio,fFin);}}><span style={{fontSize:12}}>{p}</span></button>
                  )
                }
                <button className="pg-btn" disabled={page>=totalPages} onClick={()=>{const p=page+1;setPage(p);loadIngresos(p,fDni,fNombre,fInicio,fFin);}}><ChevronRight size={14}/></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
