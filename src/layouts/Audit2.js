import React, { Component } from "react";
import { Route, Switch } from "react-router-dom";
import routes from "../routes";
import Audit2Navbar from "../components/Navbars/Audit2NavBar"

class Audit2 extends Component {
  render() {
    return (
      <div>
        <Audit2Navbar {...this.props}/>
        <Switch>
          {routes.map((prop, key) => {
            if (prop.layout === "/audit2"){
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
}

export default Audit2;
