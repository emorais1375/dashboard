import Dashboard from "../views/Dashboard/Dashboard";
import Relatorios from "../views/Relatorios/Relatorios";
import Equipe from "../views/Equipe/Equipe";
import Confronto from "../views/Confronto/Confron";
import Auditoria from "../views/Auditoria/Auditoria";
import Enderecamento from "../views/Enderecamento/Enderecamento";
import Login from "../views/Login/Login";
import Inventario from "../views/Inventario/Inventario";
import Divergencia from "../views/Divergencia/Divergencia";

import HelloWorld from "../components/App/HelloWorld";

const dashboardRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard
  }, {
    path: "/relatorios",
    name: "Relatorios",
    component: Relatorios
  }, {
    path: "/equipe",
    name: "Equipe",
    component: Equipe
  }, {
    path: "/enderecamento",
    name: "Enderecamento",
    component: Enderecamento
  }, {
    path: "/confronto",
    name: "Confronto",
    component: Confronto
  }, {
    path: "/auditoria",
    name: "Auditoria",
    component: Auditoria
  }, {
    path: "/login",
    name: "Login",
    component: Login
  }, {
    path: "/inventario",
    name: "Inventario",
    component: Inventario
  }, {
    path: "/divergencia",
    name: "Divergencia",
    component: Divergencia
  }, { 
    redirect: true,
    path: "/",
    to: "/dashboard",
    name: "Dashboard" 
  }
];

export default dashboardRoutes;
