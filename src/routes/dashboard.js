import Dashboard from "../views/Dashboard/Dashboard";
import Relatorios from "../views/Relatorios/Relatorios";
import Equipe from "../views/Equipe/Equipe";
import Confronto from "../views/Confronto/Confron";
import Auditoria from "../views/Auditoria/Auditoria";

import HelloWorld from "../components/App/HelloWorld";

const dashboardRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    // icon: "pe-7s-graph",
    component: Dashboard
  },
  {
    path: "/relatorios",
    name: "Relatorios",
    // icon: "pe-7s-graph",
    component: Relatorios
  },
  {
    path: "/equipe",
    name: "Equipe",
    // icon: "pe-7s-graph",
    component: Equipe
  },
  {
    path: "/confronto",
    name: "Confronto",
    // icon: "pe-7s-graph",
    component: Confronto
  },
  {
    path: "/auditoria",
    name: "Auditoria",
    // icon: "pe-7s-graph",
    component: Auditoria
  },
  // {
  //   path: "/user",
  //   name: "User Profile",
  //   icon: "pe-7s-user",
  //   component: UserProfile
  // },
  // {
  //   path: "/table",
  //   name: "Home",
  //   icon: "pe-7s-note2",
  //   component: TableList
  // },
  // {
  //   path: "/typography",
  //   name: "Typography",
  //   icon: "pe-7s-news-paper",
  //   component: Typography
  // },
  // { path: "/icons", name: "Icons", icon: "pe-7s-science", component: Icons },
  // { path: "/maps", name: "Maps", icon: "pe-7s-map-marker", component: Maps },
  // {
  //   path: "/notifications",
  //   name: "Notifications",
  //   icon: "pe-7s-bell",
  //   component: Notifications
  // },
  // {
  //   upgrade: true,
  //   path: "/upgrade",
  //   name: "Upgrade to PRO",
  //   icon: "pe-7s-rocket",
  //   component: Upgrade
  // },
  { redirect: true, path: "/", to: "/dashboard", name: "Dashboard" }
];

export default dashboardRoutes;
