import React, { Component } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import Header from "../../components/Header/Header";
import routes from "../../routes/dashboard";

function Dashboard() {
  return (
    <div>
        <Header />
        <Switch>
          {routes.map((prop, key) => {
            if (prop.redirect)
              return <Redirect from={prop.path} to={prop.to} key={key} />;
            return (
              <Route path={prop.path} component={prop.component} key={key} />
            );
          })}
        </Switch>
    </div>
  );
}


export default Dashboard;
