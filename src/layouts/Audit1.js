import React, { Component } from "react";
import { Route, Switch } from "react-router-dom";
import routes from "../routes";
import Audit1Navbar from "../components/Navbars/Audit1NavBar"

class Audit1 extends Component {
  render() {
    return (
      <div>
        <Audit1Navbar {...this.props}/>
        <Switch>
          {routes.map((prop, key) => {
            if (prop.layout === "/audit1"){
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

export default Audit1;
