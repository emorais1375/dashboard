import Dashboard from "./views/Dashboard/Dashboard";
import Relatorios from "./views/Relatorios/Relatorios";
import Equipe from "./views/Equipe/Equipe";
import Confronto from "./views/Confronto/Confron";
import Auditoria from "./views/Auditoria/Auditoria";
import Enderecamento from "./views/Enderecamento/Enderecamento";
import Login from "./views/Login/Login";
import Inventario from "./views/Inventario/Inventario";
import Divergencia from "./views/Divergencia/Divergencia";

import HelloWorld from "./components/App/HelloWorld";

const dashboardRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    layout: "/admin"
  }, {
    path: "/relatorios",
    name: "Relatorios",
    component: Relatorios,
    layout: "/admin"
  }, {
    path: "/equipe",
    name: "Equipe",
    component: Equipe,
    layout: "/admin"
  }, {
    path: "/enderecamento",
    name: "Enderecamento",
    component: Enderecamento,
    layout: "/admin"
  }, {
    path: "/confronto",
    name: "Confronto",
    component: Confronto,
    layout: "/admin"
  }, {
    path: "/auditoria",
    name: "Auditoria",
    component: Auditoria,
    layout: "/admin"
  }, {
    path: "/login",
    name: "Login",
    component: Login,
    layout: "/admin"
  }, {
    path: "/inventario",
    name: "Inventario",
    component: Inventario,
    layout: "/admin"
  }, {
    path: "/divergencia",
    name: "Divergencia",
    component: Divergencia,
    layout: "/admin"
  }
];

export default dashboardRoutes;
