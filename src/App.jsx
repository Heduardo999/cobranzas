import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, CheckCircle, XCircle, Trash2, PieChart, ArrowUpRight, 
  Filter, Loader2, RefreshCw, Phone, Eye, Info, TrendingUp, User, ShoppingBag, 
  CalendarClock, Fingerprint, Wallet, FileText, Lock, LogOut, Edit2, AlertTriangle, 
  Database, Package, Tag, UserCheck
} from 'lucide-react';

// =============================================================================
// CREDENCIALES DE SUPABASE
// =============================================================================
const supabaseUrl = 'https://pmmcflfhytioomtpcrnb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtbWNmbGZoeXRpb29tdHBjcm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMzM3MzUsImV4cCI6MjA5OTkwOTczNX0.-3DtRI4q5G5zbNu06x0Fxk4HDt5jUu4IG2uEVuGCEV8';
const USE_SUPABASE = true;

// Cliente Supabase global
let supabaseClient = null;

// Función para inicializar el cliente Supabase
const initSupabase = () => {
  if (!USE_SUPABASE) return null;
  
  // Si ya tenemos un cliente, lo devolvemos
  if (supabaseClient) return supabaseClient;
  
  try {
    // Intentar usar el SDK de Supabase desde window
    if (typeof window !== 'undefined' && window.supabase) {
      supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log('✅ Cliente Supabase inicializado correctamente');
      return supabaseClient;
    }
    
    // Si no está disponible, intentar cargar el script dinámicamente
    console.log('⏳ Cargando SDK de Supabase...');
    return null;
  } catch (err) {
    console.error('❌ Error al inicializar Supabase:', err);
    return null;
  }
};

// Función para obtener el cliente, con reintentos
const getSupabaseClient = async (retries = 3) => {
  if (!USE_SUPABASE) return null;
  
  // Si ya tenemos un cliente, devolverlo
  if (supabaseClient) return supabaseClient;
  
  // Intentar inicializar
  const client = initSupabase();
  if (client) return client;
  
  // Si no hay cliente pero estamos en el navegador, esperar a que se cargue el script
  if (typeof window !== 'undefined') {
    // Verificar si el script ya está cargado
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log('✅ Cliente Supabase inicializado correctamente');
      return supabaseClient;
    }
    
    // Si no, esperar y reintentar
    if (retries > 0) {
      console.log(`⏳ Esperando SDK de Supabase... (${retries} reintentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return getSupabaseClient(retries - 1);
    }
  }
  
  console.error('❌ No se pudo inicializar el cliente Supabase');
  return null;
};

// =============================================================================
// SERVICIOS DE DATOS (Híbridos: Supabase / Local de respaldo)
// =============================================================================

const ClientService = {
  getAll: async () => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nombre, ruc_dni, telefono')
          .order('nombre', { ascending: true });
        if (error) throw error;
        console.log('✅ Clientes cargados desde Supabase:', data.length);
        return data;
      } catch (err) {
        console.error("Error al cargar clientes de Supabase:", err);
        return [];
      }
    } else {
      // --- MODO LOCAL DE RESPALDO ---
      console.log('📦 Usando datos locales de clientes');
      return [
        { id: 1, nombre: 'Juan Pérez', ruc_dni: '10456789012', telefono: '987 654 321' },
        { id: 2, nombre: 'Restaurante El Buen Sabor', ruc_dni: '20123456789', telefono: '999 888 777' },
        { id: 3, nombre: 'Bodega La Esquina', ruc_dni: '10987654321', telefono: '955 444 333' }
      ];
    }
  },

  findOrCreate: async (clientName, ruc, phone) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      try {
        const { data: existing, error: findError } = await supabase
          .from('clientes')
          .select('id')
          .ilike('nombre', clientName)
          .maybeSingle();

        if (findError) throw findError;

        if (existing) {
          await supabase
            .from('clientes')
            .update({ ruc_dni: ruc, telefono: phone.replace(/\s/g, '') })
            .eq('id', existing.id);
          return existing.id;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('clientes')
            .insert([{ nombre: clientName, ruc_dni: ruc, telefono: phone.replace(/\s/g, '') }])
            .select('id')
            .single();

          if (insertError) throw insertError;
          return inserted.id;
        }
      } catch (err) {
        console.error("Error en ClientService.findOrCreate:", err);
        throw err;
      }
    }
    return Date.now();
  }
};

const ProductService = {
  getAll: async () => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('id, nombre, precio, descripcion')
          .order('nombre', { ascending: true });
        if (error) throw error;
        console.log('✅ Productos cargados desde Supabase:', data.length);
        return data;
      } catch (err) {
        console.error("Error al cargar productos de Supabase:", err);
        return [];
      }
    } else {
      // --- MODO LOCAL DE RESPALDO ---
      console.log('📦 Usando datos locales de productos');
      return [
        { id: 1, nombre: 'Pollo a la Brasa (Entero)', precio: 68.00, descripcion: 'Incluye papas y ensalada' },
        { id: 2, nombre: '1/2 Pollo a la Brasa', precio: 36.00, descripcion: 'Parte pecho o pierna' },
        { id: 3, nombre: '1/4 Pollo a la Brasa', precio: 19.00, descripcion: 'Personal' },
        { id: 4, nombre: 'Parrillada Mixta', precio: 55.00, descripcion: 'Chuleta, anticucho y pollo' },
        { id: 5, nombre: 'Gaseosa 1.5L', precio: 12.00, descripcion: 'Inca Kola / Coca Cola' },
        { id: 6, nombre: 'Chicha Morada Jarra', precio: 15.00, descripcion: '1 Litro' },
      ];
    }
  }
};

const InvoiceService = {
  getAll: async () => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('ventas')
          .select(`
            id,
            monto_total,
            monto_pagado,
            estado,
            fecha_venta,
            fecha_vencimiento,
            descripcion,
            nombre_producto,
            producto_id,
            cliente_id,
            created_at,
            clientes ( nombre, ruc_dni, telefono )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('✅ Ventas cargadas desde Supabase:', data.length);
        return data.map(v => ({
          id: v.id,
          client: v.clientes?.nombre || 'Desconocido',
          ruc: v.clientes?.ruc_dni || '',
          phone: v.clientes?.telefono || '',
          amount: parseFloat(v.monto_total),
          paidAmount: parseFloat(v.monto_pagado || 0),
          status: v.estado,
          saleDate: v.fecha_venta,
          dueDate: v.fecha_vencimiento,
          description: v.descripcion || '',
          productName: v.nombre_producto || '', 
          productId: v.producto_id,
          clientId: v.cliente_id,
          createdAt: v.created_at
        }));
      } catch (err) {
        console.error("Error al obtener ventas de Supabase:", err);
        return [];
      }
    } else {
      // --- MODO LOCAL DE RESPALDO (LocalStorage) ---
      console.log('📦 Usando datos locales de ventas');
      return new Promise((resolve) => {
        setTimeout(() => {
          const data = localStorage.getItem('pollos_trabuco_data_v3');
          let parsed = data ? JSON.parse(data) : [];
          parsed = parsed.map(inv => ({
            ...inv,
            paidAmount: inv.paidAmount !== undefined ? inv.paidAmount : (inv.status === 'paid' ? inv.amount : 0)
          }));
          resolve(parsed);
        }, 300);
      });
    }
  },

  create: async (invoice) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      try {
        const clientId = await ClientService.findOrCreate(invoice.client, invoice.ruc, invoice.phone);

        const { data, error } = await supabase
          .from('ventas')
          .insert([{
            cliente_id: clientId,
            producto_id: invoice.productId ? parseInt(invoice.productId) : null,
            nombre_producto: invoice.productName,
            descripcion: invoice.description,
            monto_total: parseFloat(invoice.amount),
            monto_pagado: 0,
            estado: 'pending',
            fecha_venta: invoice.saleDate,
            fecha_vencimiento: invoice.dueDate
          }])
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Venta creada en Supabase:', data);
        return data;
      } catch (err) {
        console.error("Error al crear venta en Supabase:", err);
        throw err;
      }
    } else {
      // --- MODO LOCAL ---
      return new Promise((resolve) => {
        const saved = localStorage.getItem('pollos_trabuco_data_v3');
        const current = saved ? JSON.parse(saved) : [];
        const newRecord = { ...invoice, id: Date.now(), createdAt: new Date().toISOString(), paidAmount: 0 };
        localStorage.setItem('pollos_trabuco_data_v3', JSON.stringify([newRecord, ...current]));
        resolve(newRecord);
      });
    }
  },

  update: async (id, updatedData) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      try {
        const clientId = await ClientService.findOrCreate(updatedData.client, updatedData.ruc, updatedData.phone);
        
        const { error } = await supabase
          .from('ventas')
          .update({
            cliente_id: clientId,
            producto_id: updatedData.productId ? parseInt(updatedData.productId) : null,
            nombre_producto: updatedData.productName,
            descripcion: updatedData.description,
            monto_total: parseFloat(updatedData.amount),
            estado: updatedData.status,
            fecha_venta: updatedData.saleDate,
            fecha_vencimiento: updatedData.dueDate
          })
          .eq('id', id);

        if (error) throw error;
        console.log('✅ Venta actualizada en Supabase:', id);
        return { success: true };
      } catch (err) {
        console.error("Error al actualizar venta en Supabase:", err);
        throw err;
      }
    } else {
      const saved = JSON.parse(localStorage.getItem('pollos_trabuco_data_v3') || "[]");
      const updated = saved.map(item => item.id === id ? { ...item, ...updatedData } : item);
      localStorage.setItem('pollos_trabuco_data_v3', JSON.stringify(updated));
      return { success: true };
    }
  },

  updatePayment: async (id, newPaidAmount, newStatus) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('ventas')
          .update({
            monto_pagado: parseFloat(newPaidAmount),
            estado: newStatus
          })
          .eq('id', id);

        if (error) throw error;
        console.log('✅ Pago actualizado en Supabase:', id);
        return { success: true };
      } catch (err) {
        console.error("Error al actualizar abono en Supabase:", err);
        throw err;
      }
    } else {
      const saved = JSON.parse(localStorage.getItem('pollos_trabuco_data_v3') || "[]");
      const updated = saved.map(item => item.id === id ? { ...item, paidAmount: newPaidAmount, status: newStatus } : item);
      localStorage.setItem('pollos_trabuco_data_v3', JSON.stringify(updated));
      return { success: true };
    }
  },

  updateDueDate: async (id, newDueDate) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('ventas')
          .update({ fecha_vencimiento: newDueDate })
          .eq('id', id);

        if (error) throw error;
        console.log('✅ Fecha actualizada en Supabase:', id);
        return { success: true };
      } catch (err) {
        console.error("Error al reprogramar vencimiento en Supabase:", err);
        throw err;
      }
    } else {
      const saved = JSON.parse(localStorage.getItem('pollos_trabuco_data_v3') || "[]");
      const updated = saved.map(item => item.id === id ? { ...item, dueDate: newDueDate } : item);
      localStorage.setItem('pollos_trabuco_data_v3', JSON.stringify(updated));
      return { success: true };
    }
  },

  delete: async (id) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('ventas')
          .delete()
          .eq('id', id);

        if (error) throw error;
        console.log('✅ Venta eliminada de Supabase:', id);
        return true;
      } catch (err) {
        console.error("Error al eliminar venta de Supabase:", err);
        throw err;
      }
    } else {
      const saved = JSON.parse(localStorage.getItem('pollos_trabuco_data_v3') || "[]");
      const filtered = saved.filter(item => item.id !== id);
      localStorage.setItem('pollos_trabuco_data_v3', JSON.stringify(filtered));
      return true;
    }
  }
};

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const supabase = await getSupabaseClient();
    if (supabase) {
      try {
        const { data, error: dbError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('usuario', username.trim().toLowerCase())
          .eq('password', password)
          .maybeSingle();
        
        if (dbError) throw dbError;

        if (data) {
          console.log('✅ Login exitoso:', data.usuario);
          onLogin();
        } else {
          setError("Usuario o contraseña incorrectos en base de datos");
          setPassword(""); 
        }
      } catch (err) {
        console.error("Error en login con Supabase:", err);
        setError("Error de red o conexión con el servidor");
      } finally {
        setLoading(false);
      }
    } else {
      // --- CONTROL LOCAL ---
      setTimeout(() => {
        if (username.trim().toLowerCase() === "jose" && password === "trabuco2024") { 
          onLogin();
        } else {
          setError("Usuario o contraseña incorrectos (Modo Simulación)");
          setPassword(""); 
        }
        setLoading(false);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-5 rounded-2xl text-white shadow-lg">
            <Lock size={40} />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Pollos Trabuco</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Acceso Seguro</p>
          {USE_SUPABASE && <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold uppercase rounded-full px-2 py-0.5 mt-2 inline-block">Nube Activa</span>}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Usuario</label>
            <div className="relative">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-700"
                placeholder="Ingresar usuario"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-700"
                placeholder="••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
              />
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl text-center">
              <span className="flex items-center justify-center gap-2"><AlertTriangle size={14}/> {error}</span>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-xl uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-blue-700 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [supabaseReady, setSupabaseReady] = useState(false);

  // Control de cuadros de diálogo flotantes
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const getToday = () => new Date().toISOString().split('T')[0];
  
  const [newInvoice, setNewInvoice] = useState({
    client: "", description: "", amount: "", saleDate: getToday(), dueDate: "", ruc: "", phone: "", productId: "", productName: ""
  });

  const [formErrors, setFormErrors] = useState({});

  // Cargar SDK dinámico de Supabase
  useEffect(() => {
    if (USE_SUPABASE && typeof window !== 'undefined' && !window.supabase) {
      console.log('📥 Cargando SDK de Supabase desde CDN...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.onload = () => {
        console.log('✅ SDK de Supabase cargado correctamente');
        // Inicializar el cliente después de cargar el SDK
        if (window.supabase) {
          supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
          console.log('✅ Cliente Supabase inicializado correctamente');
          setSupabaseReady(true);
          setRefreshTrigger(prev => prev + 1);
        }
      };
      script.onerror = () => {
        console.error('❌ Error al cargar el SDK de Supabase');
        setSupabaseReady(false);
      };
      document.head.appendChild(script);
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else if (USE_SUPABASE && window.supabase) {
      // Si ya está cargado, inicializar directamente
      supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log('✅ Cliente Supabase inicializado correctamente');
      setSupabaseReady(true);
    } else {
      setSupabaseReady(true); // Modo local
    }
  }, []);

  useEffect(() => {
    const auth = sessionStorage.getItem('pollos_trabuco_auth');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        console.log('🔄 Cargando datos...');
        const [invoicesData, productsData, clientsData] = await Promise.all([
          InvoiceService.getAll(),
          ProductService.getAll(),
          ClientService.getAll()
        ]);
        
        if (isMounted) {
          setInvoices(invoicesData);
          setProducts(productsData);
          setClients(clientsData);
          console.log('✅ Datos cargados correctamente');
        }
      } catch (error) {
        console.error("Error cargando información:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    loadAllData();
    return () => { isMounted = false; };
  }, [refreshTrigger, isAuthenticated, supabaseReady]);

  const handleLogin = () => {
    sessionStorage.setItem('pollos_trabuco_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pollos_trabuco_auth');
    setIsAuthenticated(false);
    setInvoices([]);
    setShowLogoutConfirm(false);
  };

  const formatPhoneDisplay = (val) => {
    if (!val) return "";
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length === 9) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
    return val;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'ruc' && value !== "" && !/^\d+$/.test(value)) return;
    
    if (name === 'client' && value !== "") {
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.\-]*$/;
      if (!nameRegex.test(value)) return;
    }

    let finalValue = value;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (digits.length > 9) return;
      if (digits.length > 6) finalValue = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
      else if (digits.length > 3) finalValue = `${digits.slice(0, 3)} ${digits.slice(3, 6)}`;
      else finalValue = digits;
    }

    let updatedInvoice = { ...newInvoice, [name]: finalValue };

    // Buscar y autocompletar si el cliente ya existe
    if (name === 'client') {
      const matchedClient = clients.find(c => c.nombre.toLowerCase() === finalValue.toLowerCase());
      if (matchedClient) {
        updatedInvoice.ruc = matchedClient.ruc_dni || "";
        updatedInvoice.phone = formatPhoneDisplay(matchedClient.telefono) || "";
        
        const newErrors = { ...formErrors };
        delete newErrors.client;
        delete newErrors.ruc;
        delete newErrors.phone;
        setFormErrors(newErrors);
      }
    }

    setNewInvoice(updatedInvoice);
    
    if (formErrors[name]) {
      const newErrors = { ...formErrors };
      delete newErrors[name];
      setFormErrors(newErrors);
    }
  };

  const handleProductSelect = (e) => {
    const pId = parseInt(e.target.value);
    if (!pId) return;

    const product = products.find(p => p.id === pId);
    if (product) {
      setNewInvoice(prev => ({
        ...prev,
        productId: pId,
        productName: product.nombre,
        description: product.descripcion,
        amount: product.precio.toFixed(2)
      }));
      
      const newErrors = { ...formErrors };
      delete newErrors.productId;
      delete newErrors.description;
      delete newErrors.amount;
      setFormErrors(newErrors);
    }
  };

  const openEditModal = (invoice) => {
    setEditingId(invoice.id);
    setNewInvoice({
      client: invoice.client,
      description: invoice.description,
      amount: invoice.amount.toString(),
      saleDate: invoice.saleDate,
      dueDate: invoice.dueDate,
      ruc: invoice.ruc || "",
      phone: invoice.phone || "",
      productId: invoice.productId || "",
      productName: invoice.productName || ""
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newInvoice.client || !newInvoice.client.trim()) errors.client = "Requerido";
    const rawPhone = newInvoice.phone ? newInvoice.phone.replace(/\s/g, '') : '';
    if (!rawPhone) errors.phone = "Requerido";
    else if (rawPhone.length !== 9) errors.phone = "9 dígitos";
    
    if (!newInvoice.productId && !editingId) errors.productId = "Seleccione producto";
    if (!newInvoice.productId && !newInvoice.productName) errors.productId = "Requerido";

    if (!newInvoice.description || !newInvoice.description.trim()) errors.description = "Requerido";
    if (!newInvoice.amount || parseFloat(newInvoice.amount) <= 0) errors.amount = "Inválido";
    if (!newInvoice.saleDate) errors.saleDate = "Requerido";
    if (!newInvoice.dueDate) errors.dueDate = "Requerido";
    if (newInvoice.ruc && newInvoice.ruc.trim() !== "" && newInvoice.ruc.length !== 11) errors.ruc = "11 dígitos";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const existingInvoice = invoices.find(inv => inv.id === editingId);
        const newTotal = parseFloat(newInvoice.amount);
        let newStatus = existingInvoice.status;
        const paid = existingInvoice.paidAmount || 0;
        if (paid >= newTotal - 0.1) newStatus = 'paid';
        else if (paid > 0) newStatus = 'partial';
        else newStatus = 'pending';

        await InvoiceService.update(editingId, { ...newInvoice, amount: newTotal, status: newStatus });
      } else {
        await InvoiceService.create({ ...newInvoice, amount: parseFloat(newInvoice.amount), status: "pending" });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewInvoice({ client: "", description: "", amount: "", saleDate: getToday(), dueDate: "", ruc: "", phone: "", productId: "", productName: "" });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentData) return;
    const paymentAmount = parseFloat(paymentData.amountToPay);
    if (isNaN(paymentAmount) || paymentAmount <= 0) return;
    const currentPaid = parseFloat(paymentData.invoice.paidAmount || 0);
    const totalAmount = parseFloat(paymentData.invoice.amount);
    const newTotalPaid = currentPaid + paymentAmount;
    
    if (newTotalPaid > totalAmount + 0.1) {
      setPaymentError("El monto excede la deuda.");
      return;
    }
    
    let newStatus = newTotalPaid >= totalAmount - 0.1 ? 'paid' : (newTotalPaid > 0 ? 'partial' : 'pending');
    
    setInvoices(prev => prev.map(inv => inv.id === paymentData.invoice.id ? { ...inv, paidAmount: newTotalPaid, status: newStatus } : inv));
    const targetId = paymentData.invoice.id;
    setPaymentData(null);
    setPaymentError("");
    try {
      await InvoiceService.updatePayment(targetId, newTotalPaid, newStatus);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const executeReschedule = async () => {
    if (!rescheduleData.newDate) return;
    const { id, newDate } = rescheduleData;
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, dueDate: newDate } : inv));
    setRescheduleData(null);
    try {
      await InvoiceService.updateDueDate(id, newDate);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const executeDelete = async (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    setConfirmAction(null);
    try {
      await InvoiceService.delete(id);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount).replace("PEN", "S/");
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.client.toLowerCase().includes(searchTerm.toLowerCase()) || (inv.ruc && inv.ruc.includes(searchTerm));
    const matchesDate = filterDate ? inv.dueDate <= filterDate : true;
    return matchesSearch && matchesDate;
  });

  const totalReceivable = invoices.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const totalCollected = invoices.reduce((acc, curr) => acc + parseFloat(curr.paidAmount || 0), 0);
  const totalPending = totalReceivable - totalCollected;

  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

  // Mostrar indicador de carga mientras se inicializa Supabase
  if (!supabaseReady && USE_SUPABASE) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
          <p className="mt-4 text-slate-600 font-bold">Inicializando conexión con Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 md:pb-8">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
          @page { margin: 1.5cm; size: auto; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Datalist para clientes */}
      <datalist id="client-list">
        {clients.map(client => (
          <option key={client.id} value={client.nombre} />
        ))}
      </datalist>

      {/* Barra de Navegación */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><PieChart size={24} /></div>
            <div>
              <h1 className="text-sm md:text-xl font-bold uppercase leading-none">Pollos Trabuco</h1>
              <span className="text-blue-600 text-[10px] md:text-xs font-black uppercase tracking-widest">Cuentas por cobrar</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => window.print()} title="Imprimir Reporte" className="p-2 text-slate-500 hover:text-blue-600 transition-colors"><FileText size={20} /></button>
             <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-slate-400 hover:text-red-600 transition-colors ml-1"><LogOut size={20} /></button>
             <button onClick={() => { setEditingId(null); setNewInvoice({ client: "", description: "", amount: "", saleDate: getToday(), dueDate: "", ruc: "", phone: "", productId: "", productName: "" }); setIsModalOpen(true); }} className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-md transition-all ml-2">
                <Plus size={18} /> Nueva Cuenta
              </button>
          </div>
        </div>
      </nav>

      {/* Reporte de Impresión */}
      <div id="report-section" className="print-only p-4 bg-white">
        <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Pollos Trabuco</h1>
          <h2 className="text-xl text-slate-600 uppercase tracking-widest mt-2">Reporte de Cuentas por Cobrar</h2>
          <p className="text-sm text-slate-400 mt-2">Fecha: {new Date().toLocaleDateString()}</p>
        </div>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-800">
              <th className="py-3 font-black text-slate-700 uppercase">Cliente</th>
              <th className="py-3 font-black text-slate-700 uppercase">Celular</th>
              <th className="py-3 font-black text-slate-700 uppercase">Vence</th>
              <th className="py-3 text-right font-black text-slate-700 uppercase">Total</th>
              <th className="py-3 text-right font-black text-slate-700 uppercase">Abonado</th>
              <th className="py-3 text-right font-black text-slate-700 uppercase">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {invoices.filter(inv => inv.status !== 'paid').map(inv => (
              <tr key={inv.id} className="border-b border-slate-200">
                <td className="py-3 font-bold text-slate-900">{inv.client}</td>
                <td className="py-3 text-slate-600">{formatPhoneDisplay(inv.phone)}</td>
                <td className="py-3 text-slate-600">{formatDisplayDate(inv.dueDate)}</td>
                <td className="py-3 text-right text-slate-900">{formatCurrency(inv.amount)}</td>
                <td className="py-3 text-right text-emerald-600 font-medium">{formatCurrency(inv.paidAmount || 0)}</td>
                <td className="py-3 text-right font-black text-rose-600">{formatCurrency(inv.amount - (inv.paidAmount || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 flex justify-end"><div className="w-1/3 border-t-2 border-slate-800 pt-4"><div className="flex justify-between items-center mb-2"><span className="text-sm font-bold text-slate-500 uppercase">Total por Cobrar:</span><span className="text-2xl font-black text-slate-900">{formatCurrency(totalPending)}</span></div></div></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 no-print">
        {/* Indicador de conexión de base de datos */}
        <div className="mb-4 flex items-center justify-between bg-white px-4 py-2 border rounded-xl shadow-sm text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider">Base de datos:</span>
          {USE_SUPABASE ? (
            <span className="flex items-center gap-1.5 text-emerald-600 font-black uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Supabase (Nube)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-500 font-black uppercase bg-slate-100 px-2.5 py-1 rounded-full">
              <Database size={12}/> Simulación Local
            </span>
          )}
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
            <h2 className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(totalPending)}</h2>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Recaudado</p>
            <h2 className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalCollected)}</h2>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 shadow-sm text-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total General</p>
            <h2 className="text-2xl font-black mt-1">{formatCurrency(totalReceivable)}</h2>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white p-3 rounded-xl border mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar cliente o RUC..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="date" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm outline-none text-slate-600" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            {filterDate && <button onClick={() => setFilterDate("")} className="bg-red-50 text-red-500 px-3 rounded-lg border border-red-100 transition-colors hover:bg-red-100"><XCircle size={20} /></button>}
          </div>
        </div>

        {/* Tabla de Registros */}
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={36} />
              <p className="font-bold text-sm uppercase tracking-wider">Cargando base de datos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 hidden md:table-header-group">
                  <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Cliente / Info</th>
                    <th className="px-6 py-4">Deuda</th>
                    <th className="px-6 py-4">Vencimiento</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                        <p className="font-bold">No hay registros disponibles</p>
                        <p className="text-xs mt-1">Agrega una nueva cuenta para comenzar</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors flex flex-col md:table-row p-4 md:p-0">
                        <td className="px-6 py-4 md:table-cell">
                          <div className="flex items-center">
                            <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-sm">{inv.client.charAt(0)}</div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-bold text-slate-900 leading-none">{inv.client}</p>
                              <div className="flex gap-2 mt-1.5 flex-wrap">
                                {inv.phone && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Cel: {formatPhoneDisplay(inv.phone)}</span>}
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Venta: {formatDisplayDate(inv.saleDate)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2 md:py-4 md:table-cell">
                          <div className="flex flex-col w-full">
                            <div className="flex justify-between items-end mb-1">
                              <span className="text-xs font-bold text-slate-400 md:hidden">Deuda:</span>
                              <div className="text-right">
                                <span className={`text-sm font-black ${inv.status === 'paid' ? 'text-slate-900' : 'text-rose-600'}`}>{formatCurrency(inv.amount - (inv.paidAmount || 0))}</span>
                                {inv.status !== 'paid' && inv.paidAmount > 0 && <div className="text-[10px] text-emerald-600 font-bold">Abonado: {formatCurrency(inv.paidAmount)}</div>}
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, ((inv.paidAmount || 0) / inv.amount) * 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2 md:py-4 md:table-cell">
                          <div className="flex justify-between md:block">
                            <span className="text-xs font-bold text-slate-400 md:hidden">Vence:</span>
                            <p className={`text-xs font-bold ${new Date(inv.dueDate) < new Date() && inv.status !== 'paid' ? 'text-red-500' : 'text-slate-500'}`}>{formatDisplayDate(inv.dueDate)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-2 md:py-4 md:table-cell text-center">
                          <div className="flex justify-between items-center md:block">
                            <span className="text-xs font-bold text-slate-400 md:hidden">Estado:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : inv.status === 'partial' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                              {inv.status === 'paid' ? 'Pagado' : inv.status === 'partial' ? 'Parcial' : 'Pendiente'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 md:table-cell text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setViewDetail(inv)} className="p-2 text-slate-400 hover:text-indigo-600" title="Ver Detalle"><Eye size={16}/></button>
                            <button onClick={() => openEditModal(inv)} className="p-2 text-slate-400 hover:text-blue-600" title="Editar"><Edit2 size={16}/></button>
                            {inv.status !== 'paid' && (
                              <>
                                <button onClick={() => setRescheduleData({ id: inv.id, client: inv.client, oldDate: inv.dueDate, newDate: inv.dueDate })} className="p-2 text-slate-400 hover:text-amber-600" title="Reprogramar"><CalendarClock size={16}/></button>
                                <button onClick={() => setPaymentData({ invoice: inv, amountToPay: (inv.amount - (inv.paidAmount||0)).toFixed(2) })} className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100" title="Cobrar/Abonar"><CheckCircle size={16}/></button>
                              </>
                            )}
                            <button onClick={() => setConfirmAction({ type: 'delete', data: inv })} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Botón flotante para móviles */}
      <button onClick={() => { setEditingId(null); setNewInvoice({ client: "", description: "", amount: "", saleDate: getToday(), dueDate: "", ruc: "", phone: "", productId: "", productName: "" }); setIsModalOpen(true); }} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center md:hidden no-print"><Plus size={28}/></button>

      {/* Modal Nuevo / Editar Registro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{editingId ? 'Editar Registro' : 'Nuevo Registro'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Selector de Productos */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Producto <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none appearance-none bg-white ${formErrors.productId ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-200'}`}
                    onChange={handleProductSelect}
                    value={newInvoice.productId || ""}
                  >
                    <option value="" disabled>Seleccione un producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} - S/ {p.precio.toFixed(2)}</option>
                    ))}
                  </select>
                </div>
                {formErrors.productId && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.productId}</p>}
              </div>

              {/* Autocompletar Cliente */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Cliente <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    name="client" 
                    list="client-list" 
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none ${formErrors.client ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-200'}`}
                    placeholder="Buscar o ingresar nuevo"
                    value={newInvoice.client} 
                    onChange={handleInputChange} 
                    autoComplete="off"
                  />
                </div>
                {formErrors.client && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.client}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">RUC (11 dígitos)</label>
                  <input 
                    name="ruc" 
                    maxLength="11" 
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none ${formErrors.ruc ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-200'}`} 
                    value={newInvoice.ruc} 
                    onChange={handleInputChange} 
                  />
                  {formErrors.ruc && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.ruc}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Celular <span className="text-red-500">*</span></label>
                  <input 
                    name="phone" 
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none ${formErrors.phone ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-200'}`} 
                    value={newInvoice.phone} 
                    onChange={handleInputChange} 
                  />
                  {formErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Fecha Venta <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="saleDate" 
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none ${formErrors.saleDate ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-200'}`} 
                  value={newInvoice.saleDate} 
                  onChange={handleInputChange} 
                />
                {formErrors.saleDate && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.saleDate}</p>}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Descripción <span className="text-red-500">*</span></label>
                <textarea 
                  name="description" 
                  rows="2" 
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm resize-none outline-none ${formErrors.description ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-200'}`} 
                  value={newInvoice.description} 
                  onChange={handleInputChange}
                ></textarea>
                {formErrors.description && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Monto (S/) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    name="amount" 
                    step="0.01" 
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm font-bold outline-none ${formErrors.amount ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-200'}`} 
                    value={newInvoice.amount} 
                    onChange={handleInputChange} 
                  />
                  {formErrors.amount && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.amount}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Vencimiento <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="dueDate" 
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none ${formErrors.dueDate ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-200'}`} 
                    value={newInvoice.dueDate} 
                    onChange={handleInputChange} 
                  />
                  {formErrors.dueDate && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.dueDate}</p>}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-3 bg-blue-600 text-white font-black rounded-xl uppercase tracking-widest text-xs mt-2 shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="animate-spin" size={14} />}
                {editingId ? 'Guardar Cambios' : 'Registrar Cobro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pagos (Abonar) */}
      {paymentData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl p-6">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Abonar</h3>
            <div className="bg-slate-50 p-3 rounded-xl mb-4 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Restante</p>
              <p className="text-xl font-black text-rose-600">{formatCurrency(paymentData.invoice.amount - (paymentData.invoice.paidAmount || 0))}</p>
            </div>
            
            {paymentError && (
              <div className="p-3 mb-4 bg-red-50 text-red-500 text-xs font-bold rounded-xl text-center">
                {paymentError}
              </div>
            )}

            <input 
              type="number" 
              step="0.01" 
              className="w-full p-3 border rounded-xl text-lg font-bold text-center mb-6 outline-none" 
              value={paymentData.amountToPay} 
              onChange={(e) => {
                setPaymentData({...paymentData, amountToPay: e.target.value});
                setPaymentError("");
              }} 
            />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setPaymentData(null); setPaymentError(""); }} className="py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-200">Cancelar</button>
              <button onClick={handlePaymentSubmit} className="py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-md hover:bg-emerald-700">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reprogramar */}
      {rescheduleData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl p-6">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Reprogramar</h3>
            <input type="date" className="w-full p-3 border rounded-xl text-sm mb-6" value={rescheduleData.newDate} onChange={(e) => setRescheduleData({...rescheduleData, newDate: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setRescheduleData(null)} className="py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-200">Cancelar</button>
              <button onClick={executeReschedule} className="py-3 bg-amber-600 text-white rounded-xl font-black text-xs uppercase shadow-md hover:bg-amber-700">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle (Ojito) */}
      {viewDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User size={20}/></div>
              <p className="font-black text-slate-800 uppercase tracking-widest text-xs">{viewDetail.client}</p>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">RUC</span><span className="text-xs font-bold">{viewDetail.ruc || '-'}</span></div>
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">F. Venta</span><span className="text-xs font-bold">{formatDisplayDate(viewDetail.saleDate)}</span></div>
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Celular</span><span className="text-xs font-bold">{formatPhoneDisplay(viewDetail.phone)}</span></div>
              
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Package size={10}/> Producto</p>
                  <p className="text-sm font-bold text-slate-700">{viewDetail.productName || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Info size={10}/> Descripción</p>
                  <p className="text-xs text-slate-600 italic leading-relaxed">{viewDetail.description}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setViewDetail(null)} className="w-full mt-6 py-3 bg-slate-800 text-white font-black rounded-xl text-[10px] uppercase tracking-widest">Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24}/></div>
            <p className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-tight">¿Eliminar registro?</p>
            <p className="text-xs text-slate-400 mb-6">Esta acción es irreversible y borrará el cobro de la base de datos.</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmAction(null)} className="py-2.5 bg-slate-100 text-slate-500 rounded-lg font-bold text-xs uppercase hover:bg-slate-200">No</button>
              <button onClick={() => executeDelete(confirmAction.data.id)} className="py-2.5 bg-red-500 text-white rounded-lg font-black text-xs uppercase hover:bg-red-600">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Cerrar Sesión */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"><LogOut size={24}/></div>
            <p className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-tight">¿Cerrar Sesión?</p>
            <p className="text-xs text-slate-400 mb-6">Se cerrará tu sesión de trabajo actual de manera segura.</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-2.5 bg-slate-100 text-slate-500 rounded-lg font-bold text-xs uppercase hover:bg-slate-200">No</button>
              <button onClick={handleLogout} className="py-2.5 bg-blue-600 text-white rounded-lg font-black text-xs uppercase hover:bg-blue-700">Sí, salir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}