import React, { Component } from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import Header from "../components/Header/Header";
import routes2 from "../routes/dashboard";
import routes from "../routes";
import AdminNavbar from "../components/Navbars/AdminNavbar"

function Admin() {
  return (
    <div>
      <AdminNavbar />
      <Switch>
        {routes.map((prop, key) => {
          if (prop.layout === "/admin"){
            return (
              <Route 
                path={prop.layout + prop.path}
                component={prop.component}
                key={key}
              />
            );
          } else {
            return null;
          }
        })}
      </Switch>
    </div>
  );
}

export default Admin;
