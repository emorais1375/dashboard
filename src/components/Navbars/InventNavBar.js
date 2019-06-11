import React, { Component } from "react";
import { 
  Navbar,
  Nav,
  NavDropdown, 
  Form,
  FormControl,
  Button,
  NavItem
} from "react-bootstrap";

import logo from "../../assets/img/logo.png";

class InventNavbar extends Component {
  render() {
    return (
      <Navbar collapseOnSelect bg="dark" variant="dark" expand="md">
        <Navbar.Brand>
          <img
            src={logo}
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt="React Bootstrap logo"
          />
        {' Arko Systems'}</Navbar.Brand>
        <Navbar.Collapse className="justify-content-end">
          <Button variant="outline-info" href="#/auth/login" onClick={()=>localStorage.clear()}>Sair</Button>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

export default InventNavbar;
