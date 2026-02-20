// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   LayoutDashboard,
//   Package,
//   Component,
//   ShoppingCart,
//   Plus,
//   Trash2,
//   AlertCircle,
//   CheckCircle2,
//   XCircle,
//   ChevronRight,
//   Search,
//   Settings,
//   Users,
//   X,
//   TrendingUp,
//   Box,
//   AlertTriangle,
//   ArrowRight,
//   PenSquare,
//   BarChart3,
//   ChevronLeft,
//   Database,
//   History,
//   Edit3,
//   Lock,
//   Unlock,
//   Cloud
// } from 'lucide-react';

// // --- FIREBASE IMPORTS ---
// import { initializeApp } from 'firebase/app';
// import {
//   getFirestore,
//   collection,
//   doc,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   onSnapshot,
//   query,
//   orderBy
// } from 'firebase/firestore';
// import {
//   signInAnonymously,
//   signInWithEmailAndPassword,
//   onAuthStateChanged
// } from "firebase/auth";

// // --- FIREBASE SETUP ---
// // FIXED: Removed duplicate import. Kept only this one.
// import { auth, db } from "./firebase";

// // --- CONFIGURATION ---
// // FIXED: Added missing appId. Using a generic name for now.
// const appId = "crm_prod_v1"; 
// // FIXED: Added missing adminPassword variable used in login
// const adminPassword = "password123"; 

// // --- INITIAL STATE ---
// const INITIAL_PARTS = [];
// const INITIAL_PRODUCTS = [];
// const INITIAL_RECIPES = [];
// const INITIAL_ORDERS = [];
// const INITIAL_TRASH = [];

// export default function App() {
//   // --- STATE ---
//   const [user, setUser] = useState(null);
//   const [authLoading, setAuthLoading] = useState(true);
//   const [isAdmin, setIsAdmin] = useState(false); // Toggle for Admin/Viewer mode
//   const [adminPin, setAdminPin] = useState('');
//   const [showAdminLogin, setShowAdminLogin] = useState(false);

//   const [activeTab, setActiveTab] = useState('dashboard');

//   // Data State (Managed by Firestore Listeners)
//   const [parts, setParts] = useState(INITIAL_PARTS);
//   const [products, setProducts] = useState(INITIAL_PRODUCTS);
//   const [recipes, setRecipes] = useState(INITIAL_RECIPES);
//   const [orders, setOrders] = useState(INITIAL_ORDERS);
//   const [trash, setTrash] = useState(INITIAL_TRASH);

//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);

//   // Modals & Forms State
//   const [showAddPart, setShowAddPart] = useState(false);
//   const [showAddProduct, setShowAddProduct] = useState(false);
//   const [showAddOrder, setShowAddOrder] = useState(false);
//   const [showEditOrder, setShowEditOrder] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [editingOrder, setEditingOrder] = useState(null);

//   // Order Form State
//   const [orderType, setOrderType] = useState('product');

//   // Temporary state for building a recipe while creating a product
//   const [newProductRecipe, setNewProductRecipe] = useState([]);

//   // Delete & Adjust Confirmation State
//   const [deleteConfig, setDeleteConfig] = useState(null);
//   const [adjustConfig, setAdjustConfig] = useState(null);

//   // Sales Dashboard State
//   const [salesView, setSalesView] = useState('year');
//   const [salesFilter, setSalesFilter] = useState('all');
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [selectedMonth, setSelectedMonth] = useState(null);
//   const [selectedDate, setSelectedDate] = useState(null);

//   // --- AUTHENTICATION ---
//   useEffect(() => {
//     // Attempt anonymous sign-in so we can read data
//     signInAnonymously(auth).catch(err => console.error("Auth error:", err));

//     const unsubscribe = onAuthStateChanged(auth, (u) => {
//       setUser(u);
//       setAuthLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);


//   // --- FIRESTORE LISTENERS ---
//   useEffect(() => {
//     if (!user) return;


//     // Helper to setup listener
//     const setupListener = (colName, setter) => {
//       // NOTE: We are using appId here to separate data
//       const q = query(collection(db, 'artifacts', appId, 'public', 'data', colName));

//       return onSnapshot(
//         q,
//         (snapshot) => {
//           const data = snapshot.docs.map((doc) => ({
//             id: doc.id,
//             ...doc.data(),
//           }));
//           setter(data);
//         },
//         (error) => {
//           console.error(`Error fetching ${colName}:`, error);
//         }
//       );
//     };

//     const unsubParts = setupListener("parts", setParts);
//     const unsubProducts = setupListener("products", setProducts);
//     const unsubRecipes = setupListener("recipes", setRecipes);
//     const unsubOrders = setupListener("orders", setOrders);
//     const unsubTrash = setupListener("trash", setTrash);

//     return () => {
//       unsubParts();
//       unsubProducts();
//       unsubRecipes();
//       unsubOrders();
//       unsubTrash();
//     };
//   }, [user]);

//   // --- LOGIC: CALCULATE INVENTORY ---
//   const getProductAvailability = (prodId) => {
//     // Note: In Firestore, IDs are strings. 
//     const prodRecipe = recipes.filter(r => r.productId === prodId);
//     if (prodRecipe.length === 0) return { count: 0, status: 'No Parts Linked', isBuildable: false, limitingPart: null };

//     let maxBuildable = Infinity;
//     let limitingPart = null;

//     prodRecipe.forEach(item => {
//       const part = parts.find(p => p.id === item.partId);
//       if (!part) return;

//       const possibleWithThisPart = Math.floor(part.stock / item.quantity);
//       if (possibleWithThisPart < maxBuildable) {
//         maxBuildable = possibleWithThisPart;
//         limitingPart = part;
//       }
//     });

//     if (maxBuildable === Infinity) maxBuildable = 0;

//     return {
//       count: maxBuildable,
//       status: maxBuildable > 0 ? 'Complete' : 'Incomplete',
//       isBuildable: maxBuildable > 0,
//       limitingPart: maxBuildable === 0 ? limitingPart : null
//     };
//   };

//   const getMissingComponents = (prodId) => {
//     const prodRecipe = recipes.filter(r => r.productId === prodId);
//     const missing = [];
//     prodRecipe.forEach(item => {
//       const part = parts.find(p => p.id === item.partId);
//       if (part && part.stock < item.quantity) {
//         missing.push({
//           name: part.name,
//           required: item.quantity,
//           available: part.stock,
//           deficit: item.quantity - part.stock
//         });
//       }
//     });
//     return missing;
//   };

//   // --- SALES ANALYTICS LOGIC ---
//   const getSalesData = () => {
//     const filteredOrders = orders.filter(order => {
//       if (salesFilter === 'all') return true;
//       return order.items.some(item => item.type === salesFilter);
//     });

//     const byYear = {};
//     filteredOrders.forEach(order => {
//       const y = order.date.split('-')[0];
//       if (!byYear[y]) byYear[y] = 0;
//       byYear[y] += order.total;
//     });

//     const byMonth = Array(12).fill(0);
//     filteredOrders.forEach(order => {
//       const [y, m] = order.date.split('-');
//       if (parseInt(y) === selectedYear) {
//         byMonth[parseInt(m) - 1] += order.total;
//       }
//     });

//     const byDay = {};
//     if (selectedMonth !== null) {
//       filteredOrders.forEach(order => {
//         const [y, m, d] = order.date.split('-');
//         if (parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1) {
//           const dateKey = order.date;
//           if (!byDay[dateKey]) byDay[dateKey] = { total: 0, orders: [] };
//           byDay[dateKey].total += order.total;
//           byDay[dateKey].orders.push(order);
//         }
//       });
//     }
//     return { byYear, byMonth, byDay };
//   };

//   const salesData = useMemo(() => getSalesData(), [orders, selectedYear, selectedMonth, salesFilter]);
//   const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

//   // --- ACTIONS (FIRESTORE) ---
//   const handleAdminLogin = async (e) => {
//     e.preventDefault();
//     try {
//       // NOTE: This assumes you have an email/pass user set up in Firebase Console
//       // using adminPin as email (if it's an email format) or you need to adjust this logic.
//       // For now, assuming adminPin is the email.
//       await signInWithEmailAndPassword(auth, adminPin, adminPassword);
//       setIsAdmin(true);
//       setShowAdminLogin(false);
//     } catch (err) {
//       console.error(err);
//       alert("Invalid admin credentials");
//     }
//   };

//   const handleAddPart = async (e) => {
//     e.preventDefault();
//     if (!isAdmin) return;
//     const formData = new FormData(e.target);
//     const newPart = {
//       name: formData.get('name'),
//       sku: formData.get('sku'),
//       stock: parseInt(formData.get('stock')),
//       minStock: parseInt(formData.get('minStock')),
//       cost: parseFloat(formData.get('cost')),
//     };
//     await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parts'), newPart);
//     setShowAddPart(false);
//   };

//   const handleUpdateStock = async (partId, delta) => {
//     if (!isAdmin) return;
//     const part = parts.find(p => p.id === partId);
//     if (part) {
//       const newStock = Math.max(0, part.stock + delta);
//       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', partId), { stock: newStock });
//     }
//   };

//   const handleStockAdjustment = async (e) => {
//     e.preventDefault();
//     if (!isAdmin) return;
//     const formData = new FormData(e.target);
//     const adjustmentType = formData.get('type');
//     const amount = parseInt(formData.get('amount'));

//     if (isNaN(amount) || amount < 0) return;

//     const part = parts.find(p => p.id === adjustConfig.id);
//     if (part) {
//       let newStock = part.stock;
//       if (adjustmentType === 'add') newStock += amount;
//       else if (adjustmentType === 'remove') newStock = Math.max(0, newStock - amount);
//       else if (adjustmentType === 'set') newStock = amount;

//       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), { stock: newStock });
//     }
//     setAdjustConfig(null);
//   };

//   const handleAddProduct = async (e) => {
//     e.preventDefault();
//     if (!isAdmin) return;
//     const formData = new FormData(e.target);

//     // Add Product Doc
//     const productRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {
//       name: formData.get('name'),
//       sku: formData.get('sku'),
//       price: parseFloat(formData.get('price')),
//       description: formData.get('description')
//     });

//     // Add Recipe Docs
//     const batchPromises = newProductRecipe.map(item =>
//       addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'recipes'), {
//         productId: productRef.id,
//         partId: item.partId,
//         quantity: item.quantity
//       })
//     );
//     await Promise.all(batchPromises);

//     setNewProductRecipe([]);
//     setShowAddProduct(false);
//   };

//   const handleAddToRecipeDraft = () => {
//     const partSelect = document.getElementById('newProdPart');
//     const qtyInput = document.getElementById('newProdQty');
//     const partId = partSelect.value; // ID is string in Firestore
//     const quantity = parseFloat(qtyInput.value);

//     if (partId && quantity > 0) {
//       if (newProductRecipe.some(p => p.partId === partId)) {
//         alert("Part already added to recipe");
//         return;
//       }
//       const partName = parts.find(p => p.id === partId).name;
//       setNewProductRecipe([...newProductRecipe, { partId, name: partName, quantity }]);
//       qtyInput.value = 1;
//     }
//   };

//   const handleRemoveFromRecipeDraft = (partId) => {
//     setNewProductRecipe(newProductRecipe.filter(p => p.partId !== partId));
//   };

//   const handleRemoveLink = async (productId, partId) => {
//     if (!isAdmin) return;
//     // Find the recipe doc to delete
//     const recipe = recipes.find(r => r.productId === productId && r.partId === partId);
//     if (recipe) {
//       await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recipes', recipe.id));
//     }
//   };

//   const handleDeletePart = (partId) => {
//     if (!isAdmin) return;
//     const part = parts.find(p => p.id === partId);
//     if (part) setDeleteConfig({ type: 'part', id: partId, name: part.name, data: part });
//   };

//   const handleDeleteProduct = (productId) => {
//     if (!isAdmin) return;
//     const prod = products.find(p => p.id === productId);
//     if (prod) setDeleteConfig({ type: 'product', id: productId, name: prod.name, data: prod });
//   };

//   const handleDeleteOrder = (orderId) => {
//     if (!isAdmin) return;
//     const order = orders.find(o => o.id === orderId);
//     if (order) setDeleteConfig({ type: 'order', id: orderId, name: `Order`, data: order });
//   };

//   const executeDelete = async () => {
//     if (!isAdmin || !deleteConfig) return;

//     const timestamp = new Date().toLocaleString();
//     await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'trash'), {
//       ...deleteConfig.data,
//       deletedAt: timestamp,
//       itemType: deleteConfig.type,
//       originalId: deleteConfig.id
//     });

//     if (deleteConfig.type === 'part') {
//       await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', deleteConfig.id));
//       // Cleanup recipes optional but good practice
//       const relatedRecipes = recipes.filter(r => r.partId === deleteConfig.id);
//       await Promise.all(relatedRecipes.map(r => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recipes', r.id))));

//     } else if (deleteConfig.type === 'product') {
//       await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', deleteConfig.id));
//       const relatedRecipes = recipes.filter(r => r.productId === deleteConfig.id);
//       await Promise.all(relatedRecipes.map(r => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recipes', r.id))));
//       if (selectedProduct?.id === deleteConfig.id) setSelectedProduct(null);

//     } else if (deleteConfig.type === 'order') {
//       await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', deleteConfig.id));

//       const returnStock = document.getElementById('returnStockCheckbox')?.checked;
//       if (returnStock) {
//         const order = deleteConfig.data;
//         // Process stock return sequentially
//         for (const item of order.items) {
//           if (item.type === 'product') {
//             // In firestore context, matching by name is risky if name changed, but we stored name. 
//             // Ideally we store ID. Let's assume name match for demo continuity or use itemId if available.
//             const product = products.find(p => p.id === item.itemId); // Use ID if available
//             if (product) {
//               const prodRecipe = recipes.filter(r => r.productId === product.id);
//               for (const r of prodRecipe) {
//                 const part = parts.find(p => p.id === r.partId);
//                 if (part) {
//                   await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), {
//                     stock: part.stock + (r.quantity * item.qty)
//                   });
//                 }
//               }
//             }
//           } else {
//             const part = parts.find(p => p.id === item.itemId);
//             if (part) {
//               await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), {
//                 stock: part.stock + item.qty
//               });
//             }
//           }
//         }
//       }
//     }
//     setDeleteConfig(null);
//   };

//   const handleCreateOrder = async (e) => {
//     e.preventDefault();
//     if (!isAdmin) return;
//     const formData = new FormData(e.target);
//     const type = orderType;
//     const itemId = formData.get('itemId'); // ID is string
//     const qty = parseInt(formData.get('quantity'));
//     const customer = formData.get('customer');

//     let total = 0;
//     let itemName = '';

//     if (type === 'product') {
//       const product = products.find(p => p.id === itemId);
//       const availability = getProductAvailability(itemId);

//       if (availability.count < qty) {
//         alert(`Cannot fulfill order! Only ${availability.count} ${product.name}s available.`);
//         return;
//       }

//       // Deduct Stock
//       const prodRecipe = recipes.filter(r => r.productId === itemId);
//       for (const r of prodRecipe) {
//         const part = parts.find(p => p.id === r.partId);
//         if (part) {
//           await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), {
//             stock: part.stock - (r.quantity * qty)
//           });
//         }
//       }
//       total = product.price * qty;
//       itemName = product.name;
//     } else {
//       const part = parts.find(p => p.id === itemId);
//       if (part.stock < qty) {
//         alert(`Insufficient stock! Only ${part.stock} ${part.name} available.`);
//         return;
//       }
//       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), {
//         stock: part.stock - qty
//       });
//       const unitPrice = part.cost * 1.5;
//       total = unitPrice * qty;
//       itemName = part.name;
//     }

//     const today = new Date().toISOString().split('T')[0];
//     await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), {
//       customer,
//       date: today,
//       total: total,
//       status: 'Completed',
//       items: [{ name: itemName, type: type, qty: qty, itemId: itemId }]
//     });
//     setShowAddOrder(false);
//   };

//   const handleSaveEditOrder = async (e) => {
//     e.preventDefault();
//     if (!isAdmin) return;
//     const formData = new FormData(e.target);
//     const newCustomer = formData.get('customer');
//     const newDate = formData.get('date');
//     const newTotal = parseFloat(formData.get('total'));
//     const newQty = parseInt(formData.get('quantity'));

//     const oldOrder = editingOrder;
//     const oldItem = oldOrder.items[0];
//     const qtyDiff = newQty - oldItem.qty;

//     if (qtyDiff !== 0) {
//       if (oldItem.type === 'product') {
//         const product = products.find(p => p.id === oldItem.itemId);
//         if (product) {
//           const prodRecipe = recipes.filter(r => r.productId === product.id);

//           if (qtyDiff > 0) {
//             const avail = getProductAvailability(product.id);
//             if (avail.count < qtyDiff) {
//               alert(`Cannot increase quantity by ${qtyDiff}. Only ${avail.count} sets available.`);
//               return;
//             }
//           }

//           for (const r of prodRecipe) {
//             const part = parts.find(p => p.id === r.partId);
//             if (part) {
//               await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), {
//                 stock: part.stock - (r.quantity * qtyDiff)
//               });
//             }
//           }
//         }
//       } else {
//         const part = parts.find(p => p.id === oldItem.itemId);
//         if (part) {
//           if (qtyDiff > 0 && part.stock < qtyDiff) {
//             alert(`Insufficient stock to increase quantity.`);
//             return;
//           }
//           await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), {
//             stock: part.stock - qtyDiff
//           });
//         }
//       }
//     }

//     await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', editingOrder.id), {
//       customer: newCustomer,
//       date: newDate,
//       total: newTotal,
//       editedAt: new Date().toLocaleString(),
//       items: [{ ...oldItem, qty: newQty }]
//     });

//     setEditingOrder(null);
//     setShowEditOrder(false);
//   };

//   // --- SUB-COMPONENTS ---
//   const SidebarItem = ({ id, icon: Icon, label }) => (
//     <button
//       onClick={() => { setActiveTab(id); setSelectedProduct(null); }}
//       className={`w-full flex items-center space-x-3 px-6 py-4 transition-colors ${activeTab === id
//           ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
//           : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
//         }`}
//     >
//       <Icon size={20} />
//       <span className="font-medium">{label}</span>
//     </button>
//   );

//   const StatusBadge = ({ status }) => {
//     const styles = {
//       'Complete': 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
//       'Incomplete': 'bg-rose-100 text-rose-700 ring-rose-600/20',
//       'No Parts Linked': 'bg-slate-100 text-slate-700 ring-slate-600/20',
//       'Completed': 'bg-blue-100 text-blue-700 ring-blue-600/20',
//       'Pending': 'bg-amber-100 text-amber-700 ring-amber-600/20',
//     };
//     const Icon = status === 'Complete' || status === 'Completed' ? CheckCircle2 : status === 'Pending' ? AlertCircle : XCircle;
//     return (
//       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${styles[status] || styles['No Parts Linked']}`}>
//         <Icon size={12} />
//         {status}
//       </span>
//     );
//   };

//   // --- VIEWS ---
//   const SalesAnalyticsWidget = () => {
//     return (
//       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
//         <div className="px-6 py-5 border-b border-slate-100">
//           <div className="flex justify-between items-center mb-4">
//             <div>
//               <h3 className="font-semibold text-slate-900 flex items-center gap-2">
//                 <BarChart3 size={18} className="text-blue-600" />
//                 Sales Analytics
//               </h3>
//               <p className="text-xs text-slate-500 mt-0.5">
//                 {salesView === 'year' && `Yearly Performance (${selectedYear})`}
//                 {salesView === 'month' && `${monthNames[selectedMonth]} ${selectedYear} Breakdown`}
//                 {salesView === 'day' && `Details for ${selectedDate}`}
//               </p>
//             </div>
//             {salesView !== 'year' && (
//               <button
//                 onClick={() => {
//                   if (salesView === 'day') setSalesView('month');
//                   else setSalesView('year');
//                 }}
//                 className="text-xs bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md text-slate-600 font-medium flex items-center gap-1"
//               >
//                 <ChevronLeft size={14} /> Back
//               </button>
//             )}
//           </div>
//           <div className="flex gap-2 text-xs">
//             {['all', 'product', 'part'].map(type => (
//               <button
//                 key={type}
//                 onClick={() => setSalesFilter(type)}
//                 className={`px-3 py-1.5 rounded-full capitalize font-medium transition-colors ${salesFilter === type
//                     ? 'bg-slate-900 text-white'
//                     : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//                   }`}
//               >
//                 {type === 'all' ? 'All Sales' : `${type}s Only`}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="p-6 flex-1 overflow-auto">
//           {salesView === 'year' && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
//                 {salesData.byMonth.map((total, idx) => (
//                   <button
//                     key={idx}
//                     onClick={() => { setSelectedMonth(idx); setSalesView('month'); }}
//                     className={`p-4 rounded-xl border text-left transition-all ${total > 0
//                         ? 'bg-blue-50 border-blue-200 hover:shadow-md hover:border-blue-400'
//                         : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100'
//                       }`}
//                   >
//                     <span className="text-xs font-bold text-slate-500 uppercase block mb-1">{monthNames[idx]}</span>
//                     <span className={`text-lg font-bold ${total > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
//                       ${total.toLocaleString()}
//                     </span>
//                   </button>
//                 ))}
//               </div>
//               <p className="text-xs text-center text-slate-400 mt-4">Select a month to view daily breakdown</p>
//             </div>
//           )}
//           {salesView === 'month' && (
//             <div className="space-y-4">
//               <div className="space-y-2">
//                 {Object.keys(salesData.byDay).sort().map(dateStr => {
//                   const dayData = salesData.byDay[dateStr];
//                   return (
//                     <button
//                       key={dateStr}
//                       onClick={() => { setSelectedDate(dateStr); setSalesView('day'); }}
//                       className="w-full flex justify-between items-center p-3 hover:bg-blue-50 rounded-lg group transition-colors border border-transparent hover:border-blue-100"
//                     >
//                       <div className="flex items-center gap-3">
//                         <div className="bg-blue-100 text-blue-700 font-bold text-xs p-2 rounded-md w-12 text-center">
//                           {dateStr.split('-')[2]}
//                         </div>
//                         <span className="text-sm font-medium text-slate-700">{dateStr}</span>
//                       </div>
//                       <div className="flex items-center gap-4">
//                         <span className="text-xs text-slate-400">{dayData.orders.length} orders</span>
//                         <span className="text-sm font-bold text-slate-900">${dayData.total.toFixed(2)}</span>
//                         <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
//                       </div>
//                     </button>
//                   );
//                 })}
//                 {Object.keys(salesData.byDay).length === 0 && (
//                   <div className="text-center py-10 text-slate-400">No {salesFilter === 'all' ? '' : salesFilter} sales recorded for this month.</div>
//                 )}
//               </div>
//             </div>
//           )}
//           {salesView === 'day' && salesData.byDay[selectedDate] && (
//             <div className="space-y-3">
//               <table className="w-full text-left text-sm text-slate-600">
//                 <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
//                   <tr>
//                     <th className="px-4 py-2">Customer</th>
//                     <th className="px-4 py-2">Items</th>
//                     <th className="px-4 py-2 text-right">Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {salesData.byDay[selectedDate].orders.map(order => (
//                     <tr key={order.id}>
//                       <td className="px-4 py-3 font-medium text-slate-900">{order.customer}</td>
//                       <td className="px-4 py-3">
//                         {order.items.map((i, idx) => (
//                           <div key={idx} className="flex items-center gap-2">
//                             <span className={`w-1.5 h-1.5 rounded-full ${i.type === 'product' ? 'bg-indigo-500' : 'bg-orange-500'}`}></span>
//                             <span className="text-xs text-slate-500">{i.qty}x {i.name}</span>
//                           </div>
//                         ))}
//                       </td>
//                       <td className="px-4 py-3 text-right font-mono">${order.total.toFixed(2)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//               <div className="border-t border-slate-100 pt-3 text-right">
//                 <span className="text-sm font-bold text-slate-900">Total: ${salesData.byDay[selectedDate].total.toFixed(2)}</span>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   const DashboardView = () => {
//     const totalStockValue = parts.reduce((acc, p) => acc + (p.stock * p.cost), 0);
//     const lowStockCount = parts.filter(p => p.stock < p.minStock).length;
//     const readyProductsCount = products.filter(p => getProductAvailability(p.id).isBuildable).length;

//     return (
//       <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm font-medium text-slate-500">Total Inventory Value</p>
//                 <h3 className="text-2xl font-bold text-slate-900 mt-2">${totalStockValue.toLocaleString()}</h3>
//               </div>
//               <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
//                 <TrendingUp size={20} />
//               </div>
//             </div>
//           </div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm font-medium text-slate-500">Ready to Build</p>
//                 <h3 className="text-2xl font-bold text-slate-900 mt-2">{readyProductsCount} <span className="text-sm text-slate-400 font-normal">Products</span></h3>
//               </div>
//               <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
//                 <Package size={20} />
//               </div>
//             </div>
//           </div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm font-medium text-slate-500">Low Stock Parts</p>
//                 <h3 className="text-2xl font-bold text-slate-900 mt-2">{lowStockCount} <span className="text-sm text-slate-400 font-normal">Items</span></h3>
//               </div>
//               <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
//                 <AlertCircle size={20} />
//               </div>
//             </div>
//           </div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm font-medium text-slate-500">Total Orders</p>
//                 <h3 className="text-2xl font-bold text-slate-900 mt-2">{orders.length}</h3>
//               </div>
//               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
//                 <ShoppingCart size={20} />
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
//           <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
//             <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//               <div>
//                 <h3 className="font-semibold text-slate-900">Production Readiness Overview</h3>
//                 <p className="text-xs text-slate-500 mt-0.5">Real-time assembly capability based on current stock</p>
//               </div>
//               <button onClick={() => setActiveTab('products')} className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
//                 Manage Details <ArrowRight size={14} />
//               </button>
//             </div>
//             <div className="overflow-auto flex-1">
//               {products.length === 0 ? (
//                 <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
//                   <Package size={48} className="mb-2 opacity-50" />
//                   <p>No products defined yet.</p>
//                 </div>
//               ) : (
//                 <table className="w-full text-left text-sm text-slate-600">
//                   <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
//                     <tr>
//                       <th className="px-6 py-3">Product</th>
//                       <th className="px-6 py-3">Availability</th>
//                       <th className="px-6 py-3">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100">
//                     {products.map(product => {
//                       const avail = getProductAvailability(product.id);
//                       const missingParts = getMissingComponents(product.id);
//                       const isLow = avail.count > 0 && avail.count < 5;
//                       return (
//                         <tr key={product.id} className="hover:bg-slate-50 transition-colors">
//                           <td className="px-6 py-4 align-top">
//                             <div className="font-medium text-slate-900">{product.name}</div>
//                             <div className="text-xs text-slate-400 font-mono">{product.sku}</div>
//                           </td>
//                           <td className="px-6 py-4 align-top">
//                             {avail.isBuildable ? (
//                               <div>
//                                 <div className="flex items-baseline gap-1">
//                                   <span className="text-2xl font-bold text-slate-900">{avail.count}</span>
//                                   <span className="text-xs text-slate-500">units buildable</span>
//                                 </div>
//                                 {isLow && (
//                                   <div className="flex items-center gap-1 text-amber-600 text-xs font-medium mt-1">
//                                     <AlertTriangle size={12} /> Low Build Quantity
//                                   </div>
//                                 )}
//                               </div>
//                             ) : (
//                               <div className="text-slate-400 font-medium">0 units</div>
//                             )}
//                           </td>
//                           <td className="px-6 py-4 align-top">
//                             {avail.isBuildable ? (
//                               <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${isLow ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'}`}>
//                                 <CheckCircle2 size={12} />
//                                 {isLow ? 'Low Stock' : 'Ready to Build'}
//                               </span>
//                             ) : (
//                               <div className="space-y-2">
//                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20">
//                                   <XCircle size={12} />
//                                   Not Ready
//                                 </span>
//                                 <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
//                                   <p className="text-[10px] font-bold text-rose-800 uppercase mb-1">Missing Parts:</p>
//                                   <ul className="space-y-1">
//                                     {missingParts.map((mp, idx) => (
//                                       <li key={idx} className="text-xs text-rose-700 flex justify-between gap-4">
//                                         <span>{mp.name}</span>
//                                         <span className="font-mono font-bold">-{mp.deficit}</span>
//                                       </li>
//                                     ))}
//                                     {missingParts.length === 0 && recipes.filter(r => r.productId === product.id).length === 0 && (
//                                       <li className="text-xs text-slate-500 italic">No recipe defined</li>
//                                     )}
//                                   </ul>
//                                 </div>
//                               </div>
//                             )}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </div>
//           <div className="h-full">
//             <SalesAnalyticsWidget />
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const PartsView = () => (
//     <div className="p-8 h-full flex flex-col">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h2 className="text-2xl font-bold text-slate-900">Part Inventory</h2>
//           <p className="text-slate-500">Manage raw materials and components</p>
//         </div>
//         {isAdmin && (
//           <button
//             onClick={() => setShowAddPart(true)}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm shadow-blue-200"
//           >
//             <Plus size={18} /> Add Part
//           </button>
//         )}
//       </div>

//       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
//         <div className="overflow-auto max-h-[calc(100vh-250px)]">
//           {parts.length === 0 ? (
//             <div className="text-center p-12 text-slate-400">
//               <Component size={48} className="mx-auto mb-4 opacity-50" />
//               <p>No parts added yet. Add a part to get started.</p>
//             </div>
//           ) : (
//             <table className="w-full text-left text-sm text-slate-600">
//               <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10 shadow-sm">
//                 <tr>
//                   <th className="px-6 py-4">Part Name</th>
//                   <th className="px-6 py-4">SKU</th>
//                   <th className="px-6 py-4 text-center">Stock Level</th>
//                   {isAdmin && <th className="px-6 py-4 text-center">Actions</th>}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {parts.map(part => {
//                   const isLow = part.stock < part.minStock;
//                   return (
//                     <tr key={part.id} className="hover:bg-slate-50 transition-colors">
//                       <td className="px-6 py-4">
//                         <div className="font-medium text-slate-900">{part.name}</div>
//                         <div className="text-xs text-slate-400">Min: {part.minStock}</div>
//                       </td>
//                       <td className="px-6 py-4 font-mono text-xs">{part.sku}</td>
//                       <td className="px-6 py-4">
//                         <div className="flex flex-col items-center gap-2">
//                           <div className={`text-lg font-bold ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
//                             {part.stock}
//                           </div>
//                           {isLow && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">LOW STOCK</span>}
//                         </div>
//                       </td>
//                       {isAdmin && (
//                         <td className="px-6 py-4">
//                           <div className="flex justify-center items-center gap-2">
//                             <button
//                               onClick={() => handleUpdateStock(part.id, -1)}
//                               className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600 transition-colors"
//                               title="Decrease Stock"
//                             >
//                               <TrendingUp size={16} className="rotate-180" />
//                             </button>
//                             <button
//                               onClick={() => handleUpdateStock(part.id, 1)}
//                               className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-600 transition-colors"
//                               title="Increase Stock"
//                             >
//                               <TrendingUp size={16} />
//                             </button>
//                             <button
//                               onClick={() => setAdjustConfig(part)}
//                               className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
//                               title="Adjust Stock"
//                             >
//                               <PenSquare size={16} />
//                             </button>
//                             <div className="w-px h-4 bg-slate-200 mx-1"></div>
//                             <button
//                               onClick={() => handleDeletePart(part.id)}
//                               className="p-1.5 rounded-md hover:bg-rose-100 text-rose-500 transition-colors"
//                               title="Delete Part"
//                             >
//                               <Trash2 size={16} />
//                             </button>
//                           </div>
//                         </td>
//                       )}
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   );

//   const ProductsView = () => (
//     <div className="p-8 h-full flex flex-col">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h2 className="text-2xl font-bold text-slate-900">Products & Assembly</h2>
//           <p className="text-slate-500">Track build readiness and BOMs</p>
//         </div>
//         {isAdmin && (
//           <button
//             onClick={() => { setNewProductRecipe([]); setShowAddProduct(true); }}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm shadow-blue-200"
//           >
//             <Plus size={18} /> New Product
//           </button>
//         )}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         <div className="space-y-4">
//           {products.length === 0 && <p className="text-slate-400 text-sm">No products available.</p>}
//           {products.map(product => {
//             const avail = getProductAvailability(product.id);
//             const isSelected = selectedProduct?.id === product.id;
//             return (
//               <div
//                 key={product.id}
//                 onClick={() => setSelectedProduct(product)}
//                 className={`group bg-white p-5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200 hover:border-blue-300'
//                   }`}
//               >
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="font-bold text-slate-900">{product.name}</h3>
//                     <p className="text-xs text-slate-400 font-mono mt-1">{product.sku}</p>
//                   </div>
//                   <div className="flex items-start gap-4">
//                     <div className="text-right">
//                       <StatusBadge status={avail.status} />
//                       <div className="text-xs font-medium text-slate-500 mt-2">
//                         Buildable: <span className="text-slate-900 font-bold text-lg">{avail.count}</span>
//                       </div>
//                     </div>
//                     {isAdmin && (
//                       <button
//                         onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
//                         className="text-slate-300 hover:text-rose-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
//                         title="Delete Product"
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     )}
//                   </div>
//                 </div>
//                 <div className="mt-4 pt-4 border-t border-slate-100">
//                   <div className="flex justify-between text-xs mb-1">
//                     <span className="text-slate-500">Readiness</span>
//                     <span className={avail.isBuildable ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
//                       {avail.isBuildable ? 'Ready for Assembly' : `Missing: ${avail.limitingPart ? avail.limitingPart.name : 'Parts'}`}
//                     </span>
//                   </div>
//                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
//                     <div
//                       className={`h-full rounded-full ${avail.isBuildable ? 'bg-emerald-500' : 'bg-rose-500'}`}
//                       style={{ width: avail.isBuildable ? '100%' : '15%' }}
//                     ></div>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 h-fit sticky top-6">
//           {selectedProduct ? (
//             <div className="animate-in slide-in-from-right-4 duration-300">
//               <div className="flex justify-between items-start mb-6">
//                 <div>
//                   <h3 className="text-xl font-bold text-slate-900">{selectedProduct.name}</h3>
//                   <p className="text-slate-500 text-sm mt-1">{selectedProduct.description}</p>
//                 </div>
//                 <div className="bg-white px-3 py-1 rounded-md border border-slate-200 text-sm font-mono text-slate-600">
//                   ${selectedProduct.price}
//                 </div>
//               </div>

//               <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
//                 <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
//                   <h4 className="font-semibold text-slate-700 text-sm">Bill of Materials (BOM)</h4>
//                   <span className="text-xs text-slate-500">Parts Required per Unit</span>
//                 </div>

//                 <div className="divide-y divide-slate-100">
//                   {recipes
//                     .filter(r => r.productId === selectedProduct.id)
//                     .map((r) => {
//                       const part = parts.find(p => p.id === r.partId);
//                       if (!part) return null;
//                       const canMake = Math.floor(part.stock / r.quantity);
//                       const isBottleneck = canMake === getProductAvailability(selectedProduct.id).count;
//                       return (
//                         <div key={r.partId} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
//                           <div className="flex items-center gap-3">
//                             <div className={`w-2 h-2 rounded-full ${part.stock >= r.quantity ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
//                             <div>
//                               <p className="text-sm font-medium text-slate-900">{part.name}</p>
//                               <p className="text-xs text-slate-500">Requires: {r.quantity} | In Stock: {part.stock}</p>
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             {isBottleneck && <span className="text-[10px] text-rose-600 font-bold uppercase mr-2">Bottleneck</span>}
//                             {isAdmin && (
//                               <button
//                                 onClick={() => handleRemoveLink(selectedProduct.id, part.id)}
//                                 className="text-slate-400 hover:text-rose-500 p-1"
//                               >
//                                 <Trash2 size={14} />
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                       );
//                     })}
//                   {recipes.filter(r => r.productId === selectedProduct.id).length === 0 && (
//                     <div className="p-8 text-center text-slate-400 text-sm">
//                       No parts linked yet.
//                     </div>
//                   )}
//                 </div>
//                 {isAdmin && (
//                   <div className="bg-slate-50 p-4 border-t border-slate-200">
//                     <div className="flex gap-2">
//                       <select id="partSelect" className="flex-1 text-sm rounded-md border-slate-300 py-2 pl-3">
//                         {parts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
//                       </select>
//                       <input id="qtyInput" type="number" placeholder="Qty" className="w-20 text-sm rounded-md border-slate-300 py-2 pl-3" defaultValue={1} />
//                       <button
//                         onClick={() => {
//                           const pid = document.getElementById('partSelect').value;
//                           const qty = parseFloat(document.getElementById('qtyInput').value);
//                           if (pid && qty) {
//                             addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'recipes'), {
//                               productId: selectedProduct.id,
//                               partId: pid,
//                               quantity: qty
//                             });
//                           }
//                         }}
//                         className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-md"
//                       >
//                         <Plus size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           ) : (
//             <div className="h-full flex flex-col items-center justify-center text-slate-400">
//               <Component size={48} className="mb-4 opacity-50" />
//               <p>Select a product to view details</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );

//   const OrdersView = () => (
//     <div className="p-8 h-full flex flex-col">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
//           <p className="text-slate-500">Process sales and deduct inventory</p>
//         </div>
//         {isAdmin && (
//           <button
//             onClick={() => setShowAddOrder(true)}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm shadow-blue-200"
//           >
//             <Plus size={18} /> New Order
//           </button>
//         )}
//       </div>

//       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
//         {orders.length === 0 ? (
//           <div className="text-center p-12 text-slate-400">
//             <Users size={48} className="mx-auto mb-4 opacity-50" />
//             <p>No orders yet.</p>
//           </div>
//         ) : (
//           <table className="w-full text-left text-sm text-slate-600">
//             <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
//               <tr>
//                 <th className="px-6 py-4">Order Details</th>
//                 <th className="px-6 py-4">Items</th>
//                 <th className="px-6 py-4 text-right">Total</th>
//                 <th className="px-6 py-4 text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {orders.map(order => (
//                 <tr key={order.id} className="hover:bg-slate-50 group">
//                   <td className="px-6 py-4">
//                     <div className="font-medium text-slate-900">{order.customer}</div>
//                     <div className="text-xs text-slate-400">#{order.id} • {order.date}</div>
//                     {order.editedAt && <div className="text-[10px] text-blue-500 mt-1 italic">Edited on {order.editedAt}</div>}
//                   </td>
//                   <td className="px-6 py-4">
//                     {order.items.map((item, idx) => (
//                       <div key={idx} className="text-slate-700 flex items-center gap-2">
//                         <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'product' ? 'bg-indigo-500' : 'bg-orange-500'}`}></span>
//                         {item.qty}x {item.name}
//                       </div>
//                     ))}
//                   </td>
//                   <td className="px-6 py-4 text-right font-mono font-medium">${order.total.toFixed(2)}</td>
//                   <td className="px-6 py-4 text-center">
//                     {isAdmin && (
//                       <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                         <button
//                           onClick={() => { setEditingOrder(order); setShowEditOrder(true); }}
//                           className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
//                           title="Edit Order"
//                         >
//                           <Edit3 size={16} />
//                         </button>
//                         <button
//                           onClick={() => handleDeleteOrder(order.id)}
//                           className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
//                           title="Delete Order"
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );

//   const TrashView = () => (
//     <div className="p-8 h-full flex flex-col">
//       <div className="flex items-center gap-3 mb-6">
//         <h2 className="text-2xl font-bold text-slate-900">Trash History</h2>
//         <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-medium">{trash.length} items</span>
//       </div>

//       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
//         {trash.length === 0 ? (
//           <div className="text-center p-12 text-slate-400">
//             <History size={48} className="mx-auto mb-4 opacity-50" />
//             <p>Trash is empty.</p>
//           </div>
//         ) : (
//           <table className="w-full text-left text-sm text-slate-600">
//             <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
//               <tr>
//                 <th className="px-6 py-4">Item Type</th>
//                 <th className="px-6 py-4">Details</th>
//                 <th className="px-6 py-4">Deleted At</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {trash.map((item, idx) => (
//                 <tr key={idx} className="hover:bg-slate-50">
//                   <td className="px-6 py-4">
//                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase ring-1 ring-inset
//                       ${item.itemType === 'order' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
//                         item.itemType === 'product' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' :
//                           'bg-amber-50 text-amber-700 ring-amber-600/20'}`}>
//                       {item.itemType}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="font-medium text-slate-900">
//                       {item.itemType === 'order' ? `Order #${item.originalId} - ${item.customer}` : item.name}
//                     </div>
//                     {item.itemType === 'order' && (
//                       <div className="text-xs text-slate-500 mt-1">
//                         Total: ${item.total.toFixed(2)} | Date: {item.date}
//                       </div>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 font-mono text-xs text-slate-500">
//                     {item.deletedAt}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );

//   // --- MODALS ---
//   const Modal = ({ title, show, onClose, children }) => {
//     if (!show) return null;
//     return (
//       <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
//         <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
//           <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
//             <h3 className="font-semibold text-slate-900">{title}</h3>
//             <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
//           </div>
//           <div className="p-6">
//             {children}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   if (authLoading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//           <p className="text-sm font-medium">Connecting to secure storage...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">

//       {/* Sidebar */}
//       <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20`}>
//         <div className="p-6 flex items-center gap-3">
//           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
//             <Box size={20} />
//           </div>
//           {isSidebarOpen && <span className="font-bold text-lg tracking-tight">InvCRM</span>}
//         </div>

//         <nav className="flex-1 py-6 space-y-1">
//           <SidebarItem id="dashboard" icon={LayoutDashboard} label={isSidebarOpen ? "Dashboard" : ""} />
//           <SidebarItem id="products" icon={Package} label={isSidebarOpen ? "Products" : ""} />
//           <SidebarItem id="parts" icon={Component} label={isSidebarOpen ? "Inventory" : ""} />
//           <SidebarItem id="orders" icon={Users} label={isSidebarOpen ? "Orders" : ""} />
//           {isAdmin && <SidebarItem id="trash" icon={Trash2} label={isSidebarOpen ? "Trash" : ""} />}
//         </nav>

//         {/* Storage Indicator & Admin Toggle */}
//         <div className={`p-4 ${isSidebarOpen ? 'block' : 'hidden'} space-y-2`}>
//           <div className="bg-indigo-50 text-indigo-700 text-xs p-3 rounded-lg border border-indigo-100 flex items-center gap-2">
//             <Cloud size={14} />
//             <span>Data synced online</span>
//           </div>

//           <button
//             onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)}
//             className={`w-full text-xs p-3 rounded-lg border flex items-center gap-2 transition-colors ${isAdmin ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
//           >
//             {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
//             <span>{isAdmin ? 'Admin Mode (Active)' : 'Viewer Mode'}</span>
//           </button>
//         </div>

//         <div className="p-4 border-t border-slate-100">
//           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 w-full flex justify-center">
//             {isSidebarOpen ? <ChevronRight className="rotate-180" /> : <ChevronRight />}
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 overflow-auto bg-slate-50/50">
//         {activeTab === 'dashboard' && <DashboardView />}
//         {activeTab === 'products' && <ProductsView />}
//         {activeTab === 'parts' && <PartsView />}
//         {activeTab === 'orders' && <OrdersView />}
//         {activeTab === 'trash' && <TrashView />}
//       </div>

//       {/* --- MODALS --- */}
//       <Modal title="Admin Login" show={showAdminLogin} onClose={() => setShowAdminLogin(false)}>
//         <form onSubmit={handleAdminLogin} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">Enter Admin PIN</label>
//             <input
//               type="password"
//               className="w-full rounded-lg border-slate-300 py-2 px-3 text-center tracking-widest text-lg"
//               autoFocus
//               value={adminPin}
//               onChange={(e) => setAdminPin(e.target.value)}
//               placeholder="••••"
//             />
//           </div>
//           <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2 transition-colors">Access Admin Panel</button>
//         </form>
//       </Modal>

//       <Modal title="Add New Part" show={showAddPart} onClose={() => setShowAddPart(false)}>
//         <form onSubmit={handleAddPart} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">Part Name</label>
//             <input required name="name" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="e.g., Titanium Screw" />
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
//               <input required name="sku" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="PRT-001" />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
//               <input required name="cost" type="number" step="0.01" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="0.00" />
//             </div>
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
//               <input required name="stock" type="number" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="0" />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">Min Level</label>
//               <input required name="minStock" type="number" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="10" />
//             </div>
//           </div>
//           <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2 transition-colors">Add Part</button>
//         </form>
//       </Modal>

//       <Modal title="Create New Product" show={showAddProduct} onClose={() => setShowAddProduct(false)}>
//         <form onSubmit={handleAddProduct} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
//             <input required name="name" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="e.g., Office Chair" />
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
//               <input required name="sku" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="PROD-001" />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
//               <input required name="price" type="number" step="0.01" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="0.00" />
//             </div>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
//             <textarea name="description" className="w-full rounded-lg border-slate-300 py-2 px-3" rows="2" placeholder="Product details..."></textarea>
//           </div>

//           <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
//             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Define Initial Recipe (Parts)</label>
//             <div className="space-y-2 mb-3">
//               {newProductRecipe.map((p, idx) => (
//                 <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 border border-slate-200 rounded">
//                   <span>{p.quantity}x {p.name}</span>
//                   <button type="button" onClick={() => handleRemoveFromRecipeDraft(p.partId)} className="text-rose-500 hover:text-rose-700"><X size={14} /></button>
//                 </div>
//               ))}
//               {newProductRecipe.length === 0 && <p className="text-xs text-slate-400 italic">No parts added yet.</p>}
//             </div>
//             <div className="flex gap-2">
//               <select id="newProdPart" className="flex-1 text-sm rounded-md border-slate-300 py-1.5 px-2">
//                 <option value="">Select Part...</option>
//                 {parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//               </select>
//               <input id="newProdQty" type="number" className="w-16 text-sm rounded-md border-slate-300 py-1.5 px-2" placeholder="Qty" defaultValue={1} />
//               <button type="button" onClick={handleAddToRecipeDraft} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 rounded-md text-xs font-bold">Add</button>
//             </div>
//           </div>
//           <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2 transition-colors">Create Product & Recipe</button>
//         </form>
//       </Modal>

//       <Modal title="Create New Order" show={showAddOrder} onClose={() => setShowAddOrder(false)}>
//         <form onSubmit={handleCreateOrder} className="space-y-4">
//           <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
//             <button type="button" onClick={() => setOrderType('product')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${orderType === 'product' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Sell Product</button>
//             <button type="button" onClick={() => setOrderType('part')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${orderType === 'part' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Sell Part</button>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
//             <input required name="customer" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="e.g., John Doe" />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">Select {orderType === 'product' ? 'Product' : 'Part'}</label>
//             <select name="itemId" className="w-full rounded-lg border-slate-300 py-2 px-3">
//               {orderType === 'product' ? (
//                 products.map(p => {
//                   const avail = getProductAvailability(p.id);
//                   return (
//                     <option key={p.id} value={p.id} disabled={!avail.isBuildable}>
//                       {p.name} (${p.price}) - {avail.isBuildable ? `${avail.count} Available` : 'Out of Stock'}
//                     </option>
//                   );
//                 })
//               ) : (
//                 parts.map(p => (
//                   <option key={p.id} value={p.id} disabled={p.stock === 0}>
//                     {p.name} (Stock: {p.stock})
//                   </option>
//                 ))
//               )}
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
//             <input required name="quantity" type="number" min="1" className="w-full rounded-lg border-slate-300 py-2 px-3" defaultValue="1" />
//           </div>
//           <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2 transition-colors">Confirm Order</button>
//         </form>
//       </Modal>

//       {/* --- EDIT ORDER MODAL --- */}
//       <Modal title={`Edit Order #${editingOrder?.id}`} show={showEditOrder} onClose={() => setShowEditOrder(false)}>
//         {editingOrder && (
//           <form onSubmit={handleSaveEditOrder} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
//               <input required name="customer" defaultValue={editingOrder.customer} className="w-full rounded-lg border-slate-300 py-2 px-3" />
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
//                 <input required name="date" type="date" defaultValue={editingOrder.date} className="w-full rounded-lg border-slate-300 py-2 px-3" />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount ($)</label>
//                 <input required name="total" type="number" step="0.01" defaultValue={editingOrder.total} className="w-full rounded-lg border-slate-300 py-2 px-3" />
//               </div>
//             </div>

//             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
//               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Order Items (Update Quantity)</label>
//               {editingOrder.items.map((item, idx) => (
//                 <div key={idx} className="flex justify-between items-center text-sm mb-2">
//                   <span className="font-medium text-slate-700">{item.name}</span>
//                   <div className="flex items-center gap-2">
//                     <span className="text-xs text-slate-400">Qty:</span>
//                     <input name="quantity" type="number" min="1" defaultValue={item.qty} className="w-16 rounded-md border-slate-300 py-1 px-2 text-right" />
//                   </div>
//                 </div>
//               ))}
//               <p className="text-xs text-blue-600 mt-2 flex items-start gap-1">
//                 <AlertCircle size={12} className="mt-0.5 shrink-0" />
//                 Changing quantity will automatically adjust inventory levels.
//               </p>
//             </div>

//             <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2 transition-colors">Save Changes</button>
//           </form>
//         )}
//       </Modal>

//       <Modal title="Confirm Deletion" show={!!deleteConfig} onClose={() => setDeleteConfig(null)}>
//         <div className="space-y-4">
//           <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg">
//             <AlertTriangle size={24} className="shrink-0" />
//             <p className="text-sm">Are you sure you want to delete <strong>{deleteConfig?.name}</strong>?</p>
//           </div>

//           {deleteConfig?.type === 'order' && (
//             <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50">
//               <input type="checkbox" id="returnStockCheckbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" defaultChecked />
//               <label htmlFor="returnStockCheckbox" className="text-sm text-slate-700 font-medium cursor-pointer">
//                 Return items to stock?
//               </label>
//             </div>
//           )}

//           <div className="flex justify-end gap-3 pt-2">
//             <button onClick={() => setDeleteConfig(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
//             <button onClick={executeDelete} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Delete Permanently</button>
//           </div>
//         </div>
//       </Modal>

//       <Modal title={`Adjust Stock: ${adjustConfig?.name}`} show={!!adjustConfig} onClose={() => setAdjustConfig(null)}>
//         <form onSubmit={handleStockAdjustment} className="space-y-4">
//           <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-sm border border-slate-100">
//             <span className="text-slate-500">Current Stock Level:</span>
//             <span className="font-bold text-lg text-slate-900">{adjustConfig?.stock}</span>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-2">Adjustment Type</label>
//             <div className="grid grid-cols-3 gap-3">
//               <label className="cursor-pointer">
//                 <input type="radio" name="type" value="add" className="peer sr-only" defaultChecked />
//                 <div className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-slate-100 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 text-slate-600 peer-checked:text-emerald-700 transition-all hover:bg-slate-50">
//                   <Plus size={20} className="mb-1" />
//                   <span className="text-xs font-semibold">Add</span>
//                 </div>
//               </label>
//               <label className="cursor-pointer">
//                 <input type="radio" name="type" value="remove" className="peer sr-only" />
//                 <div className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-slate-100 peer-checked:border-rose-500 peer-checked:bg-rose-50 text-slate-600 peer-checked:text-rose-700 transition-all hover:bg-slate-50">
//                   <TrendingUp size={20} className="mb-1 rotate-180" />
//                   <span className="text-xs font-semibold">Remove</span>
//                 </div>
//               </label>
//               <label className="cursor-pointer">
//                 <input type="radio" name="type" value="set" className="peer sr-only" />
//                 <div className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-slate-100 peer-checked:border-blue-500 peer-checked:bg-blue-50 text-slate-600 peer-checked:text-blue-700 transition-all hover:bg-slate-50">
//                   <Settings size={20} className="mb-1" />
//                   <span className="text-xs font-semibold">Set Fixed</span>
//                 </div>
//               </label>
//             </div>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">Amount / Quantity</label>
//             <input required name="amount" type="number" min="0" className="w-full rounded-lg border-slate-300 py-2 px-3 focus:ring-2 focus:ring-blue-500" placeholder="Enter value" />
//           </div>
//           <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg mt-2 transition-colors">Update Stock</button>
//         </form>
//       </Modal>

//     </div>
//   );
// }

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  Component,
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Users,
  X,
  TrendingUp,
  Box,
  AlertTriangle,
  ArrowRight,
  PenSquare,
  BarChart3,
  ChevronLeft,
  History,
  Edit3,
  Lock,
  Unlock,
  Cloud,
  LogOut,
  LogIn
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
  where
} from 'firebase/firestore';
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// --- FIREBASE SETUP ---
import { auth, db } from "./firebase";

// --- CONFIGURATION ---
const appId = "crm_prod_v1"; 

// --- INITIAL STATE ---
const INITIAL_PARTS = [];
const INITIAL_PRODUCTS = [];
const INITIAL_RECIPES = [];
const INITIAL_ORDERS = [];
const INITIAL_TRASH = [];

export default function App() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Controlled by Auth status
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');

  // Data State
  const [parts, setParts] = useState(INITIAL_PARTS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [recipes, setRecipes] = useState(INITIAL_RECIPES);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [trash, setTrash] = useState(INITIAL_TRASH);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals & Forms State
  const [showAddPart, setShowAddPart] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  // Order Form State
  const [orderType, setOrderType] = useState('product');

  // Temporary state for building a recipe
  const [newProductRecipe, setNewProductRecipe] = useState([]);

  // Delete & Adjust Confirmation State
  const [deleteConfig, setDeleteConfig] = useState(null);
  const [adjustConfig, setAdjustConfig] = useState(null);

  // Sales Dashboard State
  const [salesView, setSalesView] = useState('year');
  const [salesFilter, setSalesFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // --- AUTHENTICATION HANDLERS ---
  
  // 1. Google Login
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert(error.message);
    }
  };

  // 2. Email Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLoginModal(false);
    } catch (error) {
      console.error("Email Sign-In Error:", error);
      alert("Login failed: " + error.message);
    }
  };

  // 3. Logout (Reverts to Anonymous Viewer)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth); // Keep them logged in as viewer
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // --- AUTH LISTENER ---
  // useEffect(() => {
  //   // Attempt initial anonymous sign-in if not logged in
  //   const initAuth = async () => {
  //     if (!auth.currentUser) {
  //       await signInAnonymously(auth).catch(console.error);
  //     }
  //   };
  //   initAuth();

  //   const unsubscribe = onAuthStateChanged(auth, (u) => {
  //     setUser(u);
  //     setAuthLoading(false);
      
  //     // LOGIC: If user is logged in and NOT anonymous, they are Admin.
  //     if (u && !u.isAnonymous) {
  //       setIsAdmin(true);
  //     } else {
  //       setIsAdmin(false);
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);
// --- AUTH LISTENER ---
  useEffect(() => {
    // Attempt initial anonymous sign-in if not logged in
    const initAuth = async () => {
      if (!auth.currentUser) {
        await signInAnonymously(auth).catch(console.error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      
      // LOGIC: Check if user is logged in and NOT anonymous
      if (u && !u.isAnonymous) {
        try {
          // 1. Search the "users" collection for this person's email
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", u.email));
          const querySnapshot = await getDocs(q);
          
          let userIsAdmin = false;
          
          // 2. Loop through results (should only be one) and check the role
          querySnapshot.forEach((doc) => {
            if (doc.data().role === "admin") {
              userIsAdmin = true;
            }
          });
          
          // 3. Set admin status based on what we found in Firestore
          setIsAdmin(userIsAdmin); 
          
        } catch (error) {
          console.error("Error fetching user role:", error);
          setIsAdmin(false); // Default to regular viewer if something goes wrong
        }
      } else {
        // Anonymous users are never admins
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- FIRESTORE LISTENERS ---
  useEffect(() => {
    if (!user) return;

    const setupListener = (colName, setter) => {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', colName));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setter(data);
      });
    };

    const unsubParts = setupListener("parts", setParts);
    const unsubProducts = setupListener("products", setProducts);
    const unsubRecipes = setupListener("recipes", setRecipes);
    const unsubOrders = setupListener("orders", setOrders);
    const unsubTrash = setupListener("trash", setTrash);

    return () => {
      unsubParts(); unsubProducts(); unsubRecipes(); unsubOrders(); unsubTrash();
    };
  }, [user]);

  // --- LOGIC: INVENTORY & SALES ---
  const getProductAvailability = (prodId) => {
    const prodRecipe = recipes.filter(r => r.productId === prodId);
    if (prodRecipe.length === 0) return { count: 0, status: 'No Parts Linked', isBuildable: false, limitingPart: null };

    let maxBuildable = Infinity;
    let limitingPart = null;

    prodRecipe.forEach(item => {
      const part = parts.find(p => p.id === item.partId);
      if (!part) return;
      const possibleWithThisPart = Math.floor(part.stock / item.quantity);
      if (possibleWithThisPart < maxBuildable) {
        maxBuildable = possibleWithThisPart;
        limitingPart = part;
      }
    });

    if (maxBuildable === Infinity) maxBuildable = 0;

    return {
      count: maxBuildable,
      status: maxBuildable > 0 ? 'Complete' : 'Incomplete',
      isBuildable: maxBuildable > 0,
      limitingPart: maxBuildable === 0 ? limitingPart : null
    };
  };

  const getMissingComponents = (prodId) => {
    const prodRecipe = recipes.filter(r => r.productId === prodId);
    const missing = [];
    prodRecipe.forEach(item => {
      const part = parts.find(p => p.id === item.partId);
      if (part && part.stock < item.quantity) {
        missing.push({
          name: part.name,
          required: item.quantity,
          available: part.stock,
          deficit: item.quantity - part.stock
        });
      }
    });
    return missing;
  };

  const getSalesData = () => {
    const filteredOrders = orders.filter(order => {
      if (salesFilter === 'all') return true;
      return order.items.some(item => item.type === salesFilter);
    });

    const byYear = {};
    const byMonth = Array(12).fill(0);
    const byDay = {};

    filteredOrders.forEach(order => {
      const [y, m, d] = order.date.split('-');
      // Year
      if (!byYear[y]) byYear[y] = 0;
      byYear[y] += order.total;
      
      // Month
      if (parseInt(y) === selectedYear) {
        byMonth[parseInt(m) - 1] += order.total;
      }

      // Day
      if (selectedMonth !== null && parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1) {
        const dateKey = order.date;
        if (!byDay[dateKey]) byDay[dateKey] = { total: 0, orders: [] };
        byDay[dateKey].total += order.total;
        byDay[dateKey].orders.push(order);
      }
    });

    return { byYear, byMonth, byDay };
  };

  const salesData = useMemo(() => getSalesData(), [orders, selectedYear, selectedMonth, salesFilter]);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // --- ACTIONS (FIRESTORE) ---
  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formData = new FormData(e.target);
    const newPart = {
      name: formData.get('name'),
      sku: formData.get('sku'),
      stock: parseInt(formData.get('stock')),
      minStock: parseInt(formData.get('minStock')),
      cost: parseFloat(formData.get('cost')),
    };
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parts'), newPart);
    setShowAddPart(false);
  };

  const handleUpdateStock = async (partId, delta) => {
    if (!isAdmin) return;
    const part = parts.find(p => p.id === partId);
    if (part) {
      const newStock = Math.max(0, part.stock + delta);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', partId), { stock: newStock });
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formData = new FormData(e.target);
    const adjustmentType = formData.get('type');
    const amount = parseInt(formData.get('amount'));

    const part = parts.find(p => p.id === adjustConfig.id);
    if (part && !isNaN(amount)) {
      let newStock = part.stock;
      if (adjustmentType === 'add') newStock += amount;
      else if (adjustmentType === 'remove') newStock = Math.max(0, newStock - amount);
      else if (adjustmentType === 'set') newStock = amount;

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), { stock: newStock });
    }
    setAdjustConfig(null);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formData = new FormData(e.target);

    const productRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {
      name: formData.get('name'),
      sku: formData.get('sku'),
      price: parseFloat(formData.get('price')),
      description: formData.get('description')
    });

    const batchPromises = newProductRecipe.map(item =>
      addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'recipes'), {
        productId: productRef.id,
        partId: item.partId,
        quantity: item.quantity
      })
    );
    await Promise.all(batchPromises);

    setNewProductRecipe([]);
    setShowAddProduct(false);
  };

  const handleAddToRecipeDraft = () => {
    const partSelect = document.getElementById('newProdPart');
    const qtyInput = document.getElementById('newProdQty');
    const partId = partSelect.value;
    const quantity = parseFloat(qtyInput.value);

    if (partId && quantity > 0) {
      if (newProductRecipe.some(p => p.partId === partId)) {
        alert("Part already added to recipe");
        return;
      }
      const partName = parts.find(p => p.id === partId).name;
      setNewProductRecipe([...newProductRecipe, { partId, name: partName, quantity }]);
      qtyInput.value = 1;
    }
  };

  const handleRemoveLink = async (productId, partId) => {
    if (!isAdmin) return;
    const recipe = recipes.find(r => r.productId === productId && r.partId === partId);
    if (recipe) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recipes', recipe.id));
  };

  const executeDelete = async () => {
    if (!isAdmin || !deleteConfig) return;

    const timestamp = new Date().toLocaleString();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'trash'), {
      ...deleteConfig.data,
      deletedAt: timestamp,
      itemType: deleteConfig.type,
      originalId: deleteConfig.id
    });

    if (deleteConfig.type === 'part') {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', deleteConfig.id));
      const relatedRecipes = recipes.filter(r => r.partId === deleteConfig.id);
      await Promise.all(relatedRecipes.map(r => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recipes', r.id))));
    } else if (deleteConfig.type === 'product') {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', deleteConfig.id));
      const relatedRecipes = recipes.filter(r => r.productId === deleteConfig.id);
      await Promise.all(relatedRecipes.map(r => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recipes', r.id))));
      if (selectedProduct?.id === deleteConfig.id) setSelectedProduct(null);
    } else if (deleteConfig.type === 'order') {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', deleteConfig.id));
      const returnStock = document.getElementById('returnStockCheckbox')?.checked;
      if (returnStock) {
        const order = deleteConfig.data;
        for (const item of order.items) {
          if (item.type === 'product') {
            const prodRecipe = recipes.filter(r => r.productId === item.itemId);
            for (const r of prodRecipe) {
              const part = parts.find(p => p.id === r.partId);
              if (part) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), { stock: part.stock + (r.quantity * item.qty) });
            }
          } else {
            const part = parts.find(p => p.id === item.itemId);
            if (part) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), { stock: part.stock + item.qty });
          }
        }
      }
    }
    setDeleteConfig(null);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formData = new FormData(e.target);
    const type = orderType;
    const itemId = formData.get('itemId');
    const qty = parseInt(formData.get('quantity'));
    const customer = formData.get('customer');

    let total = 0;
    let itemName = '';

    if (type === 'product') {
      const product = products.find(p => p.id === itemId);
      const availability = getProductAvailability(itemId);

      if (availability.count < qty) {
        alert(`Cannot fulfill order! Only ${availability.count} ${product.name}s available.`);
        return;
      }

      const prodRecipe = recipes.filter(r => r.productId === itemId);
      for (const r of prodRecipe) {
        const part = parts.find(p => p.id === r.partId);
        if (part) {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), {
            stock: part.stock - (r.quantity * qty)
          });
        }
      }
      total = product.price * qty;
      itemName = product.name;
    } else {
      const part = parts.find(p => p.id === itemId);
      if (part.stock < qty) {
        alert(`Insufficient stock! Only ${part.stock} ${part.name} available.`);
        return;
      }
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), {
        stock: part.stock - qty
      });
      total = (part.cost * 1.5) * qty;
      itemName = part.name;
    }

    const today = new Date().toISOString().split('T')[0];
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), {
      customer,
      date: today,
      total: total,
      status: 'Completed',
      items: [{ name: itemName, type: type, qty: qty, itemId: itemId }]
    });
    setShowAddOrder(false);
  };

  const handleSaveEditOrder = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formData = new FormData(e.target);
    const newCustomer = formData.get('customer');
    const newDate = formData.get('date');
    const newTotal = parseFloat(formData.get('total'));
    const newQty = parseInt(formData.get('quantity'));

    const oldOrder = editingOrder;
    const oldItem = oldOrder.items[0];
    const qtyDiff = newQty - oldItem.qty;

    if (qtyDiff !== 0) {
      if (oldItem.type === 'product') {
        const product = products.find(p => p.id === oldItem.itemId);
        if (product) {
          const prodRecipe = recipes.filter(r => r.productId === product.id);
          if (qtyDiff > 0) {
            const avail = getProductAvailability(product.id);
            if (avail.count < qtyDiff) {
              alert(`Cannot increase quantity by ${qtyDiff}. Only ${avail.count} sets available.`);
              return;
            }
          }
          for (const r of prodRecipe) {
            const part = parts.find(p => p.id === r.partId);
            if (part) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), { stock: part.stock - (r.quantity * qtyDiff) });
          }
        }
      } else {
        const part = parts.find(p => p.id === oldItem.itemId);
        if (part) {
          if (qtyDiff > 0 && part.stock < qtyDiff) {
            alert(`Insufficient stock.`);
            return;
          }
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parts', part.id), { stock: part.stock - qtyDiff });
        }
      }
    }

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', editingOrder.id), {
      customer: newCustomer,
      date: newDate,
      total: newTotal,
      editedAt: new Date().toLocaleString(),
      items: [{ ...oldItem, qty: newQty }]
    });

    setEditingOrder(null);
    setShowEditOrder(false);
  };

  // --- SUB-COMPONENTS ---
  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => { setActiveTab(id); setSelectedProduct(null); }}
      className={`w-full flex items-center space-x-3 px-6 py-4 transition-colors ${activeTab === id
          ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const StatusBadge = ({ status }) => {
    const styles = {
      'Complete': 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
      'Incomplete': 'bg-rose-100 text-rose-700 ring-rose-600/20',
      'No Parts Linked': 'bg-slate-100 text-slate-700 ring-slate-600/20',
      'Completed': 'bg-blue-100 text-blue-700 ring-blue-600/20',
      'Pending': 'bg-amber-100 text-amber-700 ring-amber-600/20',
    };
    const Icon = status === 'Complete' || status === 'Completed' ? CheckCircle2 : status === 'Pending' ? AlertCircle : XCircle;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${styles[status] || styles['No Parts Linked']}`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  // --- VIEWS ---
  const SalesAnalyticsWidget = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><BarChart3 size={18} className="text-blue-600" /> Sales Analytics</h3>
            <p className="text-xs text-slate-500 mt-0.5">{salesView === 'year' ? `Yearly (${selectedYear})` : salesView === 'month' ? `${monthNames[selectedMonth]} ${selectedYear}` : `Details for ${selectedDate}`}</p>
          </div>
          {salesView !== 'year' && (
            <button onClick={() => setSalesView(salesView === 'day' ? 'month' : 'year')} className="text-xs bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md text-slate-600 font-medium flex items-center gap-1"><ChevronLeft size={14} /> Back</button>
          )}
        </div>
        <div className="flex gap-2 text-xs">
          {['all', 'product', 'part'].map(type => (
            <button key={type} onClick={() => setSalesFilter(type)} className={`px-3 py-1.5 rounded-full capitalize font-medium transition-colors ${salesFilter === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{type === 'all' ? 'All Sales' : `${type}s Only`}</button>
          ))}
        </div>
      </div>
      <div className="p-6 flex-1 overflow-auto">
        {salesView === 'year' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {salesData.byMonth.map((total, idx) => (
              <button key={idx} onClick={() => { setSelectedMonth(idx); setSalesView('month'); }} className={`p-4 rounded-xl border text-left transition-all ${total > 0 ? 'bg-blue-50 border-blue-200 hover:shadow-md' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">{monthNames[idx]}</span>
                <span className={`text-lg font-bold ${total > 0 ? 'text-blue-700' : 'text-slate-400'}`}>${total.toLocaleString()}</span>
              </button>
            ))}
          </div>
        )}
        {salesView === 'month' && (
          <div className="space-y-2">
            {Object.keys(salesData.byDay).sort().map(dateStr => (
              <button key={dateStr} onClick={() => { setSelectedDate(dateStr); setSalesView('day'); }} className="w-full flex justify-between items-center p-3 hover:bg-blue-50 rounded-lg group transition-colors border border-transparent hover:border-blue-100">
                <div className="flex items-center gap-3"><div className="bg-blue-100 text-blue-700 font-bold text-xs p-2 rounded-md w-12 text-center">{dateStr.split('-')[2]}</div><span className="text-sm font-medium text-slate-700">{dateStr}</span></div>
                <div className="flex items-center gap-4"><span className="text-xs text-slate-400">{salesData.byDay[dateStr].orders.length} orders</span><span className="text-sm font-bold text-slate-900">${salesData.byDay[dateStr].total.toFixed(2)}</span><ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" /></div>
              </button>
            ))}
          </div>
        )}
        {salesView === 'day' && salesData.byDay[selectedDate] && (
          <div className="space-y-3">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500"><tr><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Items</th><th className="px-4 py-2 text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {salesData.byDay[selectedDate].orders.map(order => (
                  <tr key={order.id}><td className="px-4 py-3 font-medium text-slate-900">{order.customer}</td><td className="px-4 py-3">{order.items.map((i, idx) => <div key={idx} className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${i.type === 'product' ? 'bg-indigo-500' : 'bg-orange-500'}`}></span><span className="text-xs text-slate-500">{i.qty}x {i.name}</span></div>)}</td><td className="px-4 py-3 text-right font-mono">${order.total.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Inventory Value', val: `$${parts.reduce((acc, p) => acc + (p.stock * p.cost), 0).toLocaleString()}`, icon: TrendingUp, color: 'blue' },
          { label: 'Ready to Build', val: `${products.filter(p => getProductAvailability(p.id).isBuildable).length} Products`, icon: Package, color: 'emerald' },
          { label: 'Low Stock Parts', val: `${parts.filter(p => p.stock < p.minStock).length} Items`, icon: AlertCircle, color: 'rose' },
          { label: 'Total Orders', val: orders.length, icon: ShoppingCart, color: 'indigo' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
            <div><p className="text-sm font-medium text-slate-500">{stat.label}</p><h3 className="text-2xl font-bold text-slate-900 mt-2">{stat.val}</h3></div>
            <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl`}><stat.icon size={20} /></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div><h3 className="font-semibold text-slate-900">Production Readiness</h3><p className="text-xs text-slate-500 mt-0.5">Real-time capability</p></div>
            <button onClick={() => setActiveTab('products')} className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">Manage <ArrowRight size={14} /></button>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500"><tr><th className="px-6 py-3">Product</th><th className="px-6 py-3">Count</th><th className="px-6 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(product => {
                  const avail = getProductAvailability(product.id);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4"><div className="font-medium text-slate-900">{product.name}</div><div className="text-xs text-slate-400 font-mono">{product.sku}</div></td>
                      <td className="px-6 py-4"><span className="text-xl font-bold text-slate-900">{avail.count}</span> <span className="text-xs text-slate-500">units</span></td>
                      <td className="px-6 py-4">{avail.isBuildable ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"><CheckCircle2 size={12} /> Ready</span> : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700"><XCircle size={12} /> Missing {avail.limitingPart?.name}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="h-full"><SalesAnalyticsWidget /></div>
      </div>
    </div>
  );

  const PartsView = () => (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-2xl font-bold text-slate-900">Inventory</h2><p className="text-slate-500">Manage raw materials</p></div>
        {isAdmin && <button onClick={() => setShowAddPart(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"><Plus size={18} /> Add Part</button>}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <div className="overflow-auto max-h-[calc(100vh-250px)]">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">SKU</th><th className="px-6 py-4 text-center">Stock</th>{isAdmin && <th className="px-6 py-4 text-center">Actions</th>}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {parts.map(part => (
                <tr key={part.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><div className="font-medium text-slate-900">{part.name}</div></td>
                  <td className="px-6 py-4 font-mono text-xs">{part.sku}</td>
                  <td className="px-6 py-4 text-center"><span className={`text-lg font-bold ${part.stock < part.minStock ? 'text-rose-600' : 'text-emerald-600'}`}>{part.stock}</span></td>
                  {isAdmin && <td className="px-6 py-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => handleUpdateStock(part.id, -1)} className="p-1.5 hover:bg-rose-100 text-rose-600 rounded"><TrendingUp size={16} className="rotate-180" /></button><button onClick={() => handleUpdateStock(part.id, 1)} className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded"><TrendingUp size={16} /></button><button onClick={() => setAdjustConfig(part)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded"><PenSquare size={16} /></button><button onClick={() => { setDeleteConfig({ type: 'part', id: part.id, name: part.name, data: part }) }} className="p-1.5 hover:bg-rose-100 text-rose-500 rounded"><Trash2 size={16} /></button></div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ProductsView = () => (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-2xl font-bold text-slate-900">Products</h2><p className="text-slate-500">Assembly & BOMs</p></div>
        {isAdmin && <button onClick={() => { setNewProductRecipe([]); setShowAddProduct(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"><Plus size={18} /> New Product</button>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          {products.map(product => {
            const avail = getProductAvailability(product.id);
            return (
              <div key={product.id} onClick={() => setSelectedProduct(product)} className={`group bg-white p-5 rounded-xl border cursor-pointer hover:shadow-md ${selectedProduct?.id === product.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                <div className="flex justify-between items-start">
                  <div><h3 className="font-bold text-slate-900">{product.name}</h3><p className="text-xs text-slate-400 font-mono mt-1">{product.sku}</p></div>
                  <div className="text-right"><StatusBadge status={avail.status} /><div className="text-xs font-medium text-slate-500 mt-2">Buildable: <span className="text-slate-900 font-bold text-lg">{avail.count}</span></div></div>
                </div>
                {isAdmin && <button onClick={(e) => { e.stopPropagation(); setDeleteConfig({ type: 'product', id: product.id, name: product.name, data: product }) }} className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 float-right mt-[-60px]"><Trash2 size={16} /></button>}
              </div>
            );
          })}
        </div>
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 h-fit sticky top-6">
          {selectedProduct ? (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-4">{selectedProduct.name} <span className="text-sm font-normal text-slate-500">(${selectedProduct.price})</span></h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200"><h4 className="font-semibold text-slate-700 text-sm">Bill of Materials</h4></div>
                <div className="divide-y divide-slate-100">
                  {recipes.filter(r => r.productId === selectedProduct.id).map(r => {
                    const part = parts.find(p => p.id === r.partId);
                    if (!part) return null;
                    return (
                      <div key={r.partId} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
                        <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${part.stock >= r.quantity ? 'bg-emerald-500' : 'bg-rose-500'}`}></div><div><p className="text-sm font-medium text-slate-900">{part.name}</p><p className="text-xs text-slate-500">Qty: {r.quantity} | Stock: {part.stock}</p></div></div>
                        {isAdmin && <button onClick={() => handleRemoveLink(selectedProduct.id, part.id)} className="text-slate-400 hover:text-rose-500 p-1"><Trash2 size={14} /></button>}
                      </div>
                    );
                  })}
                </div>
                {isAdmin && <div className="bg-slate-50 p-4 border-t border-slate-200 flex gap-2"><select id="partSelect" className="flex-1 text-sm rounded-md border-slate-300 py-2 pl-3">{parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input id="qtyInput" type="number" className="w-20 text-sm rounded-md border-slate-300 py-2 pl-3" defaultValue={1} /><button onClick={() => { const pid = document.getElementById('partSelect').value; const qty = parseFloat(document.getElementById('qtyInput').value); if (pid && qty) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'recipes'), { productId: selectedProduct.id, partId: pid, quantity: qty }); }} className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-md"><Plus size={16} /></button></div>}
              </div>
            </div>
          ) : <div className="h-full flex flex-col items-center justify-center text-slate-400"><Component size={48} className="mb-4 opacity-50" /><p>Select a product</p></div>}
        </div>
      </div>
    </div>
  );

  const OrdersView = () => (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-2xl font-bold text-slate-900">Orders</h2><p className="text-slate-500">Sales & Fulfillment</p></div>
        {isAdmin && <button onClick={() => setShowAddOrder(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"><Plus size={18} /> New Order</button>}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500"><tr><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Items</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4"><div className="font-medium text-slate-900">{order.customer}</div><div className="text-xs text-slate-400">#{order.id}</div></td>
                <td className="px-6 py-4">{order.items.map((item, idx) => <div key={idx} className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${item.type === 'product' ? 'bg-indigo-500' : 'bg-orange-500'}`}></span>{item.qty}x {item.name}</div>)}</td>
                <td className="px-6 py-4 text-right font-mono font-medium">${order.total.toFixed(2)}</td>
                <td className="px-6 py-4 text-center">{isAdmin && <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => { setEditingOrder(order); setShowEditOrder(true); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"><Edit3 size={16} /></button><button onClick={() => setDeleteConfig({ type: 'order', id: order.id, name: 'Order', data: order })} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded"><Trash2 size={16} /></button></div>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const TrashView = () => (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6"><h2 className="text-2xl font-bold text-slate-900">Trash</h2><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-medium">{trash.length} items</span></div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500"><tr><th className="px-6 py-4">Type</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Deleted At</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{trash.map((item, idx) => <tr key={idx} className="hover:bg-slate-50"><td className="px-6 py-4"><span className="uppercase text-xs font-bold">{item.itemType}</span></td><td className="px-6 py-4 font-medium text-slate-900">{item.name || item.customer}</td><td className="px-6 py-4 text-slate-500 font-mono text-xs">{item.deletedAt}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );

  const Modal = ({ title, show, onClose, children }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-semibold text-slate-900">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      {/* SIDEBAR */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20`}>
        <div className="p-6 flex items-center gap-3"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0"><Box size={20} /></div>{isSidebarOpen && <span className="font-bold text-lg tracking-tight">InvCRM</span>}</div>
        <nav className="flex-1 py-6 space-y-1">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label={isSidebarOpen ? "Dashboard" : ""} />
          <SidebarItem id="products" icon={Package} label={isSidebarOpen ? "Products" : ""} />
          <SidebarItem id="parts" icon={Component} label={isSidebarOpen ? "Inventory" : ""} />
          <SidebarItem id="orders" icon={Users} label={isSidebarOpen ? "Orders" : ""} />
          {isAdmin && <SidebarItem id="trash" icon={Trash2} label={isSidebarOpen ? "Trash" : ""} />}
        </nav>
        <div className={`p-4 ${isSidebarOpen ? 'block' : 'hidden'} space-y-2`}>
          <div className="bg-indigo-50 text-indigo-700 text-xs p-3 rounded-lg border border-indigo-100 flex items-center gap-2"><Cloud size={14} /><span>Synced</span></div>
          {isAdmin ? (
            <button onClick={handleLogout} className="w-full text-xs p-3 rounded-lg border flex items-center gap-2 transition-colors bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"><LogOut size={14} /><span>Sign Out</span></button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="w-full text-xs p-3 rounded-lg border flex items-center gap-2 transition-colors bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"><LogIn size={14} /><span>Sign In (Admin)</span></button>
          )}
        </div>
        <div className="p-4 border-t border-slate-100"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 w-full flex justify-center">{isSidebarOpen ? <ChevronRight className="rotate-180" /> : <ChevronRight />}</button></div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto bg-slate-50/50">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'parts' && <PartsView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'trash' && <TrashView />}
      </div>

      {/* --- MODALS --- */}
      
      {/* LOGIN MODAL */}
      <Modal title="Sign In" show={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <div className="space-y-4">
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Sign in with Google
          </button>
          <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">Or with Email</span><div className="flex-grow border-t border-slate-200"></div></div>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input required name="email" type="email" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="you@company.com" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Password</label><input required name="password" type="password" className="w-full rounded-lg border-slate-300 py-2 px-3" placeholder="••••••••" /></div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">Sign In</button>
          </form>
        </div>
      </Modal>

      {/* CRUD MODALS */}
      <Modal title="Add New Part" show={showAddPart} onClose={() => setShowAddPart(false)}>
        <form onSubmit={handleAddPart} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input required name="name" className="w-full rounded-lg border-slate-300 py-2 px-3" /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">SKU</label><input required name="sku" className="w-full rounded-lg border-slate-300 py-2 px-3" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Cost</label><input required name="cost" type="number" step="0.01" className="w-full rounded-lg border-slate-300 py-2 px-3" /></div></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Stock</label><input required name="stock" type="number" className="w-full rounded-lg border-slate-300 py-2 px-3" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Min</label><input required name="minStock" type="number" className="w-full rounded-lg border-slate-300 py-2 px-3" /></div></div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2">Add Part</button>
        </form>
      </Modal>

      <Modal title="Create New Product" show={showAddProduct} onClose={() => setShowAddProduct(false)}>
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input required name="name" className="w-full rounded-lg border-slate-300 py-2 px-3" /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">SKU</label><input required name="sku" className="w-full rounded-lg border-slate-300 py-2 px-3" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Price</label><input required name="price" type="number" step="0.01" className="w-full rounded-lg border-slate-300 py-2 px-3" /></div></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea name="description" className="w-full rounded-lg border-slate-300 py-2 px-3" rows="2"></textarea></div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Recipe</label><div className="space-y-2 mb-3">{newProductRecipe.map((p, idx) => <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 border border-slate-200 rounded"><span>{p.quantity}x {p.name}</span></div>)}</div><div className="flex gap-2"><select id="newProdPart" className="flex-1 text-sm rounded-md border-slate-300 py-1.5 px-2">{parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input id="newProdQty" type="number" className="w-16 text-sm rounded-md border-slate-300 py-1.5 px-2" defaultValue={1} /><button type="button" onClick={handleAddToRecipeDraft} className="bg-slate-200 px-3 rounded-md text-xs font-bold">Add</button></div></div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2">Create Product</button>
        </form>
      </Modal>

      <Modal title="Create New Order" show={showAddOrder} onClose={() => setShowAddOrder(false)}>
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg"><button type="button" onClick={() => setOrderType('product')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${orderType === 'product' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Product</button><button type="button" onClick={() => setOrderType('part')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${orderType === 'part' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Part</button></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Customer</label><input required name="customer" className="w-full rounded-lg border-slate-300 py-2 px-3" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Select Item</label><select name="itemId" className="w-full rounded-lg border-slate-300 py-2 px-3">{orderType === 'product' ? products.map(p => <option key={p.id} value={p.id} disabled={!getProductAvailability(p.id).isBuildable}>{p.name} (${p.price})</option>) : parts.map(p => <option key={p.id} value={p.id} disabled={p.stock === 0}>{p.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label><input required name="quantity" type="number" min="1" className="w-full rounded-lg border-slate-300 py-2 px-3" defaultValue="1" /></div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2">Confirm Order</button>
        </form>
      </Modal>

      <Modal title={`Edit Order #${editingOrder?.id}`} show={showEditOrder} onClose={() => setShowEditOrder(false)}>
        {editingOrder && <form onSubmit={handleSaveEditOrder} className="space-y-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Customer</label><input required name="customer" defaultValue={editingOrder.customer} className="w-full rounded-lg border-slate-300 py-2 px-3" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Date</label><input required name="date" type="date" defaultValue={editingOrder.date} className="w-full rounded-lg border-slate-300 py-2 px-3" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Total</label><input required name="total" type="number" step="0.01" defaultValue={editingOrder.total} className="w-full rounded-lg border-slate-300 py-2 px-3" /></div></div><div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Item Quantity</label>{editingOrder.items.map((item, idx) => <div key={idx} className="flex justify-between items-center text-sm mb-2"><span className="font-medium text-slate-700">{item.name}</span><input name="quantity" type="number" min="1" defaultValue={item.qty} className="w-16 rounded-md border-slate-300 py-1 px-2 text-right" /></div>)}</div><button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2">Save Changes</button></form>}
      </Modal>

      <Modal title="Confirm Deletion" show={!!deleteConfig} onClose={() => setDeleteConfig(null)}>
        <div className="space-y-4"><div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg"><AlertTriangle size={24} className="shrink-0" /><p className="text-sm">Delete <strong>{deleteConfig?.name}</strong>?</p></div>{deleteConfig?.type === 'order' && <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50"><input type="checkbox" id="returnStockCheckbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" defaultChecked /><label htmlFor="returnStockCheckbox" className="text-sm text-slate-700 font-medium cursor-pointer">Return items to stock?</label></div>}<div className="flex justify-end gap-3 pt-2"><button onClick={() => setDeleteConfig(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button><button onClick={executeDelete} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium">Delete</button></div></div>
      </Modal>

      <Modal title={`Adjust Stock: ${adjustConfig?.name}`} show={!!adjustConfig} onClose={() => setAdjustConfig(null)}>
        <form onSubmit={handleStockAdjustment} className="space-y-4"><div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-sm border border-slate-100"><span className="text-slate-500">Current Stock:</span><span className="font-bold text-lg text-slate-900">{adjustConfig?.stock}</span></div><div className="grid grid-cols-3 gap-3"><label className="cursor-pointer"><input type="radio" name="type" value="add" className="peer sr-only" defaultChecked /><div className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-slate-100 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 text-slate-600 peer-checked:text-emerald-700 hover:bg-slate-50"><Plus size={20} /><span className="text-xs font-semibold mt-1">Add</span></div></label><label className="cursor-pointer"><input type="radio" name="type" value="remove" className="peer sr-only" /><div className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-slate-100 peer-checked:border-rose-500 peer-checked:bg-rose-50 text-slate-600 peer-checked:text-rose-700 hover:bg-slate-50"><TrendingUp size={20} className="rotate-180" /><span className="text-xs font-semibold mt-1">Remove</span></div></label><label className="cursor-pointer"><input type="radio" name="type" value="set" className="peer sr-only" /><div className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-slate-100 peer-checked:border-blue-500 peer-checked:bg-blue-50 text-slate-600 peer-checked:text-blue-700 hover:bg-slate-50"><PenSquare size={20} /><span className="text-xs font-semibold mt-1">Set</span></div></label></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Amount</label><input required name="amount" type="number" min="0" className="w-full rounded-lg border-slate-300 py-2 px-3" /></div><button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg mt-2">Update Stock</button></form>
      </Modal>
    </div>
  );
}