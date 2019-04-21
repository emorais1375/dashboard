import React from 'react';
import { render } from 'react-dom';

import { HashRouter, Route, Switch ,Redirect} from "react-router-dom";

import Login from "./views/Login/Login";
import Inventario from "./views/Inventario/Inventario";

import AdminLayout from "./layouts/Admin";
import Audit1Layout from "./layouts/Audit1";
import Audit2Layout from "./layouts/Audit2";

import "./bootstrap/dist/css/bootstrap.min.css";

const App = () => (
	<HashRouter>
	  <Switch>
	  	<Route path="/login2" component={Login} />
	  	<Route path="/inventario" component={Inventario} />
      	<Route path="/admin" render={props => <AdminLayout {...props} />} />
      	<Route path="/audit1" render={props => <Audit1Layout {...props} />} />
      	<Route path="/audit2" render={props => <Audit2Layout {...props} />} />
      	<Redirect from="/" to="/login2" />
	  </Switch>
	</HashRouter>
)

render(
  <App />,
  document.getElementById('app')
);
